import type { ScientificCommunication } from '@/domain/scientificCommunication/ScientificCommunication'
import type { ScientificCommunicationRepository } from '@/domain/scientificCommunication/ScientificCommunicationRepository'
import { resolving } from '@/test/fakeList'

/** A talk with every field filled in. */
export const fullCommunication: ScientificCommunication = {
  id: 1,
  kind: 'talk',
  title: { en: 'Fast compilers', fr: 'Compilateurs rapides' },
  authors: 'A. Le Borgne, J. Doe',
  venue: 'ICFP',
  date: '2023-05-15',
  url: 'https://example.com/fast-compilers',
}

/** A poster without authors or link. */
export const minimalCommunication: ScientificCommunication = {
  id: 2,
  kind: 'poster',
  title: { en: 'Slow compilers', fr: 'Compilateurs lents' },
  authors: '',
  venue: 'SPLASH',
  date: '2022-10-01',
  url: '',
}

/** A repository that answers with the given entries. */
export function fakeScientificCommunicationRepository(
  entries: ScientificCommunication[] = [fullCommunication, minimalCommunication],
) {
  return { list: resolving(entries) } satisfies ScientificCommunicationRepository
}
