import { useMemo, useState } from 'react'

import { Download } from 'lucide-react'

import { ModelDrawer } from '../app/ModelDrawer'
import { DataTable, type Column } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { Stat } from '../components/Stat'
import { Tag } from '../components/Tag'
import { TextInput } from '../components/Field'
import { TextTabs } from '../components/TextTabs'
import { STAGES, type Model, type ModelStage } from '../data'
import { cx } from '../lib/cx'
import { downloadable } from '../lib/csv'
import { count, percent, shortDate } from '../lib/format'
import { avgAccuracy, drifting } from '../lib/metrics'
import { useStore } from '../lib/store'

const FILTERS = ['All', ...STAGES] as const
type Filter = (typeof FILTERS)[number]

const stageTone = (s: ModelStage) => (s === 'Production' ? 'ok' : s === 'Shadow' ? 'watch' : 'neutral')

export function Models() {
  const { models } = useStore()
  const [filter, setFilter] = useState<Filter>('All')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Model | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return models.filter((m) => {
      if (filter !== 'All' && m.stage !== filter) return false
      if (!needle) return true
      return [m.name, m.code, m.owner, m.task, m.domain].some((v) => v.toLowerCase().includes(needle))
    })
  }, [models, filter, q])

  const production = models.filter((m) => m.stage === 'Production')
  const drift = drifting(models)
  const inferences = models.reduce((s, m) => s + m.inferences, 0)

  const columns: Column<Model>[] = [
    {
      key: 'model',
      label: 'Model',
      width: 'minmax(200px,1.5fr)',
      sort: (m) => m.name,
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate text-[14px]">{m.name}</p>
          <p className="caps mt-1 truncate text-[9.5px] tracking-[0.16em] text-muted">{m.code} · {m.version}</p>
        </div>
      ),
    },
    { key: 'domain', label: 'Domain', width: '124px', sort: (m) => m.domain, cell: (m) => <span className="text-[12.5px] text-muted">{m.domain}</span> },
    {
      key: 'stage',
      label: 'Stage',
      width: '112px',
      sort: (m) => m.stage,
      cell: (m) => <Tag tone={stageTone(m.stage)}>{m.stage}</Tag>,
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      align: 'right',
      width: '92px',
      sort: (m) => m.accuracy,
      firstDir: -1,
      cell: (m) => <span className={cx(m.accuracy < 0.85 && 'text-risk')}>{percent(m.accuracy)}</span>,
    },
    {
      key: 'drift',
      label: 'Drift',
      align: 'right',
      width: '78px',
      sort: (m) => m.drift,
      firstDir: -1,
      cell: (m) => <span className={cx(m.drift >= 0.2 && 'text-risk')}>{percent(m.drift)}</span>,
    },
    { key: 'latency', label: 'Latency', align: 'right', width: '86px', sort: (m) => m.latencyMs, cell: (m) => <span className="text-muted">{m.latencyMs} ms</span> },
    { key: 'inferences', label: 'Inf / day', align: 'right', width: '100px', sort: (m) => m.inferences, firstDir: -1, cell: (m) => <span className="text-muted">{count(m.inferences)}</span> },
    { key: 'owner', label: 'Owner', width: 'calc(96px + 2rem)', sort: (m) => m.owner, cell: (m) => <span className="text-[12.5px] text-muted">{m.owner}</span> },
  ]

  const exportCsv = () =>
    downloadable(
      'meridian-models.csv',
      models.map((m) => ({ id: m.id, name: m.name, domain: m.domain, task: m.task, stage: m.stage, version: m.version, accuracy: m.accuracy, drift: m.drift, latency_ms: m.latencyMs, owner: m.owner, risk_tier: m.riskTier, updated: m.updated })),
      ['id', 'name', 'domain', 'task', 'stage', 'version', 'accuracy', 'drift', 'latency_ms', 'owner', 'risk_tier', 'updated'],
    )

  return (
    <>
      <PageHeader
        eyebrow={`Model registry · ${models.length} registered`}
        title="Models"
        lede="Every model with a path to action: its evidence, its drift and the guardrails that bound it. A model can only act once it is in production and its owning agent is live."
        actions={
          <Pill variant="ghost" icon={<Download strokeWidth={1.75} />} onClick={exportCsv}>
            Export CSV
          </Pill>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="In production">{production.length}</Stat>
        <Stat label="Mean accuracy">{percent(avgAccuracy(production))}</Stat>
        <Stat label="Drifting" alert={drift.length > 0}>{drift.length}</Stat>
        <Stat label="Inferences / day">{count(inferences)}</Stat>
      </dl>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <TextTabs label="Stage filter" variant="caps" options={FILTERS} value={filter} onChange={setFilter} className="gap-4 sm:gap-6" />
        <TextInput label="Search models" hideLabel search id="model-search" placeholder="Search name, owner, task…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-[290px]" />
      </div>

      <div className="mt-4 border-t-2 border-rule pt-1">
        <DataTable
          label="Registered models"
          columns={columns}
          rows={rows}
          rowKey={(m) => m.id}
          rowLabel={(m) => `${m.name}, ${m.stage}, accuracy ${percent(m.accuracy)}`}
          onRowClick={setSelected}
          defaultSort={{ key: 'model', dir: 1 }}
          minWidth={980}
          enterDelay={120}
          empty={<EmptyState title="No models match">Try a different stage or clear the search.</EmptyState>}
        />
      </div>
      <p className="mt-4 text-[12px] text-muted">Select a row for evaluation evidence, guardrails, lineage and promotion controls. Last registry sync {shortDate('2026-11-22')}.</p>

      <ModelDrawer model={selected} onClose={() => setSelected(null)} />
    </>
  )
}
