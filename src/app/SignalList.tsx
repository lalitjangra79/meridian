import { Panel } from '../components/Panel'
import { Tag, type TagTone } from '../components/Tag'
import type { Insight } from '../data'
import { percent } from '../lib/format'

const toneFor: Record<Insight['kind'], TagTone> = {
  Anomaly: 'risk',
  Forecast: 'watch',
  Opportunity: 'ok',
  Risk: 'risk',
}

/** What the models found that a person should know about. */
export function SignalList({ insights, limit = 3 }: { insights: Insight[]; limit?: number }) {
  return (
    <Panel id="signals" title="Signals worth a look" meta={`${insights.length} open`}>
      <ul className="mt-5 divide-y divide-line border-t border-line">
        {insights.slice(0, limit).map((i) => (
          <li key={i.id} className="grid gap-y-2 py-5 sm:grid-cols-[110px_minmax(0,1fr)_150px] sm:items-start sm:gap-x-6">
            <Tag tone={toneFor[i.kind]}>{i.kind}</Tag>
            <div className="min-w-0">
              <h3 className="font-serif text-[18px] leading-snug">{i.title}</h3>
              <p className="mt-1.5 max-w-[620px] text-[13px] leading-relaxed text-muted">{i.body}</p>
            </div>
            <div className="sm:text-right">
              <p className="tnum font-mono text-[12.5px]">{i.impact}</p>
              <p className="caps mt-1.5 text-[9.5px] tracking-[0.18em] text-faint">{percent(i.confidence)} confidence · {i.domain}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
