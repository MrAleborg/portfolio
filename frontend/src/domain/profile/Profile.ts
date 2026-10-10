import type { Localized } from '@/domain/i18n/Locale'

export interface Profile {
  fullName: string
  headline: Localized<string>
  bio: Localized<string>
  /** The role the owner is looking for. Empty in every language when unset. */
  desiredRole: Localized<string>
}
