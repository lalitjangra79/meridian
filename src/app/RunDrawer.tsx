import { Overlay } from '../components/Overlay'
import { Pill } from '../components/Pill'
import { Sparkline } from '../components/Sparkline'
import { Tag } from '../components/Tag'
import { useToast } from '../components/Toast'
import { modelById, type Run } from '../data'
import { cx } from '../lib/cx'
import { percent } from '../lib/format'

/** Evidence for one training run: the loss curve, the settings, the artifact. */
export function RunDrawer({ run, onClose }: { run: Run | null; onClose: () => void }) {
  const toast = useToast()
  const model = run ? modelById(run.modelId) : null

  return (
    <Overlay open={!!run} onClose={onClose} label={run ? `Run ${run.id}` : 'Run'} kind="drawer" className="max-w-[500px]">
      {run && model && (
        <div className="px-6 pt-14 pb-8 sm:px-8">
          <p className="caps text-[10px] tracking-[0.22em] text-muted">Training run · {run.started}</p>
          <h2 className="mt-2 pr-8 font-serif text-[29px] leading-tight">{run.id}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Tag tone={run.status === 'Succeeded' ? 'ok' : 'risk'}>{run.status}</Tag>
            <span className="caps text-[10px] tracking-[0.18em] text-muted">{model.name}</span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">{run.objective}</p>

          <div className="mt-7 border-t border-line pt-5">
            <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Training loss</h3>
            <div className="mt-3">
              <Sparkline values={run.loss} width={400} height={110} area dotRadius={3} />
            </div>
            <div className="tnum mt-2 flex justify-between font-mono text-[10.5px] text-muted">
              <span>epoch 0 · {run.loss[0]?.toFixed(3)}</span>
              <span>{run.loss.length} logged points</span>
              <span>final · {run.loss[run.loss.length - 1]?.toFixed(3)}</span>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5">
            {[
              ['Held-out accuracy', run.accuracy ? percent(run.accuracy) : '—'],
              ['Epochs', String(run.epochs)],
              ['Compute', `${run.compute} GPU-h`],
              ['Spend', `$${run.cost.toLocaleString('en-US')}`],
              ['Duration', run.duration],
              ['Owner', run.owner],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="caps text-[9.5px] tracking-[0.2em] text-muted">{label}</dt>
                <dd className={cx('tnum mt-1 font-mono text-[14px]', label === 'Held-out accuracy' && run.accuracy >= 0.95 && 'text-fg')}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 border-t border-line pt-5">
            <h3 className="caps text-[10px] tracking-[0.2em] text-muted">Artifact</h3>
            <p className="mt-2 font-mono text-[12.5px] text-muted">
              registry.meridian.internal/{model.code}/{run.id} <span className="text-faint">·</span> commit {run.commit}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-5">
            <Pill
              variant="solid"
              disabled={run.status !== 'Succeeded'}
              onClick={() => toast.show({ tone: 'success', title: 'Candidate registered', body: `${run.id} is ready to promote from the registry.` })}
            >
              Register candidate
            </Pill>
            <Pill variant="ghost" onClick={() => toast.show({ tone: 'info', title: 'Comparison queued', body: 'This run will be compared with the current production artifact.' })}>
              Compare with production
            </Pill>
          </div>
        </div>
      )}
    </Overlay>
  )
}
