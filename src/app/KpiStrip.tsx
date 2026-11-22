import type { Kpis } from '../lib/metrics'
import type { Range } from '../data'
import { Kpi } from '../components/Kpi'
import { count, money, percent } from '../lib/format'
import { cx } from '../lib/cx'

/** The four headline numbers on the command center. */
export function KpiStrip({ k, range }: { k: Kpis; range: Range }) {
  const items = [
    { label: `Autonomous decisions · today`, value: k.decisions, format: (n: number) => count(n), note: k.decisionsNote, alert: false },
    { label: 'Auto-executed, no human', value: k.autoRate, format: (n: number) => percent(n), note: k.autoNote, alert: false },
    { label: 'Decision accuracy', value: k.accuracy, format: (n: number) => percent(n), note: k.accuracyNote, alert: !k.accuracyUp },
    { label: 'Value routed · today', value: k.value, format: (n: number) => money(n), note: k.valueNote, alert: false },
  ]
  return (
    <div className="grid grid-cols-2 border-y-2 border-rule sm:grid-cols-4" aria-label={`Key metrics over the last ${range} weeks`}>
      {items.map((item, i) => (
        <Kpi
          key={item.label}
          label={item.label}
          value={item.value}
          format={item.format}
          note={item.note}
          alert={item.alert}
          delay={i * 80}
          className={cx('border-line max-sm:py-7', i % 2 === 1 && 'border-l', i > 1 && 'max-sm:border-t', 'sm:border-l sm:first:border-l-0')}
        />
      ))}
    </div>
  )
}
