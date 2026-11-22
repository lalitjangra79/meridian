import { useEffect, useRef, type ReactNode } from 'react'

import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

import { cx } from '../lib/cx'
import { useReducedMotion } from '../lib/useReducedMotion'

type OverlayProps = {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  /** "modal" centres a card; "drawer" slides a sheet in from the right. */
  kind: 'modal' | 'drawer'
  className?: string
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Shared modal / drawer: scrim, Escape to close, focus trapped inside, then restored. */
export function Overlay({ open, onClose, label, children, kind, className }: OverlayProps) {
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => panelRef.current?.focus(), 30)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose])

  const panelMotion =
    kind === 'drawer'
      ? { initial: { x: reduce ? 0 : 48, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: reduce ? 0 : 48, opacity: 0 } }
      : { initial: { y: reduce ? 0 : 14, scale: reduce ? 1 : 0.985, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, exit: { y: reduce ? 0 : 8, opacity: 0 } }

  return (
    <AnimatePresence>
      {open && (
        <div className={cx('fixed inset-0 z-50 flex', kind === 'drawer' ? 'justify-end' : 'items-center justify-center p-4')}>
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            {...panelMotion}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={cx(
              'scroll-thin relative flex flex-col overflow-y-auto bg-panel shadow-pop outline-none',
              kind === 'drawer'
                ? 'h-full w-full max-w-[460px] border-l border-line'
                : 'max-h-[min(86vh,760px)] w-full max-w-[680px] rounded-panel border border-line',
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 z-10 grid size-8 max-sm:size-10 max-sm:top-3 max-sm:right-3 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
