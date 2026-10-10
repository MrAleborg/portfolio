import type { Profile } from '@/domain/profile/Profile'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'

export const ada: Profile = {
  fullName: 'Ada Lovelace',
  headline: { en: 'Analyst', fr: 'Analyste' },
  bio: { en: 'I write programs.', fr: 'J’écris des programmes.' },
  desiredRole: { en: 'Engineer', fr: 'Ingénieure' },
}

/** A repository that answers with the given profile. */
export function fakeProfileRepository(profile: Profile = ada) {
  return { get: vi.fn(() => Promise.resolve(profile)) } satisfies ProfileRepository
}

/** A repository whose request fails. */
export function failingProfileRepository() {
  return {
    get: vi.fn(() => Promise.reject(new Error('Network error'))),
  } satisfies ProfileRepository
}

/** A repository whose request never answers. */
export function pendingProfileRepository() {
  return { get: vi.fn(() => new Promise<Profile>(() => {})) } satisfies ProfileRepository
}
