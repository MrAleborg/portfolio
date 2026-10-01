import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Locale } from '@/domain/i18n/Locale'
import { fakeEducationRepository, masters } from '@/test/fakeEducationRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import { fakeRepositories } from '@/test/fakeRepositories'
import { AppRoutes } from '@/ui/AppRoutes'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import type { Repositories } from '@/ui/Repositories'

interface Options {
  locale?: Locale
  repositories?: Repositories
}

function renderAt(
  path: string,
  { locale = 'en', repositories = fakeRepositories() }: Options = {},
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes repositories={repositories} />
      </MemoryRouter>
    </LocaleProvider>,
  )
}

function navigation(name = 'Main') {
  return within(screen.getByRole('navigation', { name }))
}

describe('AppRoutes', () => {
  it('links to every page', () => {
    renderAt('/')

    expect(navigation().getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(navigation().getByRole('link', { name: 'Resume' })).toHaveAttribute(
      'href',
      '/resume',
    )
  })

  it('shows the home page at the root', async () => {
    renderAt('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows the resume page at /resume', async () => {
    renderAt('/resume')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      await screen.findByRole('article', { name: 'Master’s degree, Computer Science' }),
    ).toBeInTheDocument()
  })

  it('goes to the resume page from the navigation', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(navigation().getByRole('link', { name: 'Resume' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
  })

  it('sends unknown paths to the home page', async () => {
    renderAt('/nowhere')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument()
  })

  it('labels the navigation in French', () => {
    renderAt('/', { locale: 'fr' })

    expect(
      navigation('Principale').getByRole('link', { name: 'Accueil' }),
    ).toBeInTheDocument()
    expect(
      navigation('Principale').getByRole('link', { name: 'CV' }),
    ).toBeInTheDocument()
  })

  it('switches the language from the navigation without loading the profile again', async () => {
    const user = userEvent.setup()
    const profile = fakeProfileRepository()
    renderAt('/', { repositories: fakeRepositories({ profile }) })
    await screen.findByText('Analyst')

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByText('Analyste')).toBeInTheDocument()
    expect(
      navigation('Principale').getByRole('link', { name: 'Accueil' }),
    ).toBeInTheDocument()
    expect(profile.get).toHaveBeenCalledTimes(1)
  })

  it('switches the language of the resume without loading the education again', async () => {
    const user = userEvent.setup()
    const education = fakeEducationRepository()
    renderAt('/resume', { repositories: fakeRepositories({ education }) })
    await screen.findByRole('article', { name: 'Master’s degree, Computer Science' })

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByRole('article', { name: 'Master, Informatique' })).toBeInTheDocument()
    expect(education.list).toHaveBeenCalledTimes(1)
  })

  it('keeps an expanded tile open when switching the language', async () => {
    const user = userEvent.setup()
    renderAt('/resume')

    await user.click(await screen.findByRole('button', { name: 'Master’s degree, Computer Science' }))
    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByRole('button', { name: 'Master, Informatique' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Mémoire sur les compilateurs.')).toBeVisible()
  })

  describe('when a page fails to render', () => {
    const malformedDate = fakeEducationRepository([
      { ...masters, period: { start: 'not a date', end: null } },
    ])

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('says so in the page and keeps the navigation', async () => {
      renderAt('/resume', {
        repositories: fakeRepositories({ education: malformedDate }),
      })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This page could not be displayed. Reload to try again.',
      )
      expect(navigation().getByRole('link', { name: 'Home' })).toBeInTheDocument()
    })

    it('says so in French', async () => {
      renderAt('/resume', {
        locale: 'fr',
        repositories: fakeRepositories({ education: malformedDate }),
      })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Cette page n’a pas pu s’afficher. Rechargez pour réessayer.',
      )
    })

    it('shows the next page once the user navigates away', async () => {
      const user = userEvent.setup()
      renderAt('/resume', {
        repositories: fakeRepositories({ education: malformedDate }),
      })
      await screen.findByRole('alert')

      await user.click(navigation().getByRole('link', { name: 'Home' }))

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
      ).toBeInTheDocument()
    })
  })
})
