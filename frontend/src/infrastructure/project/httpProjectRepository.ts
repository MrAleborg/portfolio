import type { Localized } from '@/domain/i18n/Locale'
import type { Project } from '@/domain/project/Project'
import type { ProjectRepository } from '@/domain/project/ProjectRepository'
import type { TagDto } from '@/infrastructure/http/dtos'
import { getJson } from '@/infrastructure/http/getJson'

/** A project as the API sends it; its `experience` field is not read. */
export interface ProjectDto {
  id: number
  title: Localized<string>
  start_date: string
  end_date: string | null
  description: Localized<string>
  achievements: Localized<string>[]
  missions: Localized<string>[]
  tags: TagDto[]
}

export function toProject(dto: ProjectDto): Project {
  return {
    id: dto.id,
    title: dto.title,
    period: { start: dto.start_date, end: dto.end_date },
    description: dto.description,
    achievements: dto.achievements,
    missions: dto.missions,
    tags: dto.tags,
  }
}

export function createHttpProjectRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): ProjectRepository {
  return {
    async listSideProjects() {
      const dtos = await getJson<ProjectDto[]>(
        apiUrl,
        '/api/v1/experience/projects/?side_project=true',
        fetchFn,
      )
      return dtos.map(toProject)
    },
  }
}
