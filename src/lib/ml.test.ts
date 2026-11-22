import { afterEach, describe, expect, it } from 'vitest'

import { MlError, trainModel } from './ml'

const original = globalThis.fetch

afterEach(() => {
  globalThis.fetch = original
})

const run = {
  id: 'mlr-abc123',
  model_id: 'mdl-demand',
  objective: 'Weekly refresh',
  status: 'Succeeded' as const,
  accuracy: 0.912,
  train_accuracy: 0.93,
  epochs: 40,
  samples: 720,
  params: { weights: [1, 2], bias: 0.1, features: 2 },
  loss: [0.4, 0.3, 0.25],
  created_at: '2026-11-22T10:00:00+00:00',
}

describe('trainModel', () => {
  it('posts the run to the ML proxy and returns the trained run', async () => {
    let seen: { url: string; body: string } | null = null
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen = { url: String(input), body: String(init?.body) }
      return Response.json({ run, model: { weights: [1, 2], bias: 0.1 } })
    }) as typeof fetch

    const result = await trainModel({ modelId: 'mdl-demand', objective: 'Weekly refresh', epochs: 40, samples: 720 })
    expect(result.run.id).toBe('mlr-abc123')
    expect(seen!.url).toBe('/api/ml/train')
    expect(JSON.parse(seen!.body)).toMatchObject({ model_id: 'mdl-demand', epochs: 40, samples: 720 })
  })

  it('surfaces the unconfigured code so the UI can explain it', async () => {
    globalThis.fetch = (async () =>
      Response.json({ error: 'ML engine is not configured.', code: 'ml_unconfigured' }, { status: 503 })) as typeof fetch

    await expect(trainModel({ modelId: 'mdl-demand', objective: 'x', epochs: 20 })).rejects.toMatchObject({
      name: 'MlError',
      code: 'ml_unconfigured',
    })
  })

  it('marks a network failure as unreachable', async () => {
    globalThis.fetch = (async () => {
      throw new Error('Failed to fetch')
    }) as typeof fetch

    await expect(trainModel({ modelId: 'mdl-demand', objective: 'x', epochs: 20 })).rejects.toBeInstanceOf(MlError)
  })

  it('does not throw on a non-JSON error body', async () => {
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch

    await expect(trainModel({ modelId: 'mdl-demand', objective: 'x', epochs: 20 })).rejects.toThrow(/500/)
  })
})
