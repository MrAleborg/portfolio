import { fakeCommitmentRepository } from '@/test/fakeCommitmentRepository'
import { fakeEducationRepository } from '@/test/fakeEducationRepository'
import { fakeHobbyRepository } from '@/test/fakeHobbyRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import type { Repositories } from '@/ui/Repositories'

/** Repositories that answer with the test fixtures, unless overridden. */
export function fakeRepositories(overrides: Partial<Repositories> = {}) {
  return {
    profile: fakeProfileRepository(),
    education: fakeEducationRepository(),
    commitment: fakeCommitmentRepository(),
    hobby: fakeHobbyRepository(),
    ...overrides,
  } satisfies Repositories
}
