import { createHttpCommitmentRepository } from '@/infrastructure/commitment/httpCommitmentRepository'
import { respondWith } from '@/test/respondWith'

const finished = {
  id: 1,
  kind: 'association',
  organization: 'Rennes Open Data',
  role: { en: 'Treasurer', fr: 'Trésorier' },
  location: { en: 'Brittany', fr: 'Bretagne' },
  url: 'https://example.com/open-data',
  start_date: '2019-01-01',
  end_date: '2021-12-31',
  is_current: false,
  description: { en: 'Kept the books.', fr: 'Tenue des comptes.' },
}

const ongoing = {
  id: 2,
  kind: 'other_event',
  organization: 'Hackathon Ouest',
  role: { en: 'Mentor', fr: 'Mentor' },
  location: { en: '', fr: '' },
  url: '',
  start_date: '2023-05-01',
  end_date: null,
  is_current: true,
  description: { en: '', fr: '' },
}

describe('httpCommitmentRepository', () => {
  it('requests the commitments endpoint', async () => {
    const fetchFn = respondWith(200, [finished, ongoing])

    await createHttpCommitmentRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/commitments/',
    )
  })

  it('turns the response into commitments, in the same order', async () => {
    const repository = createHttpCommitmentRepository(
      'https://api.example.com',
      respondWith(200, [finished, ongoing]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        kind: 'association',
        organization: 'Rennes Open Data',
        role: { en: 'Treasurer', fr: 'Trésorier' },
        location: { en: 'Brittany', fr: 'Bretagne' },
        url: 'https://example.com/open-data',
        period: { start: '2019-01-01', end: '2021-12-31' },
        description: { en: 'Kept the books.', fr: 'Tenue des comptes.' },
      },
      {
        id: 2,
        kind: 'other_event',
        organization: 'Hackathon Ouest',
        role: { en: 'Mentor', fr: 'Mentor' },
        location: { en: '', fr: '' },
        url: '',
        period: { start: '2023-05-01', end: null },
        description: { en: '', fr: '' },
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpCommitmentRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
