import type { Localized } from '@/domain/i18n/Locale'
import type { ScientificCommunicationKind } from '@/domain/scientificCommunication/ScientificCommunication'
import type { ScientificCommunicationRepository } from '@/domain/scientificCommunication/ScientificCommunicationRepository'
import { getJson } from '@/infrastructure/http/getJson'

interface ScientificCommunicationDto {
  id: number
  kind: ScientificCommunicationKind
  title: Localized<string>
  authors: string
  venue: string
  date: string
  url: string
}

export function createHttpScientificCommunicationRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): ScientificCommunicationRepository {
  return {
    async list() {
      const dtos = await getJson<ScientificCommunicationDto[]>(
        apiUrl,
        '/api/v1/experience/scientific-communications/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        id: dto.id,
        kind: dto.kind,
        title: dto.title,
        authors: dto.authors,
        venue: dto.venue,
        date: dto.date,
        url: dto.url,
      }))
    },
  }
}
