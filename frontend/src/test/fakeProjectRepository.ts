import type { Project } from '@/domain/project/Project'
import type { ProjectRepository } from '@/domain/project/ProjectRepository'
import { resolving } from '@/test/fakeList'

/** A finished project with every field filled in. */
export const portfolioProject: Project = {
  id: 1,
  title: { en: 'Portfolio site', fr: 'Site portfolio' },
  period: { start: '2023-01-01', end: '2023-06-30' },
  description: { en: 'A site about me.', fr: 'Un site sur moi.' },
  achievements: [
    { en: 'Shipped in six months', fr: 'Livré en six mois' },
    { en: 'Fully tested', fr: 'Entièrement testé' },
  ],
  missions: [
    { en: 'Design the API', fr: 'Concevoir l’API' },
    { en: 'Build the front end', fr: 'Construire le front' },
  ],
  tags: [
    { id: 1, name: { en: 'React', fr: 'React' }, kind: 'skill' },
    { id: 2, name: { en: 'Vite', fr: 'Vite' }, kind: 'tool' },
  ],
}

/** An ongoing project without any optional field. */
export const minimalProject: Project = {
  id: 2,
  title: { en: 'Chess engine', fr: 'Moteur d’échecs' },
  period: { start: '2024-03-01', end: null },
  description: { en: '', fr: '' },
  achievements: [],
  missions: [],
  tags: [],
}

/** A repository that answers with the given personal projects. */
export function fakeProjectRepository(entries: Project[] = [portfolioProject, minimalProject]) {
  return { listSideProjects: resolving(entries) } satisfies ProjectRepository
}
