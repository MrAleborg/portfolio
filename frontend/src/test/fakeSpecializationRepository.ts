import type { Specialization } from '@/domain/specialization/Specialization'
import type { SpecializationRepository } from '@/domain/specialization/SpecializationRepository'
import { resolving } from '@/test/fakeList'

/** A specialization with every field filled in. */
export const cloudEngineering: Specialization = {
  id: 10,
  name: { en: 'Cloud engineering', fr: 'Ingénierie cloud' },
  issuer: 'Coursera',
  issueDate: '2024-02-10',
  expirationDate: '2027-02-10',
  credentialUrl: 'https://example.com/cloud-engineering',
  description: { en: 'Four courses on the cloud.', fr: 'Quatre cours sur le cloud.' },
  certifications: [
    { id: 1, name: { en: 'Cloud Practitioner', fr: 'Praticien du cloud' } },
    { id: 3, name: { en: 'Solutions Architect', fr: 'Architecte de solutions' } },
  ],
}

/** A specialization that never expires, without any optional field. */
export const agileDelivery: Specialization = {
  id: 11,
  name: { en: 'Agile delivery', fr: 'Delivery agile' },
  issuer: 'Scrum.org',
  issueDate: '2022-11-01',
  expirationDate: null,
  credentialUrl: '',
  description: { en: '', fr: '' },
  certifications: [],
}

/** A repository that answers with the given entries. */
export function fakeSpecializationRepository(
  entries: Specialization[] = [cloudEngineering, agileDelivery],
) {
  return { list: resolving(entries) } satisfies SpecializationRepository
}
