import { cx } from '../lib/cx'

/** Small circular spinner that inherits the text colour. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx('size-3.5 animate-spin', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
