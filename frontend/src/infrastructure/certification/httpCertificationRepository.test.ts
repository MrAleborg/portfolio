import { createHttpCertificationRepository } from '@/infrastructure/certification/httpCertificationRepository'
import { respondWith } from '@/test/respondWith'

const cloud = {
  id: 1,
  name: { en: 'Cloud Practitioner', fr: 'Praticien du cloud' },
  issuer: 'Amazon',
  issue_date: '2023-05-15',
  expiration_date: '2026-05-15',
  credential_url: 'https://example.com/cloud',
  description: { en: 'Covers the basics.', fr: 'Couvre les bases.' },
  tags: [
    { id: 1, name: { en: 'Cloud', fr: 'Cloud' }, kind: 'skill' },
    { id: 2, name: { en: 'Terraform', fr: 'Terraform' }, kind: 'tool' },
  ],
  specializations: [{ id: 10, name: { en: 'Cloud engineering', fr: 'Ingénierie cloud' } }],
}

const scrum = {
  id: 2,
  name: { en: 'Scrum Master', fr: 'Scrum Master' },
  issuer: 'Scrum.org',
  issue_date: '2022-10-01',
  expiration_date: null,
  credential_url: '',
  description: { en: '', fr: '' },
  tags: [],
  specializations: [],
}

describe('httpCertificationRepository', () => {
  it('requests the certifications endpoint', async () => {
    const fetchFn = respondWith(200, [cloud, scrum])

    await createHttpCertificationRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/certifications/',
    )
  })

  it('turns the response into certifications, in the same order', async () => {
    const repository = createHttpCertificationRepository(
      'https://api.example.com',
      respondWith(200, [cloud, scrum]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
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
        specializations: [
          { id: 10, name: { en: 'Cloud engineering', fr: 'Ingénierie cloud' } },
        ],
      },
      {
        id: 2,
        name: { en: 'Scrum Master', fr: 'Scrum Master' },
        issuer: 'Scrum.org',
        issueDate: '2022-10-01',
        expirationDate: null,
        credentialUrl: '',
        description: { en: '', fr: '' },
        tags: [],
        specializations: [],
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpCertificationRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
