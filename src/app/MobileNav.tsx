import { Link } from '../components/Link'
import { Overlay } from '../components/Overlay'
import { NAV } from '../data'
import { cx } from '../lib/cx'
import { isActive } from './TopNav'

export function MobileNav({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  return (
    <Overlay open={open} onClose={onClose} label="Pages" kind="drawer" className="max-w-[320px]">
      <nav aria-label="Pages" className="px-6 pt-16 pb-8">
        <ul className="border-t border-line">
          {NAV.map((item) => {
            const active = isActive(item.path, path)
            return (
              <li key={item.path} className="border-b border-line">
                <Link
                  to={item.path}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={cx('flex h-14 items-center justify-between font-serif text-[22px] transition-colors', active ? 'text-fg' : 'text-muted hover:text-fg')}
                >
                  {item.label}
                  {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-risk" />}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 text-[12.5px] leading-relaxed text-muted">Seeded demo estate. Every change you make is saved in this browser.</p>
      </nav>
    </Overlay>
  )
}
