import type { Localized } from '@/domain/i18n/Locale'
import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import { getJson } from '@/infrastructure/http/getJson'

interface HobbyDto {
  id: number
  name: Localized<string>
  description: Localized<string>
}

export function createHttpHobbyRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): HobbyRepository {
  return {
    async list() {
      const dtos = await getJson<HobbyDto[]>(
        apiUrl,
        '/api/v1/experience/hobbies/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        id: dto.id,
        name: dto.name,
        description: dto.description,
      }))
    },
  }
}
