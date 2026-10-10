import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { Domain } from '@/domain/tag/TagCategory'
import {
  failingEducationRepository,
  pendingEducationRepository,
} from '@/test/fakeEducationRepository'
import type { Certification } from '@/domain/certification/Certification'
import type { Specialization } from '@/domain/specialization/Specialization'
import { failing } from '@/test/fakeList'
import { fakeRepositories } from '@/test/fakeRepositories'
import { engineering, fakeTagRepository } from '@/test/fakeTagRepository'
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

const practices: Domain = {
  id: 3,
  name: { en: 'Practices', fr: 'Pratiques' },
  categories: [
    {
      id: 9,
      name: { en: 'Methods', fr: 'Méthodes' },
      tags: [{ id: 20, name: { en: 'TDD', fr: 'TDD' }, note: { en: '', fr: '' } }],
    },
  ],
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
    tiles: ['Cloud engineering', 'Agile delivery', 'Scrum Master'],
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
    tiles: ['Hobbies'],
    firstInFrench: 'Loisirs',
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

  const titlesWithIcon = ['Expertise', ...sections.map((section) => section.en)]

  /** The anchors of the sections, by fixed English slug, in page order. */
  const anchors = [
    { slug: 'expertise', title: 'Expertise' },
    { slug: 'experience', title: 'Professional experience' },
    { slug: 'projects', title: 'Personal projects' },
    { slug: 'education', title: 'Education' },
    { slug: 'certifications', title: 'Certifications' },
    { slug: 'communications', title: 'Scientific communications' },
    { slug: 'commitments', title: 'Commitments' },
    { slug: 'hobbies', title: 'Hobbies' },
  ]

  it.each(anchors)('wraps the $title section in the #$slug anchor', ({ slug, title }) => {
    renderPage()

    const anchor = document.getElementById(slug)
    expect(anchor).not.toBeNull()
    expect(
      within(anchor as HTMLElement).getByRole('heading', { level: 2, name: title }),
    ).toBeInTheDocument()
  })

  it('places the eight anchors in order, from expertise to hobbies', () => {
    renderPage()

    const found = anchors.map(({ slug }) => document.getElementById(slug))
    expect(found.every((anchor) => anchor !== null)).toBe(true)
    found.slice(1).forEach((anchor, index) => {
      expect(found[index]?.compareDocumentPosition(anchor as Node)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    })
  })

  it('keeps the same anchor slugs in French', () => {
    renderPage({}, 'fr')

    anchors.forEach(({ slug }) => {
      expect(document.getElementById(slug)).not.toBeNull()
    })
  })

  it.each(titlesWithIcon)('shows an icon in the %s heading', (title) => {
    renderPage()

    const heading = screen.getByRole('heading', { level: 2, name: title })
    expect(heading.querySelector('svg')).not.toBeNull()
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

  /** The Expertise section, once loaded, with the domain of the given name expanded. */
  async function expandedExpertise(domain: string) {
    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    await userEvent.setup().click(await expertise.findByRole('button', { name: domain }))
    return expertise
  }

  it('hides the categories of a domain until its title is clicked', async () => {
    renderPage()

    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))
    const toggle = await expertise.findByRole('button', { name: 'Engineering' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(expertise.queryByRole('list', { name: 'Languages' })).not.toBeInTheDocument()

    await userEvent.setup().click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(expertise.getByRole('list', { name: 'Languages' })).toBeVisible()
  })

  it('expands and collapses each domain on its own', async () => {
    renderPage({ tag: fakeTagRepository([engineering, practices]) })
    const user = userEvent.setup()
    const expertise = within(screen.getByRole('region', { name: 'Expertise' }))

    await user.click(await expertise.findByRole('button', { name: 'Engineering' }))
    await user.click(expertise.getByRole('button', { name: 'Practices' }))
    await user.click(expertise.getByRole('button', { name: 'Engineering' }))

    expect(expertise.queryByRole('list', { name: 'Languages' })).not.toBeInTheDocument()
    expect(expertise.getByRole('list', { name: 'Methods' })).toBeVisible()
  })

  it('shows the categories and tags of an expanded domain in API order', async () => {
    renderPage()

    const expertise = await expandedExpertise('Engineering')

    const labels = ['Languages', 'Tooling'].map((name) => expertise.getByText(name))
    expect(labels[0]?.compareDocumentPosition(labels[1] as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
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

    const expertise = await expandedExpertise('Engineering')

    const tooling = within(expertise.getByRole('list', { name: 'Tooling' }))
    expect(tooling.getAllByRole('listitem').map((chip) => chip.textContent)).toEqual([
      'Git',
      'Claude Code · used daily for agentic coding',
    ])
  })

  it('hides the separator before a note from assistive technology', async () => {
    renderPage()

    const expertise = await expandedExpertise('Engineering')

    const tooling = within(expertise.getByRole('list', { name: 'Tooling' }))
    const chip = within(tooling.getByText(/Claude Code/))
    expect(chip.getByText('·')).toHaveAttribute('aria-hidden', 'true')
    expect(chip.getByText('used daily for agentic coding')).not.toHaveAttribute('aria-hidden')
  })

  it('shows the domains, categories, tags and notes of the expertise in French', async () => {
    renderPage({}, 'fr')

    const expertise = await expandedExpertise('Ingénierie')

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

    const expertise = await expandedExpertise('Engineering')

    expect(expertise.getAllByRole('heading', { level: 3 })).toHaveLength(1)
    expect(expertise.queryByText('Unused')).not.toBeInTheDocument()
    expect(expertise.queryByRole('heading', { name: 'Management' })).not.toBeInTheDocument()
  })

  it('has no Specializations section: they are tiles of the Certifications section', () => {
    renderPage()

    expect(screen.queryByRole('heading', { name: 'Specializations' })).not.toBeInTheDocument()
  })

  it('shows a certification part of a specialization inside it, not as a tile of its own', async () => {
    renderPage()

    const section = within(screen.getByRole('region', { name: 'Certifications' }))
    await section.findAllByRole('article')
    expect(section.queryByRole('article', { name: 'Cloud Practitioner' })).not.toBeInTheDocument()
    await userEvent.setup().click(section.getByRole('button', { name: 'Cloud engineering' }))
    expect(section.getByRole('heading', { level: 4, name: 'Cloud Practitioner' })).toBeVisible()
  })

  it.each([
    ['certifications', { certification: { list: failing<Certification>() } }],
    ['specializations', { specialization: { list: failing<Specialization>() } }],
  ])('says when the %s could not be loaded', async (_, overrides) => {
    renderPage(overrides)

    expect(
      await within(screen.getByRole('region', { name: 'Certifications' })).findByRole('alert'),
    ).toBeInTheDocument()
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
