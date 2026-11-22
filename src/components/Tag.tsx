import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

export type TagTone = 'ok' | 'watch' | 'risk' | 'neutral' | 'accent'

const tone: Record<TagTone, string> = {
  ok: 'text-fg',
  watch: 'text-fg/80',
  risk: 'text-risk',
  neutral: 'text-muted',
  accent: 'text-fg',
}

const dot: Record<TagTone, string> = {
  ok: 'bg-high',
  watch: 'bg-mid',
  risk: 'bg-risk',
  neutral: 'bg-faint',
  accent: 'bg-fg',
}

/** Dot + tracked caps label. The one status primitive shared by every page. */
export function Tag({ tone: t = 'neutral', dot: showDot = true, pulse, children, className }: { tone?: TagTone; dot?: boolean; pulse?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx('caps inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] whitespace-nowrap', tone[t], className)}>
      {showDot && <span aria-hidden="true" className={cx('size-1.5 shrink-0 rounded-full', dot[t], pulse && 'animate-shimmer')} />}
      {children}
    </span>
  )
}

/** A bordered chip for domains, tasks and guardrails. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('caps inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[9.5px] tracking-[0.18em] text-muted', className)}>{children}</span>
}
