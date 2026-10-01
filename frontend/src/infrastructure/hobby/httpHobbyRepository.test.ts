import { createHttpHobbyRepository } from '@/infrastructure/hobby/httpHobbyRepository'
import { respondWith } from '@/test/respondWith'

const climbing = {
  id: 1,
  name: { en: 'Climbing', fr: 'Escalade' },
  description: { en: 'Bouldering twice a week.', fr: 'De la bloc deux fois par semaine.' },
}

const chess = {
  id: 2,
  name: { en: 'Chess', fr: 'Échecs' },
  description: { en: '', fr: '' },
}

describe('httpHobbyRepository', () => {
  it('requests the hobbies endpoint', async () => {
    const fetchFn = respondWith(200, [climbing, chess])

    await createHttpHobbyRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/hobbies/',
    )
  })

  it('turns the response into hobbies, in the same order', async () => {
    const repository = createHttpHobbyRepository(
      'https://api.example.com',
      respondWith(200, [climbing, chess]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        name: { en: 'Climbing', fr: 'Escalade' },
        description: { en: 'Bouldering twice a week.', fr: 'De la bloc deux fois par semaine.' },
      },
      {
        id: 2,
        name: { en: 'Chess', fr: 'Échecs' },
        description: { en: '', fr: '' },
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpHobbyRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
