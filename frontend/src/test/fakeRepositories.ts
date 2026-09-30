import { fakeEducationRepository } from '@/test/fakeEducationRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import type { Repositories } from '@/ui/Repositories'

/** Repositories that answer with the test fixtures, unless overridden. */
export function fakeRepositories(overrides: Partial<Repositories> = {}) {
  return {
    profile: fakeProfileRepository(),
    education: fakeEducationRepository(),
    ...overrides,
  } satisfies Repositories
}
