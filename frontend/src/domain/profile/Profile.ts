import type { Localized } from '@/domain/i18n/Locale'

export interface Profile {
  fullName: string
  headline: Localized<string>
  bio: Localized<string>
}
