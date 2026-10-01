import type { Credential } from '@/domain/credential/Credential'
import type { Localized } from '@/domain/i18n/Locale'
import type { Tag } from '@/domain/tag/Tag'

/** A certification, possibly part of some specializations. */
export interface Certification extends Credential {
  tags: Tag[]
  specializations: { id: number; name: Localized<string> }[]
}
