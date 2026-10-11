import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'
import { respondWith } from '@/test/respondWith'

const body = {
  full_name: 'Ada Lovelace',
  headline: { en: 'Analyst', fr: 'Analyste' },
  bio: { en: 'I write programs.', fr: 'J’écris des programmes.' },
  desired_role: { en: 'Engineer', fr: 'Ingénieure' },
  main_stack: [
    { id: 7, name: { en: 'Python', fr: 'Python' }, kind: 'skill' },
    { id: 3, name: { en: 'Scrum', fr: 'Scrum' }, kind: 'methodology' },
  ],
}

describe('httpProfileRepository', () => {
  it('requests the profile endpoint', async () => {
    const fetchFn = respondWith(200, body)

    await createHttpProfileRepository('https://api.example.com', fetchFn).get()

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/profile/')
  })

  it('turns the response into a profile', async () => {
    const repository = createHttpProfileRepository('https://api.example.com', respondWith(200, body))

    await expect(repository.get()).resolves.toEqual({
      fullName: 'Ada Lovelace',
      headline: { en: 'Analyst', fr: 'Analyste' },
      bio: { en: 'I write programs.', fr: 'J’écris des programmes.' },
      desiredRole: { en: 'Engineer', fr: 'Ingénieure' },
      mainStack: [
        { id: 7, name: { en: 'Python', fr: 'Python' }, kind: 'skill' },
        { id: 3, name: { en: 'Scrum', fr: 'Scrum' }, kind: 'methodology' },
      ],
    })
  })

  it('has an empty main stack when the API does not send one yet', async () => {
    const withoutMainStack = { full_name: body.full_name, headline: body.headline, bio: body.bio }
    const repository = createHttpProfileRepository(
      'https://api.example.com',
      respondWith(200, withoutMainStack),
    )

    await expect(repository.get()).resolves.toMatchObject({ mainStack: [] })
  })

  it('has an empty desired role when the API does not send one yet', async () => {
    const withoutDesiredRole = { full_name: body.full_name, headline: body.headline, bio: body.bio }
    const repository = createHttpProfileRepository(
      'https://api.example.com',
      respondWith(200, withoutDesiredRole),
    )

    await expect(repository.get()).resolves.toMatchObject({ desiredRole: { en: '', fr: '' } })
  })

  it('fails while the profile does not exist yet', async () => {
    const repository = createHttpProfileRepository(
      'https://api.example.com',
      respondWith(404, { detail: 'No Profile matches the given query.' }),
    )

    await expect(repository.get()).rejects.toThrow('404')
  })

  it('fails on a server error', async () => {
    const repository = createHttpProfileRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.get()).rejects.toThrow('500')
  })
})
