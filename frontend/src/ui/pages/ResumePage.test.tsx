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

  it('shows the sections in order, from expertise to hobbies', () => {
    renderPage()

    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual(['Expertise', ...sections.map((section) => section.en)])
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

  it('shows the expertise as domains, then categories, then tags, in API order', async () => {
    renderPage()

    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    expect(await expertise.findByRole('heading', { level: 3, name: 'Engineering' })).toBeInTheDocument()
    const lists = expertise.getAllByRole('list').map((list) => list.getAttribute('aria-labelledby'))
    expect(lists.map((id) => document.getElementById(id ?? '')?.textContent)).toEqual([
      'Languages',
      'Tooling',
    ])
    const languages = within(expertise.getByRole('list', { name: 'Languages' }))
    expect(languages.getAllByRole('listitem').map((chip) => chip.textContent)).toEqual([
      'Python',
      'Testing',
    ])
    const tooling = within(expertise.getByRole('list', { name: 'Tooling' }))
    expect(tooling.getAllByRole('listitem')[0]).toHaveTextContent('Git')
  })

  it('shows the note of a tag after its name when it has one', async () => {
    renderPage()

    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    const tooling = within(await expertise.findByRole('list', { name: 'Tooling' }))
    expect(tooling.getAllByRole('listitem').map((chip) => chip.textContent)).toEqual([
      'Git',
      'Claude Code · used daily for agentic coding',
    ])
  })

  it('shows the domains, categories, tags and notes of the expertise in French', async () => {
    renderPage({}, 'fr')

    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    expect(await expertise.findByRole('heading', { level: 3, name: 'Ingénierie' })).toBeInTheDocument()
    const languages = within(expertise.getByRole('list', { name: 'Langages' }))
    expect(languages.getAllByRole('listitem').map((chip) => chip.textContent)).toEqual([
      'Python',
      'Tests',
    ])
    const tooling = within(expertise.getByRole('list', { name: 'Outillage' }))
    expect(tooling.getAllByRole('listitem')[1]).toHaveTextContent(
      'Claude Code · utilisé au quotidien pour le code agentique',
    )
  })

  it('hides the categories without tags and the domains without categories', async () => {
    renderPage()

    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    await expertise.findByRole('heading', { level: 3, name: 'Engineering' })
    expect(expertise.getAllByRole('heading', { level: 3 })).toHaveLength(1)
    expect(expertise.queryByText('Unused')).not.toBeInTheDocument()
    expect(expertise.queryByRole('heading', { name: 'Management' })).not.toBeInTheDocument()
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
