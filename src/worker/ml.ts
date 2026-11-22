// Proxy from the Worker (Meridian's public API) to the FastAPI ML engine.
//
// The Worker stays the only origin the browser talks to; training, scoring and
// agent actions are forwarded. Set ML_SERVICE_URL (wrangler.jsonc vars locally,
// a Worker variable in production) to the running service, e.g.
// http://127.0.0.1:8000. Without it the routes answer 503 with an actionable
// message instead of pretending to train.

export type MlEnv = { ML_SERVICE_URL?: string }

const TIMEOUT_MS = 25_000

/** Forward `request` to `<ML_SERVICE_URL><path>`, mapping failures to JSON errors. */
export async function forward(request: Request, env: MlEnv, path: string): Promise<Response> {
  const base = env.ML_SERVICE_URL
  if (!base) {
    return Response.json(
      {
        error: 'ML engine is not configured. Start services/ml and set ML_SERVICE_URL.',
        code: 'ml_unconfigured',
      },
      { status: 503 },
    )
  }

  const target = new URL(request.url)
  const headers: Record<string, string> = { accept: 'application/json' }
  const contentType = request.headers.get('content-type')
  if (contentType) headers['content-type'] = contentType

  const init: RequestInit = { method: request.method, headers, signal: AbortSignal.timeout(TIMEOUT_MS) }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.text()

  let upstream: Response
  try {
    upstream = await fetch(`${base.replace(/\/+$/, '')}${path}${target.search}`, init)
  } catch (err) {
    return Response.json(
      {
        error: 'ML engine is unreachable.',
        code: 'ml_unreachable',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    )
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'x-data-source': 'ml',
    },
  })
}
