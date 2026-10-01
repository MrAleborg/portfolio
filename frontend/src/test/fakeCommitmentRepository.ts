import type { Commitment } from '@/domain/commitment/Commitment'
import type { CommitmentRepository } from '@/domain/commitment/CommitmentRepository'
import { resolving } from '@/test/fakeList'

/** A finished commitment with every field filled in. */
export const fullCommitment: Commitment = {
  id: 1,
  kind: 'association',
  organization: 'Rennes Open Data',
  role: { en: 'Treasurer', fr: 'Trésorier' },
  location: { en: 'Brittany', fr: 'Bretagne' },
  url: 'https://example.com/open-data',
  period: { start: '2019-01-01', end: '2021-12-31' },
  description: {
    en: 'Kept the books.',
    fr: 'Tenue des comptes.',
  },
}

/** An ongoing commitment without any optional field. */
export const minimalCommitment: Commitment = {
  id: 2,
  kind: 'other_event',
  organization: 'Hackathon Ouest',
  role: { en: 'Mentor', fr: 'Mentor' },
  location: { en: '', fr: '' },
  url: '',
  period: { start: '2023-05-01', end: null },
  description: { en: '', fr: '' },
}

/** A repository that answers with the given entries. */
export function fakeCommitmentRepository(
  entries: Commitment[] = [fullCommitment, minimalCommitment],
) {
  return { list: resolving(entries) } satisfies CommitmentRepository
}
