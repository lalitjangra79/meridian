import { ArrowUpRight } from 'lucide-react'

import { Link } from '../components/Link'
import { Panel } from '../components/Panel'
import { cx } from '../lib/cx'
import { count } from '../lib/format'
import type { LiveAgent } from '../lib/store'

/** Compact roster of the agents acting on the enterprise. */
export function AgentPulse({ agents }: { agents: LiveAgent[] }) {
  const sorted = [...agents].sort((a, b) => b.actionsToday - a.actionsToday).slice(0, 5)
  return (
    <Panel id="pulse" title="Agent roster" meta={`${agents.filter((a) => !a.paused).length} live`} actions={<Link to="/agents" className="caps inline-flex min-h-10 items-center gap-1 text-[10px] tracking-[0.2em] text-muted hover:text-fg">Console <ArrowUpRight className="size-3" strokeWidth={1.75} /></Link>}>
      <ul className="mt-5 divide-y divide-line border-t border-line">
        {sorted.map((a) => (
          <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3">
            <div className="min-w-0">
              <p className="truncate text-[14px]">{a.name}</p>
              <p className="caps mt-1 text-[9.5px] tracking-[0.18em] text-muted">
                {a.paused ? 'Paused' : a.autonomy}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="tnum font-mono text-[12.5px] text-muted">{count(a.actionsToday)}</span>
              <span
                aria-hidden="true"
                title={a.autonomy}
                className={cx('size-1.5 rounded-full', a.paused ? 'bg-faint' : a.autonomy === 'Fully autonomous' ? 'bg-high animate-shimmer' : 'bg-mid')}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
