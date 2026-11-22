import { ArrowUpRight } from 'lucide-react'

import { Link } from '../components/Link'
import { Panel } from '../components/Panel'
import { Sparkline } from '../components/Sparkline'
import type { Model } from '../data'
import { Tag } from '../components/Tag'
import { cx } from '../lib/cx'
import { percent } from '../lib/format'

/** Models whose population drift is at or above the review band. */
export function DriftWatch({ models }: { models: Model[] }) {
  const list = models.filter((m) => m.stage !== 'Archived' && m.drift >= 0.2).sort((a, b) => b.drift - a.drift)
  return (
    <Panel id="drift" title="Drift watch" meta={`${list.length} above 0.20`} actions={<Link to="/models" className="caps inline-flex min-h-10 items-center gap-1 text-[10px] tracking-[0.2em] text-muted hover:text-fg">Registry <ArrowUpRight className="size-3" strokeWidth={1.75} /></Link>}>
      {list.length === 0 ? (
        <p className="mt-5 border-t border-line pt-5 text-[13px] text-muted">Every monitored model is inside its stability band.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {list.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px]">{m.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Tag tone="risk" dot={false}>
                    Drifting
                  </Tag>
                  <span className="caps text-[9.5px] tracking-[0.16em] text-faint">{m.stage}</span>
                </div>
              </div>
              <Sparkline values={m.drift13} width={82} height={24} threshold={0.2} domain={[0, 0.4]} area />
              <span className={cx('tnum w-9 text-right font-mono text-[12.5px]', m.drift >= 0.25 ? 'text-risk' : 'text-muted')}>{percent(m.drift)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">Auto-freeze pauses an agent as soon as its model crosses 0.20 PSI. Retraining is queued automatically.</p>
    </Panel>
  )
}
