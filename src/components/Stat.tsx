import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** Label / value pair on a hairline (use inside a <dl>). */
export function Stat({ label, children, alert, className }: { label: string; children: ReactNode; alert?: boolean; className?: string }) {
  return (
    <div className={cx('border-t border-line pt-3', className)}>
      <dt className="caps text-[10px] tracking-[0.22em] text-muted">{label}</dt>
      <dd className={cx('tnum mt-1.5 font-mono text-[15px]', alert && 'text-risk')}>{children}</dd>
    </div>
  )
}
