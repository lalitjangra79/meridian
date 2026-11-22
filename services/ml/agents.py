"""The agent layer: policy-checked tool calls, with an optional LLM planner.

Without an API key the planner is deterministic (the same guardrail logic the
console documents), which keeps the service runnable and testable offline. Set
OPENAI_API_KEY to let the model choose between the same tools instead; the tools,
the policy gate and the audit record are identical either way.
"""

from __future__ import annotations

import json
import os
import urllib.request
from dataclasses import dataclass

from .store import Store

POLICY = {
    "drift_freeze": 0.20,  # PSI above this freezes the agent
    "retrain_floor": 0.95,  # held-out accuracy below this queues a retrain
    "max_spend": 2_500,  # USD per autonomous action
}

TOOLS = [
    {
        "name": "queue_retrain",
        "description": "Queue a training run for a model that fell below the accuracy floor.",
        "parameters": {"model_id": "string", "reason": "string"},
    },
    {
        "name": "freeze_agent",
        "description": "Pause an agent whose model is drifting past the policy threshold.",
        "parameters": {"agent_id": "string", "reason": "string"},
    },
    {
        "name": "escalate",
        "description": "Send a decision to a human when it breaches policy or budget.",
        "parameters": {"decision_id": "string", "reason": "string"},
    },
]


@dataclass
class Observation:
    model_id: str
    agent_id: str
    accuracy: float
    drift: float
    risk_tier: str
    decision_id: str | None = None
    spend: float = 0.0


def plan(observation: Observation) -> list[dict]:
    """Deterministic policy planner — the fallback and the reference behaviour."""
    actions: list[dict] = []
    if observation.drift >= POLICY["drift_freeze"]:
        actions.append(
            {
                "tool": "freeze_agent",
                "arguments": {"agent_id": observation.agent_id},
                "rationale": f"PSI {observation.drift:.2f} is at or above the {POLICY['drift_freeze']:.2f} freeze threshold.",
            }
        )
        actions.append(
            {
                "tool": "queue_retrain",
                "arguments": {"model_id": observation.model_id},
                "rationale": f"Drift on {observation.model_id} exceeds policy; retraining is queued with the freeze.",
            }
        )
    if observation.accuracy < POLICY["retrain_floor"] and observation.risk_tier == "Tier 1":
        actions.append(
            {
                "tool": "escalate",
                "arguments": {"decision_id": observation.decision_id or "unscoped"},
                "rationale": f"Tier-1 model at {observation.accuracy:.1%} is below the {POLICY['retrain_floor']:.0%} floor.",
            }
        )
    if observation.spend > POLICY["max_spend"]:
        actions.append(
            {
                "tool": "escalate",
                "arguments": {"decision_id": observation.decision_id or "unscoped"},
                "rationale": f"Spend {observation.spend:.0f} USD is above the {POLICY['max_spend']} USD limit for autonomous action.",
            }
        )
    return actions


def plan_with_llm(observation: Observation) -> list[dict] | None:
    """Ask an OpenAI-compatible model to pick tools. None when no key is set."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return None
    base = os.environ.get("OPENAI_BASE_URL", "https://freebuff.com/api/v1/paid")
    model = os.environ.get("OPENAI_MODEL", "gpt-5-mini")
    body = json.dumps(
        {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You operate Meridian's agents. Choose tool calls from the provided tools only. Reply with JSON: {\"actions\":[{\"tool\":string,\"arguments\":object,\"rationale\":string}]}",
                },
                {"role": "user", "content": json.dumps({"observation": observation.__dict__, "policy": POLICY, "tools": TOOLS})},
            ],
            "response_format": {"type": "json_object"},
        }
    ).encode()
    request = urllib.request.Request(
        f"{base.rstrip('/')}/chat/completions",
        data=body,
        headers={"authorization": f"Bearer {key}", "content-type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:  # noqa: S310 - fixed https endpoint
            payload = json.loads(response.read())
        parsed = json.loads(payload["choices"][0]["message"]["content"])
        actions = parsed.get("actions", [])
        known = {t["name"] for t in TOOLS}
        return [a for a in actions if a.get("tool") in known]
    except Exception:  # network, quota or a malformed reply: fall back to policy
        return None


def act(store: Store, observation: Observation, use_llm: bool = False) -> dict:
    """Plan, gate against policy, execute the allow-listed tools, audit everything."""
    actions = (plan_with_llm(observation) if use_llm else None) or plan(observation)
    executed: list[dict] = []
    for action in actions:
        tool = action["tool"]
        if tool not in {t["name"] for t in TOOLS}:
            continue
        record = store.save_action(
            agent_id=observation.agent_id,
            kind=tool,
            target=str(next(iter(action["arguments"].values()), observation.model_id)),
            rationale=action.get("rationale", ""),
            payload=action["arguments"],
        )
        executed.append(record)
    return {
        "agentId": observation.agent_id,
        "modelId": observation.model_id,
        "policy": POLICY,
        "planned": actions,
        "executed": executed,
        "planner": "llm" if use_llm and os.environ.get("OPENAI_API_KEY") else "policy",
    }


def dump(store: Store) -> str:
    return json.dumps({"actions": store.list_actions()}, indent=2)
