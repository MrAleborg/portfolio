import { createHttpTagRepository } from '@/infrastructure/tag/httpTagRepository'
import { respondWith } from '@/test/respondWith'

const TAG_CATEGORIES = '/api/v1/experience/tag-categories/'

const tagCategories = [
  {
    id: 1,
    name: { en: 'Engineering', fr: 'Ingénierie' },
    children: [
      {
        id: 3,
        name: { en: 'AI tools', fr: 'Outils IA' },
        tags: [
          {
            id: 7,
            name: { en: 'Claude Code', fr: 'Claude Code' },
            note: { en: 'used daily', fr: 'utilisé au quotidien' },
          },
          { id: 8, name: { en: 'Git', fr: 'Git' }, note: { en: '', fr: '' } },
        ],
      },
      { id: 4, name: { en: 'Languages', fr: 'Langages' }, tags: [] },
    ],
  },
  { id: 2, name: { en: 'Practices', fr: 'Pratiques' }, children: [] },
]

/** A fetch that answers the tag categories endpoint, and any other path with an empty list. */
function fakeApi(status = 200) {
  return vi.fn<typeof fetch>((input) => {
    const isCategories = String(input).endsWith(TAG_CATEGORIES)
    return respondWith(isCategories ? status : 200, isCategories ? tagCategories : [])(input)
  })
}

describe('httpTagRepository', () => {
  it('requests the tag categories, and nothing else', async () => {
    const fetchFn = fakeApi()

    await createHttpTagRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(`https://api.example.com${TAG_CATEGORIES}`)
  })

  it('returns the domains with their categories, tags and notes, in API order', async () => {
    const repository = createHttpTagRepository('https://api.example.com', fakeApi())

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        name: { en: 'Engineering', fr: 'Ingénierie' },
        categories: [
          {
            id: 3,
            name: { en: 'AI tools', fr: 'Outils IA' },
            tags: [
              {
                id: 7,
                name: { en: 'Claude Code', fr: 'Claude Code' },
                note: { en: 'used daily', fr: 'utilisé au quotidien' },
              },
              { id: 8, name: { en: 'Git', fr: 'Git' }, note: { en: '', fr: '' } },
            ],
          },
          { id: 4, name: { en: 'Languages', fr: 'Langages' }, tags: [] },
        ],
      },
      { id: 2, name: { en: 'Practices', fr: 'Pratiques' }, categories: [] },
    ])
  })

  it('fails when the tag categories cannot be loaded', async () => {
    const repository = createHttpTagRepository('https://api.example.com', fakeApi(500))

    await expect(repository.list()).rejects.toThrow('500')
  })
})
