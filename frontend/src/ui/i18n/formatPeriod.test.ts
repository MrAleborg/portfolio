import { formatPeriod } from '@/ui/i18n/formatPeriod'

const finished = { start: '2015-09-01', end: '2017-06-30' }
const ongoing = { start: '2021-10-01', end: null }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('formatPeriod', () => {
  describe('in English', () => {
    it('shows the start and end months', () => {
      expect(formatPeriod(finished, 'en')).toBe('Sep 2015 – Jun 2017')
    })

    it('says an ongoing period lasts until now', () => {
      expect(formatPeriod(ongoing, 'en')).toBe('Oct 2021 – Present')
    })
  })

  describe('in French', () => {
    it('shows the start and end months', () => {
      expect(formatPeriod(finished, 'fr')).toBe('sept. 2015 – juin 2017')
    })

    it('says an ongoing period lasts until now', () => {
      expect(formatPeriod(ongoing, 'fr')).toBe('oct. 2021 – aujourd’hui')
    })
  })

  it('keeps the first day of a month in that month west of Greenwich', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')

    expect(formatPeriod({ start: '2015-09-01', end: '2017-06-01' }, 'en')).toBe(
      'Sep 2015 – Jun 2017',
    )
  })
})
