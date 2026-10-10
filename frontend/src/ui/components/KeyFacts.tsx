import type { Localized } from '@/domain/i18n/Locale'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'

interface KeyFactsProps {
  experiences: ProfessionalExperience[]
  /** Empty in every language when unset. */
  desiredRole: Localized<string>
  /** Defaults to now. */
  today?: Date
}

/** Skeleton for the red gate: behavior comes in the green step. */
export function KeyFacts(props: KeyFactsProps) {
  void props
  return null
}
