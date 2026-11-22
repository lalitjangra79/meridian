-- Meridian schema. Applied by the Worker on first request (src/worker/db.ts) and
-- by `wrangler d1 migrations apply` when you want it applied out of band.

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  domain TEXT NOT NULL,
  task TEXT NOT NULL,
  stage TEXT NOT NULL,
  version TEXT NOT NULL,
  accuracy REAL NOT NULL,
  drift REAL NOT NULL,
  latency_ms INTEGER NOT NULL,
  inferences INTEGER NOT NULL,
  owner TEXT NOT NULL,
  updated TEXT NOT NULL,
  risk_tier TEXT NOT NULL,
  features INTEGER NOT NULL,
  datasets TEXT NOT NULL,
  guardrails TEXT NOT NULL,
  note TEXT NOT NULL,
  accuracy13 TEXT NOT NULL,
  drift13 TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_models_stage ON models (stage);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  default_autonomy TEXT NOT NULL,
  actions_today INTEGER NOT NULL,
  success_rate REAL NOT NULL,
  escalations INTEGER NOT NULL,
  owner TEXT NOT NULL,
  guardrails TEXT NOT NULL,
  last_action TEXT NOT NULL,
  model_ids TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  subject TEXT NOT NULL,
  confidence REAL NOT NULL,
  outcome TEXT NOT NULL,
  value REAL NOT NULL,
  domain TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents (id)
);

CREATE INDEX IF NOT EXISTS idx_decisions_outcome ON decisions (outcome);

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  owner TEXT NOT NULL,
  row_count TEXT NOT NULL,
  quality INTEGER NOT NULL,
  freshness_hours INTEGER NOT NULL,
  pii INTEGER NOT NULL,
  streaming INTEGER NOT NULL,
  used_by INTEGER NOT NULL,
  columns TEXT NOT NULL,
  issue TEXT
);

CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  domain TEXT NOT NULL,
  impact TEXT NOT NULL,
  confidence REAL NOT NULL,
  model_id TEXT NOT NULL,
  FOREIGN KEY (model_id) REFERENCES models (id)
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL,
  started TEXT NOT NULL,
  duration TEXT NOT NULL,
  epochs INTEGER NOT NULL,
  compute INTEGER NOT NULL,
  cost REAL NOT NULL,
  accuracy REAL NOT NULL,
  owner TEXT NOT NULL,
  git_commit TEXT NOT NULL,
  loss TEXT NOT NULL,
  FOREIGN KEY (model_id) REFERENCES models (id)
);

CREATE INDEX IF NOT EXISTS idx_runs_model ON runs (model_id);
