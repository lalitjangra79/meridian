/*
  Seed data for Meridian, the autonomous enterprise intelligence platform.

  Everything here is deterministic and local: twelve registered models, ten
  governed datasets, eight autonomous agents and the decision ledger they write
  to. Swap the arrays for a warehouse, a feature store or an API — every page
  derives its numbers from these structures.
*/

export const TODAY = '2026-11-22'

export const copy = {
  title: 'Meridian',
  tagline: 'Autonomous enterprise intelligence',
  lede: 'The control plane for an autonomous enterprise: every model, agent and decision in one place.',
}

/** Longest window offered by the top-bar control. */
export const RANGES = [4, 8, 13] as const
export type Range = (typeof RANGES)[number]
export const DEFAULT_RANGE: Range = 13

export const NAV = [
  { path: '/', label: 'Command' },
  { path: '/models', label: 'Models' },
  { path: '/training', label: 'Training' },
  { path: '/data', label: 'Data' },
  { path: '/agents', label: 'Agents' },
  { path: '/governance', label: 'Governance' },
] as const

export const SHORTCUTS = [
  { label: 'Command center', keys: ['g', 'c'] },
  { label: 'Models', keys: ['g', 'm'] },
  { label: 'Training runs', keys: ['g', 't'] },
  { label: 'Data estate', keys: ['g', 'd'] },
  { label: 'Agents', keys: ['g', 'a'] },
  { label: 'Governance', keys: ['g', 'g'] },
  { label: 'Search models', keys: ['/'] },
  { label: 'Switch theme', keys: ['t'] },
]

export type Domain = 'Revenue' | 'Supply chain' | 'Risk & fraud' | 'Customer' | 'Operations' | 'People'
export const DOMAINS: Domain[] = ['Revenue', 'Supply chain', 'Risk & fraud', 'Customer', 'Operations', 'People']

export type Task = 'Forecasting' | 'Classification' | 'Ranking' | 'Extraction' | 'Anomaly detection' | 'Optimization' | 'Risk scoring'
export type ModelStage = 'Production' | 'Shadow' | 'Staging' | 'Archived'
export const STAGES: ModelStage[] = ['Production', 'Shadow', 'Staging', 'Archived']
export type RiskTier = 'Tier 1' | 'Tier 2' | 'Tier 3'

export type Model = {
  id: string
  name: string
  code: string
  domain: Domain
  task: Task
  stage: ModelStage
  version: string
  /** Held-out accuracy, 0–1. */
  accuracy: number
  /** Population stability index, 0–1. Above 0.2 the model is drifting. */
  drift: number
  latencyMs: number
  inferences: number
  owner: string
  updated: string
  riskTier: RiskTier
  features: number
  datasets: string[]
  guardrails: string[]
  note: string
  accuracy13: number[]
  drift13: number[]
}

export type Dataset = {
  id: string
  name: string
  domain: Domain
  source: string
  owner: string
  rows: string
  quality: number
  freshnessHours: number
  pii: boolean
  streaming?: boolean
  usedBy: number
  columns: string[]
  issue?: string
}

export type AutonomyLevel = 'Observe' | 'Recommend' | 'Act with approval' | 'Fully autonomous'
export const AUTONOMY: AutonomyLevel[] = ['Observe', 'Recommend', 'Act with approval', 'Fully autonomous']

export type Agent = {
  id: string
  name: string
  domain: Domain
  description: string
  defaultAutonomy: AutonomyLevel
  actionsToday: number
  successRate: number
  escalations: number
  owner: string
  guardrails: string[]
  lastAction: string
  modelIds: string[]
}

export type Outcome = 'Auto-executed' | 'Awaiting approval' | 'Escalated' | 'Approved'

export type Decision = {
  id: string
  time: string
  agentId: string
  action: string
  subject: string
  confidence: number
  outcome: Outcome
  value: number
  domain: Domain
}

export type Insight = {
  id: string
  kind: 'Anomaly' | 'Forecast' | 'Opportunity' | 'Risk'
  title: string
  body: string
  domain: Domain
  impact: string
  confidence: number
  modelId: string
}

export type RunStatus = 'Succeeded' | 'Failed'
export type Run = {
  id: string
  modelId: string
  objective: string
  status: RunStatus
  started: string
  duration: string
  epochs: number
  compute: number
  cost: number
  accuracy: number
  owner: string
  commit: string
  loss: number[]
}

/* ------------------------------------------------------------------ helpers */

function rng(seed: number) {
  let s = seed % 2 ** 31
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

/** A wandering weekly series, rounded to `digits`. */
function walk(seed: number, start: number, n: number, step: number, noise: number, digits = 0): number[] {
  const r = rng(seed)
  const out: number[] = []
  let v = start
  const p = 10 ** digits
  for (let i = 0; i < n; i++) {
    v += step + (r() - 0.5) * noise
    out.push(Math.round(v * p) / p)
  }
  return out
}

/** A descending training curve with a little noise. */
export function lossCurve(seed: number, points = 28, from = 1.9, to = 0.18): number[] {
  const r = rng(seed)
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    const base = to + (from - to) * Math.exp(-3.1 * t)
    return Math.round((base + (r() - 0.5) * 0.06 * (1 - t)) * 1000) / 1000
  })
}

export const MODELS: Model[] = [
  {
    id: 'mdl-churn',
    name: 'Churn propensity',
    code: 'churn-propensity',
    domain: 'Customer',
    task: 'Classification',
    stage: 'Production',
    version: 'v4.2.1',
    accuracy: 0.947,
    drift: 0.08,
    latencyMs: 24,
    inferences: 184_200,
    owner: 'S. Raman',
    updated: '2026-11-18',
    riskTier: 'Tier 1',
    features: 148,
    datasets: ['ds-crm', 'ds-tickets', 'ds-orders'],
    guardrails: ['No outreach to accounts under legal hold', 'Explanations retained for 24 months'],
    note: 'Scores every active account weekly for 90-day churn risk and feeds the retention agent.',
    accuracy13: walk(11, 0.912, 13, 0.0028, 0.006, 3),
    drift13: walk(12, 0.19, 13, -0.008, 0.012, 3),
  },
  {
    id: 'mdl-demand',
    name: 'Demand forecast',
    code: 'demand-forecast',
    domain: 'Supply chain',
    task: 'Forecasting',
    stage: 'Production',
    version: 'v7.0.3',
    accuracy: 0.912,
    drift: 0.23,
    latencyMs: 68,
    inferences: 96_400,
    owner: 'M. Lindqvist',
    updated: '2026-11-21',
    riskTier: 'Tier 1',
    features: 212,
    datasets: ['ds-orders', 'ds-inventory', 'ds-pricing'],
    guardrails: ['Never forecasts beyond committed capacity', 'Manual review above 18% variance'],
    note: 'Eight-week SKU-level demand across 42 markets. Now drifting on APAC promotion mix.',
    accuracy13: walk(21, 0.938, 13, -0.002, 0.007, 3),
    drift13: walk(22, 0.09, 13, 0.011, 0.014, 3),
  },
  {
    id: 'mdl-invoice',
    name: 'Invoice exception',
    code: 'invoice-exception',
    domain: 'Operations',
    task: 'Extraction',
    stage: 'Production',
    version: 'v3.8.0',
    accuracy: 0.981,
    drift: 0.04,
    latencyMs: 41,
    inferences: 412_800,
    owner: 'J. Park',
    updated: '2026-11-20',
    riskTier: 'Tier 2',
    features: 64,
    datasets: ['ds-contracts', 'ds-orders'],
    guardrails: ['No payment release without two-field match', 'Amounts over $250k always escalate'],
    note: 'Reads supplier invoices, flags mismatches against the contract corpus and routes them.',
    accuracy13: walk(31, 0.968, 13, 0.0011, 0.003, 3),
    drift13: walk(32, 0.06, 13, -0.0012, 0.008, 3),
  },
  {
    id: 'mdl-fraud',
    name: 'Fraud sentinel',
    code: 'fraud-sentinel',
    domain: 'Risk & fraud',
    task: 'Anomaly detection',
    stage: 'Production',
    version: 'v5.1.4',
    accuracy: 0.968,
    drift: 0.11,
    latencyMs: 9,
    inferences: 2_840_000,
    owner: 'A. Okafor',
    updated: '2026-11-22',
    riskTier: 'Tier 1',
    features: 334,
    datasets: ['ds-payments', 'ds-crm'],
    guardrails: ['Never blocks a verified merchant', 'Every adverse action is human-appealable'],
    note: 'Streaming transaction scoring with a 9 ms budget. Drives the fraud containment agent.',
    accuracy13: walk(41, 0.951, 13, 0.0013, 0.002, 3),
    drift13: walk(42, 0.16, 13, -0.004, 0.006, 3),
  },
  {
    id: 'mdl-pricing',
    name: 'Price elasticity',
    code: 'price-elasticity',
    domain: 'Revenue',
    task: 'Optimization',
    stage: 'Production',
    version: 'v2.4.0',
    accuracy: 0.884,
    drift: 0.31,
    latencyMs: 122,
    inferences: 58_900,
    owner: 'L. Moreau',
    updated: '2026-11-19',
    riskTier: 'Tier 1',
    features: 176,
    datasets: ['ds-pricing', 'ds-orders'],
    guardrails: ['Minimum margin floor 18%', 'No repricing of contracted renewals'],
    note: 'Estimates elasticity per segment and proposes price bands. Drift is above policy.',
    accuracy13: walk(51, 0.902, 13, -0.0018, 0.009, 3),
    drift13: walk(52, 0.14, 13, 0.014, 0.015, 3),
  },
  {
    id: 'mdl-nbo',
    name: 'Next best offer',
    code: 'next-best-offer',
    domain: 'Revenue',
    task: 'Ranking',
    stage: 'Production',
    version: 'v6.0.2',
    accuracy: 0.903,
    drift: 0.12,
    latencyMs: 33,
    inferences: 221_600,
    owner: 'S. Raman',
    updated: '2026-11-17',
    riskTier: 'Tier 2',
    features: 129,
    datasets: ['ds-crm', 'ds-orders', 'ds-pricing'],
    guardrails: ['Offer ceilings set by sales ops', 'Suppressed during active escalations'],
    note: 'Ranks the next expansion motion for every open opportunity in the pipeline.',
    accuracy13: walk(61, 0.881, 13, 0.0016, 0.007, 3),
    drift13: walk(62, 0.17, 13, -0.004, 0.009, 3),
  },
  {
    id: 'mdl-triage',
    name: 'Ticket triage',
    code: 'ticket-triage',
    domain: 'Customer',
    task: 'Classification',
    stage: 'Production',
    version: 'v2.9.6',
    accuracy: 0.958,
    drift: 0.06,
    latencyMs: 18,
    inferences: 305_100,
    owner: 'D. Haddad',
    updated: '2026-11-21',
    riskTier: 'Tier 3',
    features: 58,
    datasets: ['ds-tickets', 'ds-crm'],
    guardrails: ['Severity 1 always routed to a human', 'No auto-close on safety topics'],
    note: 'Classifies and routes inbound tickets, setting severity and the owning queue.',
    accuracy13: walk(71, 0.941, 13, 0.0013, 0.004, 3),
    drift13: walk(72, 0.08, 13, -0.0015, 0.006, 3),
  },
  {
    id: 'mdl-supplier',
    name: 'Supplier risk',
    code: 'supplier-risk',
    domain: 'Supply chain',
    task: 'Risk scoring',
    stage: 'Shadow',
    version: 'v1.6.0',
    accuracy: 0.871,
    drift: 0.18,
    latencyMs: 54,
    inferences: 12_400,
    owner: 'M. Lindqvist',
    updated: '2026-11-15',
    riskTier: 'Tier 2',
    features: 94,
    datasets: ['ds-supplier', 'ds-orders'],
    guardrails: ['Shadow only — never writes to the supplier record'],
    note: 'Scores supplier concentration and delivery risk. Running in shadow before promotion.',
    accuracy13: walk(81, 0.842, 13, 0.0023, 0.008, 3),
    drift13: walk(82, 0.2, 13, -0.002, 0.011, 3),
  },
  {
    id: 'mdl-attrition',
    name: 'Attrition signal',
    code: 'attrition-signal',
    domain: 'People',
    task: 'Classification',
    stage: 'Staging',
    version: 'v0.9.2',
    accuracy: 0.823,
    drift: 0.09,
    latencyMs: 27,
    inferences: 3_800,
    owner: 'K. Novak',
    updated: '2026-11-12',
    riskTier: 'Tier 1',
    features: 72,
    datasets: ['ds-hris'],
    guardrails: ['Aggregate reporting only', 'No individual score is shown to managers'],
    note: 'Models attrition risk by team to inform workforce planning. Aggregate output only.',
    accuracy13: walk(91, 0.794, 13, 0.0022, 0.009, 3),
    drift13: walk(92, 0.13, 13, -0.003, 0.01, 3),
  },
  {
    id: 'mdl-contract',
    name: 'Contract reader',
    code: 'contract-reader',
    domain: 'Operations',
    task: 'Extraction',
    stage: 'Production',
    version: 'v4.0.1',
    accuracy: 0.99,
    drift: 0.03,
    latencyMs: 86,
    inferences: 47_600,
    owner: 'J. Park',
    updated: '2026-11-22',
    riskTier: 'Tier 2',
    features: 41,
    datasets: ['ds-contracts'],
    guardrails: ['Citations required on every extracted clause', 'No amendment drafting'],
    note: 'Extracts obligations, renewal terms and liability caps from signed contracts.',
    accuracy13: walk(101, 0.982, 13, 0.0006, 0.002, 3),
    drift13: walk(102, 0.05, 13, -0.0011, 0.005, 3),
  },
  {
    id: 'mdl-energy',
    name: 'Energy scheduler',
    code: 'energy-scheduler',
    domain: 'Operations',
    task: 'Optimization',
    stage: 'Production',
    version: 'v3.3.0',
    accuracy: 0.932,
    drift: 0.15,
    latencyMs: 210,
    inferences: 8_200,
    owner: 'R. Silva',
    updated: '2026-11-16',
    riskTier: 'Tier 2',
    features: 88,
    datasets: ['ds-telemetry', 'ds-pricing'],
    guardrails: ['Never exceeds contracted peak load', 'Safety interlocks are out of scope'],
    note: 'Shifts plant load across tariff windows within committed capacity.',
    accuracy13: walk(111, 0.921, 13, 0.0009, 0.004, 3),
    drift13: walk(112, 0.11, 13, 0.003, 0.007, 3),
  },
  {
    id: 'mdl-winprob',
    name: 'Win probability',
    code: 'win-probability',
    domain: 'Revenue',
    task: 'Ranking',
    stage: 'Archived',
    version: 'v3.1.0',
    accuracy: 0.79,
    drift: 0.22,
    latencyMs: 31,
    inferences: 0,
    owner: 'L. Moreau',
    updated: '2026-09-30',
    riskTier: 'Tier 3',
    features: 67,
    datasets: ['ds-crm', 'ds-orders'],
    guardrails: ['Retired — superseded by next best offer'],
    note: 'Superseded in September by the next best offer ranker. Kept for audit lineage.',
    accuracy13: walk(121, 0.803, 13, -0.0009, 0.009, 3),
    drift13: walk(122, 0.19, 13, 0.002, 0.01, 3),
  },
]

export const DATASETS: Dataset[] = [
  {
    id: 'ds-crm',
    name: 'Customer 360',
    domain: 'Customer',
    source: 'Snowflake · CRM',
    owner: 'S. Raman',
    rows: '18.4M',
    quality: 94,
    freshnessHours: 2,
    pii: true,
    usedBy: 3,
    columns: ['account_id', 'segment', 'arr', 'health_score', 'owner_id', 'renewal_date'],
  },
  {
    id: 'ds-orders',
    name: 'Order ledger',
    domain: 'Revenue',
    source: 'Snowflake · ERP',
    owner: 'L. Moreau',
    rows: '92.1M',
    quality: 97,
    freshnessHours: 1,
    pii: false,
    usedBy: 4,
    columns: ['order_id', 'account_id', 'sku', 'units', 'net_price', 'booked_at'],
  },
  {
    id: 'ds-inventory',
    name: 'Inventory positions',
    domain: 'Supply chain',
    source: 'Databricks · WMS',
    owner: 'M. Lindqvist',
    rows: '41.6M',
    quality: 88,
    freshnessHours: 6,
    pii: false,
    usedBy: 1,
    columns: ['sku', 'site_id', 'on_hand', 'in_transit', 'committed', 'as_of'],
  },
  {
    id: 'ds-supplier',
    name: 'Supplier master',
    domain: 'Supply chain',
    source: 'Postgres · procurement',
    owner: 'M. Lindqvist',
    rows: '1.2M',
    quality: 76,
    freshnessHours: 38,
    pii: false,
    usedBy: 1,
    columns: ['supplier_id', 'legal_name', 'region', 'tier', 'lead_time_days', 'risk_band'],
    issue: '38 h stale — ingestion job failed twice; `risk_band` is 11% null',
  },
  {
    id: 'ds-tickets',
    name: 'Support tickets',
    domain: 'Customer',
    source: 'Kafka · support',
    owner: 'D. Haddad',
    rows: '8.9M',
    quality: 91,
    freshnessHours: 3,
    pii: true,
    usedBy: 2,
    columns: ['ticket_id', 'account_id', 'channel', 'subject', 'severity', 'queue', 'opened_at'],
  },
  {
    id: 'ds-contracts',
    name: 'Contract corpus',
    domain: 'Operations',
    source: 'S3 · legal',
    owner: 'J. Park',
    rows: '412k',
    quality: 82,
    freshnessHours: 14,
    pii: true,
    usedBy: 2,
    columns: ['contract_id', 'counterparty', 'effective_on', 'term_months', 'liability_cap', 'document_uri'],
    issue: 'OCR quality dropped on 2,104 scanned amendments from the EU entity',
  },
  {
    id: 'ds-payments',
    name: 'Payment events',
    domain: 'Risk & fraud',
    source: 'Kafka · ledger',
    owner: 'A. Okafor',
    rows: '1.4B',
    quality: 96,
    freshnessHours: 0,
    pii: true,
    streaming: true,
    usedBy: 1,
    columns: ['event_id', 'merchant_id', 'amount', 'currency', 'channel', 'device_id', 'event_at'],
  },
  {
    id: 'ds-hris',
    name: 'Workforce directory',
    domain: 'People',
    source: 'Workday · HRIS',
    owner: 'K. Novak',
    rows: '84k',
    quality: 89,
    freshnessHours: 26,
    pii: true,
    usedBy: 1,
    columns: ['employee_id', 'team_id', 'role_family', 'level', 'tenure_months', 'location'],
    issue: 'Nightly sync is running 4 h behind; team reorgs not yet reflected',
  },
  {
    id: 'ds-telemetry',
    name: 'Plant telemetry',
    domain: 'Operations',
    source: 'MQTT · SCADA',
    owner: 'R. Silva',
    rows: '3.8B',
    quality: 93,
    freshnessHours: 0,
    pii: false,
    streaming: true,
    usedBy: 1,
    columns: ['site_id', 'asset_id', 'metric', 'reading', 'unit', 'recorded_at'],
  },
  {
    id: 'ds-pricing',
    name: 'Price & promo history',
    domain: 'Revenue',
    source: 'BigQuery · commercial',
    owner: 'L. Moreau',
    rows: '64.3M',
    quality: 85,
    freshnessHours: 9,
    pii: false,
    usedBy: 3,
    columns: ['sku', 'region', 'list_price', 'discount_pct', 'promo_code', 'valid_from', 'valid_to'],
    issue: 'Region codes changed upstream; 6% of rows fail the new region mapping',
  },
]

export const AGENTS: Agent[] = [
  {
    id: 'ag-fraud',
    name: 'Fraud containment',
    domain: 'Risk & fraud',
    description: 'Scores payment events in real time and holds, steps up or clears each transaction.',
    defaultAutonomy: 'Fully autonomous',
    actionsToday: 1840,
    successRate: 0.991,
    escalations: 2,
    owner: 'A. Okafor',
    guardrails: ['Never blocks a verified merchant', 'Every hold is appealable within 24 h', 'Card testing spikes freeze the agent'],
    lastAction: 'Held a $18,400 card-testing burst',
    modelIds: ['mdl-fraud'],
  },
  {
    id: 'ag-invoice',
    name: 'Invoice resolution',
    domain: 'Operations',
    description: 'Matches invoices to contracts, resolves tolerance mismatches and schedules payment.',
    defaultAutonomy: 'Fully autonomous',
    actionsToday: 2310,
    successRate: 0.983,
    escalations: 5,
    owner: 'J. Park',
    guardrails: ['Amounts over $250k escalate', 'No payment without a two-field match', 'Duplicate invoice detection always on'],
    lastAction: 'Cleared 41 invoices in the EMEA queue',
    modelIds: ['mdl-invoice', 'mdl-contract'],
  },
  {
    id: 'ag-energy',
    name: 'Energy optimisation',
    domain: 'Operations',
    description: 'Shifts plant load across tariff windows and bids flexibility into the day-ahead market.',
    defaultAutonomy: 'Fully autonomous',
    actionsToday: 640,
    successRate: 0.967,
    escalations: 1,
    owner: 'R. Silva',
    guardrails: ['Contracted peak load is a hard ceiling', 'Never touches safety interlocks'],
    lastAction: 'Moved 4.2 MWh into the off-peak window',
    modelIds: ['mdl-energy'],
  },
  {
    id: 'ag-revenue',
    name: 'Revenue recovery',
    domain: 'Revenue',
    description: 'Finds at-risk renewals and drafts the recovery motion for the owning account executive.',
    defaultAutonomy: 'Act with approval',
    actionsToday: 412,
    successRate: 0.94,
    escalations: 3,
    owner: 'S. Raman',
    guardrails: ['Discounts above 12% need approval', 'Tier-1 outreach requires the CSM', 'No contact during legal hold'],
    lastAction: 'Drafted a save play for Northwind Logistics',
    modelIds: ['mdl-churn', 'mdl-nbo'],
  },
  {
    id: 'ag-churn',
    name: 'Retention outreach',
    domain: 'Customer',
    description: 'Sequences low-risk outreach for accounts with softening usage and no open escalation.',
    defaultAutonomy: 'Act with approval',
    actionsToday: 168,
    successRate: 0.901,
    escalations: 11,
    owner: 'D. Haddad',
    guardrails: ['One touch per account per week', 'Suppressed during open severity-1 tickets', 'Draft-only for enterprise accounts'],
    lastAction: 'Paused 3 sequences after a sentiment drop',
    modelIds: ['mdl-churn', 'mdl-triage'],
  },
  {
    id: 'ag-supply',
    name: 'Supply rebalancing',
    domain: 'Supply chain',
    description: 'Recommends stock transfers between sites when a region drifts outside its service band.',
    defaultAutonomy: 'Recommend',
    actionsToday: 96,
    successRate: 0.88,
    escalations: 7,
    owner: 'M. Lindqvist',
    guardrails: ['Recommendations only while the forecast is drifting', 'No transfers under 200 units'],
    lastAction: 'Flagged 5 APAC SKUs for rebalancing',
    modelIds: ['mdl-demand', 'mdl-supplier'],
  },
  {
    id: 'ag-pricing',
    name: 'Dynamic pricing',
    domain: 'Revenue',
    description: 'Proposes price bands per segment from the elasticity model and margin floors.',
    defaultAutonomy: 'Recommend',
    actionsToday: 58,
    successRate: 0.893,
    escalations: 4,
    owner: 'L. Moreau',
    guardrails: ['18% margin floor', 'Never reprices contracted renewals', 'Frozen while drift is above policy'],
    lastAction: 'Proposed a 3.5% uplift on the mid-market band',
    modelIds: ['mdl-pricing'],
  },
  {
    id: 'ag-workforce',
    name: 'Workforce planning',
    domain: 'People',
    description: 'Observes attrition and capacity signals and writes an aggregate weekly planning brief.',
    defaultAutonomy: 'Observe',
    actionsToday: 24,
    successRate: 0.84,
    escalations: 0,
    owner: 'K. Novak',
    guardrails: ['Aggregate output only', 'No individual scores leave the platform'],
    lastAction: 'Published the week 47 capacity brief',
    modelIds: ['mdl-attrition'],
  },
]

export const DECISIONS: Decision[] = [
  { id: 'd-1041', time: '09:58', agentId: 'ag-fraud', action: 'Held transaction for step-up verification', subject: 'Merchant 88214 · $18,400', confidence: 0.993, outcome: 'Auto-executed', value: 18_400, domain: 'Risk & fraud' },
  { id: 'd-1040', time: '09:54', agentId: 'ag-invoice', action: 'Cleared invoice against contract terms', subject: 'Northwind Logistics · INV-20841', confidence: 0.981, outcome: 'Auto-executed', value: 142_000, domain: 'Operations' },
  { id: 'd-1039', time: '09:47', agentId: 'ag-revenue', action: 'Drafted renewal save play', subject: 'Halcyon Media · $412k renewal', confidence: 0.912, outcome: 'Awaiting approval', value: 412_000, domain: 'Revenue' },
  { id: 'd-1038', time: '09:41', agentId: 'ag-energy', action: 'Shifted 4.2 MWh to the off-peak window', subject: 'Plant 3 · tariff window 22:00', confidence: 0.964, outcome: 'Auto-executed', value: 8_900, domain: 'Operations' },
  { id: 'd-1037', time: '09:36', agentId: 'ag-invoice', action: 'Escalated a tolerance mismatch', subject: 'Ardent Components · INV-20902', confidence: 0.803, outcome: 'Escalated', value: 61_000, domain: 'Operations' },
  { id: 'd-1036', time: '09:29', agentId: 'ag-fraud', action: 'Cleared a high-value cross-border payment', subject: 'Merchant 44120 · $96,200', confidence: 0.988, outcome: 'Auto-executed', value: 96_200, domain: 'Risk & fraud' },
  { id: 'd-1035', time: '09:22', agentId: 'ag-churn', action: 'Paused retention sequence', subject: 'Vantage Group · sentiment drop', confidence: 0.877, outcome: 'Auto-executed', value: 0, domain: 'Customer' },
  { id: 'd-1034', time: '09:18', agentId: 'ag-supply', action: 'Recommended a 640-unit transfer', subject: 'APAC · SKU 88-4021', confidence: 0.861, outcome: 'Awaiting approval', value: 24_500, domain: 'Supply chain' },
  { id: 'd-1033', time: '09:11', agentId: 'ag-pricing', action: 'Proposed a 3.5% mid-market uplift', subject: 'EMEA · price band B2', confidence: 0.889, outcome: 'Awaiting approval', value: 388_000, domain: 'Revenue' },
  { id: 'd-1032', time: '09:04', agentId: 'ag-invoice', action: 'Blocked a duplicate invoice', subject: 'Meridian Freight · INV-20877', confidence: 0.996, outcome: 'Auto-executed', value: 33_800, domain: 'Operations' },
  { id: 'd-1031', time: '08:57', agentId: 'ag-fraud', action: 'Froze a merchant cluster', subject: '41 accounts · card testing', confidence: 0.978, outcome: 'Auto-executed', value: 210_400, domain: 'Risk & fraud' },
  { id: 'd-1030', time: '08:49', agentId: 'ag-revenue', action: 'Routed an expansion offer', subject: 'Cobalt Health · Tier 2', confidence: 0.934, outcome: 'Auto-executed', value: 88_000, domain: 'Revenue' },
  { id: 'd-1029', time: '08:42', agentId: 'ag-churn', action: 'Drafted outreach for an enterprise account', subject: 'Arclight Systems · $640k ARR', confidence: 0.842, outcome: 'Awaiting approval', value: 640_000, domain: 'Customer' },
  { id: 'd-1028', time: '08:35', agentId: 'ag-energy', action: 'Bid 2.6 MWh into the day-ahead market', subject: 'Plant 1 · 14:00–18:00', confidence: 0.941, outcome: 'Auto-executed', value: 12_300, domain: 'Operations' },
  { id: 'd-1027', time: '08:27', agentId: 'ag-fraud', action: 'Released a held payment after review', subject: 'Merchant 10442 · $7,150', confidence: 0.902, outcome: 'Auto-executed', value: 7_150, domain: 'Risk & fraud' },
  { id: 'd-1026', time: '08:19', agentId: 'ag-invoice', action: 'Scheduled payment after a two-field match', subject: 'Kestrel Industrial · INV-20851', confidence: 0.985, outcome: 'Auto-executed', value: 274_000, domain: 'Operations' },
  { id: 'd-1025', time: '08:12', agentId: 'ag-supply', action: 'Flagged a supplier lead-time breach', subject: 'Supplier 1180 · +11 days', confidence: 0.884, outcome: 'Escalated', value: 0, domain: 'Supply chain' },
  { id: 'd-1024', time: '08:04', agentId: 'ag-revenue', action: 'Recalculated renewal risk after a usage drop', subject: 'Vantage Group · $212k', confidence: 0.918, outcome: 'Auto-executed', value: 0, domain: 'Revenue' },
  { id: 'd-1023', time: '07:58', agentId: 'ag-pricing', action: 'Rejected a below-floor discount request', subject: 'Sales ops · 21% discount', confidence: 0.967, outcome: 'Auto-executed', value: 0, domain: 'Revenue' },
  { id: 'd-1022', time: '07:51', agentId: 'ag-churn', action: 'Opened a retention play', subject: 'Nimbus Retail · $96k ARR', confidence: 0.896, outcome: 'Auto-executed', value: 96_000, domain: 'Customer' },
  { id: 'd-1021', time: '07:44', agentId: 'ag-fraud', action: 'Escalated an ambiguous identity match', subject: 'Merchant 77310 · $41,900', confidence: 0.712, outcome: 'Escalated', value: 41_900, domain: 'Risk & fraud' },
  { id: 'd-1020', time: '07:36', agentId: 'ag-invoice', action: 'Auto-approved 41 EMEA invoices', subject: 'EMEA queue · batch 118', confidence: 0.976, outcome: 'Auto-executed', value: 488_000, domain: 'Operations' },
  { id: 'd-1019', time: '07:29', agentId: 'ag-revenue', action: 'Approved a 9% renewal discount', subject: 'Brightline Foods · $184k', confidence: 0.927, outcome: 'Auto-executed', value: 184_000, domain: 'Revenue' },
  { id: 'd-1018', time: '07:21', agentId: 'ag-energy', action: 'Deferred a maintenance-window load shift', subject: 'Plant 2 · 06:00 window', confidence: 0.922, outcome: 'Auto-executed', value: 3_400, domain: 'Operations' },
]

export const INSIGHTS: Insight[] = [
  {
    id: 'in-1',
    kind: 'Anomaly',
    title: 'EMEA invoice exceptions doubled in nine days',
    body: 'Exception rate moved from 2.1% to 4.3% after the new region mapping shipped. 71% of the delta sits in two suppliers with OCR quality below threshold.',
    domain: 'Operations',
    impact: '$610k held in the approval queue',
    confidence: 0.96,
    modelId: 'mdl-invoice',
  },
  {
    id: 'in-2',
    kind: 'Forecast',
    title: 'APAC demand will exceed committed supply in five weeks',
    body: 'The demand forecast puts three SKU families 12–18% above committed capacity by week 52, concentrated in the Singapore and Osaka lanes.',
    domain: 'Supply chain',
    impact: '$1.9M margin at risk',
    confidence: 0.91,
    modelId: 'mdl-demand',
  },
  {
    id: 'in-3',
    kind: 'Risk',
    title: 'Tier-1 accounts are showing silent churn signals',
    body: 'Eleven enterprise accounts lost two or more weekly active users without a support ticket. Churn propensity is up 14 points on the cohort.',
    domain: 'Customer',
    impact: '$3.4M ARR exposure',
    confidence: 0.88,
    modelId: 'mdl-churn',
  },
  {
    id: 'in-4',
    kind: 'Opportunity',
    title: 'Renewal clustering leaves a Q1 capacity gap',
    body: '38% of the renewal book lands in the first seven weeks of Q1. Spreading recovery plays into December protects the coverage ratio.',
    domain: 'Revenue',
    impact: '$2.2M pull-forward',
    confidence: 0.84,
    modelId: 'mdl-nbo',
  },
  {
    id: 'in-5',
    kind: 'Anomaly',
    title: 'Card-testing ring spans 41 merchant accounts',
    body: 'Fraud sentinel found a shared device fingerprint and a common settlement account. The agent froze the cluster automatically.',
    domain: 'Risk & fraud',
    impact: '$210k prevented',
    confidence: 0.97,
    modelId: 'mdl-fraud',
  },
  {
    id: 'in-6',
    kind: 'Opportunity',
    title: 'Load shifting could cut plant energy cost by 7%',
    body: 'Moving two production windows into the off-peak tariff keeps output flat and cuts the blended rate. The energy agent can act within current guardrails.',
    domain: 'Operations',
    impact: '$340k annualised',
    confidence: 0.9,
    modelId: 'mdl-energy',
  },
]

export const RUNS: Run[] = [
  {
    id: 'run-2418',
    modelId: 'mdl-demand',
    objective: 'Retrain with APAC promotion mix',
    status: 'Succeeded',
    started: 'Nov 21 · 14:02',
    duration: '3h 12m',
    epochs: 90,
    compute: 24,
    cost: 1_920,
    accuracy: 0.918,
    owner: 'M. Lindqvist',
    commit: 'a4f19c2',
    loss: lossCurve(2418, 28, 1.94, 0.21),
  },
  {
    id: 'run-2417',
    modelId: 'mdl-churn',
    objective: 'Weekly refresh · new usage features',
    status: 'Succeeded',
    started: 'Nov 21 · 09:40',
    duration: '1h 46m',
    epochs: 60,
    compute: 12,
    cost: 840,
    accuracy: 0.951,
    owner: 'S. Raman',
    commit: '9b0d771',
    loss: lossCurve(2417, 28, 1.72, 0.16),
  },
  {
    id: 'run-2416',
    modelId: 'mdl-pricing',
    objective: 'Drift correction · EMEA price bands',
    status: 'Failed',
    started: 'Nov 20 · 18:11',
    duration: '0h 22m',
    epochs: 8,
    compute: 2,
    cost: 160,
    accuracy: 0.0,
    owner: 'L. Moreau',
    commit: 'c81e0aa',
    loss: lossCurve(2416, 12, 2.1, 0.9),
  },
  {
    id: 'run-2415',
    modelId: 'mdl-supplier',
    objective: 'Promotion candidate · risk bands',
    status: 'Succeeded',
    started: 'Nov 20 · 11:28',
    duration: '2h 04m',
    epochs: 74,
    compute: 16,
    cost: 1_180,
    accuracy: 0.879,
    owner: 'M. Lindqvist',
    commit: '7e2b4d1',
    loss: lossCurve(2415, 28, 1.88, 0.24),
  },
  {
    id: 'run-2414',
    modelId: 'mdl-fraud',
    objective: 'Adversarial hardening · week 47',
    status: 'Succeeded',
    started: 'Nov 19 · 22:06',
    duration: '5h 38m',
    epochs: 120,
    compute: 48,
    cost: 4_320,
    accuracy: 0.971,
    owner: 'A. Okafor',
    commit: '2f60be9',
    loss: lossCurve(2414, 28, 2.02, 0.12),
  },
  {
    id: 'run-2413',
    modelId: 'mdl-triage',
    objective: 'Severity recalibration',
    status: 'Succeeded',
    started: 'Nov 19 · 15:14',
    duration: '0h 58m',
    epochs: 40,
    compute: 6,
    cost: 420,
    accuracy: 0.961,
    owner: 'D. Haddad',
    commit: '55ac118',
    loss: lossCurve(2413, 24, 1.61, 0.19),
  },
  {
    id: 'run-2412',
    modelId: 'mdl-attrition',
    objective: 'Staging candidate · team aggregates',
    status: 'Succeeded',
    started: 'Nov 18 · 12:33',
    duration: '1h 19m',
    epochs: 52,
    compute: 8,
    cost: 560,
    accuracy: 0.831,
    owner: 'K. Novak',
    commit: 'e0f7a34',
    loss: lossCurve(2412, 26, 1.78, 0.38),
  },
  {
    id: 'run-2411',
    modelId: 'mdl-invoice',
    objective: 'Monthly refresh · contract corpus',
    status: 'Succeeded',
    started: 'Nov 17 · 08:51',
    duration: '2h 41m',
    epochs: 80,
    compute: 18,
    cost: 1_440,
    accuracy: 0.982,
    owner: 'J. Park',
    commit: 'b39d55f',
    loss: lossCurve(2411, 28, 1.83, 0.14),
  },
  {
    id: 'run-2410',
    modelId: 'mdl-energy',
    objective: 'Tariff window simulation',
    status: 'Succeeded',
    started: 'Nov 16 · 19:02',
    duration: '3h 55m',
    epochs: 96,
    compute: 20,
    cost: 1_600,
    accuracy: 0.936,
    owner: 'R. Silva',
    commit: '6a1c0d8',
    loss: lossCurve(2410, 28, 1.91, 0.27),
  },
  {
    id: 'run-2409',
    modelId: 'mdl-nbo',
    objective: 'Ranking refresh · Q4 offers',
    status: 'Succeeded',
    started: 'Nov 15 · 10:17',
    duration: '1h 32m',
    epochs: 56,
    compute: 10,
    cost: 720,
    accuracy: 0.908,
    owner: 'S. Raman',
    commit: 'd4b7e19',
    loss: lossCurve(2409, 26, 1.74, 0.22),
  },
]

/* Weekly indices for the charts (13 weeks, oldest first). */
export const DECISION_VOLUME = walk(301, 18_400, 13, 1_560, 900, 0).map((n) => Math.round(n))
export const AUTO_RATE = walk(302, 0.742, 13, 0.0152, 0.009, 3).map((n) => Math.min(0.99, n))
export const ACCURACY_INDEX = walk(303, 0.909, 13, 0.0043, 0.004, 3).map((n) => Math.min(0.995, n))
export const VALUE_ROUTED = walk(304, 2_140_000, 13, 172_000, 120_000, 0).map((n) => Math.round(n))

/** Today's totals, seeded so the console is stable between visits. */
export const TODAY_STATS = {
  decisions: 5_412,
  autoExecuted: 0.924,
  accuracy: 0.961,
  value: 4_420_000,
  modelsInProduction: MODELS.filter((m) => m.stage === 'Production').length,
  valueYear: 148_000_000,
}

export const OWNERS = Array.from(new Set([...MODELS.map((m) => m.owner), ...AGENTS.map((a) => a.owner)])).sort()

export function modelById(id: string) {
  return MODELS.find((m) => m.id === id)
}

export function agentById(id: string) {
  return AGENTS.find((a) => a.id === id)
}

export function datasetById(id: string) {
  return DATASETS.find((d) => d.id === id)
}

/** ISO date `offset` days from the seeded "today". */
export function isoFromToday(offset: number): string {
  const d = new Date(`${TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}
