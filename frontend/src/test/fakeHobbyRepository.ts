import type { Hobby } from '@/domain/hobby/Hobby'
import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import { resolving } from '@/test/fakeList'

/** A hobby with a description in every language. */
export const climbing: Hobby = {
  id: 1,
  name: { en: 'Climbing', fr: 'Escalade' },
  description: {
    en: 'Bouldering twice a week.',
    fr: 'De la bloc deux fois par semaine.',
  },
}

/** A hobby without a description. */
export const chess: Hobby = {
  id: 2,
  name: { en: 'Chess', fr: 'Échecs' },
  description: { en: '', fr: '' },
}

/** A repository that answers with the given entries. */
export function fakeHobbyRepository(entries: Hobby[] = [climbing, chess]) {
  return { list: resolving(entries) } satisfies HobbyRepository
}
