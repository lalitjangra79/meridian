import { describe, expect, it } from 'vitest'

import { ACCURACY_INDEX, DECISIONS, MODELS, TODAY_STATS } from '../data'
import { avgAccuracy, awaiting, drifting, kpis, median } from './metrics'

describe('kpis', () => {
  it('reports today’s totals', () => {
    const k = kpis(13)
    expect(k.decisions).toBe(TODAY_STATS.decisions)
    expect(k.autoRate).toBe(TODAY_STATS.autoExecuted)
    expect(k.value).toBe(TODAY_STATS.value)
  })

  it('compares accuracy against the start of the range', () => {
    const k = kpis(4)
    const prev = ACCURACY_INDEX[ACCURACY_INDEX.length - 1 - 4]!
    expect(k.accuracy).toBe(ACCURACY_INDEX[ACCURACY_INDEX.length - 1])
    expect(k.accuracyNote).toContain(`${Math.abs((TODAY_STATS.accuracy - prev) * 100).toFixed(1)} pts`)
    expect(k.accuracyNote).toContain('target 95%')
  })

  it('narrows the comparison window with the range', () => {
    const note13 = kpis(13).decisionsNote
    const note4 = kpis(4).decisionsNote
    expect(note13.endsWith('vs 13W ago')).toBe(true)
    expect(note4.endsWith('vs 4W ago')).toBe(true)
    expect(note13).not.toBe(note4)
  })
})

describe('avgAccuracy', () => {
  it('averages the production models by default', () => {
    const production = MODELS.filter((m) => m.stage === 'Production')
    const expected = production.reduce((s, m) => s + m.accuracy, 0) / production.length
    expect(avgAccuracy()).toBeCloseTo(expected, 10)
  })

  it('accepts an explicit model list', () => {
    const two = MODELS.slice(0, 2)
    expect(avgAccuracy(two)).toBeCloseTo((two[0]!.accuracy + two[1]!.accuracy) / 2, 10)
  })

  it('returns zero for an empty list', () => {
    expect(avgAccuracy([])).toBe(0)
  })
})

describe('drifting', () => {
  it('returns live models above the policy threshold, worst first', () => {
    expect(drifting().map((m) => m.id)).toEqual(['mdl-pricing', 'mdl-demand'])
  })

  it('ignores archived models', () => {
    expect(drifting().some((m) => m.stage === 'Archived')).toBe(false)
  })
})

describe('awaiting', () => {
  it('keeps only decisions waiting on a human', () => {
    const list = awaiting(DECISIONS)
    expect(list).toHaveLength(DECISIONS.filter((d) => d.outcome === 'Awaiting approval').length)
    expect(list.every((d) => d.outcome === 'Awaiting approval')).toBe(true)
  })
})

describe('median', () => {
  it('handles odd and even lengths', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBe(0)
  })
})
