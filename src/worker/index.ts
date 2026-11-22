import { Hono } from 'hono'

import { AGENTS, DECISIONS, MODELS, modelById, type ModelStage } from '../data'

// The Worker in front of the console. API routes live here; everything else
// falls through to the built assets (single-page-application mode).
//
// These routes serve the seeded registry so the app has real loading and error
// states. Point them at your model registry, feature store or a D1 table.
type Env = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

const STAGE = /^(Production|Shadow|Staging|Archived)$/
const ID = /^mdl-[a-z]+$/

app.get('/api/health', (c) => c.json({ ok: true, service: 'meridian-console' }))

/** GET /api/models?stage=Production — registry summaries. 400 on an unknown stage. */
app.get('/api/models', (c) => {
  const stage = c.req.query('stage')
  if (stage !== undefined && !STAGE.test(stage)) {
    return c.json({ error: 'Unknown stage. Use Production, Shadow, Staging or Archived.' }, 400)
  }
  const list = stage ? MODELS.filter((m) => m.stage === (stage as ModelStage)) : MODELS
  return c.json({
    models: list.map(({ id, name, code, domain, task, stage, version, accuracy, drift, latencyMs, riskTier, owner }) => ({ id, name, code, domain, task, stage, version, accuracy, drift, latencyMs, riskTier, owner })),
  })
})

/** GET /api/models/:id — 400 for a malformed id, 404 for an unknown one. */
app.get('/api/models/:id', (c) => {
  const id = c.req.param('id')
  if (!ID.test(id)) return c.json({ error: 'Malformed model id' }, 400)
  const model = modelById(id)
  if (!model) return c.json({ error: 'Model not found' }, 404)
  return c.json({ model }, 200, { 'Cache-Control': 'private, max-age=60' })
})

app.get('/api/agents', (c) => c.json({ agents: AGENTS.map(({ id, name, domain, defaultAutonomy, actionsToday, successRate, escalations, owner }) => ({ id, name, domain, autonomy: defaultAutonomy, actionsToday, successRate, escalations, owner })) }))

/** GET /api/decisions?outcome=... — the decision ledger, newest first. */
app.get('/api/decisions', (c) => {
  const outcome = c.req.query('outcome')
  const list = outcome
    ? DECISIONS.filter((d) => d.outcome.toLowerCase() === outcome.toLowerCase())
    : DECISIONS
  return c.json({ decisions: list })
})

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
