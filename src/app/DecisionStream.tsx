import { useMemo, useState } from 'react'

import { Check } from 'lucide-react'

import { Panel } from '../components/Panel'
import { Pill } from '../components/Pill'
import { Progress } from '../components/Progress'
import { Tag, type TagTone } from '../components/Tag'
import { TextTabs } from '../components/TextTabs'
import { useToast } from '../components/Toast'
import { agentById, type Decision, type Outcome } from '../data'
import { cx } from '../lib/cx'
import { money, percent } from '../lib/format'
import { useStore } from '../lib/store'

const tone: Record<Outcome, TagTone> = {
  'Auto-executed': 'ok',
  'Awaiting approval': 'watch',
  Escalated: 'risk',
  Approved: 'ok',
}

const FILTERS = ['All', 'Awaiting', 'Autonomous'] as const
type Filter = (typeof FILTERS)[number]

/** The live decision ledger: what the agents did, what still needs a person. */
export function DecisionStream({ decisions, limit = 8 }: { decisions: Decision[]; limit?: number }) {
  const { approve, approveAll } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('All')
  const [expanded, setExpanded] = useState(false)

  const rows = useMemo(() => {
    const list =
      filter === 'Awaiting'
        ? decisions.filter((d) => d.outcome === 'Awaiting approval')
        : filter === 'Autonomous'
          ? decisions.filter((d) => d.outcome === 'Auto-executed' || d.outcome === 'Approved')
          : decisions
    return expanded ? list : list.slice(0, limit)
  }, [decisions, filter, expanded, limit])

  const pending = decisions.filter((d) => d.outcome === 'Awaiting approval')
  const pendingValue = pending.reduce((s, d) => s + d.value, 0)

  const onApprove = (d: Decision) => {
    approve(d.id)
    toast.show({ tone: 'success', title: 'Approved', body: `${d.action} · ${d.subject}` })
  }

  return (
    <Panel
      id="ledger"
      title="Decision ledger"
      meta={`${decisions.length} logged · ${pending.length} awaiting`}
      actions={<TextTabs label="Decision filter" variant="caps" options={FILTERS} value={filter} onChange={setFilter} className="gap-4" />}
    >
      {pending.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
          <p className="text-[13px] text-muted">
            <span className="tnum font-mono text-fg">{money(pendingValue)}</span> is waiting on a human
          </p>
          <Pill
            size="sm"
            variant="outline"
            icon={<Check strokeWidth={2} />}
            onClick={() => {
              approveAll()
              toast.show({ tone: 'success', title: `Approved ${pending.length} decisions`, body: 'Written to the audit log under your name.' })
            }}
          >
            Approve all
          </Pill>
        </div>
      )}

      <ul className={cx('divide-y divide-line', pending.length === 0 && 'border-t border-line')}>
        {rows.map((d) => {
          const agent = agentById(d.agentId)
          const isPending = d.outcome === 'Awaiting approval'
          return (
            <li key={d.id} className="grid grid-cols-[42px_minmax(0,1fr)] gap-x-3 gap-y-2 py-3.5 sm:grid-cols-[46px_minmax(0,1fr)_92px_130px] sm:items-center">
              <span className="tnum pt-0.5 font-mono text-[11.5px] text-faint sm:pt-0">{d.time}</span>
              <div className="min-w-0">
                <p className="text-[14px] leading-snug">{d.action}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                  <span className="truncate">{d.subject}</span>
                  <span aria-hidden="true" className="text-faint">·</span>
                  <span className="whitespace-nowrap">{agent?.name}</span>
                </p>
              </div>

              <div className="col-start-2 flex items-center gap-2 sm:col-start-auto sm:block">
                <Progress value={d.confidence} label={`${d.action} confidence`} className="max-w-[52px] sm:max-w-none" />
                <span className="tnum mt-1.5 font-mono text-[11px] text-muted">{percent(d.confidence)}</span>
              </div>

              <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:justify-end">
                <span className="tnum font-mono text-[12px] text-muted">{d.value ? money(d.value) : '—'}</span>
                {isPending ? (
                  <Pill size="sm" variant="outline" onClick={() => onApprove(d)}>
                    Approve
                  </Pill>
                ) : (
                  <Tag tone={tone[d.outcome]} className="sm:w-[130px] sm:justify-end">
                    {d.outcome}
                  </Tag>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {filter === 'All' && decisions.length > rows.length && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="caps mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-muted transition-colors hover:text-fg"
        >
          Show all {decisions.length} <span aria-hidden="true">→</span>
        </button>
      )}
    </Panel>
  )
}
