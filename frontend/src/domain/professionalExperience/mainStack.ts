import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Tag } from '@/domain/tag/Tag'

/**
 * The skills and tools used across all experiences, each once, most used first
 * (the number of projects carrying a tag, a tag repeated in one project counting once).
 * Tags used by as many projects keep the order of first appearance across the experiences
 * then their projects. Methodologies are left out. Limited to the first `max`.
 */
export function mainStack(experiences: ProfessionalExperience[], max: number): Tag[] {
  const stack = new Map<number, { tag: Tag; projects: number }>()
  for (const experience of experiences) {
    for (const project of experience.projects) {
      const tagsOfProject = new Map(project.tags.map((tag) => [tag.id, tag]))
      for (const tag of tagsOfProject.values()) {
        if (tag.kind === 'methodology') continue
        const entry = stack.get(tag.id)
        if (entry) entry.projects += 1
        else stack.set(tag.id, { tag, projects: 1 })
      }
    }
  }
  // Array.prototype.sort is stable, so ties keep the order of first appearance.
  return [...stack.values()]
    .sort((a, b) => b.projects - a.projects)
    .slice(0, max)
    .map(({ tag }) => tag)
}
