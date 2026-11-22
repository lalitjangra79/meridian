import type { ComponentPropsWithoutRef, MouseEvent } from 'react'

import { navigate } from '../lib/router'

type LinkProps = ComponentPropsWithoutRef<'a'> & { to: string }

/** An <a> that routes client-side (and still opens in a new tab with ⌘/Ctrl-click). */
export function Link({ to, onClick, ...rest }: LinkProps) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={go} {...rest} />
}
