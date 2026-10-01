import type { Hobby } from '@/domain/hobby/Hobby'

/** Where the owner's hobbies come from. */
export interface HobbyRepository {
  /** The visible entries, in display order. */
  list(): Promise<Hobby[]>
}
