import { ShieldCheck } from 'lucide-react'

import { PageHeader } from '../components/PageHeader'
import { Pill } from '../components/Pill'
import { Stat } from '../components/Stat'
import { Switch } from '../components/Field'
import { Chip, Tag } from '../components/Tag'
import { useToast } from '../components/Toast'
import { AUTONOMY, type AutonomyLevel } from '../data'
import { cx } from '../lib/cx'
import { count, money, percent } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore, type LiveAgent } from '../lib/store'

const SHORT: Record<AutonomyLevel, string> = {
  Observe: 'Observe',
  Recommend: 'Recommend',
  'Act with approval': 'Approve',
  'Fully autonomous': 'Autonomous',
}

const LADDER: Array<{ level: AutonomyLevel; hint: string }> = [
  { level: 'Observe', hint: 'Reads signals, writes nothing' },
  { level: 'Recommend', hint: 'Proposes actions to a person' },
  { level: 'Act with approval', hint: 'Executes once approved' },
  { level: 'Fully autonomous', hint: 'Acts inside its guardrails' },
]

function AgentCard({ agent }: { agent: LiveAgent }) {
  const { setAutonomy, toggleAgent, settings } = useStore()
  const toast = useToast()

  const change = (level: AutonomyLevel) => {
    if (level === agent.autonomy) return
    setAutonomy(agent.id, level)
    const body =
      level === 'Fully autonomous'
        ? `Acts inside its guardrails; spend above ${money(settings.approvalLimit)} still waits for a human.`
        : level === 'Act with approval'
          ? 'Every action is drafted and queued for a person to approve.'
          : level === 'Recommend'
            ? 'The agent proposes actions and executes none of them.'
            : 'Signals and recommendations only — no actions.'
    toast.show({ tone: level === 'Fully autonomous' ? 'success' : 'info', title: `${agent.name} · ${level}`, body })
  }

  return (
    <article className="flex animate-rise flex-col rounded-[2px] bg-panel p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[22px] leading-tight">{agent.name}</h3>
          <p className="caps mt-1.5 text-[9.5px] tracking-[0.18em] text-muted">
            {agent.domain} <span className="text-faint">/</span> {agent.modelIds.length} {agent.modelIds.length === 1 ? 'model' : 'models'}
          </p>
        </div>
        <Tag tone={agent.paused ? 'neutral' : 'ok'} pulse={!agent.paused}>
          {agent.paused ? 'Paused' : 'Live'}
        </Tag>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-muted">{agent.description}</p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-3">
        {[
          ['Actions today', count(agent.actionsToday)],
          ['Success', percent(agent.successRate)],
          ['Escalated', String(agent.escalations)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="caps text-[9px] tracking-[0.16em] text-muted">{label}</dt>
            <dd className="tnum mt-1 font-mono text-[15px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <p className="caps text-[9px] tracking-[0.18em] text-faint">Last action</p>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">{agent.lastAction}</p>
      </div>

      <div className="mt-auto pt-5">
        <p className="caps text-[9.5px] tracking-[0.2em] text-muted">Autonomy</p>
        <div role="radiogroup" aria-label={`Autonomy level for ${agent.name}`} className="mt-2 grid grid-cols-4 overflow-hidden rounded-[3px] border border-line">
          {AUTONOMY.map((level, i) => {
            const active = level === agent.autonomy
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => change(level)}
                className={cx(
                  'caps min-h-10 cursor-pointer px-1 py-2 text-[8.5px] tracking-[0.12em] transition-colors sm:text-[9px] sm:tracking-[0.16em]',
                  i > 0 && 'border-l border-line',
                  active ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
                )}
              >
                {SHORT[level]}
              </button>
            )
          })}
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {agent.guardrails.slice(0, 2).map((g) => (
            <Chip key={g} className="normal-case tracking-normal">{g}</Chip>
          ))}
          {agent.guardrails.length > 2 && <Chip>+{agent.guardrails.length - 2}</Chip>}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-2">
          <span className="caps text-[9px] tracking-[0.16em] text-muted">{agent.paused ? 'Not acting' : 'Acting within guardrails'}</span>
          <Switch
            checked={!agent.paused}
            label={`${agent.paused ? 'Resume' : 'Pause'} ${agent.name}`}
            onChange={() => {
              toggleAgent(agent.id)
              toast.show({ tone: agent.paused ? 'success' : 'info', title: agent.paused ? `${agent.name} resumed` : `${agent.name} paused`, body: agent.paused ? 'Queued actions resume immediately.' : 'No new actions will be taken until resumed.' })
            }}
          />
        </div>
      </div>
    </article>
  )
}

export function Agents() {
  const { agents, decisions } = useStore()
  const live = agents.filter((a) => !a.paused)
  const autonomous = agents.filter((a) => a.autonomy === 'Fully autonomous' && !a.paused)
  const actions = agents.reduce((s, a) => s + a.actionsToday, 0)
  const escalations = agents.reduce((s, a) => s + a.escalations, 0)

  return (
    <>
      <PageHeader
        eyebrow="Autonomy console · granted, not assumed"
        title="Agents"
        lede="Autonomy is a dial per agent, bounded by policy. Raising it changes what executes without a person; lowering it is immediate. Every action lands in the audit log."
        actions={
          <Pill variant="solid" onClick={() => navigate('/governance')}>
            Execution policy
          </Pill>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="Agents">{agents.length}</Stat>
        <Stat label="Fully autonomous">{autonomous.length}</Stat>
        <Stat label="Actions today">{count(actions)}</Stat>
        <Stat label="Escalations / action">{percent(escalations / Math.max(1, actions))}</Stat>
      </dl>

      <div className="mt-7 grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-4">
        {LADDER.map((step, i) => (
          <div key={step.level} className="bg-bg px-4 py-4">
            <p className="caps text-[9px] tracking-[0.2em] text-faint">0{i + 1}</p>
            <p className="mt-1.5 font-serif text-[17px] leading-tight">{step.level}</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">{step.hint}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
        <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {decisions.filter((d) => d.outcome === 'Awaiting approval').length} decisions are waiting on a person right now.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-muted">{live.length} agents are live. Autonomy settings and pauses are saved in this browser.</p>
    </>
  )
}
