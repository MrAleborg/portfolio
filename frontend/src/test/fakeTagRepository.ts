import type { CategorizedTag, Category, Domain } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { resolving } from '@/test/fakeList'

const noNote = { en: '', fr: '' }

export const python: CategorizedTag = { id: 1, name: { en: 'Python', fr: 'Python' }, note: noNote }
export const testing: CategorizedTag = { id: 2, name: { en: 'Testing', fr: 'Tests' }, note: noNote }
export const git: CategorizedTag = { id: 3, name: { en: 'Git', fr: 'Git' }, note: noNote }
export const claudeCode: CategorizedTag = {
  id: 4,
  name: { en: 'Claude Code', fr: 'Claude Code' },
  note: { en: 'used daily for agentic coding', fr: 'utilisé au quotidien pour le code agentique' },
}

export const languages: Category = {
  id: 1,
  name: { en: 'Languages', fr: 'Langages' },
  tags: [python, testing],
}
export const tooling: Category = {
  id: 2,
  name: { en: 'Tooling', fr: 'Outillage' },
  tags: [git, claudeCode],
}
export const noTags: Category = { id: 3, name: { en: 'Unused', fr: 'Inutilisé' }, tags: [] }

export const engineering: Domain = {
  id: 1,
  name: { en: 'Engineering', fr: 'Ingénierie' },
  categories: [languages, tooling, noTags],
}
export const emptyDomain: Domain = {
  id: 2,
  name: { en: 'Management', fr: 'Management' },
  categories: [],
}

/** A repository that answers with the given domains. */
export function fakeTagRepository(entries: Domain[] = [engineering, emptyDomain]) {
  return { list: resolving(entries) } satisfies TagRepository
}
