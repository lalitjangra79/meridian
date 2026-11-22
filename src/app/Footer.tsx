import { Link } from '../components/Link'
import { copy } from '../data'

const link = 'caps inline-flex min-h-10 items-center text-[10px] tracking-[0.2em] text-muted transition-colors hover:text-fg sm:min-h-0'

export function Footer({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  return (
    <footer className="mx-auto mt-4 flex max-w-[1304px] flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line-soft px-4 py-5 sm:px-8">
      <span className="caps text-[10px] tracking-[0.2em] text-muted">{copy.title} · synthetic demo estate · today = Nov 22 ’26</span>
      <div className="flex flex-wrap items-center gap-x-6">
        <Link to="/models" className={link}>
          Registry
        </Link>
        <Link to="/governance" className={link}>
          Policy
        </Link>
        <button type="button" onClick={onOpenShortcuts} className={`${link} cursor-pointer`}>
          Shortcuts
        </button>
      </div>
    </footer>
  )
}
