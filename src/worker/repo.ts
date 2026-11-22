import { AGENTS, DATASETS, DECISIONS, INSIGHTS, MODELS, RUNS, modelById, type Agent, type Dataset, type Decision, type Insight, type Model, type ModelStage, type Run } from '../data'

import { ready } from './db'

/*
  Read model for the API.

  Every route goes through here. When the Worker has a D1 binding (deployed, or
  `npm run dev` with the local database) the query hits SQL; without a binding —
  unit tests, a bare `wrangler dev` without the config — the same shape is served
  from the checked-in seed arrays so the console still runs.
*/

export type Source = 'd1' | 'seed'

export type ModelSummary = Pick<Model, 'id' | 'name' | 'code' | 'domain' | 'task' | 'stage' | 'version' | 'accuracy' | 'drift' | 'latencyMs' | 'riskTier' | 'owner'>

export type AgentSummary = {
  id: string
  name: string
  domain: Agent['domain']
  autonomy: Agent['defaultAutonomy']
  actionsToday: number
  successRate: number
  escalations: number
  owner: string
}

export function summary(m: Model): ModelSummary {
  return {
    id: m.id,
    name: m.name,
    code: m.code,
    domain: m.domain,
    task: m.task,
    stage: m.stage,
    version: m.version,
    accuracy: m.accuracy,
    drift: m.drift,
    latencyMs: m.latencyMs,
    riskTier: m.riskTier,
    owner: m.owner,
  }
}

export function agentSummary(a: Agent): AgentSummary {
  return {
    id: a.id,
    name: a.name,
    domain: a.domain,
    autonomy: a.defaultAutonomy,
    actionsToday: a.actionsToday,
    successRate: a.successRate,
    escalations: a.escalations,
    owner: a.owner,
  }
}

/* ---------------------------------------------------------------- row mappers */

type ModelRow = {
  id: string
  name: string
  code: string
  domain: string
  task: string
  stage: string
  version: string
  accuracy: number
  drift: number
  latency_ms: number
  inferences: number
  owner: string
  updated: string
  risk_tier: string
  features: number
  datasets: string
  guardrails: string
  note: string
  accuracy13: string
  drift13: string
}

function toModel(r: ModelRow): Model {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    domain: r.domain as Model['domain'],
    task: r.task as Model['task'],
    stage: r.stage as ModelStage,
    version: r.version,
    accuracy: r.accuracy,
    drift: r.drift,
    latencyMs: r.latency_ms,
    inferences: r.inferences,
    owner: r.owner,
    updated: r.updated,
    riskTier: r.risk_tier as Model['riskTier'],
    features: r.features,
    datasets: JSON.parse(r.datasets) as string[],
    guardrails: JSON.parse(r.guardrails) as string[],
    note: r.note,
    accuracy13: JSON.parse(r.accuracy13) as number[],
    drift13: JSON.parse(r.drift13) as number[],
  }
}

type AgentRow = { id: string; name: string; domain: string; default_autonomy: string; actions_today: number; success_rate: number; escalations: number; owner: string }

function toAgentSummary(r: AgentRow): AgentSummary {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain as Agent['domain'],
    autonomy: r.default_autonomy as Agent['defaultAutonomy'],
    actionsToday: r.actions_today,
    successRate: r.success_rate,
    escalations: r.escalations,
    owner: r.owner,
  }
}

type DecisionRow = {
  id: string
  time: string
  agent_id: string
  action: string
  subject: string
  confidence: number
  outcome: string
  value: number
  domain: string
}

function toDecision(r: DecisionRow): Decision {
  return {
    id: r.id,
    time: r.time,
    agentId: r.agent_id,
    action: r.action,
    subject: r.subject,
    confidence: r.confidence,
    outcome: r.outcome as Decision['outcome'],
    value: r.value,
    domain: r.domain as Decision['domain'],
  }
}

/* -------------------------------------------------------------------- queries */

export async function listModels(db: D1Database | undefined, stage?: ModelStage): Promise<{ rows: ModelSummary[]; source: Source }> {
  if (!db) {
    const list = stage ? MODELS.filter((m) => m.stage === stage) : MODELS
    return { rows: list.map(summary), source: 'seed' }
  }
  await ready(db)
  const stmt = stage
    ? db.prepare('SELECT * FROM models WHERE stage = ? ORDER BY rowid').bind(stage)
    : db.prepare('SELECT * FROM models ORDER BY rowid')
  const { results } = await stmt.all<ModelRow>()
  return { rows: results.map((r) => summary(toModel(r))), source: 'd1' }
}

export async function findModel(db: D1Database | undefined, id: string): Promise<{ model: Model | undefined; source: Source }> {
  if (!db) return { model: modelById(id), source: 'seed' }
  await ready(db)
  const row = await db.prepare('SELECT * FROM models WHERE id = ?').bind(id).first<ModelRow>()
  return { model: row ? toModel(row) : undefined, source: 'd1' }
}

export async function listAgents(db: D1Database | undefined): Promise<{ rows: AgentSummary[]; source: Source }> {
  if (!db) return { rows: AGENTS.map(agentSummary), source: 'seed' }
  await ready(db)
  const { results } = await db.prepare('SELECT * FROM agents ORDER BY rowid').all<AgentRow>()
  return { rows: results.map(toAgentSummary), source: 'd1' }
}

export async function listDecisions(db: D1Database | undefined, outcome?: string): Promise<{ rows: Decision[]; source: Source }> {
  if (!db) {
    const list = outcome ? DECISIONS.filter((d) => d.outcome.toLowerCase() === outcome.toLowerCase()) : DECISIONS
    return { rows: list, source: 'seed' }
  }
  await ready(db)
  const stmt = outcome
    ? db.prepare('SELECT * FROM decisions WHERE lower(outcome) = lower(?) ORDER BY time DESC').bind(outcome)
    : db.prepare('SELECT * FROM decisions ORDER BY time DESC')
  const { results } = await stmt.all<DecisionRow>()
  return { rows: results.map(toDecision), source: 'd1' }
}

type DatasetRow = {
  id: string
  name: string
  domain: string
  source: string
  owner: string
  row_count: string
  quality: number
  freshness_hours: number
  pii: number
  streaming: number
  used_by: number
  columns: string
  issue: string | null
}

function toDataset(r: DatasetRow): Dataset {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain as Dataset['domain'],
    source: r.source,
    owner: r.owner,
    rows: r.row_count,
    quality: r.quality,
    freshnessHours: r.freshness_hours,
    pii: r.pii === 1,
    streaming: r.streaming === 1,
    usedBy: r.used_by,
    columns: JSON.parse(r.columns) as string[],
    issue: r.issue ?? undefined,
  }
}

export async function listDatasets(db: D1Database | undefined): Promise<{ rows: Dataset[]; source: Source }> {
  if (!db) return { rows: DATASETS, source: 'seed' }
  await ready(db)
  const { results } = await db.prepare('SELECT * FROM datasets ORDER BY rowid').all<DatasetRow>()
  return { rows: results.map(toDataset), source: 'd1' }
}

type InsightRow = { id: string; kind: string; title: string; body: string; domain: string; impact: string; confidence: number; model_id: string }

function toInsight(r: InsightRow): Insight {
  return {
    id: r.id,
    kind: r.kind as Insight['kind'],
    title: r.title,
    body: r.body,
    domain: r.domain as Insight['domain'],
    impact: r.impact,
    confidence: r.confidence,
    modelId: r.model_id,
  }
}

export async function listInsights(db: D1Database | undefined): Promise<{ rows: Insight[]; source: Source }> {
  if (!db) return { rows: INSIGHTS, source: 'seed' }
  await ready(db)
  const { results } = await db.prepare('SELECT * FROM insights ORDER BY rowid').all<InsightRow>()
  return { rows: results.map(toInsight), source: 'd1' }
}

type RunRow = { id: string; model_id: string; objective: string; status: string; started: string; duration: string; epochs: number; compute: number; cost: number; accuracy: number; owner: string; git_commit: string; loss: string }

function toRun(r: RunRow): Run {
  return {
    id: r.id,
    modelId: r.model_id,
    objective: r.objective,
    status: r.status as Run['status'],
    started: r.started,
    duration: r.duration,
    epochs: r.epochs,
    compute: r.compute,
    cost: r.cost,
    accuracy: r.accuracy,
    owner: r.owner,
    commit: r.git_commit,
    loss: JSON.parse(r.loss) as number[],
  }
}

export async function listRuns(db: D1Database | undefined): Promise<{ rows: Run[]; source: Source }> {
  if (!db) return { rows: RUNS, source: 'seed' }
  await ready(db)
  const { results } = await db.prepare('SELECT * FROM runs ORDER BY rowid').all<RunRow>()
  return { rows: results.map(toRun), source: 'd1' }
}
