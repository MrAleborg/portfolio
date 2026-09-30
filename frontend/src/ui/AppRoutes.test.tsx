import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Locale } from '@/domain/i18n/Locale'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { fakeProfileRepository } from '@/test/fakeProfileRepository'
import { AppRoutes } from '@/ui/AppRoutes'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

interface Options {
  locale?: Locale
  repository?: ProfileRepository
}

function renderAt(
  path: string,
  { locale = 'en', repository = fakeProfileRepository() }: Options = {},
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes profileRepository={repository} />
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

  it('shows the resume page at /resume', () => {
    renderAt('/resume')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toHaveAttribute(
      'aria-current',
      'page',
    )
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
    const repository = fakeProfileRepository()
    renderAt('/', { repository })
    await screen.findByText('Analyst')

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByText('Analyste')).toBeInTheDocument()
    expect(
      navigation('Principale').getByRole('link', { name: 'Accueil' }),
    ).toBeInTheDocument()
    expect(repository.get).toHaveBeenCalledTimes(1)
  })
})
