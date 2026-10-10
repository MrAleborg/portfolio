import { monthIndex } from '@/domain/period/monthIndex'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

/**
 * The number of distinct calendar months covered by the experiences' periods, counting both
 * end months and ignoring the day of the month. Overlapping periods count once and gaps
 * between jobs not at all. Internships are left out (apprenticeships count). An ongoing
 * period runs to today's month, and no month after today is counted: a period starting
 * after today's month adds nothing (unlike periodDuration, which never goes below 1 month).
 */
export function experienceMonths(experiences: ProfessionalExperience[], today: Date): number {
  // ISO dates are read as UTC, so the result does not depend on the time zone.
  const lastMonth = monthIndex(today.getUTCFullYear(), today.getUTCMonth())
  const covered = new Set<number>()
  for (const { employmentType, period } of experiences) {
    if (employmentType === 'internship') continue
    const start = new Date(period.start)
    const end = period.end === null ? today : new Date(period.end)
    const endMonth = Math.min(monthIndex(end.getUTCFullYear(), end.getUTCMonth()), lastMonth)
    for (
      let month = monthIndex(start.getUTCFullYear(), start.getUTCMonth());
      month <= endMonth;
      month++
    ) {
      covered.add(month)
    }
  }
  return covered.size
}
