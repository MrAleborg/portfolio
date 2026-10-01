import type { Localized } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'
import type { Tag } from '@/domain/tag/Tag'

/** Work done on its own or as part of a job. Lists are empty and the description empty in every language when absent. */
export interface Project {
  id: number
  title: Localized<string>
  period: Period
  description: Localized<string>
  achievements: Localized<string>[]
  missions: Localized<string>[]
  tags: Tag[]
}
