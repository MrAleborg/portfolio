import type { Credential } from '@/domain/credential/Credential'
import type { Localized } from '@/domain/i18n/Locale'

/** A specialization, made of certifications. */
export interface Specialization extends Credential {
  certifications: { id: number; name: Localized<string> }[]
}
