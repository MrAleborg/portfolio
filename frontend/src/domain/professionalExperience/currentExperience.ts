import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

/** The first ongoing experience (no end date) in the given order, if any. */
export function currentExperience(
  experiences: ProfessionalExperience[],
): ProfessionalExperience | undefined {
  return experiences.find((experience) => experience.period.end === null)
}
