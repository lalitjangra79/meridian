# Deploying Meridian

Two pieces, and only one of them fits on Freebuff Sites:

| Piece | Runs on | Why |
| --- | --- | --- |
| Console + Hono API | **Freebuff Sites** (Workers + D1) | static assets, `/api/*`, D1 storage |
| ML engine (`services/ml`, FastAPI + PostgreSQL) | Render / Fly / any Docker host | Workers cannot run Python |

Until the engine is hosted and `ML_SERVICE_URL` is set on the Worker, the console
works everywhere except **Training → Queue run**, which reports
`ML engine is not configured` instead of inventing numbers.

## 1. Host the ML engine

### Render (Blueprint)

1. Push this repo (already done).
2. Render → **New → Blueprint** → select the repo. `render.yaml` creates the
   `meridian-ml` web service and the `meridian-db` Postgres.
3. When it is live, copy
   - the service URL, e.g. `https://meridian-ml.onrender.com`
   - the generated `ML_SERVICE_TOKEN` (Service → Environment).
4. Optional: add `OPENAI_API_KEY` in the service's environment to let the agent
   planner use an LLM; leave it unset for the deterministic policy planner.

The free instance sleeps when idle; the first request after a quiet period can
exceed the Worker's 25s timeout and surface as `ml_unreachable`. Use a paid
instance for a demo you will show people.

### Fly.io

```sh
fly launch --no-deploy --dockerfile services/ml/Dockerfile --name meridian-ml
fly postgres create --name meridian-db
fly postgres attach meridian-db            # sets DATABASE_URL
fly secrets set ML_SERVICE_TOKEN=$(openssl rand -hex 24)
fly deploy
```

`fly.toml` is already in the repo with the health check and port.

### Any VPS with Docker

```sh
docker compose up -d            # postgres + mlflow + ml, from the repo root
```

Put a TLS proxy in front (`caddy`, `nginx`, or a tunnel) — the Worker must reach
it over **https**. If you keep it on plain HTTP inside a private network you can
use `hyperdrive`/`services` bindings instead, but a public https URL with a token
is the least moving parts.

## 2. Point the Worker at it

On the deployed site: **Sites → Secrets** (or `sites_set_secret`), add both:

| Name | Value |
| --- | --- |
| `ML_SERVICE_URL` | `https://<your-ml-host>` (no trailing slash) |
| `ML_SERVICE_TOKEN` | the same value the service runs with (if you set one) |

Redeploy (or restart) so the Worker picks up the variables, then check:

```sh
curl -s https://<site>/api/ml/health
# {"ok":true,"service":"meridian-ml","storage":"postgres","llm":"policy-only"}
```

`/api/ml/*` now returns `x-data-source: ml`, and **Training → Queue run** trains
for real: the run lands with the engine's id, held-out accuracy and loss curve.

## 3. Verify

```sh
# direct
curl -s https://<ml-host>/health
curl -s -X POST https://<ml-host>/train \
  -H "authorization: Bearer $ML_SERVICE_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"model_id":"mdl-demand","epochs":40,"samples":600}'

# through the Worker
curl -s https://<site>/api/ml/health
curl -s https://<site>/api/ml/runs
```

Without the token header the service answers `401`, which is what keeps a public
deployment from letting strangers write runs into your database.

## Trust boundaries

- The browser never talks to the ML host; only the Worker does, server-side.
- `/health` is open so the host can probe it. Everything else requires the token
  when `ML_SERVICE_TOKEN` is set.
- The ML service holds model weights and run history — give it the managed
  database, not a volume on a box you might lose.
- No production credentials belong in this repo. `ML_SERVICE_URL` and
  `ML_SERVICE_TOKEN` go in Sites → Secrets, and `.dev.vars` (gitignored) only for
  local development.
