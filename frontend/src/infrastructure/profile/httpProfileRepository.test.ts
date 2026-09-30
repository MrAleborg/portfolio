import { createHttpProfileRepository } from '@/infrastructure/profile/httpProfileRepository'

const body = {
  full_name: 'Ada Lovelace',
  headline: { en: 'Analyst', fr: 'Analyste' },
  bio: { en: 'I write programs.', fr: 'J’écris des programmes.' },
}

function respondWith(status: number, json: unknown = body) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(JSON.stringify(json), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

describe('httpProfileRepository', () => {
  it('requests the profile endpoint', async () => {
    const fetchFn = respondWith(200)

    await createHttpProfileRepository('https://api.example.com', fetchFn).get()

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/profile/')
  })

  it('accepts an API URL with a trailing slash', async () => {
    const fetchFn = respondWith(200)

    await createHttpProfileRepository('https://api.example.com/', fetchFn).get()

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/profile/')
  })

  it('turns the response into a profile', async () => {
    const repository = createHttpProfileRepository('https://api.example.com', respondWith(200))

    await expect(repository.get()).resolves.toEqual({
      fullName: 'Ada Lovelace',
      headline: { en: 'Analyst', fr: 'Analyste' },
      bio: { en: 'I write programs.', fr: 'J’écris des programmes.' },
    })
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
