import { motion } from 'motion/react'
import { Menu } from 'lucide-react'

import { Link } from '../components/Link'
import { Pill } from '../components/Pill'
import { TextTabs } from '../components/TextTabs'
import { NAV, RANGES } from '../data'
import { cx } from '../lib/cx'
import { useStore } from '../lib/store'

export function isActive(path: string, current: string) {
  return path === '/' ? current === '/' : current === path || current.startsWith(`${path}/`)
}

/** Page links (desktop), the comparison window and the shortcuts button. */
export function TopNav({ path, onOpenMenu, onOpenShortcuts }: { path: string; onOpenMenu: () => void; onOpenShortcuts: () => void }) {
  const { range, setRange } = useStore()
  return (
    <div className="flex animate-fade items-center justify-between gap-4 border-b border-line-soft pb-3">
      <nav aria-label="Pages" className="hidden md:block">
        <ul className="flex items-center gap-7">
          {NAV.map((item) => {
            const active = isActive(item.path, path)
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cx('caps relative inline-block py-1.5 text-[11px] tracking-[0.2em] transition-colors duration-200', active ? 'text-fg' : 'text-muted hover:text-fg/85')}
                >
                  {item.label}
                  {active && (
                    <motion.span layoutId="nav-dot" aria-hidden="true" className="absolute -bottom-0.5 left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-fg/70" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <Pill variant="ghost" size="sm" icon={<Menu strokeWidth={1.75} />} onClick={onOpenMenu} className="md:hidden" aria-label="Open page menu">
        Menu
      </Pill>

      <div className="flex items-center gap-3 sm:gap-5">
        <span className="caps hidden text-[10px] tracking-[0.2em] text-muted lg:inline">Window</span>
        <TextTabs label="Comparison window" variant="caps" options={RANGES} value={range} onChange={setRange} format={(r) => `${r}W`} className="gap-3 sm:gap-4" />
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="Keyboard shortcuts"
          className="grid size-[30px] cursor-pointer place-items-center rounded-full border border-line font-mono text-[12px] text-muted transition-colors hover:border-fg/40 hover:text-fg max-sm:size-10"
        >
          ?
        </button>
      </div>
    </div>
  )
}
