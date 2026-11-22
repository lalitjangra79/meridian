import { describe, expect, it } from 'vitest'

import { AGENTS, DATASETS, DECISIONS, INSIGHTS, MODELS, RUNS } from '../data'
import app from './index'

/** Static-asset binding stand-in. No `DB`: these tests exercise the seed path. */
const env = {
  ASSETS: {
    fetch: async (request: Request) => new Response(`asset:${new URL(request.url).pathname}`, { headers: { 'content-type': 'text/html' } }),
  },
}

const get = (path: string) => app.request(path, {}, env as never)

describe('GET /api/health', () => {
  it('answers ok and names the storage path', async () => {
    const res = await get('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, service: 'meridian-console', storage: 'seed' })
  })
})

describe('GET /api/models', () => {
  it('lists every registered model', async () => {
    const res = await get('/api/models')
    const body = (await res.json()) as { models: { id: string }[] }
    expect(res.status).toBe(200)
    expect(body.models).toHaveLength(MODELS.length)
    expect(res.headers.get('x-data-source')).toBe('seed')
  })

  it('filters by stage', async () => {
    const body = (await (await get('/api/models?stage=Shadow')).json()) as { models: { stage: string }[] }
    expect(body.models.length).toBeGreaterThan(0)
    expect(body.models.every((m) => m.stage === 'Shadow')).toBe(true)
  })

  it('rejects an unknown stage', async () => {
    const res = await get('/api/models?stage=Nope')
    expect(res.status).toBe(400)
    expect((await res.json()) as { error: string }).toHaveProperty('error')
  })
})

describe('GET /api/models/:id', () => {
  it('returns one model', async () => {
    const res = await get('/api/models/mdl-churn')
    const body = (await res.json()) as { model: { id: string } }
    expect(res.status).toBe(200)
    expect(body.model.id).toBe('mdl-churn')
  })

  it('rejects a malformed id', async () => {
    expect((await get('/api/models/BAD!')).status).toBe(400)
  })

  it('404s an unknown id', async () => {
    expect((await get('/api/models/mdl-zzz')).status).toBe(404)
  })
})

describe('GET /api/agents', () => {
  it('exposes the autonomy level', async () => {
    const body = (await (await get('/api/agents')).json()) as { agents: { autonomy: string }[] }
    expect(body.agents).toHaveLength(AGENTS.length)
    expect(body.agents[0]).toHaveProperty('autonomy')
  })
})

describe('GET /api/decisions', () => {
  it('lists the ledger', async () => {
    const body = (await (await get('/api/decisions')).json()) as { decisions: unknown[] }
    expect(body.decisions).toHaveLength(DECISIONS.length)
  })

  it('filters by outcome, case-insensitively', async () => {
    const body = (await (await get('/api/decisions?outcome=awaiting approval')).json()) as { decisions: { outcome: string }[] }
    expect(body.decisions.length).toBeGreaterThan(0)
    expect(body.decisions.every((d) => d.outcome === 'Awaiting approval')).toBe(true)
  })
})

describe('read-only tables', () => {
  it('serves the data estate', async () => {
    const body = (await (await get('/api/datasets')).json()) as { datasets: unknown[] }
    expect(body.datasets).toHaveLength(DATASETS.length)
  })

  it('serves training runs', async () => {
    const body = (await (await get('/api/runs')).json()) as { runs: { commit: string }[] }
    expect(body.runs).toHaveLength(RUNS.length)
    expect(body.runs[0]).toHaveProperty('commit')
  })

  it('serves the signals', async () => {
    const body = (await (await get('/api/insights')).json()) as { insights: unknown[] }
    expect(body.insights).toHaveLength(INSIGHTS.length)
  })
})

describe('fallbacks', () => {
  it('404s unknown API routes as JSON', async () => {
    const res = await get('/api/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('hands everything else to the asset binding', async () => {
    const res = await get('/models')
    expect(await res.text()).toBe('asset:/models')
  })
})
