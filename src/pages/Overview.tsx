import { AgentPulse } from '../app/AgentPulse'
import { DecisionStream } from '../app/DecisionStream'
import { DriftWatch } from '../app/DriftWatch'
import { KpiStrip } from '../app/KpiStrip'
import { SignalList } from '../app/SignalList'
import { Panel } from '../components/Panel'
import { WeeklyChart } from '../components/WeeklyChart'
import { ACCURACY_INDEX, DECISION_VOLUME, INSIGHTS } from '../data'
import { count, money, percent } from '../lib/format'
import { kpis } from '../lib/metrics'
import { useStore } from '../lib/store'

export function Overview() {
  const { models, agents, decisions, range } = useStore()
  const k = kpis(range)
  const weekly = DECISION_VOLUME[DECISION_VOLUME.length - 1]!
  const accuracy = ACCURACY_INDEX[ACCURACY_INDEX.length - 1]!
  const accDomain: [number, number] = [
    Math.floor((Math.min(...ACCURACY_INDEX) - 0.005) * 100) / 100,
    Math.ceil((Math.max(...ACCURACY_INDEX) + 0.005) * 100) / 100,
  ]

  return (
    <>
      <h2 className="sr-only" tabIndex={-1} data-page-title>
        Command center
      </h2>

      <div className="mt-6 sm:mt-7">
        <KpiStrip k={k} range={range} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] sm:mt-10">
        <DecisionStream decisions={decisions} />
        <div className="grid content-start gap-6">
          <AgentPulse agents={agents} />
          <DriftWatch models={models} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel id="throughput" title="Decision throughput" meta="Weekly · 13 weeks">
          <div className="mt-6">
            <WeeklyChart values={DECISION_VOLUME} kind="bars" label="Autonomous decisions per week" format={count} height={190} range={range} />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
            <span className="tnum font-mono text-fg">{count(weekly)}</span> decisions last week, {money(k.value)} of value routed today. Volume is the sum over all eight agents.
          </p>
        </Panel>

        <Panel id="accuracy" title="Accuracy index" meta="Production models">
          <div className="mt-6">
            <WeeklyChart values={ACCURACY_INDEX} kind="line" label="Held-out accuracy across production models" domain={accDomain} format={(v) => `${(v * 100).toFixed(0)}%`} height={190} range={range} />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
            Blended held-out accuracy is <span className="tnum font-mono text-fg">{percent(accuracy)}</span>. Tier-1 models must stay above 95% to act without a human.
          </p>
        </Panel>
      </div>

      <div className="mt-6">
        <SignalList insights={INSIGHTS} />
      </div>
    </>
  )
}
