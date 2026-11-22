import { Activity, Moon, Sun } from 'lucide-react'

import { Link } from '../components/Link'
import { Pill } from '../components/Pill'
import { Tag } from '../components/Tag'
import { copy } from '../data'
import type { Theme } from '../lib/theme'

type HeaderProps = {
  models: number
  agents: number
  theme: Theme
  onToggleTheme: () => void
}

/** The masthead every page shares: brand, platform state, theme. */
export function Header({ models, agents, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex animate-rise flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Tag tone="ok" pulse>
            Platform live
          </Tag>
          <span className="caps text-[10px] tracking-[0.2em] text-faint">22 Nov ’26 · 09:58 UTC</span>
        </div>
        <h1 className="mt-2.5 font-serif text-[32px] leading-none font-normal tracking-[-0.015em] sm:text-[38px]">
          <Link to="/" className="inline-flex items-center gap-3">
            <Activity className="size-[26px] translate-y-px" strokeWidth={1.5} aria-hidden="true" />
            {copy.title}
          </Link>
        </h1>
        <p className="mt-2 max-w-[560px] text-[13.5px] leading-relaxed text-muted">{copy.tagline} · {copy.lede}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <dl className="flex items-center gap-6">
          <div>
            <dt className="caps text-[9.5px] tracking-[0.2em] text-muted">Models live</dt>
            <dd className="tnum mt-0.5 font-mono text-[17px]">{models}</dd>
          </div>
          <div>
            <dt className="caps text-[9.5px] tracking-[0.2em] text-muted">Agents</dt>
            <dd className="tnum mt-0.5 font-mono text-[17px]">{agents}</dd>
          </div>
        </dl>
        <Pill variant="solid" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} icon={theme === 'dark' ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Pill>
      </div>
    </header>
  )
}
