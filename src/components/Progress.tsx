import { cx } from '../lib/cx'

/** Thin progress bar; turns orange when `alert`. */
export function Progress({ value, label, alert, className }: { value: number; label: string; alert?: boolean; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cx('h-[3px] w-full overflow-hidden rounded-full bg-fg/[0.09]', className)}>
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', alert ? 'bg-risk' : 'bg-fg/70')} style={{ width: `${pct}%` }} />
    </div>
  )
}
