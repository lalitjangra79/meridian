import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

export type PillVariant = 'outline' | 'solid' | 'ghost' | 'danger'
export type PillSize = 'sm' | 'md'

const variants: Record<PillVariant, string> = {
  outline: 'border-[1.5px] border-fg/75 text-fg hover:border-fg hover:bg-fg/[0.06]',
  solid: 'bg-fg text-bg shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] hover:opacity-90',
  ghost: 'border border-line text-muted hover:text-fg hover:border-fg/40',
  danger: 'border-[1.5px] border-risk/80 text-risk hover:border-risk hover:bg-risk/[0.08]',
}

const sizes: Record<PillSize, string> = {
  sm: 'h-[30px] max-sm:h-10 px-3 text-[10.5px] gap-1.5 [&_svg]:size-3',
  md: 'h-[34px] max-sm:h-10 px-4 text-[11.5px] gap-2 [&_svg]:size-3.5',
}

/** Class string for anything pill-shaped (buttons and links share it). */
export function pillClass(variant: PillVariant = 'outline', size: PillSize = 'md', className?: string) {
  return cx(
    'caps inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full leading-none whitespace-nowrap select-none',
    'transition-[background-color,color,border-color,opacity,transform] duration-200 active:scale-[0.97]',
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 aria-disabled:opacity-45',
    '[&_svg]:shrink-0',
    sizes[size],
    variants[variant],
    className,
  )
}

type PillProps = ComponentPropsWithoutRef<'button'> & {
  variant?: PillVariant
  size?: PillSize
  icon?: ReactNode
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean
}

/** Rounded mono-caps button: "EXPORT CSV", "LIGHT". */
export function Pill({ variant = 'outline', size = 'md', icon, loading, className, children, disabled, ...rest }: PillProps) {
  return (
    <button type="button" className={pillClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner /> : icon}
      <span className="-mr-[0.26em]">{children}</span>
    </button>
  )
}
