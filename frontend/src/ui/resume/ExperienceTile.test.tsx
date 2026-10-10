import { isInaccessible, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import {
  fakeProfessionalExperienceRepository,
  fullExperience,
  minimalExperience,
} from '@/test/fakeProfessionalExperienceRepository'
import { minimalProject, portfolioProject } from '@/test/fakeProjectRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ExperienceSection } from '@/ui/resume/ExperienceSection'
import { ExperienceTile } from '@/ui/resume/ExperienceTile'

function renderTile(
  experience: ProfessionalExperience,
  locale: Locale = 'en',
  defaultExpanded?: boolean,
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ExperienceTile experience={experience} defaultExpanded={defaultExpanded} />
    </LocaleProvider>,
  )
}

/** Seven tags over two projects, deliberately not in kind order. */
const manyTagsProjects = [
  {
    ...portfolioProject,
    tags: [
      { id: 10, name: { en: 'Scrum', fr: 'Scrum' }, kind: 'methodology' as const },
      { id: 11, name: { en: 'Vite', fr: 'Vite' }, kind: 'tool' as const },
      { id: 12, name: { en: 'React', fr: 'React' }, kind: 'skill' as const },
    ],
  },
  {
    ...minimalProject,
    tags: [
      { id: 13, name: { en: 'Python', fr: 'Python' }, kind: 'skill' as const },
      { id: 14, name: { en: 'Docker', fr: 'Docker' }, kind: 'tool' as const },
      { id: 15, name: { en: 'SQL', fr: 'SQL' }, kind: 'skill' as const },
      { id: 16, name: { en: 'Git', fr: 'Git' }, kind: 'tool' as const },
    ],
  },
]

const twoParagraphs = {
  en: 'Built the platform.\n\nLed the migration.',
  fr: 'Construction de la plateforme.\n\nPilotage de la migration.',
}

/** The elements showing a text that the user can see, leaving out the hidden details. */
function shown(text: string) {
  return screen.queryAllByText(text).filter((element) => !isInaccessible(element))
}

/** The paragraphs the user can see: the company and the facts under the title, plus any summary. */
function shownParagraphs() {
  return screen.queryAllByRole('paragraph').filter((element) => !isInaccessible(element))
}

/** Clicks a tile's title to show its details. */
async function expand(title: string) {
  await userEvent.setup().click(screen.getByRole('button', { name: title }))
}

describe('ExperienceTile', () => {
  describe('in English', () => {
    it('is a tile named by the position', () => {
      renderTile(fullExperience)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Software engineer' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Software engineer')
    })

    it('shows the company', () => {
      renderTile(fullExperience)

      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    it('shows the period in time elements, the location and the employment type', () => {
      renderTile(fullExperience)

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('Sep 2019')
      expect(end).toHaveTextContent('Aug 2022')
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('Full-time')).toBeInTheDocument()
    })

    it('names every employment type', () => {
      const expected = {
        full_time: 'Full-time',
        part_time: 'Part-time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship',
        apprenticeship: 'Apprenticeship',
      } as const
      for (const [type, label] of Object.entries(expected)) {
        const { unmount } = renderTile({
          ...fullExperience,
          employmentType: type as ProfessionalExperience['employmentType'],
        })
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      }
    })

    it('shows the description and a website link once expanded', async () => {
      renderTile(fullExperience)

      await expand('Software engineer')

      expect(screen.getByText('Built the platform.')).toBeVisible()
      const link = screen.getByRole('link', { name: /^Website: Acme/ })
      expect(link).toBeVisible()
      expect(link).toHaveAttribute('href', 'https://example.com/acme')
    })

    it('lists its projects as nested tiles once expanded, in order', async () => {
      renderTile(fullExperience)

      await expand('Software engineer')

      const projects = screen.getByRole('list', { name: 'Projects' })
      expect(projects).toBeVisible()
      const headings = within(projects).getAllByRole('heading', { level: 4 })
      expect(headings.map((heading) => heading.textContent)).toEqual([
        'Portfolio site',
        'Chess engine',
      ])
      expect(within(projects).getAllByRole('article')).toHaveLength(2)
    })

    it('lets each project be expanded on its own', async () => {
      renderTile(fullExperience)
      await expand('Software engineer')

      expect(screen.getByText('Design the API')).not.toBeVisible()
      await expand('Portfolio site')

      expect(screen.getByText('Design the API')).toBeVisible()
      expect(screen.getByRole('list', { name: 'Skills' })).toBeVisible()
    })

    it('has no list of projects when it has none', async () => {
      renderTile({ ...fullExperience, projects: [] })

      await expand('Software engineer')

      expect(screen.queryByRole('list', { name: 'Projects' })).toBeNull()
    })

    it('shows an ongoing job as lasting until now', () => {
      renderTile(minimalExperience)

      expect(screen.getByRole('article')).toHaveTextContent('Jan 2023 – Present')
    })

    it('leaves out the optional fields that are empty', async () => {
      renderTile({
        ...fullExperience,
        location: { en: '', fr: '' },
        companyUrl: '',
        description: { en: '', fr: '' },
      })

      await expand('Software engineer')

      expect(screen.queryByText('Paris')).toBeNull()
      expect(screen.queryByText('Built the platform.')).toBeNull()
      expect(screen.queryByRole('link')).toBeNull()
      expect(screen.getByRole('list', { name: 'Projects' })).toBeVisible()
    })

    it('has no expand button when there is nothing to show in the details', () => {
      renderTile(minimalExperience)

      expect(screen.getByRole('article')).toHaveAccessibleName('Consultant')
      expect(screen.queryByRole('button')).toBeNull()
    })
  })

  describe('in French', () => {
    it('is a tile named by the position, with the employment type in French', () => {
      renderTile(fullExperience, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Ingénieur logiciel')
      expect(screen.getByText('Temps plein')).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveTextContent('sept. 2019 – août 2022')
    })

    it('names the other employment types in French', () => {
      const expected = {
        part_time: 'Temps partiel',
        contract: 'CDD',
        freelance: 'Freelance',
        internship: 'Stage',
        apprenticeship: 'Alternance',
      } as const
      for (const [type, label] of Object.entries(expected)) {
        const { unmount } = renderTile(
          {
            ...fullExperience,
            employmentType: type as ProfessionalExperience['employmentType'],
          },
          'fr',
        )
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      }
    })

    it('shows the website link and the projects once expanded', async () => {
      renderTile(fullExperience, 'fr')

      await expand('Ingénieur logiciel')

      expect(screen.getByRole('link', { name: /^Site web : Acme/ })).toBeVisible()
      const projects = screen.getByRole('list', { name: 'Projets' })
      expect(within(projects).getAllByRole('heading', { level: 4 })[0]).toHaveTextContent(
        'Site portfolio',
      )
    })
  })

  describe('preview while closed', () => {
    it('shows the first paragraph of the description only', () => {
      renderTile({ ...fullExperience, description: twoParagraphs })

      expect(shown('Built the platform.')).toHaveLength(1)
      expect(shown('Led the migration.')).toHaveLength(0)
    })

    it('shows at most five tags, skills then tools then methodologies, under "Main keywords"', () => {
      renderTile({ ...fullExperience, projects: manyTagsProjects })

      const tags = within(screen.getByRole('list', { name: 'Main keywords' })).getAllByRole(
        'listitem',
      )
      expect(tags.map((tag) => tag.textContent)).toEqual([
        'React',
        'Python',
        'SQL',
        'Vite',
        'Docker',
      ])
      expect(tags[0]).toHaveClass('tag', 'tag--skill')
      expect(tags[3]).toHaveClass('tag', 'tag--tool')
    })

    it('goes away once the tile is opened, which shows the full description', async () => {
      renderTile({
        ...fullExperience,
        description: twoParagraphs,
        projects: manyTagsProjects,
      })

      await expand('Software engineer')

      expect(screen.queryByRole('list', { name: 'Main keywords' })).toBeNull()
      expect(screen.getByText('Built the platform.')).toBeVisible()
      expect(screen.getByText('Led the migration.')).toBeVisible()
    })

    it('comes back when the tile is closed again', async () => {
      renderTile({ ...fullExperience, projects: manyTagsProjects }, 'en', true)

      await expand('Software engineer')

      expect(screen.getByRole('list', { name: 'Main keywords' })).toBeVisible()
    })

    it('has no summary when the description is empty', () => {
      renderTile({
        ...fullExperience,
        description: { en: '', fr: '' },
        projects: manyTagsProjects,
      })

      expect(screen.getByRole('list', { name: 'Main keywords' })).toBeVisible()
      expect(shownParagraphs()).toHaveLength(2)
    })

    it('has no list of skills when the projects have no tags', () => {
      renderTile({ ...fullExperience, projects: [minimalProject] })

      expect(shown('Built the platform.')).toHaveLength(1)
      expect(screen.queryByRole('list', { name: 'Main keywords' })).toBeNull()
    })

    it('has no preview at all without a description and without tags', () => {
      renderTile({ ...fullExperience, description: { en: '', fr: '' }, projects: [minimalProject] })

      expect(screen.queryByRole('list', { name: 'Main keywords' })).toBeNull()
      expect(shownParagraphs()).toHaveLength(2)
    })

    it('starts open when asked to', () => {
      renderTile(fullExperience, 'en', true)

      expect(screen.getByRole('button', { name: 'Software engineer' })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      expect(screen.getByRole('list', { name: 'Projects' })).toBeVisible()
    })

    it('is in French in French', () => {
      renderTile(
        { ...fullExperience, description: twoParagraphs, projects: manyTagsProjects },
        'fr',
      )

      expect(shown('Construction de la plateforme.')).toHaveLength(1)
      expect(screen.getByRole('list', { name: 'Mots-clés principaux' })).toBeVisible()
    })
  })
})

describe('ExperienceSection', () => {
  it('opens the first experience, showing its projects, and keeps the next ones closed', async () => {
    const second = { ...fullExperience, id: 3, position: { en: 'Tech lead', fr: 'Responsable technique' } }
    render(
      <LocaleProvider initialLocale="en">
        <ExperienceSection
          repository={fakeProfessionalExperienceRepository([fullExperience, second])}
        />
      </LocaleProvider>,
    )

    const first = await screen.findByRole('button', { name: 'Software engineer' })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('list', { name: 'Projects' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Tech lead' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('list', { name: 'Main keywords' })).toBeVisible()
  })
})
