import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { currentExperience } from '@/domain/professionalExperience/currentExperience'

const OCTOBER_2026 = new Date('2026-10-10T12:00:00Z')

const experience = (
  id: number,
  end: string | null,
  start = '2020-01-01',
): ProfessionalExperience => ({
  id,
  company: `Company ${id}`,
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType: 'full_time',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start, end },
  description: { en: '', fr: '' },
  projects: [],
})

describe('currentExperience', () => {
  it('returns the first ongoing experience in the given order', () => {
    const result = currentExperience([
      experience(1, '2021-12-31'),
      experience(2, null),
      experience(3, null),
    ], OCTOBER_2026)

    expect(result?.id).toBe(2)
  })

  it('returns undefined when no experience is ongoing', () => {
    const result = currentExperience([experience(1, '2021-12-31'), experience(2, '2022-06-30')], OCTOBER_2026)

    expect(result).toBeUndefined()
  })

  it('returns undefined when there are no experiences', () => {
    expect(currentExperience([], OCTOBER_2026)).toBeUndefined()
  })

  it('ignores an ongoing experience starting after the month of today', () => {
    const result = currentExperience(
      [experience(1, null, '2026-11-01'), experience(2, null, '2026-10-31')],
      OCTOBER_2026,
    )

    expect(result?.id).toBe(2)
  })

  it('returns undefined when the only ongoing experience starts after the month of today', () => {
    const result = currentExperience([experience(1, null, '2027-01-01')], OCTOBER_2026)

    expect(result).toBeUndefined()
  })
})
