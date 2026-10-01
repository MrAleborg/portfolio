import type { Project } from '@/domain/project/Project'

/** Where the owner's projects come from. */
export interface ProjectRepository {
  /** The visible personal projects, in display order. */
  listSideProjects(): Promise<Project[]>
}
