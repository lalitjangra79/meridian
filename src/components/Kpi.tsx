import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import { useTween } from '../lib/useTween'

type KpiProps = {
  label: string
  value: number
  format: (n: number) => string
  note: ReactNode
  /** Orange note (the change is bad news). */
  alert?: boolean
  delay?: number
  /** "lg" is the overview strip (50px numerals); "sm" is for page summaries. */
  size?: 'lg' | 'sm'
  className?: string
}

/** One cell of the KPI strip: tracked label, large mono numeral, delta note. */
export function Kpi({ label, value, format, note, alert, delay = 0, size = 'lg', className }: KpiProps) {
  const shown = useTween(value, 900)
  const sm = size === 'sm'
  return (
    <div
      className={cx('flex animate-rise flex-col items-center justify-center px-3 text-center', sm ? 'py-6' : 'py-7 sm:py-0', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="caps text-[10px] leading-relaxed text-balance text-muted sm:text-[11px] sm:whitespace-nowrap">{label}</div>
      <div className={cx('tnum font-mono leading-none font-normal tracking-[-0.02em]', sm ? 'mt-3 text-[30px] sm:text-[34px]' : 'mt-3 text-[38px] sm:mt-[18px] sm:text-[50px]')}>
        {format(shown)}
      </div>
      <div className={cx('tnum font-mono text-[12px]', sm ? 'mt-3' : 'mt-3 sm:mt-[18px] sm:text-[12.5px]', alert ? 'text-risk' : 'text-muted')}>{note}</div>
    </div>
  )
}
