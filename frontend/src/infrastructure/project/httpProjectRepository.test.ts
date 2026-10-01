import { createHttpProjectRepository } from '@/infrastructure/project/httpProjectRepository'
import { respondWith } from '@/test/respondWith'

const portfolio = {
  id: 1,
  title: { en: 'Portfolio site', fr: 'Site portfolio' },
  start_date: '2023-01-01',
  end_date: '2023-06-30',
  is_current: false,
  description: { en: 'A site about me.', fr: 'Un site sur moi.' },
  achievements: [{ en: 'Shipped in six months', fr: 'Livré en six mois' }],
  experience: null,
  missions: [{ en: 'Design the API', fr: 'Concevoir l’API' }],
  tags: [{ id: 1, name: { en: 'React', fr: 'React' }, kind: 'skill' }],
}

const chess = {
  id: 2,
  title: { en: 'Chess engine', fr: 'Moteur d’échecs' },
  start_date: '2024-03-01',
  end_date: null,
  is_current: true,
  description: { en: '', fr: '' },
  achievements: [],
  experience: null,
  missions: [],
  tags: [],
}

describe('httpProjectRepository', () => {
  it('requests the personal projects only', async () => {
    const fetchFn = respondWith(200, [portfolio, chess])

    await createHttpProjectRepository('https://api.example.com', fetchFn).listSideProjects()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/projects/?side_project=true',
    )
  })

  it('turns the response into projects, in the same order', async () => {
    const repository = createHttpProjectRepository(
      'https://api.example.com',
      respondWith(200, [portfolio, chess]),
    )

    await expect(repository.listSideProjects()).resolves.toEqual([
      {
        id: 1,
        title: { en: 'Portfolio site', fr: 'Site portfolio' },
        period: { start: '2023-01-01', end: '2023-06-30' },
        description: { en: 'A site about me.', fr: 'Un site sur moi.' },
        achievements: [{ en: 'Shipped in six months', fr: 'Livré en six mois' }],
        missions: [{ en: 'Design the API', fr: 'Concevoir l’API' }],
        tags: [{ id: 1, name: { en: 'React', fr: 'React' }, kind: 'skill' }],
      },
      {
        id: 2,
        title: { en: 'Chess engine', fr: 'Moteur d’échecs' },
        period: { start: '2024-03-01', end: null },
        description: { en: '', fr: '' },
        achievements: [],
        missions: [],
        tags: [],
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpProjectRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.listSideProjects()).rejects.toThrow('500')
  })
})
