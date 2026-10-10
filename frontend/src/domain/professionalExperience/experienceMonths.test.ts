import type { EmploymentType, ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { experienceMonths } from '@/domain/professionalExperience/experienceMonths'

const OCTOBER_2026 = new Date('2026-10-10T12:00:00Z')

afterEach(() => {
  vi.unstubAllEnvs()
})

const experience = (
  start: string,
  end: string | null,
  employmentType: EmploymentType = 'full_time',
): ProfessionalExperience => ({
  id: 1,
  company: 'Acme',
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType,
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start, end },
  description: { en: '', fr: '' },
  projects: [],
})

describe('experienceMonths', () => {
  it('is 0 when there are no experiences', () => {
    expect(experienceMonths([], OCTOBER_2026)).toBe(0)
  })

  it('counts both end months of a period, so Sep 2015 to Jun 2017 is 22 months', () => {
    const months = experienceMonths([experience('2015-09-01', '2017-06-30')], OCTOBER_2026)

    expect(months).toBe(22)
  })

  it('counts months covered by overlapping periods once', () => {
    const months = experienceMonths(
      [experience('2020-01-01', '2020-06-30'), experience('2020-04-01', '2020-09-30')],
      OCTOBER_2026,
    )

    expect(months).toBe(9)
  })

  it('counts a month shared by two consecutive jobs once', () => {
    const months = experienceMonths(
      [experience('2020-01-01', '2020-06-15'), experience('2020-06-16', '2020-12-31')],
      OCTOBER_2026,
    )

    expect(months).toBe(12)
  })

  it('does not count the gaps between jobs', () => {
    const months = experienceMonths(
      [experience('2020-01-01', '2020-03-31'), experience('2020-07-01', '2020-09-30')],
      OCTOBER_2026,
    )

    expect(months).toBe(6)
  })

  it('excludes internships', () => {
    const months = experienceMonths(
      [
        experience('2019-01-01', '2019-12-31', 'internship'),
        experience('2020-01-01', '2020-03-31'),
      ],
      OCTOBER_2026,
    )

    expect(months).toBe(3)
  })

  it('includes apprenticeships', () => {
    const months = experienceMonths(
      [experience('2020-01-01', '2020-12-31', 'apprenticeship')],
      OCTOBER_2026,
    )

    expect(months).toBe(12)
  })

  it('counts an ongoing job up to the month of today', () => {
    const months = experienceMonths([experience('2026-01-01', null)], OCTOBER_2026)

    expect(months).toBe(10)
  })

  it('ignores the day of the month', () => {
    const firstOfTheMonths = experienceMonths([experience('2018-02-01', '2018-07-01')], OCTOBER_2026)
    const endOfTheMonths = experienceMonths([experience('2018-02-28', '2018-07-31')], OCTOBER_2026)

    expect(firstOfTheMonths).toBe(6)
    expect(endOfTheMonths).toBe(6)
  })

  it('does not count a month after today, even when a period ends later', () => {
    const months = experienceMonths([experience('2026-08-01', '2027-03-31')], OCTOBER_2026)

    expect(months).toBe(3)
  })

  it('counts nothing for a period that starts after today (unlike periodDuration, no minimum of 1 month)', () => {
    const months = experienceMonths([experience('2027-01-01', null)], OCTOBER_2026)

    expect(months).toBe(0)
  })

  it('does not depend on the time zone: west of UTC, the 1st of a month still counts that month', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')

    const months = experienceMonths(
      [experience('2026-09-01', null)],
      new Date('2026-10-15T12:00:00Z'),
    )

    expect(months).toBe(2)
  })
})
