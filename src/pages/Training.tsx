import { useEffect, useRef, useState } from 'react'

import { Download, Play } from 'lucide-react'

import { RunDrawer } from '../app/RunDrawer'
import { DataTable, type Column } from '../components/DataTable'
import { Slider, Select, TextInput } from '../components/Field'
import { Overlay } from '../components/Overlay'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { Pill } from '../components/Pill'
import { Progress } from '../components/Progress'
import { Sparkline } from '../components/Sparkline'
import { Stat } from '../components/Stat'
import { Tag } from '../components/Tag'
import { useToast } from '../components/Toast'
import { MODELS, modelById, type Run } from '../data'
import { downloadable } from '../lib/csv'
import { percent } from '../lib/format'
import { MlError, trainModel } from '../lib/ml'
import { useStore } from '../lib/store'

type Queued = { id: string; modelId: string; objective: string; epochs: number; compute: number; progress: number }

const TRAINABLE = MODELS.filter((m) => m.stage !== 'Archived')

export function Training() {
  const { runs, launchRun } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Run | null>(null)
  const [modelId, setModelId] = useState(TRAINABLE[0]!.id)
  const [objective, setObjective] = useState('Weekly refresh · latest feature snapshot')
  const [epochs, setEpochs] = useState(80)
  const [compute, setCompute] = useState(24)
  const [queued, setQueued] = useState<Queued[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), [])

  const start = async () => {
    const jobId = `queue-${Date.now().toString().slice(-6)}`
    const job: Queued = { id: jobId, modelId, objective: objective.trim() || 'Refresh', epochs, compute, progress: 8 }
    setQueued((q) => [...q, job])
    setOpen(false)
    toast.show({ tone: 'info', title: 'Run sent to the ML engine', body: `${modelById(modelId)?.name} · ${epochs} epochs on ${compute} GPU-h` })

    // The bar creeps while the request is open; the run finishes when the engine
    // answers, never on a clock.
    const timer = window.setInterval(() => {
      setQueued((q) => q.map((x) => (x.id === jobId ? { ...x, progress: Math.min(92, x.progress + 5) } : x)))
    }, 400)
    timers.current.push(timer)

    try {
      const result = await trainModel({ modelId, objective: job.objective, epochs })
      window.clearInterval(timer)
      const run = launchRun({
        modelId,
        objective: job.objective,
        epochs,
        compute,
        result: { id: result.run.id, accuracy: result.run.accuracy, loss: result.run.loss, samples: result.run.samples },
      })
      setQueued((q) => q.filter((x) => x.id !== jobId))
      toast.show({
        tone: 'success',
        title: `${run.id} trained`,
        body: `${modelById(modelId)?.name} · ${percent(run.accuracy)} held-out on ${result.run.samples.toLocaleString('en-US')} rows`,
      })
    } catch (err) {
      window.clearInterval(timer)
      setQueued((q) => q.filter((x) => x.id !== jobId))
      const unconfigured = err instanceof MlError && err.code === 'ml_unconfigured'
      toast.show({
        tone: 'error',
        title: unconfigured ? 'ML engine not configured' : 'Training failed',
        body: unconfigured ? 'Start services/ml and set ML_SERVICE_URL, then queue the run again.' : err instanceof Error ? err.message : 'The ML engine could not be reached.',
      })
    }
  }

  const succeeded = runs.filter((r) => r.status === 'Succeeded')
  const gpuHours = runs.reduce((s, r) => s + r.compute, 0)
  const spend = runs.reduce((s, r) => s + r.cost, 0)

  const columns: Column<Run>[] = [
    {
      key: 'run',
      label: 'Run',
      width: 'minmax(190px,1.3fr)',
      sort: (r) => r.id,
      firstDir: -1,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[14px]">{r.id}</p>
          <p className="mt-1 truncate text-[11.5px] text-muted">{r.objective}</p>
        </div>
      ),
    },
    { key: 'model', label: 'Model', width: '150px', sort: (r) => modelById(r.modelId)?.name ?? '', cell: (r) => <span className="text-[12.5px] text-muted">{modelById(r.modelId)?.name}</span> },
    { key: 'status', label: 'Status', width: '102px', sort: (r) => r.status, cell: (r) => <Tag tone={r.status === 'Succeeded' ? 'ok' : 'risk'}>{r.status}</Tag> },
    { key: 'loss', label: 'Loss', width: '104px', cell: (r) => <Sparkline values={r.loss} width={92} height={22} /> },
    { key: 'accuracy', label: 'Accuracy', align: 'right', width: '92px', sort: (r) => r.accuracy, firstDir: -1, cell: (r) => (r.accuracy ? percent(r.accuracy) : <span className="text-risk">failed</span>) },
    { key: 'compute', label: 'Compute', align: 'right', width: '82px', sort: (r) => r.compute, cell: (r) => <span className="text-muted">{r.compute} h</span> },
    { key: 'epochs', label: 'Epochs', align: 'right', width: '78px', sort: (r) => r.epochs, cell: (r) => <span className="text-muted">{r.epochs}</span> },
    { key: 'started', label: 'Started', width: '116px', sort: (r) => r.started, cell: (r) => <span className="text-[12px] text-muted">{r.started}</span> },
    { key: 'owner', label: 'Owner', width: '88px', sort: (r) => r.owner, cell: (r) => <span className="text-[12.5px] text-muted">{r.owner}</span> },
  ]

  const exportCsv = () =>
    downloadable(
      'meridian-training-runs.csv',
      runs.map((r) => ({ id: r.id, model: modelById(r.modelId)?.name ?? r.modelId, status: r.status, objective: r.objective, epochs: r.epochs, compute_gpu_hours: r.compute, cost_usd: r.cost, accuracy: r.accuracy, started: r.started, owner: r.owner, commit: r.commit })),
      ['id', 'model', 'status', 'objective', 'epochs', 'compute_gpu_hours', 'cost_usd', 'accuracy', 'started', 'owner', 'commit'],
    )

  return (
    <>
      <PageHeader
        eyebrow="Experiments · reproducible by default"
        title="Training"
        lede="Retraining, hardening and audit runs across the registry. Every artifact is hashed, every curve is kept, and nothing reaches production without a promotion decision."
        actions={
          <>
            <Pill variant="ghost" icon={<Download strokeWidth={1.75} />} onClick={exportCsv}>
              Export
            </Pill>
            <Pill variant="solid" icon={<Play strokeWidth={1.9} />} onClick={() => setOpen(true)}>
              New run
            </Pill>
          </>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="Runs kept">{runs.length}</Stat>
        <Stat label="Succeeded">{percent(succeeded.length / Math.max(1, runs.length))}</Stat>
        <Stat label="Compute">{gpuHours} GPU-h</Stat>
        <Stat label="Spend">${(spend / 1000).toFixed(1)}k</Stat>
      </dl>

      {queued.length > 0 && (
        <div className="mt-7">
          <Panel id="queue" title="In the queue" meta={`${queued.length} running`}>
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {queued.map((j) => (
                <li key={j.id} className="grid gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,1fr)_220px_70px] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[14px]">
                      {modelById(j.modelId)?.name} <span className="text-muted">·</span> {j.epochs} epochs
                    </p>
                    <p className="mt-1 text-[12px] text-muted">{j.objective}</p>
                  </div>
                  <Progress value={j.progress / 100} label={`${j.id} training progress`} />
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Tag tone="watch" pulse>
                      Training
                    </Tag>
                    <span className="tnum font-mono text-[12px] text-muted">{Math.round(j.progress)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <div className="mt-7 border-t-2 border-rule pt-1">
        <DataTable
          label="Training runs"
          columns={columns}
          rows={runs}
          rowKey={(r) => r.id}
          rowLabel={(r) => `${r.id}, ${r.status}`}
          onRowClick={setSelected}
          defaultSort={{ key: 'run', dir: 1 }}
          minWidth={1040}
          enterDelay={120}
        />
      </div>
      <p className="mt-4 text-[12px] text-muted">
        Select a run for its loss curve, artifact and promotion controls. Runs launched here are trained by the ML engine (<span className="font-mono">services/ml</span>), which also stores the run and its weights.
      </p>

      <Overlay open={open} onClose={() => setOpen(false)} label="Queue a training run" kind="modal" className="max-w-[560px]">
        <div className="px-6 pt-8 pb-8 sm:px-9">
          <p className="caps text-[10px] tracking-[0.22em] text-muted">Training</p>
          <h2 className="mt-2 pr-8 font-serif text-[27px] leading-tight">Queue a run</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">The run trains in the ML engine, its accuracy and loss curve come back from that training, and the artifact lands in the registry as a candidate. Promotion still needs a human decision.</p>

          <Select
            label="Model"
            className="mt-6"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            options={TRAINABLE.map((m) => ({ value: m.id, label: `${m.name} · ${m.version}` }))}
          />
          <TextInput label="Objective" className="mt-4" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Why is this run happening?" />
          <Slider label="Epochs" className="mt-5" min={20} max={160} step={10} value={epochs} onChange={setEpochs} display={epochs} />
          <Slider label="Compute budget" className="mt-4" min={4} max={64} step={4} value={compute} onChange={setCompute} display={`${compute} GPU-h`} />

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
            <span className="tnum font-mono text-[12px] text-muted">≈ ${(compute * 80).toLocaleString('en-US')}</span>
            <div className="flex gap-3">
              <Pill variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Pill>
              <Pill variant="solid" icon={<Play strokeWidth={1.9} />} onClick={start} disabled={!objective.trim()}>
                Queue run
              </Pill>
            </div>
          </div>
        </div>
      </Overlay>

      <RunDrawer run={selected} onClose={() => setSelected(null)} />
    </>
  )
}
