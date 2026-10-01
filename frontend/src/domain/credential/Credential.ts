import type { Localized } from '@/domain/i18n/Locale'

/** A diploma-like proof issued by an organization. The url is empty and the description empty in every language when absent. */
export interface Credential {
  id: number
  name: Localized<string>
  issuer: string
  /** An ISO date (YYYY-MM-DD). */
  issueDate: string
  /** null when it never expires. */
  expirationDate: string | null
  credentialUrl: string
  description: Localized<string>
}
