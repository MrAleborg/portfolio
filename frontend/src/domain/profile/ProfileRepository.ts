import type { Profile } from '@/domain/profile/Profile'

/** Where the owner's profile comes from. */
export interface ProfileRepository {
  get(): Promise<Profile>
}
