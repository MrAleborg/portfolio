import type { Localized } from '@/domain/i18n/Locale'

/** A pastime. The description is empty in every language when absent. */
export interface Hobby {
  id: number
  name: Localized<string>
  description: Localized<string>
}
