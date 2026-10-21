import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { fakeEducationRepository, masters } from '@/test/fakeEducationRepository'
import {
  failingProfileRepository,
  fakeProfileRepository,
  pendingProfileRepository,
} from '@/test/fakeProfileRepository'
import { fakeRepositories } from '@/test/fakeRepositories'
import { AppRoutes } from '@/ui/AppRoutes'
import type { Repositories } from '@/ui/Repositories'

interface Options {
  repositories?: Repositories
}

// Shows the address the app is at, as the browser's address bar would.
function Address() {
  const { pathname, search, hash } = useLocation()
  return <p data-testid="address">{pathname + search + hash}</p>
}

function address() {
  return screen.getByTestId('address').textContent
}

function renderAt(path: string, { repositories = fakeRepositories() }: Options = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes repositories={repositories} />
      <Address />
    </MemoryRouter>,
  )
}

// Stands in for the browser's back button and address bar.
function BrowserControls() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate('/')}>Open the root</button>
    </>
  )
}

function renderWithHistory(entries: string[]) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <AppRoutes repositories={fakeRepositories()} />
      <Address />
      <BrowserControls />
    </MemoryRouter>,
  )
}

function switchLanguage(to: 'Français' | 'English') {
  return userEvent.setup().click(screen.getByRole('button', { name: to, hidden: true }))
}

function navigation(name = 'Main') {
  return within(screen.getByRole('navigation', { name }))
}

function header() {
  return within(screen.getByRole('banner'))
}

describe('AppRoutes', () => {
  it('lists Resume then Contact in the navigation, each linking to its page', () => {
    renderAt('/en/')

    const links = navigation().getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Resume', 'Contact'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/en/resume',
      '/en/contact',
    ])
  })

  it('shows the profile name in the header as a link to the home page', async () => {
    renderAt('/en/resume')

    expect(await header().findByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      '/en/',
    )
  })

  it('keeps the navigation and no site mark while the profile loads', () => {
    renderAt('/en/resume', {
      repositories: fakeRepositories({ profile: pendingProfileRepository() }),
    })

    expect(header().queryByRole('link', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
  })

  it('shows no site mark but keeps the navigation when the profile fails to load', async () => {
    renderAt('/en/resume', {
      repositories: fakeRepositories({ profile: failingProfileRepository() }),
    })
    // Lets the rejected request settle, so the assertions see the error state.
    await act(async () => {})

    expect(header().queryByRole('link', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('shows the home page at the root', async () => {
    renderAt('/en/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument()
  })

  it('shows the resume page at /resume', async () => {
    renderAt('/en/resume')

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
    renderAt('/en/contact')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact' }),
    ).toBeInTheDocument()
    expect(navigation().getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      within(screen.getByRole('main')).getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument()
  })

  it('goes to the contact page from the navigation', async () => {
    const user = userEvent.setup()
    renderAt('/en/')

    await user.click(navigation().getByRole('link', { name: 'Contact' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact' }),
    ).toBeInTheDocument()
  })

  it('goes to the resume page from the navigation', async () => {
    const user = userEvent.setup()
    renderAt('/en/')

    await user.click(navigation().getByRole('link', { name: 'Resume' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Resume' }),
    ).toBeInTheDocument()
  })

  describe('unknown addresses', () => {
    it.each([
      ['/nowhere', 'en', 'Page not found', "This page doesn't exist.", 'Back to home'],
      ['/en/nowhere', 'en', 'Page not found', "This page doesn't exist.", 'Back to home'],
      ['/fr/nowhere', 'fr', 'Page introuvable', "Cette page n'existe pas.", "Retour à l'accueil"],
      ['/fr/resume/nowhere', 'fr', 'Page introuvable', "Cette page n'existe pas.", "Retour à l'accueil"],
      ['/de/resume', 'en', 'Page not found', "This page doesn't exist.", 'Back to home'],
    ])('shows the not-found page at %s in %s', (path, lang, heading, text, back) => {
      renderAt(path)

      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
      expect(within(screen.getByRole('main')).getByText(text)).toBeInTheDocument()
      expect(within(screen.getByRole('main')).getByRole('link', { name: back })).toHaveAttribute(
        'href',
        `/${lang}/`,
      )
      expect(document.documentElement).toHaveAttribute('lang', lang)
      expect(address()).toBe(path)
    })

    it('keeps the layout around it', () => {
      renderAt('/fr/nowhere')

      expect(navigation('Principale').getByRole('link', { name: 'CV' })).toHaveAttribute(
        'href',
        '/fr/resume',
      )
    })

    it('shows it in English whatever the saved preference, as the address names no Locale', () => {
      localStorage.setItem('locale', 'fr')

      renderAt('/nowhere')

      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    })

    it('goes back to the home page of its Locale', async () => {
      renderAt('/fr/nowhere')

      await userEvent.setup().click(screen.getByRole('link', { name: "Retour à l'accueil" }))

      expect(address()).toBe('/fr/')
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
      ).toBeInTheDocument()
    })

    it.each([
      ['/nowhere', 'Français', '/fr/nowhere', 'Page introuvable'],
      ['/en/nowhere', 'Français', '/fr/nowhere', 'Page introuvable'],
      ['/fr/nowhere', 'English', '/en/nowhere', 'Page not found'],
    ])('switches the language of %s', async (path, to, switched, heading) => {
      renderAt(path)

      await switchLanguage(to as 'Français' | 'English')

      expect(address()).toBe(switched)
      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    })
  })

  describe('locale addresses', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it.each([
      ['/fr/', 'Analyste'],
      ['/en/', 'Analyst'],
    ])('shows %s in its own language', async (path, headline) => {
      renderAt(path)

      expect(await screen.findByText(headline)).toBeInTheDocument()
    })

    it.each([
      ['/fr/resume', 'CV', 'fr'],
      ['/en/resume', 'Resume', 'en'],
      ['/fr/contact', 'Contact', 'fr'],
      ['/en/contact', 'Contact', 'en'],
    ])('shows %s in its own language, whatever the saved preference', (path, heading, lang) => {
      localStorage.setItem('locale', lang === 'fr' ? 'en' : 'fr')

      renderAt(path)

      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
      expect(
        screen.getByRole('navigation', { name: lang === 'fr' ? 'Principale' : 'Main' }),
      ).toBeInTheDocument()
    })

    it('sets the page language to the locale of the address', () => {
      renderAt('/fr/resume')

      expect(document.documentElement).toHaveAttribute('lang', 'fr')
    })

    it('ignores a saved language that is not supported', () => {
      localStorage.setItem('locale', 'de')
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

      renderAt('/')

      expect(address()).toBe('/fr/')
    })

    it('opens the root in the saved language', () => {
      localStorage.setItem('locale', 'fr')
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])

      renderAt('/')

      expect(address()).toBe('/fr/')
    })

    it('opens the root in the browser language when nothing is saved', () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

      renderAt('/')

      expect(address()).toBe('/fr/')
    })

    it('opens the root in English when the browser language is not supported', () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE'])

      renderAt('/')

      expect(address()).toBe('/en/')
    })

    it.each(['resume', 'contact'])('sends the old link /%s to the English page', (page) => {
      localStorage.setItem('locale', 'fr')

      renderAt(`/${page}`)

      expect(address()).toBe(`/en/${page}`)
    })

    it('keeps the search and hash of an old link', () => {
      renderAt('/resume?ref=cv#experience')

      expect(address()).toBe('/en/resume?ref=cv#experience')
    })

    it('opens the root in the language switched to since the app loaded', async () => {
      renderWithHistory(['/en/resume'])
      await switchLanguage('Français')

      await userEvent.setup().click(screen.getByRole('button', { name: 'Open the root' }))

      expect(address()).toBe('/fr/')
    })

    it('works when the storage is unavailable', async () => {
      const denied = () => {
        throw new DOMException('denied', 'SecurityError')
      }
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied)
      renderAt('/')
      expect(address()).toBe('/en/')

      await switchLanguage('Français')

      expect(address()).toBe('/fr/')
    })

    it('does not add a history entry when switching language', async () => {
      renderWithHistory(['/en/', '/en/resume'])

      await switchLanguage('Français')
      await userEvent.setup().click(screen.getByRole('button', { name: 'Back' }))

      expect(address()).toBe('/en/')
    })

    it('does not change the saved language when a link is opened', () => {
      localStorage.setItem('locale', 'en')
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

      renderAt('/fr/').unmount()

      renderAt('/')

      expect(address()).toBe('/en/')
    })

    it('switches to the same page in the other language', async () => {
      renderAt('/en/resume')

      await switchLanguage('Français')

      expect(address()).toBe('/fr/resume')
      expect(document.documentElement).toHaveAttribute('lang', 'fr')
      expect(navigation('Principale').getByRole('link', { name: 'CV' })).toHaveAttribute(
        'href',
        '/fr/resume',
      )
    })

    it('switches from the home page to the home page of the other language', async () => {
      renderAt('/fr/')

      await switchLanguage('English')

      expect(address()).toBe('/en/')
    })

    it('remembers the language switched to for the next visit to the root', async () => {
      const first = renderAt('/en/contact')
      await switchLanguage('Français')
      first.unmount()

      renderAt('/')

      expect(address()).toBe('/fr/')
    })

    it('stays where it was scrolled when switching language', async () => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      renderAt('/en/resume')
      scrollTo.mockClear()

      await switchLanguage('Français')

      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('links the home page calls to action in the current language', async () => {
      renderAt('/fr/')

      expect(await screen.findByRole('link', { name: 'Me contacter' })).toHaveAttribute(
        'href',
        '/fr/contact',
      )
    })
  })

  it('labels the navigation in French', () => {
    renderAt('/fr/')

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
    renderAt('/en/resume', { repositories: fakeRepositories({ education }) })
    await screen.findByRole('article', { name: 'Master’s degree, Computer Science' })

    await user.click(
      screen.getByRole('button', { name: 'Français', hidden: true }),
    )

    expect(screen.getByRole('article', { name: 'Master, Informatique' })).toBeInTheDocument()
    expect(education.list).toHaveBeenCalledTimes(1)
  })

  it('keeps an expanded tile open when switching the language', async () => {
    const user = userEvent.setup()
    renderAt('/en/resume')

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

  describe('tab title', () => {
    beforeEach(() => {
      document.title = ''
    })

    it.each([
      ['/en/', 'Ada Lovelace – Analyst'],
      ['/fr/', 'Ada Lovelace – Analyste'],
      ['/en/resume', 'Resume – Ada Lovelace'],
      ['/fr/resume', 'CV – Ada Lovelace'],
      ['/en/contact', 'Contact – Ada Lovelace'],
      ['/fr/contact', 'Contact – Ada Lovelace'],
      ['/en/nowhere', 'Page not found – Ada Lovelace'],
      ['/fr/nowhere', 'Page introuvable – Ada Lovelace'],
      ['/nowhere', 'Page not found – Ada Lovelace'],
      ['/ab', 'Page not found – Ada Lovelace'],
      ['/abresume', 'Page not found – Ada Lovelace'],
      ['/en/constructor', 'Page not found – Ada Lovelace'],
      ['/en/resume/', 'Resume – Ada Lovelace'],
    ])('is the page summary title at %s once the profile has loaded', async (path, title) => {
      renderAt(path)

      await waitFor(() => expect(document.title).toBe(title))
    })

    it("leaves the shell's title alone until the profile loads", async () => {
      document.title = 'Shell title'
      renderAt('/fr/resume', {
        repositories: fakeRepositories({ profile: pendingProfileRepository() }),
      })
      await screen.findByRole('heading', { level: 1, name: 'CV' })

      expect(document.title).toBe('Shell title')
    })

    it('is the generic title when the profile fails to load', async () => {
      document.title = 'Shell title'
      renderAt('/fr/resume', {
        repositories: fakeRepositories({ profile: failingProfileRepository() }),
      })

      await waitFor(() => expect(document.title).toBe('Alexandre Le Borgne'))
    })

    it.each(['/EN/resume', '/en/RESUME', '/RESUME', '/CONTACT'])(
      'is the not-found title at %s, as nginx does not serve it',
      async (path) => {
        renderAt(path)

        expect(
          await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
        ).toBeInTheDocument()
        await waitFor(() => expect(document.title).toBe('Page not found – Ada Lovelace'))
      },
    )

    it('follows the visitor from page to page', async () => {
      renderAt('/en/')
      await waitFor(() => expect(document.title).toBe('Ada Lovelace – Analyst'))

      await userEvent.setup().click(navigation().getByRole('link', { name: 'Contact' }))

      await waitFor(() => expect(document.title).toBe('Contact – Ada Lovelace'))
    })

    it('follows a language switch', async () => {
      renderAt('/en/resume')
      await waitFor(() => expect(document.title).toBe('Resume – Ada Lovelace'))

      await switchLanguage('Français')

      await waitFor(() => expect(document.title).toBe('CV – Ada Lovelace'))
    })
  })

  describe('footer', () => {
    it.each(['/en/', '/en/resume', '/en/contact'])('is the only content information of %s', async (path) => {
      renderAt(path)

      await screen.findByRole('contentinfo')

      expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
    })

    it('comes after the main content', async () => {
      renderAt('/en/')

      const footer = await screen.findByRole('contentinfo')

      expect(screen.getByRole('main').compareDocumentPosition(footer)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    })

    it('does not load the profile a second time', async () => {
      const profile = fakeProfileRepository()
      renderAt('/en/contact', { repositories: fakeRepositories({ profile }) })

      expect(await within(await screen.findByRole('contentinfo')).findByText(/^© \d{4} Ada Lovelace$/)).toBeInTheDocument()

      expect(profile.get).toHaveBeenCalledTimes(1)
    })

    it.each(['/en/', '/en/resume', '/en/contact'])('shows the contact links and the copyright on %s', async (path) => {
      renderAt(path)
      const footer = within(await screen.findByRole('contentinfo'))

      expect(await footer.findByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
        'href',
        'mailto:ada@example.com',
      )
      expect(footer.getByRole('link', { name: /^GitHub/ })).toBeInTheDocument()
      expect(await footer.findByText(/^© \d{4} Ada Lovelace$/)).toBeInTheDocument()
    })

    it('lists the contact links on /contact in the footer only, not in the page itself', async () => {
      renderAt('/en/contact')
      const footer = within(await screen.findByRole('contentinfo'))
      await footer.findByRole('link', { name: 'ada@example.com' })

      expect(within(screen.getByRole('main')).queryAllByRole('link')).toHaveLength(0)
    })

    it('labels its links in French', async () => {
      renderAt('/fr/')

      expect(
        await screen.findByRole('navigation', { name: 'Liens de contact' }),
      ).toBeInTheDocument()
    })
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

    it('goes back to the top of the page when a navigation link is followed', async () => {
      const user = userEvent.setup()
      renderAt('/en/resume')

      await user.click(navigation().getByRole('link', { name: 'Contact' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page when the header name is followed', async () => {
      const user = userEvent.setup()
      renderAt('/en/resume')

      await user.click(await header().findByRole('link', { name: 'Ada Lovelace' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page when a call to action of the home page is followed', async () => {
      const user = userEvent.setup()
      renderAt('/en/')

      await user.click(await screen.findByRole('link', { name: 'Get in touch' }))

      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page each time the link to the current page is followed', async () => {
      const user = userEvent.setup()
      renderAt('/en/')
      const mark = await header().findByRole('link', { name: 'Ada Lovelace' })

      await user.click(mark)
      await user.click(mark)

      expect(scrollTo).toHaveBeenCalledTimes(2)
      expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    })

    it('goes back to the top of the page each time the active navigation link is followed', async () => {
      const user = userEvent.setup()
      renderAt('/en/contact')

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
        renderAt('/en/')
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
      renderWithHistory(['/en/', '/en/resume'])

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
      renderAt('/en/')

      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled')
    })

    it('is marked as scrolled once the top of the page scrolls out of view', () => {
      renderAt('/en/')

      act(() => reportSentinel(false))

      expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled')
    })

    it('is no longer marked as scrolled once the top of the page is back in view', () => {
      renderAt('/en/')
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
      renderAt('/en/resume', {
        repositories: fakeRepositories({ education: malformedDate }),
      })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This page could not be displayed. Reload to try again.',
      )
      expect(navigation().getByRole('link', { name: 'Resume' })).toBeInTheDocument()
    })

    it('says so in French', async () => {
      renderAt('/fr/resume', {
        repositories: fakeRepositories({ education: malformedDate }),
      })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Cette page n’a pas pu s’afficher. Rechargez pour réessayer.',
      )
    })

    it('shows the next page once the user navigates away', async () => {
      const user = userEvent.setup()
      renderAt('/en/resume', {
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
