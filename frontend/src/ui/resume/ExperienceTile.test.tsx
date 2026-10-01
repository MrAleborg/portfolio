import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { fullExperience, minimalExperience } from '@/test/fakeProfessionalExperienceRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ExperienceTile } from '@/ui/resume/ExperienceTile'

function renderTile(experience: ProfessionalExperience, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ExperienceTile experience={experience} />
    </LocaleProvider>,
  )
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
})
