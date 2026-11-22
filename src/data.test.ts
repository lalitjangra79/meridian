import { describe, expect, it } from 'vitest'

import { ACCURACY_INDEX, DECISION_VOLUME, MODELS, TODAY_STATS, agentById, isoFromToday, modelById } from './data'

describe('ACCURACY_INDEX', () => {
  const production = MODELS.filter((m) => m.stage === 'Production')

  it('has one value per week, matching the other weekly series', () => {
    expect(ACCURACY_INDEX).toHaveLength(DECISION_VOLUME.length)
  })

  it('is the inference-weighted mean of the production models', () => {
    const volume = production.reduce((sum, m) => sum + m.inferences, 0)
    ACCURACY_INDEX.forEach((value, i) => {
      const expected = production.reduce((sum, m) => sum + m.accuracy13[i]! * m.inferences, 0) / volume
      expect(value).toBeCloseTo(expected, 4)
    })
  })

  it('stays inside the range of the production models', () => {
    const history = production.flatMap((m) => m.accuracy13)
    expect(Math.min(...ACCURACY_INDEX)).toBeGreaterThanOrEqual(Math.min(...history))
    expect(Math.max(...ACCURACY_INDEX)).toBeLessThanOrEqual(Math.max(...history))
  })
})

describe('TODAY_STATS', () => {
  it('reports the same accuracy as the last index point', () => {
    expect(TODAY_STATS.accuracy).toBe(ACCURACY_INDEX[ACCURACY_INDEX.length - 1])
  })

  it('counts the production models', () => {
    expect(TODAY_STATS.modelsInProduction).toBe(MODELS.filter((m) => m.stage === 'Production').length)
  })
})

describe('lookups', () => {
  it('finds records by id', () => {
    expect(modelById('mdl-churn')?.name).toBe('Churn propensity')
    expect(agentById('ag-fraud')?.name).toBe('Fraud containment')
    expect(modelById('mdl-nope')).toBeUndefined()
  })

  it('offsets dates from the seeded today', () => {
    expect(isoFromToday(0)).toBe('2026-11-22')
    expect(isoFromToday(-7)).toBe('2026-11-15')
  })
})
