import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { Project } from '@/domain/project/Project'
import { minimalProject, portfolioProject } from '@/test/fakeProjectRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ProjectTile } from '@/ui/resume/ProjectTile'

function renderTile(project: Project, locale: Locale = 'en', headingLevel?: 3 | 4) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ProjectTile project={project} headingLevel={headingLevel} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(title: string) {
  await userEvent.setup().click(screen.getByRole('button', { name: title }))
}

function itemsOf(list: string) {
  return within(screen.getByRole('list', { name: list }))
    .getAllByRole('listitem')
    .map((item) => item.textContent)
}

describe('ProjectTile', () => {
  describe('in English', () => {
    it('is a tile named by the title', () => {
      renderTile(portfolioProject)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Portfolio site' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Portfolio site')
    })

    it('shows the period in time elements', () => {
      renderTile(portfolioProject)

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('Jan 2023')
      expect(end).toHaveTextContent('Jun 2023')
    })

    it('shows an ongoing project as lasting until now', () => {
      renderTile(minimalProject)

      expect(screen.getByRole('article')).toHaveTextContent('Mar 2024 – Present')
    })

    it('shows the description once expanded', async () => {
      renderTile(portfolioProject)

      await expand('Portfolio site')

      expect(screen.getByText('A site about me.')).toBeVisible()
    })

    it('lists the missions, the achievements and the tags once expanded', async () => {
      renderTile(portfolioProject)

      await expand('Portfolio site')

      expect(itemsOf('Missions')).toEqual(['Design the API', 'Build the front end'])
      expect(itemsOf('Achievements')).toEqual(['Shipped in six months', 'Fully tested'])
      expect(itemsOf('Skills')).toEqual(['React'])
      expect(itemsOf('Tools')).toEqual(['Vite'])
    })

    it('leaves out the lists that are empty', async () => {
      renderTile({ ...portfolioProject, missions: [], achievements: [], tags: [] })

      await expand('Portfolio site')

      expect(screen.queryByRole('list')).toBeNull()
    })

    it('has no expand button when there is nothing to show in the details', () => {
      renderTile(minimalProject)

      expect(screen.getByRole('article')).toHaveAccessibleName('Chess engine')
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('shows each paragraph of the description apart', async () => {
      renderTile({
        ...minimalProject,
        description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
      })

      await expand('Chess engine')

      expect(screen.getByText('First paragraph.')).toBeVisible()
      expect(screen.getByText('Second paragraph.')).toBeVisible()
    })
  })

  describe('in French', () => {
    it('is a tile named by the title and shows its period', () => {
      renderTile(portfolioProject, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Site portfolio')
      expect(screen.getByRole('article')).toHaveTextContent('janv. 2023 – juin 2023')
    })

    it('lists the missions, the achievements and the tags once expanded', async () => {
      renderTile(portfolioProject, 'fr')

      await expand('Site portfolio')

      expect(itemsOf('Missions')).toEqual(['Concevoir l’API', 'Construire le front'])
      expect(itemsOf('Réalisations')).toEqual(['Livré en six mois', 'Entièrement testé'])
      expect(itemsOf('Compétences')).toEqual(['React'])
    })
  })

  it('shows its title as a level 4 heading when asked to', () => {
    renderTile(portfolioProject, 'en', 4)

    expect(
      screen.getByRole('heading', { level: 4, name: 'Portfolio site' }),
    ).toBeInTheDocument()
  })
})
