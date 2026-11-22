"""Meridian ML engine — FastAPI service.

Run it next to the Worker:

    uvicorn services.ml.app:app --port 8000   (or: python -m services.ml.app)

The Worker reaches it through ML_SERVICE_URL (see src/worker/ml.ts). Without that
variable the console keeps serving the D1-backed registry and this service is
simply not called.
"""

from __future__ import annotations

import os
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .agents import Observation, act
from .engine import predict, train
from .store import Store

app = FastAPI(title="Meridian ML engine", version="1.0.0")

_store: Store | None = None


def store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store


class TrainRequest(BaseModel):
    model_id: str = Field(default="mdl-demand", min_length=3)
    objective: str = Field(default="Weekly refresh", min_length=1)
    seed: int = 7
    samples: int = Field(default=900, ge=50, le=50_000)
    features: int = Field(default=6, ge=1, le=64)
    epochs: int = Field(default=60, ge=1, le=500)
    learning_rate: float = Field(default=0.25, gt=0, le=5)


class PredictRequest(BaseModel):
    modelId: str
    rows: list[list[float]]


class ActRequest(BaseModel):
    modelId: str
    agentId: str
    accuracy: float = Field(ge=0, le=1)
    drift: float = Field(ge=0, le=1)
    riskTier: Literal["Tier 1", "Tier 2", "Tier 3"] = "Tier 2"
    decisionId: str | None = None
    spend: float = Field(default=0.0, ge=0)
    useLlm: bool = False


def require_token(authorization: str | None = Header(default=None)) -> None:
    """Shared-secret gate for a publicly hosted service.

    Active only when ML_SERVICE_TOKEN is set; the Worker sends the same value as
    `Authorization: Bearer …`. /health stays open so a host can probe the service.
    """
    expected = os.environ.get("ML_SERVICE_TOKEN")
    if not expected:
        return
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "service": "meridian-ml",
        "storage": store().kind,
        "llm": "configured" if os.environ.get("OPENAI_API_KEY") else "policy-only",
    }


@app.post("/train", dependencies=[Depends(require_token)])
def post_train(request: TrainRequest) -> dict:
    try:
        result = train(
            seed=request.seed,
            samples=request.samples,
            features=request.features,
            epochs=request.epochs,
            learning_rate=request.learning_rate,
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    run = store().save_run(request.model_id, request.objective, result)
    return {"run": run, "model": {"weights": result["weights"], "bias": result["bias"]}}


@app.get("/runs", dependencies=[Depends(require_token)])
def get_runs(limit: int = 20) -> dict:
    return {"runs": store().list_runs(max(1, min(limit, 100)))}


@app.get("/runs/{run_id}", dependencies=[Depends(require_token)])
def get_run(run_id: str) -> dict:
    run = store().get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run": run}


@app.post("/predict", dependencies=[Depends(require_token)])
def post_predict(request: PredictRequest) -> dict:
    run = next((r for r in store().list_runs(100) if r["model_id"] == request.modelId), None)
    if run is None:
        raise HTTPException(status_code=404, detail="No trained run for that model")
    try:
        rows = predict(run["params"]["weights"], run["params"]["bias"], request.rows)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    return {"modelId": request.modelId, "runId": run["id"], "predictions": rows}


@app.post("/agents/act", dependencies=[Depends(require_token)])
def post_act(request: ActRequest) -> dict:
    observation = Observation(
        model_id=request.modelId,
        agent_id=request.agentId,
        accuracy=request.accuracy,
        drift=request.drift,
        risk_tier=request.riskTier,
        decision_id=request.decisionId,
        spend=request.spend,
    )
    return act(store(), observation, use_llm=request.useLlm)


@app.get("/agents/actions", dependencies=[Depends(require_token)])
def get_actions(limit: int = 50) -> dict:
    return {"actions": store().list_actions(max(1, min(limit, 200)))}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
