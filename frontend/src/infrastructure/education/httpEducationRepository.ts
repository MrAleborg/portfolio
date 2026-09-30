import type { EducationRepository } from '@/domain/education/EducationRepository'
import type { Localized } from '@/domain/i18n/Locale'
import { getJson } from '@/infrastructure/http/getJson'

interface EducationDto {
  id: number
  institution: string
  degree: Localized<string>
  field_of_study: Localized<string>
  grade: Localized<string>
  location: Localized<string>
  start_date: string
  end_date: string | null
  description: Localized<string>
}

export function createHttpEducationRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): EducationRepository {
  return {
    async list() {
      const dtos = await getJson<EducationDto[]>(
        apiUrl,
        '/api/v1/experience/education/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        id: dto.id,
        institution: dto.institution,
        degree: dto.degree,
        fieldOfStudy: dto.field_of_study,
        grade: dto.grade,
        location: dto.location,
        period: { start: dto.start_date, end: dto.end_date },
        description: dto.description,
      }))
    },
  }
}
