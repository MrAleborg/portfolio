import { createHttpEducationRepository } from '@/infrastructure/education/httpEducationRepository'
import { respondWith } from '@/test/respondWith'

const finished = {
  id: 1,
  institution: 'Université de Rennes',
  degree: { en: 'Master’s degree', fr: 'Master' },
  field_of_study: { en: 'Computer Science', fr: 'Informatique' },
  grade: { en: 'With honours', fr: 'Mention bien' },
  location: { en: 'Brittany', fr: 'Bretagne' },
  start_date: '2015-09-01',
  end_date: '2017-06-30',
  is_current: false,
  description: { en: 'Thesis on compilers.', fr: 'Mémoire sur les compilateurs.' },
}

const ongoing = {
  id: 2,
  institution: 'Inria',
  degree: { en: 'PhD', fr: 'Doctorat' },
  field_of_study: { en: '', fr: '' },
  grade: { en: '', fr: '' },
  location: { en: '', fr: '' },
  start_date: '2021-10-01',
  end_date: null,
  is_current: true,
  description: { en: '', fr: '' },
}

describe('httpEducationRepository', () => {
  it('requests the education endpoint', async () => {
    const fetchFn = respondWith(200, [finished, ongoing])

    await createHttpEducationRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/education/',
    )
  })

  it('turns the response into education entries, in the same order', async () => {
    const repository = createHttpEducationRepository(
      'https://api.example.com',
      respondWith(200, [finished, ongoing]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        institution: 'Université de Rennes',
        degree: { en: 'Master’s degree', fr: 'Master' },
        fieldOfStudy: { en: 'Computer Science', fr: 'Informatique' },
        grade: { en: 'With honours', fr: 'Mention bien' },
        location: { en: 'Brittany', fr: 'Bretagne' },
        period: { start: '2015-09-01', end: '2017-06-30' },
        description: { en: 'Thesis on compilers.', fr: 'Mémoire sur les compilateurs.' },
      },
      {
        id: 2,
        institution: 'Inria',
        degree: { en: 'PhD', fr: 'Doctorat' },
        fieldOfStudy: { en: '', fr: '' },
        grade: { en: '', fr: '' },
        location: { en: '', fr: '' },
        period: { start: '2021-10-01', end: null },
        description: { en: '', fr: '' },
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpEducationRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
