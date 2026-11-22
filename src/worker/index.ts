import { Hono } from 'hono'

import { type ModelStage } from '../data'

import { ready } from './db'
import { forward } from './ml'
import { findModel, listAgents, listDatasets, listDecisions, listInsights, listModels, listRuns } from './repo'

// The Worker in front of the console. API routes live here; everything else
// falls through to the built assets (single-page-application mode).
//
// Reads go through `repo.ts`, which queries the D1 binding when one is bound and
// falls back to the checked-in seed arrays otherwise. Responses carry
// `x-data-source: d1 | seed` so it is obvious which path answered.
type Env = {
  ASSETS: Fetcher
  DB?: D1Database
  /** Base URL of the FastAPI ML engine (services/ml). */
  ML_SERVICE_URL?: string
}

const app = new Hono<{ Bindings: Env }>()

const STAGE = /^(Production|Shadow|Staging|Archived)$/
const ID = /^mdl-[a-z]+$/

const source = (value: 'd1' | 'seed') => ({ 'x-data-source': value })

app.get('/api/health', async (c) => {
  if (!c.env.DB) return c.json({ ok: true, service: 'meridian-console', storage: 'seed' })
  try {
    await ready(c.env.DB)
  } catch (err) {
    return c.json({ ok: false, service: 'meridian-console', storage: 'd1', error: err instanceof Error ? err.message : 'bootstrap failed' }, 503)
  }
  return c.json({ ok: true, service: 'meridian-console', storage: 'd1' })
})

/** GET /api/models?stage=Production — registry summaries. 400 on an unknown stage. */
app.get('/api/models', async (c) => {
  const stage = c.req.query('stage')
  if (stage !== undefined && !STAGE.test(stage)) {
    return c.json({ error: 'Unknown stage. Use Production, Shadow, Staging or Archived.' }, 400)
  }
  const { rows, source: from } = await listModels(c.env.DB, stage as ModelStage | undefined)
  return c.json({ models: rows }, 200, source(from))
})

/** GET /api/models/:id — 400 for a malformed id, 404 for an unknown one. */
app.get('/api/models/:id', async (c) => {
  const id = c.req.param('id')
  if (!ID.test(id)) return c.json({ error: 'Malformed model id' }, 400)
  const { model, source: from } = await findModel(c.env.DB, id)
  if (!model) return c.json({ error: 'Model not found' }, 404)
  return c.json({ model }, 200, { ...source(from), 'Cache-Control': 'private, max-age=60' })
})

app.get('/api/agents', async (c) => {
  const { rows, source: from } = await listAgents(c.env.DB)
  return c.json({ agents: rows }, 200, source(from))
})

/** GET /api/decisions?outcome=... — the decision ledger, newest first. */
app.get('/api/decisions', async (c) => {
  const { rows, source: from } = await listDecisions(c.env.DB, c.req.query('outcome'))
  return c.json({ decisions: rows }, 200, source(from))
})

app.get('/api/datasets', async (c) => {
  const { rows, source: from } = await listDatasets(c.env.DB)
  return c.json({ datasets: rows }, 200, source(from))
})

app.get('/api/insights', async (c) => {
  const { rows, source: from } = await listInsights(c.env.DB)
  return c.json({ insights: rows }, 200, source(from))
})

app.get('/api/runs', async (c) => {
  const { rows, source: from } = await listRuns(c.env.DB)
  return c.json({ runs: rows }, 200, source(from))
})

/**
 * The Python half of the API layer: /api/ml/* is forwarded to the FastAPI ML
 * engine (train, predict, runs, agent actions). See src/worker/ml.ts.
 */
app.all('/api/ml/*', (c) => forward(c.req.raw, c.env, c.req.path.replace('/api/ml', '')))

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
