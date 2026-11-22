import { useRef, type KeyboardEvent } from 'react'

import { motion } from 'motion/react'

import { cx } from '../lib/cx'

type TextTabsProps<T extends string | number> = {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Separator between options, e.g. "·" for "Combined · By segment". */
  separator?: string
  /** "text" is the 15px sans row; "caps" is the small mono-caps row (range, nav). */
  variant?: 'text' | 'caps'
  /** Render an option's visible text. */
  format?: (value: T) => string
  className?: string
}

/**
 * Text-only tab row: the active option is full-strength with a hairline
 * dot that fades in beneath it. Arrow keys move between options.
 */
export function TextTabs<T extends string | number>({ options, value, onChange, label, separator, variant = 'text', format, className }: TextTabsProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = (i + d + options.length) % options.length
    onChange(options[next]!)
    ref.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus()
  }
  return (
    <div ref={ref} role="tablist" aria-label={label} className={cx('flex items-center', separator ? 'gap-2.5' : variant === 'caps' ? 'gap-4' : 'gap-7', className)}>
      {options.map((opt, i) => {
        const active = opt === value
        return (
          <div key={String(opt)} className="flex items-center gap-2.5">
            {separator && i > 0 && (
              <span aria-hidden="true" className="text-[13px] text-faint">
                {separator}
              </span>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(opt)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                'relative cursor-pointer whitespace-nowrap transition-colors duration-200 max-sm:min-h-10 max-sm:min-w-10',
                variant === 'caps' ? 'caps py-1.5 text-[11px] tracking-[0.2em]' : 'py-1 text-[15px] tracking-[0.005em]',
                active ? 'text-fg' : 'text-muted hover:text-fg/85',
              )}
            >
              {format ? format(opt) : String(opt)}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0.4 }}
                transition={{ duration: 0.25 }}
                className={cx('absolute left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-fg/70', variant === 'caps' ? '-bottom-0.5' : '-bottom-1')}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
