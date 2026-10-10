import { render, screen } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import type { PeriodDuration } from '@/domain/period/periodDuration'
import { DurationTime } from '@/ui/components/DurationTime'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderDuration(duration: PeriodDuration, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DurationTime duration={duration} />
    </LocaleProvider>,
  )
}

describe('DurationTime', () => {
  it('shows the years and months in English', () => {
    renderDuration({ years: 1, months: 10 })

    expect(screen.getByRole('time')).toHaveTextContent('1 yr 10 mos')
  })

  it('shows the years and months in French', () => {
    renderDuration({ years: 1, months: 10 }, 'fr')

    expect(screen.getByRole('time')).toHaveTextContent('1 an 10 mois')
  })

  it('exposes years and months to machines', () => {
    renderDuration({ years: 1, months: 10 })

    expect(screen.getByRole('time')).toHaveAttribute('datetime', 'P1Y10M')
  })

  it('leaves out the years to machines when there are none', () => {
    renderDuration({ years: 0, months: 4 })

    expect(screen.getByRole('time')).toHaveAttribute('datetime', 'P4M')
  })

  it('leaves out the months to machines when there are none', () => {
    renderDuration({ years: 2, months: 0 })

    expect(screen.getByRole('time')).toHaveAttribute('datetime', 'P2Y')
  })

  it('exposes an empty duration to machines as zero months', () => {
    renderDuration({ years: 0, months: 0 })

    expect(screen.getByRole('time')).toHaveAttribute('datetime', 'P0M')
  })
})
