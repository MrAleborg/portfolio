import { render, screen, within } from '@testing-library/react'
import type { EducationRepository } from '@/domain/education/EducationRepository'
import type { Locale } from '@/domain/i18n/Locale'
import {
  failingEducationRepository,
  fakeEducationRepository,
  pendingEducationRepository,
} from '@/test/fakeEducationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumePage } from '@/ui/pages/ResumePage'

function renderPage(repository: EducationRepository, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ResumePage educationRepository={repository} />
    </LocaleProvider>,
  )
}

describe('ResumePage', () => {
  it('shows the title as the main heading', () => {
    renderPage(fakeEducationRepository())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
  })

  it('shows one tile per education entry, in order', async () => {
    renderPage(fakeEducationRepository())

    const education = within(screen.getByRole('region', { name: 'Education' }))
    const tiles = await education.findAllByRole('article')
    expect(tiles).toHaveLength(2)
    const [first, second] = tiles
    expect(first).toHaveAccessibleName('Master’s degree, Computer Science')
    expect(second).toHaveAccessibleName('PhD')
  })

  it('says the education is loading', () => {
    renderPage(pendingEducationRepository())

    expect(
      within(screen.getByRole('region', { name: 'Education' })).getByRole('status'),
    ).toBeInTheDocument()
  })

  it('says when the education could not be loaded', async () => {
    renderPage(failingEducationRepository())

    expect(
      await within(screen.getByRole('region', { name: 'Education' })).findByRole('alert'),
    ).toBeInTheDocument()
  })

  it('names the education section in French', async () => {
    renderPage(fakeEducationRepository(), 'fr')

    const education = within(screen.getByRole('region', { name: 'Formation' }))
    expect(await education.findByRole('article', { name: 'Master, Informatique' })).toBeInTheDocument()
  })
})
