import type { Tag } from '@/domain/tag/Tag'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { resolving } from '@/test/fakeList'

export const python: Tag = { id: 1, name: { en: 'Python', fr: 'Python' }, kind: 'skill' }
export const testing: Tag = { id: 2, name: { en: 'Testing', fr: 'Tests' }, kind: 'skill' }
export const git: Tag = { id: 3, name: { en: 'Git', fr: 'Git' }, kind: 'tool' }
export const agile: Tag = { id: 4, name: { en: 'Agile', fr: 'Agile' }, kind: 'methodology' }

/** A repository that answers with the given tags. */
export function fakeTagRepository(entries: Tag[] = [python, testing, git, agile]) {
  return { list: resolving(entries) } satisfies TagRepository
}
