import type { Localized } from '@/domain/i18n/Locale'

export type TagKind = 'skill' | 'tool' | 'methodology'

/** A keyword attached to an entry. */
export interface Tag {
  id: number
  name: Localized<string>
  kind: TagKind
}
