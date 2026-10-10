import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Tag } from '@/domain/tag/Tag'

/** Signature stub for the red step: the behavior comes with the green step. */
export function experienceTags(experience: ProfessionalExperience, max: number): Tag[] {
  throw new Error(`experienceTags not implemented (${experience.id}, ${max})`)
}
