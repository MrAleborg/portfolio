import type { Localized } from '@/domain/i18n/Locale'

/** A tag as the API sends it. */
export interface TagDto {
  id: number
  name: Localized<string>
  kind: 'skill' | 'tool' | 'methodology'
}

/** A link to another entry, by id and name. */
export interface ReferenceDto {
  id: number
  name: Localized<string>
}
