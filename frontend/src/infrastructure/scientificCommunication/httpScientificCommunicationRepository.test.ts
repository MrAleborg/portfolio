import { createHttpScientificCommunicationRepository } from '@/infrastructure/scientificCommunication/httpScientificCommunicationRepository'
import { respondWith } from '@/test/respondWith'

const talk = {
  id: 1,
  kind: 'talk',
  title: { en: 'Fast compilers', fr: 'Compilateurs rapides' },
  authors: 'A. Le Borgne, J. Doe',
  venue: 'ICFP',
  date: '2023-05-15',
  url: 'https://example.com/fast-compilers',
}

const poster = {
  id: 2,
  kind: 'poster',
  title: { en: 'Slow compilers', fr: 'Compilateurs lents' },
  authors: '',
  venue: 'SPLASH',
  date: '2022-10-01',
  url: '',
}

describe('httpScientificCommunicationRepository', () => {
  it('requests the scientific communications endpoint', async () => {
    const fetchFn = respondWith(200, [talk, poster])

    await createHttpScientificCommunicationRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/scientific-communications/',
    )
  })

  it('turns the response into scientific communications, in the same order', async () => {
    const repository = createHttpScientificCommunicationRepository(
      'https://api.example.com',
      respondWith(200, [talk, poster]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        kind: 'talk',
        title: { en: 'Fast compilers', fr: 'Compilateurs rapides' },
        authors: 'A. Le Borgne, J. Doe',
        venue: 'ICFP',
        date: '2023-05-15',
        url: 'https://example.com/fast-compilers',
      },
      {
        id: 2,
        kind: 'poster',
        title: { en: 'Slow compilers', fr: 'Compilateurs lents' },
        authors: '',
        venue: 'SPLASH',
        date: '2022-10-01',
        url: '',
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpScientificCommunicationRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
