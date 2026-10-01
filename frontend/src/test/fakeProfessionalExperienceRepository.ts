import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import { resolving } from '@/test/fakeList'
import { minimalProject, portfolioProject } from '@/test/fakeProjectRepository'

/** A finished job with every field filled in and two projects. */
export const fullExperience: ProfessionalExperience = {
  id: 1,
  company: 'Acme',
  position: { en: 'Software engineer', fr: 'Ingénieur logiciel' },
  employmentType: 'full_time',
  companyUrl: 'https://example.com/acme',
  location: { en: 'Paris', fr: 'Paris' },
  period: { start: '2019-09-01', end: '2022-08-31' },
  description: { en: 'Built the platform.', fr: 'Construction de la plateforme.' },
  projects: [portfolioProject, minimalProject],
}

/** An ongoing job without any optional field. */
export const minimalExperience: ProfessionalExperience = {
  id: 2,
  company: 'Globex',
  position: { en: 'Consultant', fr: 'Consultant' },
  employmentType: 'freelance',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start: '2023-01-01', end: null },
  description: { en: '', fr: '' },
  projects: [],
}

/** A repository that answers with the given entries. */
export function fakeProfessionalExperienceRepository(
  entries: ProfessionalExperience[] = [fullExperience, minimalExperience],
) {
  return { list: resolving(entries) } satisfies ProfessionalExperienceRepository
}
