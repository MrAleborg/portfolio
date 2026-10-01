import { createHttpSpecializationRepository } from '@/infrastructure/specialization/httpSpecializationRepository'
import { respondWith } from '@/test/respondWith'

const cloud = {
  id: 10,
  name: { en: 'Cloud engineering', fr: 'Ingénierie cloud' },
  issuer: 'Coursera',
  issue_date: '2024-02-10',
  expiration_date: '2027-02-10',
  credential_url: 'https://example.com/cloud-engineering',
  description: { en: 'Four courses on the cloud.', fr: 'Quatre cours sur le cloud.' },
  certifications: [
    { id: 1, name: { en: 'Cloud Practitioner', fr: 'Praticien du cloud' } },
    { id: 3, name: { en: 'Solutions Architect', fr: 'Architecte de solutions' } },
  ],
}

const agile = {
  id: 11,
  name: { en: 'Agile delivery', fr: 'Delivery agile' },
  issuer: 'Scrum.org',
  issue_date: '2022-11-01',
  expiration_date: null,
  credential_url: '',
  description: { en: '', fr: '' },
  certifications: [],
}

describe('httpSpecializationRepository', () => {
  it('requests the specializations endpoint', async () => {
    const fetchFn = respondWith(200, [cloud, agile])

    await createHttpSpecializationRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/specializations/',
    )
  })

  it('turns the response into specializations, in the same order', async () => {
    const repository = createHttpSpecializationRepository(
      'https://api.example.com',
      respondWith(200, [cloud, agile]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
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
      },
      {
        id: 11,
        name: { en: 'Agile delivery', fr: 'Delivery agile' },
        issuer: 'Scrum.org',
        issueDate: '2022-11-01',
        expirationDate: null,
        credentialUrl: '',
        description: { en: '', fr: '' },
        certifications: [],
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpSpecializationRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
