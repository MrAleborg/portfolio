import type { Localized } from '@/domain/i18n/Locale'
import type { Tag } from '@/domain/tag/Tag'

export interface Profile {
  fullName: string
  headline: Localized<string>
  bio: Localized<string>
  /** The role the owner is looking for. Empty in every language when unset. */
  desiredRole: Localized<string>
  /** The tags the owner chose to show as their main stack, in display order. Empty when none is chosen. */
  mainStack: Tag[]
}
