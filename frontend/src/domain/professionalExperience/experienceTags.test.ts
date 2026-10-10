import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { experienceTags } from '@/domain/professionalExperience/experienceTags'
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
const experience = (projects: Project[]): ProfessionalExperience => ({
  id: 1,
  company: 'Acme',
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType: 'full_time',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start: '2020-01-01', end: null },
  description: { en: '', fr: '' },
  projects,
})
const ids = (tags: Tag[]) => tags.map((t) => t.id)

describe('experienceTags', () => {
  it('returns no tags when the experience has no projects', () => {
    expect(experienceTags(experience([]), 5)).toEqual([])
  })

  it('returns no tags when the projects have no tags', () => {
    expect(experienceTags(experience([project(1, []), project(2, [])]), 5)).toEqual([])
  })

  it('keeps a tag shared by several projects only once', () => {
    const shared = tag(1)

    const result = experienceTags(experience([project(1, [shared, tag(2)]), project(2, [shared])]), 5)

    expect(ids(result)).toEqual([1, 2])
  })

  it('lists the skills, then the tools, then the methodologies', () => {
    const result = experienceTags(
      experience([
        project(1, [tag(1, 'methodology'), tag(2, 'tool'), tag(3, 'skill')]),
        project(2, [tag(4, 'skill'), tag(5, 'tool')]),
      ]),
      10,
    )

    expect(ids(result)).toEqual([3, 4, 2, 5, 1])
  })

  it('keeps the order of first appearance across the projects within a kind', () => {
    const result = experienceTags(
      experience([project(1, [tag(5), tag(2)]), project(2, [tag(9), tag(5), tag(1)])]),
      10,
    )

    expect(ids(result)).toEqual([5, 2, 9, 1])
  })

  it('returns at most max tags, keeping the first ones in order', () => {
    const result = experienceTags(
      experience([project(1, [tag(1, 'tool'), tag(2), tag(3), tag(4, 'methodology')])]),
      2,
    )

    expect(ids(result)).toEqual([2, 3])
  })

  it('returns every tag when there are fewer than max', () => {
    const result = experienceTags(experience([project(1, [tag(1), tag(2, 'tool')])]), 5)

    expect(ids(result)).toEqual([1, 2])
  })
})
