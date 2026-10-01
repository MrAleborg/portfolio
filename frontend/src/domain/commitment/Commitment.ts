import type { Localized } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'

export type CommitmentKind = 'association' | 'conference_organization' | 'other_event'

/** A voluntary role. Optional texts are empty in every language; the url is empty when absent. */
export interface Commitment {
  id: number
  kind: CommitmentKind
  organization: string
  role: Localized<string>
  location: Localized<string>
  url: string
  period: Period
  description: Localized<string>
}
