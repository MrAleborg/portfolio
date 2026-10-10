import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { mainStack } from '@/domain/professionalExperience/mainStack'
import type { Project } from '@/domain/project/Project'
import type { Tag, TagKind } from '@/domain/tag/Tag'

const tag = (id: number, kind: TagKind = 'skill'): Tag => ({
  id,
  name: { en: `Tag ${id}`, fr: `Tag ${id}` },
  kind,
})
const project = (id: number, tags: Tag[]): Project => ({
  id,
  title: { en: `Project ${id}`, fr: `Projet ${id}` },
  period: { start: '2020-01-01', end: null },
  description: { en: '', fr: '' },
  achievements: [],
  missions: [],
  tags,
})
const experience = (id: number, projects: Project[]): ProfessionalExperience => ({
  id,
  company: `Company ${id}`,
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType: 'full_time',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start: '2020-01-01', end: null },
  description: { en: '', fr: '' },
  projects,
})
const ids = (tags: Tag[]) => tags.map((t) => t.id)

describe('mainStack', () => {
  it('returns no tags when there are no experiences', () => {
    expect(mainStack([], 5)).toEqual([])
  })

  it('ranks tags by the number of projects carrying them, most first', () => {
    const result = mainStack(
      [
        experience(1, [project(1, [tag(1), tag(2), tag(3)]), project(2, [tag(2), tag(3)])]),
        experience(2, [project(3, [tag(2)])]),
      ],
      10,
    )

    expect(ids(result)).toEqual([2, 3, 1])
  })

  it('orders tags with as many projects by first appearance, across projects then experiences', () => {
    const result = mainStack(
      [
        experience(1, [project(1, [tag(7), tag(4)]), project(2, [tag(8)])]),
        experience(2, [project(3, [tag(3), tag(4), tag(8)])]),
      ],
      10,
    )

    expect(ids(result)).toEqual([4, 8, 7, 3])
  })

  it('keeps only skills and tools, leaving out methodologies even when they are the most used', () => {
    const result = mainStack(
      [
        experience(1, [
          project(1, [tag(1, 'methodology'), tag(2, 'tool'), tag(3, 'skill')]),
          project(2, [tag(1, 'methodology')]),
        ]),
      ],
      10,
    )

    expect(ids(result)).toEqual([2, 3])
  })

  it('returns each tag once, even when several experiences carry it', () => {
    const shared = tag(1)

    const result = mainStack(
      [experience(1, [project(1, [shared])]), experience(2, [project(2, [shared])])],
      10,
    )

    expect(ids(result)).toEqual([1])
  })

  it('counts a tag repeated within one project once for that project', () => {
    const result = mainStack(
      [experience(1, [project(1, [tag(1), tag(1), tag(1), tag(2)]), project(2, [tag(2)])])],
      10,
    )

    expect(ids(result)).toEqual([2, 1])
  })

  it('returns at most max tags, keeping the best ranked', () => {
    const result = mainStack(
      [experience(1, [project(1, [tag(1), tag(2), tag(3)]), project(2, [tag(3), tag(2)])])],
      2,
    )

    expect(ids(result)).toEqual([2, 3])
  })
})
