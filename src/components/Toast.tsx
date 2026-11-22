import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { AnimatePresence, motion } from 'motion/react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

import { cx } from '../lib/cx'
import { useReducedMotion } from '../lib/useReducedMotion'

export type ToastTone = 'success' | 'info' | 'error'
type Toast = { id: number; tone: ToastTone; title: string; body?: string; action?: { label: string; run: () => void } }
type ToastApi = { show: (t: Omit<Toast, 'id'>) => void }

const Ctx = createContext<ToastApi>({ show: () => {} })

/** `const toast = useToast(); toast.show({ tone: 'success', title: 'Saved' })` */
export const useToast = () => useContext(Ctx)

const icons: Record<ToastTone, ReactNode> = {
  success: <Check strokeWidth={2} />,
  info: <Info strokeWidth={1.75} />,
  error: <TriangleAlert strokeWidth={1.75} />,
}

/** Bottom-right stack of toasts; each one leaves after 4.5 s (hover pauses nothing, close is a button). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const reduce = useReducedMotion()
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const show = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current
      setToasts((list) => [...list.slice(-2), { ...t, id }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )
  const api = useMemo(() => ({ show }), [show])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" aria-label="Notifications" role="region" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-end gap-2.5 sm:left-auto">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: reduce ? 0 : 24, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="pointer-events-auto w-full max-w-[360px]"
            >
              <ToastCard toast={t} onClose={() => dismiss(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

/** The toast surface itself. */
export function ToastCard({ toast, onClose }: { toast: Omit<Toast, 'id'>; onClose?: () => void }) {
  return (
    <div role={toast.tone === 'error' ? 'alert' : 'status'} className="flex items-start gap-3 rounded-[6px] border border-line bg-raised py-3 pr-2.5 pl-3.5 shadow-pop">
      <span className={cx('mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-full [&_svg]:size-3', toast.tone === 'error' ? 'bg-risk text-bg' : toast.tone === 'success' ? 'bg-fg text-bg' : 'border border-line text-fg')}>
        {icons[toast.tone]}
      </span>
      <div className="min-w-0 flex-1 py-px">
        <p className="text-[14px] leading-snug">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-[13px] leading-snug text-muted">{toast.body}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.run()
            onClose?.()
          }}
          className="caps mt-px h-7 max-sm:h-10 shrink-0 cursor-pointer rounded-full px-2.5 text-[10px] text-fg hover:bg-fg/[0.07]"
        >
          {toast.action.label}
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss notification" className="grid size-7 max-sm:size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-fg/[0.07] hover:text-fg">
          <X className="size-3.5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}
