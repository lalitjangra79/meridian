import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

type PanelProps = {
  title: ReactNode
  /** Small caps line on the right of the title (counts, dates). */
  meta?: ReactNode
  /** Controls next to the title (pills, inputs). */
  actions?: ReactNode
  id?: string
  className?: string
  children: ReactNode
}

/** The raised section: panel background, serif title, caps meta. */
export function Panel({ title, meta, actions, id, className, children }: PanelProps) {
  const titleId = id ? `${id}-title` : undefined
  return (
    <section aria-labelledby={titleId} className={cx('min-w-0 rounded-[2px] bg-panel px-5 pt-8 pb-5 sm:px-9 sm:pt-10 sm:pb-7', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
        <h2 id={titleId} className="font-serif text-[23px] leading-none font-normal tracking-[-0.01em] sm:text-[25px]">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {meta && <span className="caps tnum text-[10.5px] text-muted">{meta}</span>}
          {actions}
        </div>
      </div>
      {children}
    </section>
  )
}
