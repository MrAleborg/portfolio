import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Tag, TagKind } from '@/domain/tag/Tag'

const kindOrder: TagKind[] = ['skill', 'tool', 'methodology']

/**
 * The tags of an experience's projects, each once, skills then tools then methodologies
 * (first appearance order within a kind), limited to the first `max`.
 */
export function experienceTags(experience: ProfessionalExperience, max: number): Tag[] {
  const unique = new Map<number, Tag>()
  for (const project of experience.projects) {
    for (const tag of project.tags) {
      if (!unique.has(tag.id)) unique.set(tag.id, tag)
    }
  }
  return [...unique.values()]
    .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind))
    .slice(0, max)
}
