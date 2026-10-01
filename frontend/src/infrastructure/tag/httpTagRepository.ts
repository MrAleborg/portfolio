import type { Domain } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { getJson } from '@/infrastructure/http/getJson'

type DomainDto = Omit<Domain, 'categories'> & { children: Domain['categories'] }

export function createHttpTagRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): TagRepository {
  return {
    async list() {
      const dtos = await getJson<DomainDto[]>(apiUrl, '/api/v1/experience/tag-categories/', fetchFn)
      return dtos.map(({ children, ...domain }) => ({ ...domain, categories: children }))
    },
  }
}
