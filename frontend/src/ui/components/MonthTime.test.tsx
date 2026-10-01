import { render, screen } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import { MonthTime } from '@/ui/components/MonthTime'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderMonth(date: string, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <MonthTime date={date} />
    </LocaleProvider>,
  )
}

describe('MonthTime', () => {
  it('shows the month and the year in English', () => {
    renderMonth('2023-05-15')

    expect(screen.getByRole('time')).toHaveTextContent('May 2023')
  })

  it('shows the month and the year in French', () => {
    renderMonth('2023-05-15', 'fr')

    expect(screen.getByRole('time')).toHaveTextContent('mai 2023')
  })

  it('exposes the month to machines', () => {
    renderMonth('2023-05-15')

    expect(screen.getByRole('time')).toHaveAttribute('datetime', '2023-05')
  })
})
