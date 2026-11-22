import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** Centred message for empty lists, no-results and errors. */
export function EmptyState({ title, children, action, tone = 'muted', className }: { title: string; children?: ReactNode; action?: ReactNode; tone?: 'muted' | 'error'; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cx('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span aria-hidden="true" className={cx('mb-4 h-px w-10', tone === 'error' ? 'bg-risk' : 'bg-line')} />
      <p className={cx('font-serif text-[20px] leading-tight', tone === 'error' && 'text-risk')}>{title}</p>
      {children && <div className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
