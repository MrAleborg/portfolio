import { render, screen, within } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import {
  failingEducationRepository,
  pendingEducationRepository,
} from '@/test/fakeEducationRepository'
import { fakeRepositories } from '@/test/fakeRepositories'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumePage } from '@/ui/pages/ResumePage'
import type { Repositories } from '@/ui/Repositories'

function renderPage(overrides: Partial<Repositories> = {}, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ResumePage repositories={fakeRepositories(overrides)} />
    </LocaleProvider>,
  )
}

/** Each section: its name in English and French, its tiles in order, and the first tile in French. */
const sections = [
  {
    en: 'Professional experience',
    fr: 'Expérience professionnelle',
    tiles: ['Software engineer', 'Consultant'],
    firstInFrench: 'Ingénieur logiciel',
  },
  {
    en: 'Personal projects',
    fr: 'Projets personnels',
    tiles: ['Portfolio site', 'Chess engine'],
    firstInFrench: 'Site portfolio',
  },
  {
    en: 'Education',
    fr: 'Formation',
    tiles: ['Master’s degree, Computer Science', 'PhD'],
    firstInFrench: 'Master, Informatique',
  },
  {
    en: 'Certifications',
    fr: 'Certifications',
    tiles: ['Cloud Practitioner', 'Scrum Master'],
    firstInFrench: 'Praticien du cloud',
  },
  {
    en: 'Specializations',
    fr: 'Spécialisations',
    tiles: ['Cloud engineering', 'Agile delivery'],
    firstInFrench: 'Ingénierie cloud',
  },
  {
    en: 'Scientific communications',
    fr: 'Communications scientifiques',
    tiles: ['Fast compilers', 'Slow compilers'],
    firstInFrench: 'Compilateurs rapides',
  },
  {
    en: 'Commitments',
    fr: 'Engagements',
    tiles: ['Treasurer', 'Mentor'],
    firstInFrench: 'Trésorier',
  },
  {
    en: 'Hobbies',
    fr: 'Loisirs',
    tiles: ['Climbing', 'Chess'],
    firstInFrench: 'Escalade',
  },
]

describe('ResumePage', () => {
  it('shows the title as the main heading', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
  })

  it('shows the sections in order, top to bottom', () => {
    renderPage()

    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual(sections.map((section) => section.en))
  })

  it.each(sections)('shows one tile per entry of $en, in order', async ({ en, tiles }) => {
    renderPage()

    const section = within(screen.getByRole('region', { name: en }))
    const articles = await section.findAllByRole('article')
    expect(articles).toHaveLength(tiles.length)
    tiles.forEach((name, index) => {
      expect(articles[index]).toHaveAccessibleName(name)
    })
  })

  it.each(sections)('names the $en section in French', async ({ fr, firstInFrench }) => {
    renderPage({}, 'fr')

    const section = within(screen.getByRole('region', { name: fr }))
    expect(await section.findByRole('article', { name: firstInFrench })).toBeInTheDocument()
  })

  it('says the education is loading', () => {
    renderPage({ education: pendingEducationRepository() })

    expect(
      within(screen.getByRole('region', { name: 'Education' })).getByRole('status'),
    ).toBeInTheDocument()
  })

  it('says when the education could not be loaded', async () => {
    renderPage({ education: failingEducationRepository() })

    expect(
      await within(screen.getByRole('region', { name: 'Education' })).findByRole('alert'),
    ).toBeInTheDocument()
  })
})
