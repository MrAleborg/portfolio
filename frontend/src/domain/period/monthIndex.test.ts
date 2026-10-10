import { monthIndex } from '@/domain/period/monthIndex'

describe('monthIndex', () => {
  it('numbers consecutive months of a year one apart', () => {
    expect(monthIndex(2026, 9) - monthIndex(2026, 8)).toBe(1)
  })

  it('numbers December and the following January one apart', () => {
    expect(monthIndex(2027, 0) - monthIndex(2026, 11)).toBe(1)
  })

  it('numbers the same month of consecutive years twelve apart', () => {
    expect(monthIndex(2027, 4) - monthIndex(2026, 4)).toBe(12)
  })
})
