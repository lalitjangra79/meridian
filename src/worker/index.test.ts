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

describe('ML proxy', () => {
  it('503s with an actionable error when no service is configured', async () => {
    const res = await get('/api/ml/health')
    expect(res.status).toBe(503)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('ml_unconfigured')
  })

  it('forwards to the ML engine and marks the source', async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('http://127.0.0.1:8000/health')
      return new Response(JSON.stringify({ ok: true, service: 'meridian-ml' }), { headers: { 'content-type': 'application/json' } })
    }) as typeof fetch
    try {
      const res = await app.request('/api/ml/health', {}, { ...env, ML_SERVICE_URL: 'http://127.0.0.1:8000' } as never)
      expect(res.status).toBe(200)
      expect(res.headers.get('x-data-source')).toBe('ml')
      expect(await res.json()).toEqual({ ok: true, service: 'meridian-ml' })
    } finally {
      globalThis.fetch = original
    }
  })

  it('sends the shared secret as a bearer token when configured', async () => {
    const original = globalThis.fetch
    let auth: string | null = null
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      auth = new Headers(init?.headers).get('authorization')
      return Response.json({ ok: true })
    }) as typeof fetch
    try {
      const res = await app.request(
        '/api/ml/runs',
        {},
        { ...env, ML_SERVICE_URL: 'https://ml.example.com', ML_SERVICE_TOKEN: 's3cret' } as never,
      )
      expect(res.status).toBe(200)
      expect(auth).toBe('Bearer s3cret')
    } finally {
      globalThis.fetch = original
    }
  })

  it('502s when the engine is unreachable', async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new Error('connect ECONNREFUSED')
    }) as typeof fetch
    try {
      const res = await app.request('/api/ml/health', {}, { ...env, ML_SERVICE_URL: 'http://127.0.0.1:8000' } as never)
      expect(res.status).toBe(502)
      expect((await res.json()) as { code: string }).toMatchObject({ code: 'ml_unreachable' })
    } finally {
      globalThis.fetch = original
    }
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
