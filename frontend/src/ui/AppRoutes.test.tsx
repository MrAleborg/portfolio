import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import type { Locale } from '@/domain/i18n/Locale'
import { fakeEducationRepository, masters } from '@/test/fakeEducationRepository'
import {
  failingProfileRepository,
  fakeProfileRepository,
  pendingProfileRepository,
} from '@/test/fakeProfileRepository'
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

function header() {
  return within(screen.getByRole('banner'))
}

describe('AppRoutes', () => {
  it('lists Resume then Contact in the navigation, each linking to its page', () => {
    renderAt('/')

    const links = navigation().getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Resume', 'Contact'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/resume',
      '/contact',
    ])
  })

  it('shows the profile name in the header as a link to the home page', async () => {
    renderAt('/resume')

    expect(await header().findByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('keeps the navigation and no site mark while the profile loads', () => {
    renderAt('/resume', {
      repositories: fakeRepositories({ profile: pendingProfileRepository() }),
    })

    expect(header().queryByRole('link', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
  })

  it('shows no site mark but keeps the navigation when the profile fails to load', async () => {
    renderAt('/resume', {
      repositories: fakeRepositories({ profile: failingProfileRepository() }),
    })
    // Lets the rejected request settle, so the assertions see the error state.
    await act(async () => {})

    expect(header().queryByRole('link', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('shows the home page at the root', async () => {
    renderAt('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument()
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

  it('shows the contact page at /contact', async () => {
    renderAt('/contact')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact' }),
    ).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(await screen.findByRole('link', { name: 'ada@example.com' })).toBeInTheDocument()
  })

  it('goes to the contact page from the navigation', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(navigation().getByRole('link', { name: 'Contact' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact' }),
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
      navigation('Principale').getByRole('link', { name: 'CV' }),
    ).toBeInTheDocument()
    expect(
      navigation('Principale').getByRole('link', { name: 'Contact' }),
    ).toBeInTheDocument()
  })

  it('switches the language from the navigation without loading the profile again', async () => {
    const user = userEvent.setup()
    const profile = fakeProfileRepository()
    renderAt('/', { repositories: fakeRepositories({ profile }) })
    await screen.findByText('Analyst')
    const loadsBefore = profile.get.mock.calls.length

    await user.click(
      screen.getByRole('button', { name: 'Français', hidden: true }),
    )

    expect(screen.getByText('Analyste')).toBeInTheDocument()
    expect(
      navigation('Principale').getByRole('link', { name: 'CV' }),
    ).toBeInTheDocument()
    expect(profile.get).toHaveBeenCalledTimes(loadsBefore)
  })

  it('switches the language of the resume without loading the education again', async () => {
    const user = userEvent.setup()
    const education = fakeEducationRepository()
    renderAt('/resume', { repositories: fakeRepositories({ education }) })
    await screen.findByRole('article', { name: 'Master’s degree, Computer Science' })

    await user.click(
      screen.getByRole('button', { name: 'Français', hidden: true }),
    )

    expect(screen.getByRole('article', { name: 'Master, Informatique' })).toBeInTheDocument()
    expect(education.list).toHaveBeenCalledTimes(1)
  })

  it('keeps an expanded tile open when switching the language', async () => {
    const user = userEvent.setup()
    renderAt('/resume')

    await user.click(await screen.findByRole('button', { name: 'Master’s degree, Computer Science' }))
    await user.click(
      screen.getByRole('button', { name: 'Français', hidden: true }),
    )

    expect(screen.getByRole('button', { name: 'Master, Informatique' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Mémoire sur les compilateurs.')).toBeVisible()
  })

  describe('scroll position', () => {
    let scrollTo: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      // jsdom does not scroll: the spy records where the page was sent.
      scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    })

    afterEach(() => {
      scrollTo.mockRestore()
    })

    // Stands in for the browser's back button.
    function BackButton() {
      const navigate = useNavigate()
      return <button onClick={() => navigate(-1)}>Back</button>
    }

    function renderWithHistory(entries: string[]) {
      return render(
        <LocaleProvider initialLocale="en">
          <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
            <AppRoutes repositories={fakeRepositories()} />
            <BackButton />
          </MemoryRouter>
        </LocaleProvider>,
      )
    }

    it('goes back to the top of the page when a navigation link is followed', async () => {
      const user = userEvent.setup()
      renderAt('/resume')

      await user.click(navigation().getByRole('link', { name: 'Contact' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page when the header name is followed', async () => {
      const user = userEvent.setup()
      renderAt('/resume')

      await user.click(await header().findByRole('link', { name: 'Ada Lovelace' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page when a call to action of the home page is followed', async () => {
      const user = userEvent.setup()
      renderAt('/')

      await user.click(await screen.findByRole('link', { name: 'Get in touch' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page each time the link to the current page is followed', async () => {
      const user = userEvent.setup()
      renderAt('/')
      const mark = await header().findByRole('link', { name: 'Ada Lovelace' })

      await user.click(mark)
      await user.click(mark)

      expect(scrollTo).toHaveBeenCalledTimes(2)
      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page each time the active navigation link is followed', async () => {
      const user = userEvent.setup()
      renderAt('/contact')

      await user.click(navigation().getByRole('link', { name: 'Contact' }))
      await user.click(navigation().getByRole('link', { name: 'Contact' }))

      expect(scrollTo).toHaveBeenCalledTimes(2)
      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    describe('on the resume page', () => {
      beforeEach(() => {
        // jsdom has no scrollIntoView either: the resume index uses it to reach a section.
        Element.prototype.scrollIntoView = vi.fn()
      })

      afterEach(() => {
        delete (Element.prototype as Partial<Element>).scrollIntoView
      })

      it('leaves the scroll to the resume index when a section is chosen', async () => {
        const user = userEvent.setup()
        renderAt('/')
        await user.click(navigation().getByRole('link', { name: 'Resume' }))
        const scrollsBefore = scrollTo.mock.calls.length

        await user.click(
          within(screen.getByRole('navigation', { name: 'Resume sections' })).getByRole('link', {
            name: 'Education',
          }),
        )

        expect(scrollsBefore).toBe(1)
        expect(scrollTo).toHaveBeenCalledTimes(scrollsBefore)
      })
    })

    it('leaves the scroll to the browser when going back', async () => {
      const user = userEvent.setup()
      renderWithHistory(['/', '/resume'])

      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
      expect(scrollTo).not.toHaveBeenCalled()
    })
  })

  describe('header scroll state', () => {
    const realIntersectionObserver = globalThis.IntersectionObserver
    let reportSentinel: (isIntersecting: boolean) => void

    beforeEach(() => {
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: IntersectionObserverCallback) {
            reportSentinel = (isIntersecting) =>
              callback(
                [{ isIntersecting } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              )
          }
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() {
            return []
          }
        },
      )
    })

    afterEach(() => {
      // Puts the setup's stub back without dropping the other globals it stubs.
      vi.stubGlobal('IntersectionObserver', realIntersectionObserver)
    })

    it('is not marked as scrolled while the top of the page is in view', () => {
      renderAt('/')

      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled')
    })

    it('is marked as scrolled once the top of the page scrolls out of view', () => {
      renderAt('/')

      act(() => reportSentinel(false))

      expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled')
    })

    it('is no longer marked as scrolled once the top of the page is back in view', () => {
      renderAt('/')
      act(() => reportSentinel(false))

      act(() => reportSentinel(true))

      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled')
    })
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
      expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
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

      await user.click(await header().findByRole('link', { name: 'Ada Lovelace' }))

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
      ).toBeInTheDocument()
    })
  })
})
