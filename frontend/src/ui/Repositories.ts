import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import type { CommitmentRepository } from '@/domain/commitment/CommitmentRepository'
import type { EducationRepository } from '@/domain/education/EducationRepository'
import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import type { ProjectRepository } from '@/domain/project/ProjectRepository'
import type { ScientificCommunicationRepository } from '@/domain/scientificCommunication/ScientificCommunicationRepository'
import type { SpecializationRepository } from '@/domain/specialization/SpecializationRepository'

/** Where each page reads its content from. */
export interface Repositories {
  profile: ProfileRepository
  experience: ProfessionalExperienceRepository
  project: ProjectRepository
  education: EducationRepository
  certification: CertificationRepository
  specialization: SpecializationRepository
  scientificCommunication: ScientificCommunicationRepository
  commitment: CommitmentRepository
  hobby: HobbyRepository
}
