import { createHttpTagRepository } from '@/infrastructure/tag/httpTagRepository'
import { respondWith } from '@/test/respondWith'

const skills = [
  { id: 1, name: { en: 'Python', fr: 'Python' } },
  { id: 2, name: { en: 'Testing', fr: 'Tests' } },
]
const tools = [{ id: 3, name: { en: 'Git', fr: 'Git' } }]
const methodologies = [{ id: 4, name: { en: 'Agile', fr: 'Agile' } }]

/** A fetch that answers each tag endpoint with its own list, unless told to fail it. */
function fakeApi(failing: string[] = []) {
  const bodies: Record<string, unknown> = {
    '/api/v1/experience/skills/': skills,
    '/api/v1/experience/tools/': tools,
    '/api/v1/experience/methodologies/': methodologies,
  }
  return vi.fn<typeof fetch>((input) => {
    const path = String(input).replace('https://api.example.com', '')
    return respondWith(failing.includes(path) ? 500 : 200, bodies[path])(input)
  })
}

describe('httpTagRepository', () => {
  it('requests the skills, the tools and the methodologies', async () => {
    const fetchFn = fakeApi()

    await createHttpTagRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/experience/skills/')
    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/experience/tools/')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/methodologies/',
    )
  })

  it('returns the skills, then the tools, then the methodologies, each of its kind and in API order', async () => {
    const repository = createHttpTagRepository('https://api.example.com', fakeApi())

    await expect(repository.list()).resolves.toEqual([
      { id: 1, name: { en: 'Python', fr: 'Python' }, kind: 'skill' },
      { id: 2, name: { en: 'Testing', fr: 'Tests' }, kind: 'skill' },
      { id: 3, name: { en: 'Git', fr: 'Git' }, kind: 'tool' },
      { id: 4, name: { en: 'Agile', fr: 'Agile' }, kind: 'methodology' },
    ])
  })

  it.each(['skills', 'tools', 'methodologies'])('fails when the %s cannot be loaded', async (kind) => {
    const repository = createHttpTagRepository(
      'https://api.example.com',
      fakeApi([`/api/v1/experience/${kind}/`]),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
