import { describe, expect, it } from 'vitest'

import { count, dayMonth, money, percent, shortDate, signed } from './format'

describe('money', () => {
  it('uses thousands below a million', () => {
    expect(money(720_000)).toBe('$720k')
    expect(money(0)).toBe('$0k')
  })

  it('uses one decimal for millions', () => {
    expect(money(1_000_000)).toBe('$1.0M')
    expect(money(4_420_000)).toBe('$4.4M')
  })
})

describe('signed', () => {
  it('marks the sign explicitly', () => {
    expect(signed(5)).toBe('+5')
    expect(signed(-6)).toBe('−6')
    expect(signed(0)).toBe('±0')
  })
})

describe('percent', () => {
  it('rounds to whole percent', () => {
    expect(percent(0.9612)).toBe('96%')
    expect(percent(0.884)).toBe('88%')
  })
})

describe('dates', () => {
  it('formats a short date with a two-digit year', () => {
    expect(shortDate('2026-11-22')).toBe('Nov 22 ’26')
  })

  it('formats a day and month without a year', () => {
    expect(dayMonth('2026-11-22')).toBe('Nov 22')
  })
})

describe('count', () => {
  it('groups thousands', () => {
    expect(count(40_218)).toBe('40,218')
    expect(count(640.4)).toBe('640')
  })
})
