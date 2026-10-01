import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

/** Where the owner's professional experience comes from. */
export interface ProfessionalExperienceRepository {
  /** The visible entries, in display order. */
  list(): Promise<ProfessionalExperience[]>
}
