import type { EducationRepository } from '@/domain/education/EducationRepository'
import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'

/** Where each page reads its content from. */
export interface Repositories {
  profile: ProfileRepository
  education: EducationRepository
  hobby: HobbyRepository
}
