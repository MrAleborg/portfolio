import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

/** The first ongoing experience (no end date) in the given order, if any. */
export function currentExperience(
  experiences: ProfessionalExperience[],
  today: Date,
): ProfessionalExperience | undefined {
  void today // Skeleton for the red gate: used in the green step.
  return experiences.find((experience) => experience.period.end === null)
}
