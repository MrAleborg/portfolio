import type { Localized } from '@/domain/i18n/Locale'
import type { EmploymentType } from '@/domain/professionalExperience/ProfessionalExperience'
import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import { getJson } from '@/infrastructure/http/getJson'
import { type ProjectDto, toProject } from '@/infrastructure/project/httpProjectRepository'

interface ProfessionalExperienceDto {
  id: number
  company: string
  position: Localized<string>
  employment_type: EmploymentType
  company_url: string
  location: Localized<string>
  start_date: string
  end_date: string | null
  description: Localized<string>
  projects: ProjectDto[]
}

export function createHttpProfessionalExperienceRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): ProfessionalExperienceRepository {
  return {
    async list() {
      const dtos = await getJson<ProfessionalExperienceDto[]>(
        apiUrl,
        '/api/v1/experience/professional-experiences/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        id: dto.id,
        company: dto.company,
        position: dto.position,
        employmentType: dto.employment_type,
        companyUrl: dto.company_url,
        location: dto.location,
        period: { start: dto.start_date, end: dto.end_date },
        description: dto.description,
        projects: dto.projects.map(toProject),
      }))
    },
  }
}
