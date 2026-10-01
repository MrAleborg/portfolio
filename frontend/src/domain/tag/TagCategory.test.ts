import type { CategorizedTag, Category, Domain } from '@/domain/tag/TagCategory'
import { visibleDomains } from '@/domain/tag/TagCategory'

const noNote = { en: '', fr: '' }
const tag = (id: number): CategorizedTag => ({
  id,
  name: { en: `Tag ${id}`, fr: `Tag ${id}` },
  note: noNote,
})
const category = (id: number, tags: CategorizedTag[]): Category => ({
  id,
  name: { en: `Category ${id}`, fr: `Catégorie ${id}` },
  tags,
})
const domain = (id: number, categories: Category[]): Domain => ({
  id,
  name: { en: `Domain ${id}`, fr: `Domaine ${id}` },
  categories,
})

describe('visibleDomains', () => {
  it('drops the categories that have no tags', () => {
    const filled = category(1, [tag(1)])
    const empty = category(2, [])

    expect(visibleDomains([domain(1, [empty, filled])])).toEqual([domain(1, [filled])])
  })

  it('drops the domains left with no categories', () => {
    const kept = domain(2, [category(2, [tag(2)])])

    const result = visibleDomains([
      domain(1, []),
      domain(3, [category(3, [])]),
      kept,
    ])

    expect(result).toEqual([kept])
  })

  it('keeps the order of the domains, categories and tags', () => {
    const domains = [
      domain(2, [category(5, [tag(9), tag(1)]), category(4, [tag(3)])]),
      domain(1, [category(6, [tag(2)])]),
    ]

    expect(visibleDomains(domains)).toEqual(domains)
  })
})
