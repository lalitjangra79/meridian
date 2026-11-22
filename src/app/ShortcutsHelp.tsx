import { Fragment } from 'react'

import { Kbd } from '../components/Kbd'
import { Overlay } from '../components/Overlay'
import { SHORTCUTS } from '../data'

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose} label="Keyboard shortcuts" kind="modal" className="max-w-[480px]">
      <div className="px-6 pt-8 pb-8 sm:px-9">
        <p className="caps text-[10.5px] text-muted">Keyboard</p>
        <h2 className="mt-2 pr-8 font-serif text-[28px] leading-tight font-normal tracking-[-0.01em]">Shortcuts</h2>
        <dl className="mt-6 border-t border-line">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-[14px] text-muted">{s.label}</dt>
              <dd className="flex items-center gap-1.5">
                {s.keys.map((k, i) => (
                  <Fragment key={k}>
                    {i > 0 && <span className="text-[11px] text-muted">then</span>}
                    <Kbd>{k}</Kbd>
                  </Fragment>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Overlay>
  )
}
