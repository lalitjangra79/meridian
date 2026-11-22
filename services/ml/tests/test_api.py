import pytest
from fastapi.testclient import TestClient

from services.ml import app as app_module


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("MERIDIAN_DB", str(tmp_path / "api.db"))
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    app_module._store = None
    with TestClient(app_module.app) as test_client:
        yield test_client
    app_module._store = None


def test_health_reports_storage_and_planner(client):
    body = client.get("/health").json()
    assert body["ok"] is True
    assert body["storage"] == "sqlite"
    assert body["llm"] == "policy-only"


def test_train_persists_a_run(client):
    response = client.post("/train", json={"model_id": "mdl-demand", "epochs": 20, "samples": 400})
    assert response.status_code == 200
    run = response.json()["run"]
    assert run["status"] == "Succeeded"
    assert len(run["loss"]) == 20
    assert run["accuracy"] > 0.6

    listed = client.get("/runs").json()["runs"]
    assert [r["id"] for r in listed] == [run["id"]]
    assert client.get(f"/runs/{run['id']}").json()["run"]["id"] == run["id"]


def test_train_validates_the_request(client):
    assert client.post("/train", json={"samples": 10}).status_code == 422
    assert client.post("/train", json={"epochs": 0}).status_code == 422


def test_unknown_run_is_a_404(client):
    assert client.get("/runs/mlr-nope").status_code == 404


def test_predict_uses_the_trained_model(client):
    client.post("/train", json={"model_id": "mdl-churn", "epochs": 10, "samples": 300, "features": 2})
    response = client.post("/predict", json={"modelId": "mdl-churn", "rows": [[0.5, -0.5], [1.0, 0.2]]})
    assert response.status_code == 200
    assert len(response.json()["predictions"]) == 2


def test_predict_without_a_model_is_a_404(client):
    assert client.post("/predict", json={"modelId": "mdl-none", "rows": [[1.0]]}).status_code == 404


def test_token_is_enforced_only_when_configured(client, monkeypatch):
    assert client.get("/runs").status_code == 200
    monkeypatch.setenv("ML_SERVICE_TOKEN", "s3cret")
    assert client.get("/runs").status_code == 401
    assert client.get("/runs", headers={"authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/runs", headers={"authorization": "Bearer s3cret"}).status_code == 200
    # A host must be able to probe health without the secret.
    assert client.get("/health").status_code == 200


def test_agents_act_records_executed_tools(client):
    body = client.post(
        "/agents/act",
        json={"modelId": "mdl-pricing", "agentId": "ag-pricing", "accuracy": 0.96, "drift": 0.31, "riskTier": "Tier 1"},
    ).json()
    assert [e["kind"] for e in body["executed"]] == ["freeze_agent", "queue_retrain"]
    assert client.get("/agents/actions").json()["actions"]
