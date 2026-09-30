import type { ProfileRepository } from '@/domain/profile/ProfileRepository'

/** Where each page reads its content from. */
export interface Repositories {
  profile: ProfileRepository
}
