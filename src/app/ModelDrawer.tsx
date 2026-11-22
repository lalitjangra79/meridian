import { Check, ShieldCheck } from 'lucide-react'

import { Overlay } from '../components/Overlay'
import { Pill } from '../components/Pill'
import { Sparkline } from '../components/Sparkline'
import { Tag, Chip } from '../components/Tag'
import { useToast } from '../components/Toast'
import { datasetById, type Model, type ModelStage } from '../data'
import { cx } from '../lib/cx'
import { count, percent, shortDate } from '../lib/format'
import { useStore } from '../lib/store'

const stageTone = (s: ModelStage) => (s === 'Production' ? 'ok' : s === 'Shadow' ? 'watch' : 'neutral')

/** Detail drawer for a registered model: evidence, guardrails, lineage, promotion. */
export function ModelDrawer({ model, onClose }: { model: Model | null; onClose: () => void }) {
  const { setStage, models } = useStore()
  const toast = useToast()
  const live = model ? (models.find((m) => m.id === model.id) ?? model) : null
  const driftUp = live && live.drift >= 0.2

  const move = (to: ModelStage, label: string) => {
    if (!live) return
    setStage(live.id, to)
    toast.show({ tone: to === 'Production' ? 'success' : 'info', title: `${live.name} → ${to}`, body: label })
  }

  return (
    <Overlay open={!!live} onClose={onClose} label={live ? `Model ${live.name}` : 'Model'} kind="drawer" className="max-w-[520px]">
      {live && (
        <div className="px-6 pt-14 pb-8 sm:px-8">
          <p className="caps text-[10px] tracking-[0.22em] text-muted">{live.code} · {live.version}</p>
          <h2 className="mt-2 pr-8 font-serif text-[30px] leading-tight">{live.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Tag tone={stageTone(live.stage)}>{live.stage}</Tag>
            <Tag tone={live.riskTier === 'Tier 1' ? 'risk' : 'neutral'} dot={false}>
              {live.riskTier}
            </Tag>
            <Chip>{live.domain}</Chip>
            <Chip>{live.task}</Chip>
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{live.note}</p>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
            {[
              ['Accuracy', percent(live.accuracy)],
              ['Drift (PSI)', percent(live.drift)],
              ['Latency', `${live.latencyMs} ms`],
              ['Inferences / day', count(live.inferences)],
              ['Features', count(live.features)],
              ['Owner', live.owner],
              ['Updated', shortDate(live.updated)],
              ['Guardrails', String(live.guardrails.length)],
              ['Lineage', `${live.datasets.length} datasets`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="caps text-[9.5px] tracking-[0.2em] text-muted">{label}</dt>
                <dd className={cx('tnum mt-1 font-mono text-[14px]', label === 'Drift (PSI)' && driftUp && 'text-risk')}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Accuracy · 13 weeks</h3>
              <Sparkline values={live.accuracy13} width={210} height={54} area domain={[0.75, 1]} />
              <p className="mt-2 text-[12px] text-muted">Held-out evaluation, refreshed every retrain.</p>
            </div>
            <div>
              <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Drift · 13 weeks</h3>
              <Sparkline values={live.drift13} width={210} height={54} threshold={0.2} domain={[0, 0.4]} area />
              <p className={cx('mt-2 text-[12px]', driftUp ? 'text-risk' : 'text-muted')}>{driftUp ? 'Above the 0.20 review band. Retrain before promoting.' : 'Inside the 0.20 stability band.'}</p>
            </div>
          </div>

          <div className="mt-7 border-t border-line pt-5">
            <h3 className="flex items-center gap-2 font-serif text-[19px]">
              <ShieldCheck className="size-4 text-muted" strokeWidth={1.6} aria-hidden="true" /> Guardrails in force
            </h3>
            <ul className="mt-3 space-y-2">
              {live.guardrails.map((g) => (
                <li key={g} className="flex items-start gap-2 text-[13px] text-muted">
                  <Check className="mt-[3px] size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Data lineage</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {live.datasets.map((id) => (
                <Chip key={id}>{datasetById(id)?.name ?? id}</Chip>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-5">
            {live.stage === 'Production' ? (
              <Pill variant="outline" onClick={() => move('Shadow', 'Traffic is mirrored for evaluation; no live actions.')}>
                Move to shadow
              </Pill>
            ) : (
              <Pill variant="solid" onClick={() => move('Production', 'Registered for live decisions. Policy gates still apply.')}>
                {live.stage === 'Archived' ? 'Restore to staging' : 'Promote to production'}
              </Pill>
            )}
            {live.stage !== 'Archived' && (
              <Pill variant="ghost" onClick={() => move('Archived', 'Kept for audit lineage; no new inferences.')}>
                Archive
              </Pill>
            )}
          </div>
          <p className="mt-3 text-[11.5px] text-faint">Stage changes are local to this demo and saved in your browser.</p>
        </div>
      )}
    </Overlay>
  )
}
