# Meridian

An **autonomous enterprise intelligence and machine-learning platform** console:
one workspace for the models that run the business, the data they train on, the
agents that act on their output, and the policy that decides when a machine may
act without a person.

It is a working single-page app with a Cloudflare Worker behind it. Everything
is seeded, deterministic and local — no accounts, no API keys.

**Live demo:** https://meridian-a5lexs-preview.freebuff.site

## The six views

- **Command** — today’s decision volume, auto-execution rate, accuracy and value
  routed; a live **decision ledger** where you can approve queued actions; the
  agent roster; drift watch; weekly throughput and accuracy; the signals the
  models surfaced.
- **Models** — the registry: stage, accuracy, PSI drift, latency, inference
  volume and owner. Search, filter by stage, export CSV, and open any model for
  evaluation evidence, guardrails, lineage and promotion / shadow / archive
  controls.
- **Training** — reproducible runs with loss curves. Queue a run (model,
  objective, epochs, compute budget); it trains in the page and lands in the
  registry as a candidate.
- **Data** — governed data products with quality scores, freshness, PII class,
  open incidents, schema, downstream lineage and consumers.
- **Agents** — eight autonomous agents. Each has an autonomy dial (Observe →
  Recommend → Act with approval → Fully autonomous), pause/resume and visible
  guardrails.
- **Governance** — the execution policy: confidence floor, spend limit, dual
  control and auto-freeze, the risk-tier matrix, the Tier-1 register and the
  append-only audit log with CSV export.

Everything an operator changes (stages, autonomy, pauses, approvals, policy,
launched runs, theme, comparison window) persists to `localStorage` under
`meridian:`.

## Run it

Dependencies are installed with npm and pinned in `package-lock.json`:

```sh
npm install
npm run dev        # http://localhost:5187 (Vite + the Worker in workerd)
npm run build      # dist/client (assets) + dist/meridian/index.js (Worker)
npm run test       # vitest: data, derived metrics, formatting and the API routes
npm run typecheck
```

## How it is built

- `src/data.ts` — every type and all seeded data: 12 models, 10 datasets, 8
  agents, 24 ledger decisions, 6 signals, 10 runs, and the weekly indices.
  Replace the arrays and the rest of the console follows.
- `src/lib/metrics.ts` — derived KPIs (`kpis`, `avgAccuracy`, `drifting`, …).
- `src/lib/store.tsx` — one context for operator state; derived live models,
  agents, decisions and runs.
- `src/pages/*` — the six routes. `src/app/*` — shared console pieces
  (`DecisionStream`, `AgentPulse`, `DriftWatch`, `SignalList`, `ModelDrawer`,
  `RunDrawer`, `DatasetDrawer`, `KpiStrip`, header/nav/footer).
- `src/components/*` — the design system: `Panel`, `Kpi`, `DataTable`, `Pill`,
  `TextTabs`, `Tag`, `Chip`, `Sparkline`, `WeeklyChart`, `Overlay`, `Field`
  controls, `Toast`, `Progress`, `Stat`, `EmptyState`, `Kbd`.
- `src/styles.css` — warm-dark/cream tokens (Newsreader + IBM Plex Mono +
  Inter), with a light theme. Motion respects `prefers-reduced-motion`.
- `src/worker/index.ts` — Hono Worker: `GET /api/models[?stage=]`,
  `GET /api/models/:id`, `GET /api/agents`, `GET /api/decisions[?outcome=]`,
  `GET /api/datasets`, `GET /api/insights`, `GET /api/runs`, `GET /api/health`,
  then static assets in SPA mode.
- `src/worker/repo.ts` — the API's read model. With a `DB` binding it queries D1;
  without one (unit tests, a bare Worker) it serves the seed arrays, so the shape
  never changes. Responses carry `x-data-source: d1 | seed`.
- `src/worker/db.ts` + `migrations/0001_init.sql` — the Worker applies the schema
  and seeds the tables on the first request that reaches the API (cached per
  isolate, idempotent, reseeded when `SEED_VERSION` is bumped).

## Architecture

```
UI (React · Vite · TypeScript)
        │
        ▼
API layer — Worker (Hono, src/worker) ──► /api/ml/* ──► ML engine (FastAPI, services/ml)
        │                                                        │
        ▼                                                        ▼
Data engine — D1 (SQL, migrations/)                    PostgreSQL | SQLite + MLflow
```

| Layer | Where | What is real |
| --- | --- | --- |
| UI | `src/pages`, `src/app` | React console, reads `src/data.ts` |
| API (Hono) | `src/worker/index.ts` | D1-backed registry routes + proxy to the ML engine |
| API (FastAPI) | `services/ml/app.py` | Training, scoring, agent tool loop |
| Data engine | `migrations/`, `src/worker/db.ts` | Schema + seed applied on first request |
| ML engine | `services/ml/engine.py` | Real gradient-descent training, real loss curve |
| Agents | `services/ml/agents.py` | Policy-gated, allow-listed tools with an audit log |
| Persistence | D1 · PostgreSQL/SQLite | API reads from SQL; ML runs and agent actions are stored |

## Python ML engine

The ML engine is a FastAPI service; see `services/ml/README.md`. It is not part of
the static deploy — Freebuff Sites runs the Worker, not Python — so run it
separately and point `ML_SERVICE_URL` at it. Without that variable `/api/ml/*`
answers `503 { code: "ml_unconfigured" }`.

```sh
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r services/ml/requirements.txt
python -m uvicorn services.ml.app:app --port 8000
npm run test:py     # 18 pytest tests
```

`docker compose up` brings up PostgreSQL, MLflow and the ML engine together.

## Data

The console UI still reads `src/data.ts` directly, so the app runs with no
backend. The API is the storage path: on first request it creates the D1 tables
(`models`, `agents`, `decisions`, `datasets`, `insights`, `runs`, `meta`) and
seeds them from the same checked-in data.

Local development uses a local D1 database created by the Vite plugin under
`.wrangler/state`. In production the `DB` binding comes from Freebuff Sites
(Sites → Storage, D1, binding `DB`). Apply the schema out of band, if you prefer,
with `npx wrangler d1 migrations apply meridian --local` / `--remote`.

Keyboard: `g c/m/t/d/a/g` to move, `/` to search models, `t` theme, `?` help.

## Deploy with Freebuff Sites

`deploy.json` points at the build output. After `npm run build`, deploy with the
`sites_deploy` tool. Add the D1 database (binding `DB`) in Sites → Storage before
the first deploy that needs the API; the Worker creates and seeds its own schema.
