import type { Localized } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'
import type { Project } from '@/domain/project/Project'

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'freelance'
  | 'internship'
  | 'apprenticeship'

/** A job and the projects done in it. Optional texts are empty in every language; the url is empty when absent. */
export interface ProfessionalExperience {
  id: number
  company: string
  position: Localized<string>
  employmentType: EmploymentType
  companyUrl: string
  location: Localized<string>
  period: Period
  description: Localized<string>
  projects: Project[]
}
