import type { Localized } from '@/domain/i18n/Locale'

/** A tag as shown under a category, with an optional note (empty when absent). */
export interface CategorizedTag {
  id: number
  name: Localized<string>
  note: Localized<string>
}

export interface Category {
  id: number
  name: Localized<string>
  tags: CategorizedTag[]
}

export interface Domain {
  id: number
  name: Localized<string>
  categories: Category[]
}

/** Drops the categories without tags, then the domains left without categories; the order is kept. */
export function visibleDomains(domains: Domain[]): Domain[] {
  return domains
    .map((domain) => ({
      ...domain,
      categories: domain.categories.filter((category) => category.tags.length > 0),
    }))
    .filter((domain) => domain.categories.length > 0)
}
