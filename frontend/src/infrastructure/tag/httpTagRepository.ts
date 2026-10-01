import type { Tag } from '@/domain/tag/Tag'
import type { TagRepository } from '@/domain/tag/TagRepository'
import type { ReferenceDto } from '@/infrastructure/http/dtos'
import { getJson } from '@/infrastructure/http/getJson'

/** One endpoint per kind of tag, in the order the tags are returned. */
const ENDPOINTS: { kind: Tag['kind']; path: string }[] = [
  { kind: 'skill', path: '/api/v1/experience/skills/' },
  { kind: 'tool', path: '/api/v1/experience/tools/' },
  { kind: 'methodology', path: '/api/v1/experience/methodologies/' },
]

export function createHttpTagRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): TagRepository {
  return {
    async list() {
      const groups = await Promise.all(
        ENDPOINTS.map(async ({ kind, path }) => {
          const dtos = await getJson<ReferenceDto[]>(apiUrl, path, fetchFn)
          return dtos.map((dto) => ({ id: dto.id, name: dto.name, kind }))
        }),
      )
      return groups.flat()
    },
  }
}
