import { useState } from 'react'

import { Download, RotateCcw } from 'lucide-react'

import { DataTable, type Column } from '../components/DataTable'
import { Slider, Switch } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { Pill } from '../components/Pill'
import { Stat } from '../components/Stat'
import { Tag, type TagTone } from '../components/Tag'
import { useToast } from '../components/Toast'
import { agentById, type Decision, type Outcome } from '../data'
import { cx } from '../lib/cx'
import { downloadable } from '../lib/csv'
import { count, money, percent } from '../lib/format'
import { useStore, DEFAULT_SETTINGS } from '../lib/store'

const outcomeTone: Record<Outcome, TagTone> = {
  'Auto-executed': 'ok',
  'Awaiting approval': 'watch',
  Escalated: 'risk',
  Approved: 'ok',
}

const TIERS = [
  { tier: 'Tier 1', approval: 'Dual control · two named approvers', evidence: '24 months', drift: 'Review every 7 days', scope: 'Money movement, customer contact, workforce signals' },
  { tier: 'Tier 2', approval: 'Single approver · model owner', evidence: '12 months', drift: 'Review every 14 days', scope: 'Operational routing, pricing proposals' },
  { tier: 'Tier 3', approval: 'Agent owner · self-serve', evidence: '6 months', drift: 'Review every 30 days', scope: 'Internal triage, classification' },
]

export function Governance() {
  const { decisions, models, agents, settings, setConfidenceFloor, setApprovalLimit, setDualControl, setAutoFreeze, resetSettings } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'All' | 'Awaiting'>('All')

  const awaiting = decisions.filter((d) => d.outcome === 'Awaiting approval')
  const rows = tab === 'Awaiting' ? awaiting : decisions
  const below = decisions.filter((d) => d.confidence < settings.confidenceFloor).length
  const tier1 = models.filter((m) => m.riskTier === 'Tier 1')

  const reset = () => {
    resetSettings()
    toast.show({ tone: 'info', title: 'Execution policy reset', body: `Confidence floor back to ${percent(DEFAULT_SETTINGS.confidenceFloor)}, spend limit back to ${money(DEFAULT_SETTINGS.approvalLimit)}.` })
  }

  const columns: Column<Decision>[] = [
    { key: 'time', label: 'Time', width: '64px', sort: (d) => d.time, firstDir: -1, cell: (d) => <span className="text-muted">{d.time}</span> },
    { key: 'agent', label: 'Agent', width: 'minmax(140px,1fr)', sort: (d) => agentById(d.agentId)?.name ?? '', cell: (d) => <span className="text-[12.5px]">{agentById(d.agentId)?.name}</span> },
    { key: 'action', label: 'Decision', width: 'minmax(200px,1.6fr)', sort: (d) => d.action, cell: (d) => <span className="block truncate text-[12.5px] text-muted">{d.action} <span className="text-faint">·</span> {d.subject}</span> },
    { key: 'outcome', label: 'Outcome', width: '154px', sort: (d) => d.outcome, cell: (d) => <Tag tone={outcomeTone[d.outcome]}>{d.outcome}</Tag> },
    { key: 'confidence', label: 'Conf.', align: 'right', width: '72px', sort: (d) => d.confidence, firstDir: -1, cell: (d) => <span className="text-muted">{percent(d.confidence)}</span> },
    { key: 'value', label: 'Value', align: 'right', width: '86px', sort: (d) => d.value, firstDir: -1, cell: (d) => <span className="text-muted">{d.value ? money(d.value) : '—'}</span> },
  ]

  const exportCsv = () =>
    downloadable(
      'meridian-audit-log.csv',
      decisions.map((d) => ({ time: d.time, agent: agentById(d.agentId)?.name ?? d.agentId, decision: d.action, subject: d.subject, domain: d.domain, confidence: d.confidence, outcome: d.outcome, value_usd: d.value })),
      ['time', 'agent', 'decision', 'subject', 'domain', 'confidence', 'outcome', 'value_usd'],
    )

  return (
    <>
      <PageHeader
        eyebrow="Policy & audit"
        title="Governance"
        lede="The rules that decide when a machine may act. The confidence floor and spend limit are enforced by the execution layer before any agent touches a system of record."
        actions={
          <Pill variant="ghost" icon={<RotateCcw strokeWidth={1.75} />} onClick={reset}>
            Reset policy
          </Pill>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="Confidence floor">{percent(settings.confidenceFloor)}</Stat>
        <Stat label="Human review above">{money(settings.approvalLimit)}</Stat>
        <Stat label="Dual control">{settings.dualControl ? 'Required' : 'Off'}</Stat>
        <Stat label="Awaiting a person" alert={awaiting.length > 0}>{awaiting.length}</Stat>
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Panel id="policy" title="Execution policy" meta="Enforced at the action boundary" className="animate-rise [animation-delay:80ms]">
          <div className="mt-6 space-y-6">
            <Slider
              label="Auto-execute at or above"
              value={settings.confidenceFloor}
              min={0.7}
              max={0.99}
              step={0.01}
              onChange={setConfidenceFloor}
              display={percent(settings.confidenceFloor)}
            />
            <Slider
              label="Always review spend above"
              value={settings.approvalLimit}
              min={0}
              max={500_000}
              step={10_000}
              onChange={setApprovalLimit}
              display={money(settings.approvalLimit)}
            />
          </div>

          <div className="mt-6 border-y border-line py-4">
            <p className="text-[13px] leading-relaxed text-muted">
              A decision runs without review only when confidence is at least{' '}
              <span className="tnum font-mono text-fg">{percent(settings.confidenceFloor)}</span> and its value is at or under{' '}
              <span className="tnum font-mono text-fg">{money(settings.approvalLimit)}</span>.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              <span className="tnum font-mono text-fg">{below}</span> of the {decisions.length} decisions logged today fall below the current floor and are queued for a person.
            </p>
          </div>

          <ul className="mt-5 divide-y divide-line">
            <li className="flex items-start justify-between gap-4 py-3.5">
              <div>
                <p className="text-[14px]">Dual control for Tier-1 models</p>
                <p className="mt-1 text-[12.5px] leading-snug text-muted">Two named approvers are required before a Tier-1 action executes.</p>
              </div>
              <Switch checked={settings.dualControl} label="Require dual control" onChange={(v) => { setDualControl(v); toast.show({ tone: 'info', title: v ? 'Dual control required' : 'Dual control off', body: v ? 'Tier-1 actions now need two approvers.' : 'Tier-1 actions need one approver.' }) }} />
            </li>
            <li className="flex items-start justify-between gap-4 py-3.5">
              <div>
                <p className="text-[14px]">Auto-freeze drifting agents</p>
                <p className="mt-1 text-[12.5px] leading-snug text-muted">Pause an agent when its model crosses 0.20 PSI, and queue a retrain.</p>
              </div>
              <Switch checked={settings.autoFreeze} label="Auto-freeze drifting agents" onChange={(v) => { setAutoFreeze(v); toast.show({ tone: 'info', title: v ? 'Auto-freeze armed' : 'Auto-freeze off', body: v ? 'Agents pause the moment drift crosses 0.20.' : 'Drift is still recorded but no longer pauses agents.' }) }} />
            </li>
          </ul>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel id="tiers" title="Risk tiers" meta="Applies to every model" className="animate-rise [animation-delay:140ms]">
            <div className="mt-5 overflow-x-auto">
              <div className="grid grid-cols-[74px_minmax(150px,1fr)_80px_96px] gap-x-4 border-b border-line pb-2">
                {['Tier', 'Approval', 'Evidence', 'Drift'].map((h) => (
                  <span key={h} className="caps text-[9.5px] tracking-[0.2em] text-muted">{h}</span>
                ))}
              </div>
              {TIERS.map((t) => (
                <div key={t.tier} className="grid grid-cols-[74px_minmax(150px,1fr)_80px_96px] gap-x-4 border-b border-line py-3 text-[12.5px]">
                  <span className="caps text-[10px] tracking-[0.16em]">{t.tier}</span>
                  <span className="text-muted">{t.approval}</span>
                  <span className="tnum font-mono text-muted">{t.evidence}</span>
                  <span className="text-muted">{t.drift}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">Tier is set at registration and can only be lowered by the model risk committee.</p>
          </Panel>

          <Panel id="tier1" title="Tier-1 register" meta={`${tier1.length} models`} className="animate-rise [animation-delay:200ms]">
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {tier1.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px]">{m.name}</p>
                    <p className="caps mt-0.5 text-[9px] tracking-[0.16em] text-muted">{m.owner} · {m.stage}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag tone={m.drift >= 0.2 ? 'risk' : 'neutral'} dot={false}>
                      {percent(m.drift)} drift
                    </Tag>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-muted">{agents.filter((a) => a.autonomy === 'Fully autonomous').length} agents currently hold fully autonomous authority.</p>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <Panel
          id="audit"
          title="Audit log"
          meta={`Append-only · ${decisions.length} entries today`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                {(['All', 'Awaiting'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    aria-pressed={tab === t}
                    className={cx('caps min-h-8 cursor-pointer rounded-full px-2.5 text-[9.5px] tracking-[0.18em] transition-colors', tab === t ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:text-fg')}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Pill variant="ghost" size="sm" icon={<Download strokeWidth={1.75} />} onClick={exportCsv}>
                CSV
              </Pill>
            </div>
          }
        >
          <div className="mt-5">
            <DataTable
              label="Decision audit log"
              columns={columns}
              rows={rows}
              rowKey={(d) => d.id}
              defaultSort={{ key: 'time', dir: -1 }}
              minWidth={780}
              enterDelay={80}
            />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
            In production this ledger is append-only and hash-chained; approved entries carry the approver’s identity. {count(decisions.length * 214)} decisions are retained for the current audit year.
          </p>
        </Panel>
      </div>
    </>
  )
}
