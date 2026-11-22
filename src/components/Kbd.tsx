import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** A key cap: <Kbd>g</Kbd> <Kbd>a</Kbd> */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cx('inline-grid h-[22px] min-w-[22px] place-items-center rounded-[4px] border border-line bg-raised px-1.5 font-mono text-[11.5px] leading-none text-fg shadow-[0_1px_0_var(--line)]', className)}>
      {children}
    </kbd>
  )
}
