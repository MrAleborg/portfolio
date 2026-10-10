import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { currentExperience } from '@/domain/professionalExperience/currentExperience'

const experience = (id: number, end: string | null): ProfessionalExperience => ({
  id,
  company: `Company ${id}`,
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType: 'full_time',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start: '2020-01-01', end },
  description: { en: '', fr: '' },
  projects: [],
})

describe('currentExperience', () => {
  it('returns the first ongoing experience in the given order', () => {
    const result = currentExperience([
      experience(1, '2021-12-31'),
      experience(2, null),
      experience(3, null),
    ])

    expect(result?.id).toBe(2)
  })

  it('returns undefined when no experience is ongoing', () => {
    const result = currentExperience([experience(1, '2021-12-31'), experience(2, '2022-06-30')])

    expect(result).toBeUndefined()
  })

  it('returns undefined when there are no experiences', () => {
    expect(currentExperience([])).toBeUndefined()
  })
})
