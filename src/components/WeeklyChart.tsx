import { useId, useState, type KeyboardEvent } from 'react'

import { AnimatePresence, motion } from 'motion/react'

import { isoFromToday } from '../data'
import { cx } from '../lib/cx'
import { dayMonth } from '../lib/format'
import { useWidth } from '../lib/useWidth'

type WeeklyChartProps = {
  /** One value per week, oldest first; the last is this week. */
  values: number[]
  kind: 'line' | 'bars'
  label: string
  domain?: [number, number]
  height?: number
  /** Dashed orange line (risk threshold). */
  threshold?: number
  /** Dashed neutral reference line (e.g. seats purchased). */
  reference?: { value: number; label: string }
  /** Weeks in the selected range: that span is shaded and labelled. */
  range?: number
  format?: (v: number) => string
  /** Bars: colour each bar (defaults to muted). */
  barColor?: (v: number, i: number) => string
}

/**
 * Responsive weekly chart (line with area, or bars) with y gridlines, a
 * shaded range window, hover / arrow-key readout and a draw-in entrance.
 */
export function WeeklyChart({ values, kind, label, domain, height = 240, threshold, reference, range, format = String, barColor }: WeeklyChartProps) {
  const [wrap, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId()
  const n = values.length
  const lo = domain?.[0] ?? 0
  const hi = domain?.[1] ?? Math.max(...values, reference?.value ?? 0) * 1.1
  const L = 38
  const R = 10
  const T = 22
  const B = 28
  const W = Math.max(200, width)
  const step = (W - L - R) / (kind === 'bars' ? n : n - 1)
  const x = (i: number) => L + (kind === 'bars' ? step * (i + 0.5) : step * i)
  const y = (v: number) => T + (1 - (v - lo) / Math.max(1, hi - lo)) * (height - T - B)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + t * (hi - lo))
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ws = range ? n - 1 - range : null
  const weekDate = (i: number) => dayMonth(isoFromToday(-(n - 1 - i) * 7))

  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
    if (e.key === 'Home') setHover(0)
    else if (e.key === 'End') setHover(n - 1)
    else if (dir) setHover((h) => Math.min(n - 1, Math.max(0, (h ?? n - 1) + dir)))
    else return
    e.preventDefault()
  }

  const onMove = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left
    const i = kind === 'bars' ? Math.floor((px - L) / step) : Math.round((px - L) / step)
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  return (
    <div
      ref={wrap}
      className="relative w-full min-w-0 rounded-[4px] outline-offset-4"
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use the arrow keys to read each week.`}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
    >
      <svg width={W} height={height} className="block overflow-visible" aria-hidden="true" onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--fg)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ws !== null && ws >= 0 && (
          <g className="animate-fade">
            <rect x={x(ws) - (kind === 'bars' ? step / 2 : 0)} y={T - 6} width={x(n - 1) - x(ws) + (kind === 'bars' ? step : 0)} height={height - T - B + 6} fill="var(--fg)" fillOpacity={0.045} style={{ transition: 'x 0.4s var(--ease-out), width 0.4s var(--ease-out)' }} />
            <text x={x(ws) + 6} y={T + 6} className="caps fill-muted text-[9.5px]" style={{ letterSpacing: '0.2em' }}>
              {range}W
            </text>
          </g>
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="tnum fill-muted font-mono text-[10.5px]">
              {format(t)}
            </text>
          </g>
        ))}
        {[0, Math.round((n - 1) / 2), n - 1].map((i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="tnum fill-muted font-mono text-[10.5px]">
            {i === n - 1 ? 'This week' : weekDate(i)}
          </text>
        ))}
        {reference && (
          <g>
            <line x1={L} x2={W - R} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--muted)" strokeDasharray="3 4" />
            <text x={W - R} y={y(reference.value) - 6} textAnchor="end" className="caps fill-muted text-[9.5px]" style={{ letterSpacing: '0.2em' }}>
              {reference.label}
            </text>
          </g>
        )}
        {kind === 'line' ? (
          <>
            <path d={`${d} L${x(n - 1)},${y(lo)} L${x(0)},${y(lo)} Z`} fill={`url(#${gid})`} className="animate-fade" />
            <path d={d} pathLength={1} strokeDasharray="1" fill="none" stroke="var(--fg)" strokeOpacity={0.85} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" className="animate-draw" />
            <circle cx={x(n - 1)} cy={y(values[n - 1]!)} r={4} fill="var(--risk)" className="animate-fade [animation-delay:0.9s]" />
          </>
        ) : (
          values.map((v, i) => (
            <rect
              key={i}
              x={x(i) - Math.max(1.5, step * 0.32)}
              width={Math.max(3, step * 0.64)}
              y={y(v)}
              height={Math.max(0, y(lo) - y(v))}
              rx={1.5}
              fill={barColor ? barColor(v, i) : 'var(--muted)'}
              fillOpacity={hover === null || hover === i ? (ws !== null && i < ws ? 0.55 : 1) : 0.4}
              className="origin-bottom animate-grow [transform-box:fill-box]"
              style={{ animationDelay: `${i * 18}ms`, transition: 'fill-opacity 0.15s' }}
            />
          ))
        )}
        {threshold !== undefined && threshold > lo && threshold < hi && (
          <g>
            <line x1={L} x2={W - R} y1={y(threshold)} y2={y(threshold)} stroke="var(--risk)" strokeOpacity={0.7} strokeDasharray="3 4" style={{ transition: 'y1 0.35s, y2 0.35s' }} />
            <text x={L + 6} y={y(threshold) - 6} className="caps fill-risk text-[9.5px]" style={{ letterSpacing: '0.2em' }}>
              Threshold {threshold}
            </text>
          </g>
        )}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={T - 6} y2={height - B} stroke="var(--fg)" strokeOpacity={0.35} />
            {kind === 'line' && <circle cx={x(hover)} cy={y(values[hover]!)} r={4} fill="var(--bg)" stroke="var(--fg)" strokeWidth={1.5} />}
          </g>
        )}
      </svg>
      <AnimatePresence>
        {hover !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14 }}
            className={cx('pointer-events-none absolute top-0 z-10 rounded-[6px] border border-line bg-raised px-3 py-2 shadow-pop')}
            style={{ left: Math.min(W - 70, Math.max(70, x(hover))), translate: '-50% -70%' }}
          >
            <div className="caps text-[9.5px] tracking-[0.2em] text-muted">{hover === n - 1 ? 'This week' : `Week of ${weekDate(hover)}`}</div>
            <div className="tnum mt-0.5 font-mono text-[15px]">{format(values[hover]!)}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {hover !== null ? `${hover === n - 1 ? 'This week' : `Week of ${weekDate(hover)}`}: ${format(values[hover]!)}` : ''}
      </span>
    </div>
  )
}
