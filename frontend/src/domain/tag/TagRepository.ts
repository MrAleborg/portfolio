import type { Domain } from '@/domain/tag/TagCategory'

/** Where the owner's tags come from. */
export interface TagRepository {
  /** The tag tree: the domains in display order, each with its categories, each with its tags. */
  list(): Promise<Domain[]>
}
