import { useId } from 'react'

type SparklineProps = {
  values: number[]
  width?: number
  height?: number
  /** Fixed y domain so lines are comparable across rows. */
  domain?: [number, number]
  /** Draw an area under the line and a dashed threshold. */
  threshold?: number
  area?: boolean
  dotRadius?: number
  /**
   * Index where the selected date range starts. Points before it are drawn
   * fainter and a small tick marks the comparison point.
   */
  windowStart?: number
  className?: string
}

/** Line with an end dot (orange). The line draws itself on mount. */
export function Sparkline({ values, width = 100, height = 22, domain, threshold, area, dotRadius = 2.2, windowStart = 0, className }: SparklineProps) {
  const gid = useId()
  const lo = domain?.[0] ?? Math.min(...values)
  const hi = domain?.[1] ?? Math.max(...values)
  const pad = dotRadius + 1
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - lo) / Math.max(1, hi - lo)) * (height - pad * 2)
  const path = (from: number, to: number) =>
    values
      .slice(from, to + 1)
      .map((v, j) => `${j ? 'L' : 'M'}${x(from + j).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ')
  const ws = Math.max(0, Math.min(values.length - 1, windowStart))
  const d = path(ws, values.length - 1)
  const before = ws > 0 ? path(0, ws) : null
  const last = values[values.length - 1]!

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      {area && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--fg)" stopOpacity="0.12" />
              <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${x(values.length - 1)},${height} L${x(ws)},${height} Z`} fill={`url(#${gid})`} style={{ transition: 'd 0.4s' }} />
        </>
      )}
      {threshold !== undefined && threshold > lo && threshold < hi && (
        <line x1={0} x2={width} y1={y(threshold)} y2={y(threshold)} stroke="var(--risk)" strokeOpacity="0.6" strokeDasharray="3 4" />
      )}
      {before && <path d={before} fill="none" stroke="var(--muted)" strokeOpacity={0.4} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />}
      {ws > 0 && <circle cx={x(ws)} cy={y(values[ws]!)} r={1.6} fill="var(--muted)" />}
      <path
        key={ws}
        d={d}
        pathLength={1}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1"
        className="animate-draw"
      />
      <circle cx={x(values.length - 1)} cy={y(last)} r={dotRadius} fill="var(--risk)" className="animate-fade [animation-delay:0.8s]" />
    </svg>
  )
}
