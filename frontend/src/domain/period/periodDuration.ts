import type { Period } from '@/domain/period/Period'

/** A length of time in whole months, split into years and the months left over. */
export interface PeriodDuration {
  years: number
  /** 0 to 11. */
  months: number
}

/** The number of months from year 0 to the given month (0 for January). */
function monthIndex(year: number, month: number): number {
  return year * 12 + month
}

/**
 * How long a period lasts, counting both its first and its last month
 * (Sep 2015 to Jun 2017 is 1 year 10 months) and ignoring the day of the month.
 * An ongoing period lasts until today's month. It is never shorter than 1 month.
 */
export function periodDuration(period: Period, today: Date): PeriodDuration {
  // ISO dates are read as UTC, so the result does not depend on the time zone.
  const start = new Date(period.start)
  const end = period.end === null ? today : new Date(period.end)
  const months = Math.max(
    1,
    monthIndex(end.getUTCFullYear(), end.getUTCMonth()) -
      monthIndex(start.getUTCFullYear(), start.getUTCMonth()) +
      1,
  )

  return { years: Math.floor(months / 12), months: months % 12 }
}
