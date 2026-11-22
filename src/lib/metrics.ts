import { ACCURACY_INDEX, AUTO_RATE, DECISION_VOLUME, MODELS, TODAY_STATS, VALUE_ROUTED, type Decision, type Model, type Range } from '../data'

/* Derived numbers. Nothing here mutates the seed data; every page reads these. */

export type Kpis = {
  decisions: number
  decisionsNote: string
  decisionsUp: boolean
  autoRate: number
  autoNote: string
  autoUp: boolean
  accuracy: number
  accuracyNote: string
  accuracyUp: boolean
  value: number
  valueNote: string
  valueUp: boolean
}

const idx = (range: Range) => Math.max(0, DECISION_VOLUME.length - 1 - range)

function pct(from: number, to: number) {
  if (!from) return 0
  return ((to - from) / from) * 100
}

export function kpis(range: Range): Kpis {
  const i = idx(range)
  const prevDecisions = DECISION_VOLUME[i]!
  const decisionsDelta = pct(prevDecisions, DECISION_VOLUME[DECISION_VOLUME.length - 1]!)
  const prevAuto = AUTO_RATE[i]!
  const prevAccuracy = ACCURACY_INDEX[i]!
  const prevValue = VALUE_ROUTED[i]!
  return {
    decisions: TODAY_STATS.decisions,
    decisionsNote: `${decisionsDelta >= 0 ? '+' : '−'}${Math.abs(decisionsDelta).toFixed(1)}% vs ${range}W ago`,
    decisionsUp: decisionsDelta >= 0,
    autoRate: TODAY_STATS.autoExecuted,
    autoNote: `${TODAY_STATS.autoExecuted - prevAuto >= 0 ? '+' : '−'}${Math.abs((TODAY_STATS.autoExecuted - prevAuto) * 100).toFixed(1)} pts vs ${range}W ago`,
    autoUp: TODAY_STATS.autoExecuted >= prevAuto,
    accuracy: TODAY_STATS.accuracy,
    accuracyNote: `${TODAY_STATS.accuracy - prevAccuracy >= 0 ? '+' : '−'}${Math.abs((TODAY_STATS.accuracy - prevAccuracy) * 100).toFixed(1)} pts · target 95%`,
    accuracyUp: TODAY_STATS.accuracy >= 0.95,
    value: TODAY_STATS.value,
    valueNote: `${pct(prevValue, VALUE_ROUTED[VALUE_ROUTED.length - 1]!) >= 0 ? '+' : '−'}${Math.abs(pct(prevValue, VALUE_ROUTED[VALUE_ROUTED.length - 1]!)).toFixed(1)}% weekly pace`,
    valueUp: VALUE_ROUTED[VALUE_ROUTED.length - 1]! >= prevValue,
  }
}

export function avgAccuracy(models: Model[] = MODELS.filter((m) => m.stage === 'Production')): number {
  if (!models.length) return 0
  return models.reduce((s, m) => s + m.accuracy, 0) / models.length
}

export function drifting(models: Model[] = MODELS): Model[] {
  return models.filter((m) => m.stage !== 'Archived' && m.drift >= 0.2).sort((a, b) => b.drift - a.drift)
}

export function awaiting(decisions: Decision[]): Decision[] {
  return decisions.filter((d) => d.outcome === 'Awaiting approval')
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}
