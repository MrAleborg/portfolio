import type { Education } from '@/domain/education/Education'
import type { EducationRepository } from '@/domain/education/EducationRepository'

/** A finished degree with every field filled in. */
export const masters: Education = {
  id: 1,
  institution: 'Université de Rennes',
  degree: { en: 'Master’s degree', fr: 'Master' },
  fieldOfStudy: { en: 'Computer Science', fr: 'Informatique' },
  grade: { en: 'With honours', fr: 'Mention bien' },
  location: { en: 'Brittany', fr: 'Bretagne' },
  period: { start: '2015-09-01', end: '2017-06-30' },
  description: {
    en: 'Thesis on compilers.',
    fr: 'Mémoire sur les compilateurs.',
  },
}

/** An ongoing degree without any optional field. */
export const doctorate: Education = {
  id: 2,
  institution: 'Inria',
  degree: { en: 'PhD', fr: 'Doctorat' },
  fieldOfStudy: { en: '', fr: '' },
  grade: { en: '', fr: '' },
  location: { en: '', fr: '' },
  period: { start: '2021-10-01', end: null },
  description: { en: '', fr: '' },
}

/** A repository that answers with the given entries. */
export function fakeEducationRepository(entries: Education[] = [masters, doctorate]) {
  return {
    list: vi.fn(() => Promise.resolve(entries)),
  } satisfies EducationRepository
}

/** A repository whose request fails. */
export function failingEducationRepository() {
  return {
    list: vi.fn(() => Promise.reject(new Error('Network error'))),
  } satisfies EducationRepository
}

/** A repository whose request never answers. */
export function pendingEducationRepository() {
  return {
    list: vi.fn(() => new Promise<Education[]>(() => {})),
  } satisfies EducationRepository
}
