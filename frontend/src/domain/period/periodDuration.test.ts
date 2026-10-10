import { periodDuration } from '@/domain/period/periodDuration'

const OCTOBER_2026 = new Date('2026-10-10T12:00:00Z')

describe('periodDuration', () => {
  it('counts both end months, so Sep 2015 to Jun 2017 is 1 year 10 months', () => {
    const duration = periodDuration(
      { start: '2015-09-01', end: '2017-06-30' },
      OCTOBER_2026,
    )

    expect(duration).toEqual({ years: 1, months: 10 })
  })

  it('counts a calendar year as exactly 1 year', () => {
    const duration = periodDuration(
      { start: '2020-01-01', end: '2020-12-31' },
      OCTOBER_2026,
    )

    expect(duration).toEqual({ years: 1, months: 0 })
  })

  it('counts a period within a single month as 1 month', () => {
    const duration = periodDuration(
      { start: '2021-03-05', end: '2021-03-20' },
      OCTOBER_2026,
    )

    expect(duration).toEqual({ years: 0, months: 1 })
  })

  it('counts an ongoing period up to the month of today', () => {
    const duration = periodDuration(
      { start: '2024-06-01', end: null },
      OCTOBER_2026,
    )

    expect(duration).toEqual({ years: 2, months: 5 })
  })

  it('ignores the day of the month', () => {
    const firstOfTheMonths = periodDuration(
      { start: '2018-02-01', end: '2018-07-01' },
      OCTOBER_2026,
    )
    const endOfTheMonths = periodDuration(
      { start: '2018-02-28', end: '2018-07-31' },
      OCTOBER_2026,
    )

    expect(firstOfTheMonths).toEqual({ years: 0, months: 6 })
    expect(endOfTheMonths).toEqual({ years: 0, months: 6 })
  })

  it('does not depend on the time zone: shortly after midnight UTC on the 1st still counts that month', () => {
    const duration = periodDuration(
      { start: '2026-09-01', end: null },
      new Date('2026-10-01T00:30:00Z'),
    )

    expect(duration).toEqual({ years: 0, months: 2 })
  })

  it('counts at least 1 month when the period starts after today', () => {
    const duration = periodDuration(
      { start: '2027-01-01', end: null },
      OCTOBER_2026,
    )

    expect(duration).toEqual({ years: 0, months: 1 })
  })
})
