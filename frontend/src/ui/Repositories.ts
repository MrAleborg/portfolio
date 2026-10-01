import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import type { CommitmentRepository } from '@/domain/commitment/CommitmentRepository'
import type { EducationRepository } from '@/domain/education/EducationRepository'
import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import type { ScientificCommunicationRepository } from '@/domain/scientificCommunication/ScientificCommunicationRepository'

/** Where each page reads its content from. */
export interface Repositories {
  profile: ProfileRepository
  education: EducationRepository
  certification: CertificationRepository
  scientificCommunication: ScientificCommunicationRepository
  commitment: CommitmentRepository
  hobby: HobbyRepository
}
