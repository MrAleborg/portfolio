import type { Localized } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'

/** A degree or school. Optional texts are empty in every language. */
export interface Education {
  id: number
  institution: string
  degree: Localized<string>
  fieldOfStudy: Localized<string>
  grade: Localized<string>
  location: Localized<string>
  period: Period
  description: Localized<string>
}
