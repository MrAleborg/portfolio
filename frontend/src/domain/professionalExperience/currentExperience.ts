import { monthIndex } from '@/domain/period/monthIndex'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

/**
 * The first ongoing experience (no end date) in the given order, if any.
 * One starting after the month of today is not current yet.
 */
export function currentExperience(
  experiences: ProfessionalExperience[],
  today: Date,
): ProfessionalExperience | undefined {
  // ISO dates are read as UTC, so the result does not depend on the time zone.
  const thisMonth = monthIndex(today.getUTCFullYear(), today.getUTCMonth())
  return experiences.find((experience) => {
    if (experience.period.end !== null) return false
    const start = new Date(experience.period.start)
    return monthIndex(start.getUTCFullYear(), start.getUTCMonth()) <= thisMonth
  })
}
