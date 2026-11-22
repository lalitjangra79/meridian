import { ArrowRight, Database, TriangleAlert } from 'lucide-react'

import { Overlay } from '../components/Overlay'
import { Progress } from '../components/Progress'
import { Tag, Chip } from '../components/Tag'
import { DATASETS, MODELS, type Dataset } from '../data'
import { cx } from '../lib/cx'
import { percent } from '../lib/format'

/** One governed dataset: contract, quality, incident and downstream models. */
export function DatasetDrawer({ dataset, onClose }: { dataset: Dataset | null; onClose: () => void }) {
  const consumers = dataset ? MODELS.filter((m) => m.datasets.includes(dataset.id)) : []

  return (
    <Overlay open={!!dataset} onClose={onClose} label={dataset ? `Dataset ${dataset.name}` : 'Dataset'} kind="drawer" className="max-w-[520px]">
      {dataset && (
        <div className="px-6 pt-14 pb-8 sm:px-8">
          <p className="caps text-[10px] tracking-[0.22em] text-muted">Data product · {dataset.source}</p>
          <h2 className="mt-2 flex items-center gap-3 pr-8 font-serif text-[29px] leading-tight">
            <Database className="size-6 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
            {dataset.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Tag tone={dataset.quality >= 90 ? 'ok' : dataset.quality >= 80 ? 'watch' : 'risk'}>{`Quality ${dataset.quality}`}</Tag>
            {dataset.pii && <Chip>PII · restricted</Chip>}
            {dataset.streaming && <Chip>Streaming</Chip>}
            <Chip>{dataset.domain}</Chip>
          </div>

          {dataset.issue && (
            <div className="mt-5 flex items-start gap-2.5 border-l-2 border-risk bg-risk/[0.06] px-3.5 py-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-risk" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-muted">
                <span className="text-risk">Open incident.</span> {dataset.issue}
              </p>
            </div>
          )}

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
            {[
              ['Rows', dataset.rows],
              ['Freshness', dataset.streaming ? 'live' : `${dataset.freshnessHours} h`],
              ['Quality', `${dataset.quality} / 100`],
              ['Owner', dataset.owner],
              ['Consumers', `${consumers.length || dataset.usedBy} models`],
              ['Classification', dataset.pii ? 'Confidential' : 'Internal'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="caps text-[9.5px] tracking-[0.2em] text-muted">{label}</dt>
                <dd className="tnum mt-1 font-mono text-[14px]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-baseline justify-between">
              <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Contract coverage</h3>
              <span className="tnum font-mono text-[12px] text-muted">{percent(dataset.quality / 100)}</span>
            </div>
            <Progress value={dataset.quality / 100} label={`${dataset.name} quality`} className="mt-2" alert={dataset.quality < 80} />
            <p className="mt-2 text-[12px] leading-relaxed text-muted">Freshness, null rate, schema conformance and volume stability, measured every hour.</p>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Schema</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {dataset.columns.map((c) => (
                <Chip key={c} className="lowercase tracking-[0.02em]">{c}</Chip>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Lineage</h3>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-mono text-[12px] text-muted">{dataset.source}</span>
                <ArrowRight className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-mono text-[12px]">{dataset.name}</span>
              </div>
              {consumers.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-[13px]">
                  <span className="font-mono text-[12px] text-muted">{dataset.name}</span>
                  <ArrowRight className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden="true" />
                  <span className={cx('font-mono text-[12px]', m.stage === 'Production' ? 'text-fg' : 'text-muted')}>{m.name}</span>
                  <Tag tone={m.stage === 'Production' ? 'ok' : 'neutral'} dot={false}>
                    {m.stage}
                  </Tag>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-7 border-t border-line pt-4 text-[11.5px] leading-relaxed text-faint">
            {DATASETS.length} governed data products in the estate. Access is granted per model, not per person.
          </p>
        </div>
      )}
    </Overlay>
  )
}
