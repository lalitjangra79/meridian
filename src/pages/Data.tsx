import { useMemo, useState } from 'react'

import { Download, TriangleAlert } from 'lucide-react'

import { DatasetDrawer } from '../app/DatasetDrawer'
import { DataTable, type Column } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { Pill } from '../components/Pill'
import { Progress } from '../components/Progress'
import { Stat } from '../components/Stat'
import { Tag } from '../components/Tag'
import { Chip } from '../components/Tag'
import { TextTabs } from '../components/TextTabs'
import { DATASETS, DOMAINS, type Dataset } from '../data'
import { cx } from '../lib/cx'
import { downloadable } from '../lib/csv'
import { median } from '../lib/metrics'
import { useStore } from '../lib/store'

const FILTERS = ['All', ...DOMAINS] as const
type Filter = (typeof FILTERS)[number]

export function Data() {
  const { models } = useStore()
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<Dataset | null>(null)

  const rows = useMemo(() => (filter === 'All' ? DATASETS : DATASETS.filter((d) => d.domain === filter)), [filter])
  const incidents = DATASETS.filter((d) => d.issue)
  const consumers = (d: Dataset) => models.filter((m) => m.datasets.includes(d.id)).length

  const columns: Column<Dataset>[] = [
    {
      key: 'dataset',
      label: 'Data product',
      width: 'minmax(190px,1.4fr)',
      sort: (d) => d.name,
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate text-[14px]">{d.name}</p>
          <p className="mt-1 truncate text-[11.5px] text-muted">{d.source}</p>
        </div>
      ),
    },
    { key: 'domain', label: 'Domain', width: '124px', sort: (d) => d.domain, cell: (d) => <span className="text-[12.5px] text-muted">{d.domain}</span> },
    {
      key: 'quality',
      label: 'Quality',
      width: '116px',
      sort: (d) => d.quality,
      firstDir: -1,
      cell: (d) => (
        <div className="flex items-center gap-2">
          <Progress value={d.quality / 100} label={`${d.name} quality`} alert={d.quality < 80} className="w-12" />
          <span className={cx(d.quality < 80 && 'text-risk')}>{d.quality}</span>
        </div>
      ),
    },
    {
      key: 'freshness',
      label: 'Freshness',
      align: 'right',
      width: '100px',
      sort: (d) => d.freshnessHours,
      cell: (d) => <span className={cx(d.freshnessHours > 24 ? 'text-risk' : 'text-muted')}>{d.streaming ? 'live' : `${d.freshnessHours} h`}</span>,
    },
    { key: 'rows', label: 'Scale', align: 'right', width: '88px', cell: (d) => <span className="text-muted">{d.rows}</span> },
    { key: 'pii', label: 'PII', width: '76px', cell: (d) => (d.pii ? <Tag tone="neutral" dot={false}>Restricted</Tag> : <span className="text-faint">—</span>) },
    { key: 'used', label: 'Consumers', align: 'right', width: '104px', sort: (d) => consumers(d), firstDir: -1, cell: (d) => <span className="text-muted">{consumers(d)}</span> },
  ]

  const exportCsv = () =>
    downloadable(
      'meridian-data-estate.csv',
      DATASETS.map((d) => ({ id: d.id, name: d.name, domain: d.domain, source: d.source, owner: d.owner, rows: d.rows, quality: d.quality, freshness_hours: d.freshnessHours, pii: d.pii ? 'yes' : 'no', consumers: consumers(d), issue: d.issue ?? '' })),
      ['id', 'name', 'domain', 'source', 'owner', 'rows', 'quality', 'freshness_hours', 'pii', 'consumers', 'issue'],
    )

  return (
    <>
      <PageHeader
        eyebrow="Data estate · products, not tables"
        title="Data"
        lede="Each data product has an owner, a contract and a quality score. Models request access per product; an incident pauses every consumer downstream."
        actions={
          <Pill variant="ghost" icon={<Download strokeWidth={1.75} />} onClick={exportCsv}>
            Export
          </Pill>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="Data products">{DATASETS.length}</Stat>
        <Stat label="Median quality">{Math.round(median(DATASETS.map((d) => d.quality)))}</Stat>
        <Stat label="Streaming">{DATASETS.filter((d) => d.streaming).length}</Stat>
        <Stat label="Open incidents" alert={incidents.length > 0}>{incidents.length}</Stat>
      </dl>

      <div className="mt-8">
        <Panel id="incidents" title="Quality incidents" meta={`${incidents.length} open · blocks promotion`}>
          <ul className="mt-5 divide-y divide-line border-t border-line">
            {incidents.map((d) => (
              <li key={d.id} className="flex items-start gap-3 py-4">
                <TriangleAlert className="mt-[3px] size-4 shrink-0 text-risk" strokeWidth={1.75} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px]">
                    {d.name}
                    <Chip>{d.owner}</Chip>
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{d.issue}</p>
                </div>
                <Tag tone="risk" dot={false}>{`Q${d.quality}`}</Tag>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="scroll-thin -mx-1 overflow-x-auto px-1">
          <TextTabs label="Domain filter" variant="caps" options={FILTERS} value={filter} onChange={setFilter} className="gap-4 sm:gap-6" />
        </div>
        <span className="caps text-[10px] tracking-[0.2em] text-muted">Governed by contract</span>
      </div>

      <div className="mt-4 border-t-2 border-rule pt-1">
        <DataTable
          label="Data products"
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          rowLabel={(d) => `${d.name}, quality ${d.quality}`}
          onRowClick={setSelected}
          defaultSort={{ key: 'quality', dir: -1 }}
          minWidth={900}
          enterDelay={120}
          empty={<EmptyState title="No data products here">Choose another domain.</EmptyState>}
        />
      </div>
      <p className="mt-4 text-[12px] text-muted">Select a product for its contract, incident and downstream lineage.</p>

      <DatasetDrawer dataset={selected} onClose={() => setSelected(null)} />
    </>
  )
}
