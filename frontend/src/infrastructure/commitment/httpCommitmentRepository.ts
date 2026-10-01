import type { CommitmentKind } from '@/domain/commitment/Commitment'
import type { CommitmentRepository } from '@/domain/commitment/CommitmentRepository'
import type { Localized } from '@/domain/i18n/Locale'
import { getJson } from '@/infrastructure/http/getJson'

interface CommitmentDto {
  id: number
  kind: CommitmentKind
  organization: string
  role: Localized<string>
  location: Localized<string>
  url: string
  start_date: string
  end_date: string | null
  description: Localized<string>
}

export function createHttpCommitmentRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): CommitmentRepository {
  return {
    async list() {
      const dtos = await getJson<CommitmentDto[]>(
        apiUrl,
        '/api/v1/experience/commitments/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        id: dto.id,
        kind: dto.kind,
        organization: dto.organization,
        role: dto.role,
        location: dto.location,
        url: dto.url,
        period: { start: dto.start_date, end: dto.end_date },
        description: dto.description,
      }))
    },
  }
}
