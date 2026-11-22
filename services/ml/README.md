# Meridian ML engine (FastAPI)

The Python half of the API layer: real training, scoring, and the agent tool loop,
writing to a SQL database.

```
UI (React) ──► Worker (Hono) ──► /api/ml/* ──► this service ──► PostgreSQL | SQLite
                                            └► MLflow (optional)
```

## Run it

```sh
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r services/ml/requirements.txt   # Windows
.venv/bin/python -m pip install -r services/ml/requirements.txt            # macOS / Linux
python -m uvicorn services.ml.app:app --reload --port 8000
```

The Worker picks it up through `ML_SERVICE_URL`. Locally that lives in the
gitignored `.dev.vars` (`ML_SERVICE_URL=http://127.0.0.1:8000`); in production set
it as a Worker variable pointing at the deployed service. Start both:

```sh
python -m uvicorn services.ml.app:app --port 8000   # terminal 1
npm run dev                                          # terminal 2
curl -s localhost:5188/api/ml/health
```

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Storage backend, whether an LLM planner is configured |
| POST | `/train` | Trains a logistic-regression model with mini-batch gradient descent on a seeded synthetic cohort; returns the real held-out accuracy and per-epoch loss curve, and persists the run |
| GET | `/runs` | Recent runs (`limit`) |
| GET | `/runs/{id}` | One run, with weights, bias and loss curve |
| POST | `/predict` | Scores rows with the latest trained weights for a model |
| POST | `/agents/act` | Policy-gated agent: plans tool calls, executes them, writes an audit row per action |
| GET | `/agents/actions` | The agent audit log |

Training is genuine computation, not a fixture: `POST /train` with different
`seed`/`epochs` values produces different curves, and `tests/test_engine.py`
asserts the loss actually falls.

## Storage

- `DATABASE_URL` set → PostgreSQL (table DDL is created on first connect).
- Otherwise → SQLite at `services/ml/.data/ml.db`.

`docker compose up` from the repo root starts PostgreSQL, MLflow and this service
wired together.

## Agents

`POST /agents/act` runs the same guardrails the console documents:

- PSI ≥ `0.20` → `freeze_agent` + `queue_retrain`
- Tier-1 accuracy < `95%` → `escalate`
- Spend > `$2,500` → `escalate`

Tools are allow-listed; every execution is recorded in `agent_actions`. With
`OPENAI_API_KEY` set and `useLlm: true`, an OpenAI-compatible model may choose
between the same tools; without a key the deterministic policy planner runs
(`planner: "policy"`). The LLM path is not covered by the tests in this repo —
no key is configured, so it has not been exercised.

## Token gate

Set `ML_SERVICE_TOKEN` on a publicly hosted deployment: `/health` stays open, every
other route requires `Authorization: Bearer <token>` (401 otherwise). The Worker
sends it when `ML_SERVICE_TOKEN` is set on its side too.

## Deploy

`render.yaml` (Render Blueprint), `fly.toml` (Fly) and `docker-compose.yml` (VPS)
all build this Dockerfile. Steps and the Worker wiring: [../../DEPLOY.md](../../DEPLOY.md).

## Tests

```sh
python -m pytest            # 19 tests: engine, policy, API, persistence, token gate
```
