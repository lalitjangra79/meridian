import pytest

from services.ml.agents import POLICY, Observation, act, plan
from services.ml.engine import make_dataset, predict, train
from services.ml.store import Store


def test_training_produces_a_real_learning_curve():
    result = train(seed=11, samples=600, epochs=40)
    curve = result["lossCurve"]
    assert len(curve) == 40
    # It actually learns: the loss falls and lands near the noise floor.
    assert curve[-1] < curve[0] * 0.9
    assert curve[-1] < 0.35
    assert 0.0 <= result["accuracy"] <= 1.0
    assert result["accuracy"] > 0.85


def test_training_is_deterministic():
    a = train(seed=5, samples=300, epochs=10)
    b = train(seed=5, samples=300, epochs=10)
    assert a == b


def test_training_rejects_nonsense():
    with pytest.raises(ValueError):
        train(samples=10)
    with pytest.raises(ValueError):
        train(epochs=0)


def test_dataset_split_keeps_every_row():
    data = make_dataset(3, 100)
    train_set, holdout = data.split(0.2)
    assert len(train_set.labels) + len(holdout.labels) == 100


def test_predict_scores_rows():
    model = {"weights": [1.0, -1.0], "bias": 0.0}
    out = predict(model["weights"], model["bias"], [[2.0, 0.0], [0.0, 2.0]])
    assert out[0]["label"] == 1
    assert out[1]["label"] == 0
    assert 0.0 <= out[0]["score"] <= 1.0


def test_predict_rejects_malformed_rows():
    with pytest.raises(ValueError):
        predict([1.0], 0.0, [[1.0, 2.0]])
    with pytest.raises(ValueError):
        predict([], 0.0, [[1.0]])


def test_policy_freezes_a_drifting_model():
    actions = plan(Observation(model_id="mdl-pricing", agent_id="ag-pricing", accuracy=0.96, drift=0.31, risk_tier="Tier 1"))
    tools = [a["tool"] for a in actions]
    assert "freeze_agent" in tools
    assert "queue_retrain" in tools


def test_policy_escalates_a_weak_tier_one_model():
    actions = plan(Observation(model_id="mdl-churn", agent_id="ag-churn", accuracy=0.90, drift=0.05, risk_tier="Tier 1"))
    assert [a["tool"] for a in actions] == ["escalate"]


def test_policy_is_silent_on_a_healthy_model():
    assert plan(Observation(model_id="mdl-fraud", agent_id="ag-fraud", accuracy=0.97, drift=0.05, risk_tier="Tier 1")) == []


def test_policy_caps_spend():
    actions = plan(
        Observation(model_id="mdl-fraud", agent_id="ag-fraud", accuracy=0.98, drift=0.02, risk_tier="Tier 2", spend=POLICY["max_spend"] + 1)
    )
    assert [a["tool"] for a in actions] == ["escalate"]


def test_acting_writes_an_audit_row(tmp_path, monkeypatch):
    monkeypatch.setenv("MERIDIAN_DB", str(tmp_path / "test.db"))
    store = Store()
    result = act(store, Observation(model_id="mdl-pricing", agent_id="ag-pricing", accuracy=0.96, drift=0.31, risk_tier="Tier 1"))
    assert result["planner"] == "policy"
    assert len(result["executed"]) == 2
    assert store.list_actions()[0]["agent_id"] == "ag-pricing"
