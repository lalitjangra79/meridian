import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** Page title row under the app header: serif title, muted lede, actions on the right. */
export function PageHeader({ eyebrow, title, lede, actions, className }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex animate-rise flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-rule pb-6', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="caps mb-2.5 text-[10.5px] text-muted">{eyebrow}</div>}
        <h2 tabIndex={-1} data-page-title className="font-serif text-[30px] leading-[1.05] font-normal tracking-[-0.012em] outline-none sm:text-[36px]">
          {title}
        </h2>
        {lede && <p className="mt-2.5 max-w-[640px] text-[14.5px] leading-relaxed text-muted">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
