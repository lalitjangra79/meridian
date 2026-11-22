/*
  Client for the Python ML engine, reached through the Worker's /api/ml proxy.

  The Worker answers 503 `ml_unconfigured` when ML_SERVICE_URL is not set and 502
  `ml_unreachable` when the service is down, so the UI can say what is actually
  wrong instead of quietly pretending to train.
*/

export type MlRun = {
  id: string
  model_id: string
  objective: string
  status: 'Succeeded' | 'Failed'
  accuracy: number
  train_accuracy: number
  epochs: number
  samples: number
  params: { weights: number[]; bias: number; features: number }
  loss: number[]
  created_at: string
}

export type TrainResult = {
  run: MlRun
  model: { weights: number[]; bias: number }
}

export type TrainInput = {
  modelId: string
  objective: string
  epochs: number
  samples?: number
  learningRate?: number
}

export class MlError extends Error {
  code: string

  constructor(message: string, code = 'ml_error') {
    super(message)
    this.name = 'MlError'
    this.code = code
  }
}

export async function trainModel(input: TrainInput): Promise<TrainResult> {
  let response: Response
  try {
    response = await fetch('/api/ml/train', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model_id: input.modelId,
        objective: input.objective,
        epochs: input.epochs,
        samples: input.samples ?? 900,
        ...(input.learningRate ? { learning_rate: input.learningRate } : {}),
      }),
    })
  } catch (err) {
    throw new MlError(err instanceof Error ? err.message : 'The ML engine could not be reached.', 'ml_unreachable')
  }

  const body = (await response.json().catch(() => null)) as (Partial<TrainResult> & { error?: string; code?: string }) | null

  if (!response.ok || !body?.run) {
    throw new MlError(body?.error ?? `The ML engine answered ${response.status}.`, body?.code ?? 'ml_error')
  }

  return body as TrainResult
}
