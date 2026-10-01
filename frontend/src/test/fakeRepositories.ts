import { fakeCertificationRepository } from '@/test/fakeCertificationRepository'
import { fakeCommitmentRepository } from '@/test/fakeCommitmentRepository'
import { fakeEducationRepository } from '@/test/fakeEducationRepository'
import { fakeHobbyRepository } from '@/test/fakeHobbyRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import { fakeScientificCommunicationRepository } from '@/test/fakeScientificCommunicationRepository'
import type { Repositories } from '@/ui/Repositories'

/** Repositories that answer with the test fixtures, unless overridden. */
export function fakeRepositories(overrides: Partial<Repositories> = {}) {
  return {
    profile: fakeProfileRepository(),
    education: fakeEducationRepository(),
    certification: fakeCertificationRepository(),
    scientificCommunication: fakeScientificCommunicationRepository(),
    commitment: fakeCommitmentRepository(),
    hobby: fakeHobbyRepository(),
    ...overrides,
  } satisfies Repositories
}
