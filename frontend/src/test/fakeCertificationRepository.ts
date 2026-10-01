import type { Certification } from '@/domain/certification/Certification'
import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import { resolving } from '@/test/fakeList'

/** A certification with every field filled in. */
export const cloudPractitioner: Certification = {
  id: 1,
  name: { en: 'Cloud Practitioner', fr: 'Praticien du cloud' },
  issuer: 'Amazon',
  issueDate: '2023-05-15',
  expirationDate: '2026-05-15',
  credentialUrl: 'https://example.com/cloud',
  description: { en: 'Covers the basics.', fr: 'Couvre les bases.' },
  tags: [
    { id: 1, name: { en: 'Cloud', fr: 'Cloud' }, kind: 'skill' },
    { id: 2, name: { en: 'Terraform', fr: 'Terraform' }, kind: 'tool' },
  ],
  specializations: [{ id: 10, name: { en: 'Cloud engineering', fr: 'Ingénierie cloud' } }],
}

/** A certification that never expires, without any optional field. */
export const scrumMaster: Certification = {
  id: 2,
  name: { en: 'Scrum Master', fr: 'Scrum Master' },
  issuer: 'Scrum.org',
  issueDate: '2022-10-01',
  expirationDate: null,
  credentialUrl: '',
  description: { en: '', fr: '' },
  tags: [],
  specializations: [],
}

/** A repository that answers with the given entries. */
export function fakeCertificationRepository(
  entries: Certification[] = [cloudPractitioner, scrumMaster],
) {
  return { list: resolving(entries) } satisfies CertificationRepository
}
