import { fakeCertificationRepository } from '@/test/fakeCertificationRepository'
import { fakeCommitmentRepository } from '@/test/fakeCommitmentRepository'
import { fakeContactRepository } from '@/test/fakeContactRepository'
import { fakeEducationRepository } from '@/test/fakeEducationRepository'
import { fakeHobbyRepository } from '@/test/fakeHobbyRepository'
import { fakeProfessionalExperienceRepository } from '@/test/fakeProfessionalExperienceRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import { fakeProjectRepository } from '@/test/fakeProjectRepository'
import { fakeScientificCommunicationRepository } from '@/test/fakeScientificCommunicationRepository'
import { fakeSpecializationRepository } from '@/test/fakeSpecializationRepository'
import { fakeTagRepository } from '@/test/fakeTagRepository'
import type { Repositories } from '@/ui/Repositories'

/** Repositories that answer with the test fixtures, unless overridden. */
export function fakeRepositories(overrides: Partial<Repositories> = {}) {
  return {
    profile: fakeProfileRepository(),
    tag: fakeTagRepository(),
    experience: fakeProfessionalExperienceRepository(),
    project: fakeProjectRepository(),
    education: fakeEducationRepository(),
    certification: fakeCertificationRepository(),
    specialization: fakeSpecializationRepository(),
    scientificCommunication: fakeScientificCommunicationRepository(),
    commitment: fakeCommitmentRepository(),
    hobby: fakeHobbyRepository(),
    contact: fakeContactRepository(),
    ...overrides,
  } satisfies Repositories
}
