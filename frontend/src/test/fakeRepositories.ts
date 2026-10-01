import { fakeCertificationRepository } from '@/test/fakeCertificationRepository'
import { fakeCommitmentRepository } from '@/test/fakeCommitmentRepository'
import { fakeEducationRepository } from '@/test/fakeEducationRepository'
import { fakeHobbyRepository } from '@/test/fakeHobbyRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import { fakeProjectRepository } from '@/test/fakeProjectRepository'
import { fakeScientificCommunicationRepository } from '@/test/fakeScientificCommunicationRepository'
import { fakeSpecializationRepository } from '@/test/fakeSpecializationRepository'
import type { Repositories } from '@/ui/Repositories'

/** Repositories that answer with the test fixtures, unless overridden. */
export function fakeRepositories(overrides: Partial<Repositories> = {}) {
  return {
    profile: fakeProfileRepository(),
    project: fakeProjectRepository(),
    education: fakeEducationRepository(),
    certification: fakeCertificationRepository(),
    specialization: fakeSpecializationRepository(),
    scientificCommunication: fakeScientificCommunicationRepository(),
    commitment: fakeCommitmentRepository(),
    hobby: fakeHobbyRepository(),
    ...overrides,
  } satisfies Repositories
}
