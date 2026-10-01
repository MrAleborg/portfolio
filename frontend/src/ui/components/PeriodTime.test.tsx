import { render, screen } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'
import { PeriodTime } from '@/ui/components/PeriodTime'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

const finished = { start: '2015-09-01', end: '2017-06-30' }
const ongoing = { start: '2021-10-01', end: null }

function renderPeriod(period: Period, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <PeriodTime period={period} />
    </LocaleProvider>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('PeriodTime', () => {
  it('shows a finished period as two time elements, one per month', () => {
    const { container } = renderPeriod(finished)

    const times = screen.getAllByRole('time')
    const [start, end] = times
    expect(times).toHaveLength(2)
    expect(start).toHaveAttribute('datetime', '2015-09')
    expect(end).toHaveAttribute('datetime', '2017-06')
    expect(container).toHaveTextContent('Sep 2015 – Jun 2017')
  })

  it('shows an ongoing period as one time element followed by the ongoing word', () => {
    const { container } = renderPeriod(ongoing)

    const times = screen.getAllByRole('time')
    const [start] = times
    expect(times).toHaveLength(1)
    expect(start).toHaveAttribute('datetime', '2021-10')
    expect(container).toHaveTextContent('Oct 2021 – Present')
  })

  it('shows the months in French', () => {
    const { container } = renderPeriod(finished, 'fr')

    expect(container).toHaveTextContent('sept. 2015 – juin 2017')
  })

  it('says an ongoing period lasts until now in French', () => {
    const { container } = renderPeriod(ongoing, 'fr')

    expect(container).toHaveTextContent('oct. 2021 – aujourd’hui')
  })

  it('keeps the first day of a month in that month west of Greenwich', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')

    const { container } = renderPeriod({ start: '2015-09-01', end: '2017-06-01' })

    expect(container).toHaveTextContent('Sep 2015 – Jun 2017')
    expect(screen.getAllByRole('time')[0]).toHaveAttribute('datetime', '2015-09')
  })
})
