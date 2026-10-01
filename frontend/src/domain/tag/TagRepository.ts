import type { Tag } from '@/domain/tag/Tag'

/** Where the owner's tags come from. */
export interface TagRepository {
  /** Every tag: the skills, then the tools, then the methodologies, each in display order. */
  list(): Promise<Tag[]>
}
