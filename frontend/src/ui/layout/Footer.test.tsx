import { act, render, screen, within } from '@testing-library/react'
import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { Locale } from '@/domain/i18n/Locale'
import {
  contactLinks,
  failingContactRepository,
  fakeContactRepository,
  pendingContactRepository,
} from '@/test/fakeContactRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { Footer } from '@/ui/layout/Footer'

interface Options {
  fullName?: string
  contact?: ContactRepository
  locale?: Locale
}

function renderFooter(options: Options = {}) {
  // An explicit `fullName: undefined` means the name is not known, so it is not defaulted.
  const fullName = 'fullName' in options ? options.fullName : 'Ada Lovelace'
  const { contact = fakeContactRepository(), locale = 'en' } = options
  return render(
    <LocaleProvider initialLocale={locale}>
      <Footer fullName={fullName} contactRepository={contact} />
    </LocaleProvider>,
  )
}

/** Lets the rejected requests settle, so the assertions see the error state. */
async function settle() {
  await act(async () => {})
}

const website: ContactLink = { kind: 'website', url: 'https://www.ada.example.com/' }
const other: ContactLink = { kind: 'other', url: 'https://mastodon.example/@ada' }

describe('Footer', () => {
  describe('copyright', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2031-06-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows the current year and the name of the owner', async () => {
      renderFooter()

      expect(await screen.findByText('© 2031 Ada Lovelace')).toBeInTheDocument()
    })
  })

  describe('contact links', () => {
    it('shows the email as a mail link written as its address', async () => {
      renderFooter()

      expect(await screen.findByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
        'href',
        'mailto:ada@example.com',
      )
    })

    it('opens the other links in a new tab, named like on the contact page', async () => {
      renderFooter()

      const linkedin = await screen.findByRole('link', { name: /^LinkedIn/ })
      expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/ada')
      expect(linkedin).toHaveAttribute('target', '_blank')
      const github = screen.getByRole('link', { name: /^GitHub/ })
      expect(github).toHaveAttribute('href', 'https://github.com/ada')
      expect(github).toHaveAttribute('target', '_blank')
    })

    it('names a website "Website" and any other link by its address', async () => {
      renderFooter({ contact: fakeContactRepository([website, other]) })

      expect(await screen.findByRole('link', { name: /^Website/ })).toHaveAttribute(
        'href',
        'https://www.ada.example.com/',
      )
      expect(screen.getByRole('link', { name: /^mastodon\.example\/@ada/ })).toHaveAttribute(
        'href',
        'https://mastodon.example/@ada',
      )
    })

    it('names a website in French', async () => {
      renderFooter({ contact: fakeContactRepository([website]), locale: 'fr' })

      expect(await screen.findByRole('link', { name: /^Site web/ })).toBeInTheDocument()
    })

    it('groups the links in a navigation named "Contact links"', async () => {
      renderFooter()

      const nav = await screen.findByRole('navigation', { name: 'Contact links' })

      expect(within(nav).getAllByRole('link')).toHaveLength(3)
    })

    it('names the navigation in French', async () => {
      renderFooter({ locale: 'fr' })

      expect(
        await screen.findByRole('navigation', { name: 'Liens de contact' }),
      ).toBeInTheDocument()
    })
  })

  describe('contact link icons', () => {
    function iconOf(link: HTMLElement) {
      return link.querySelector('svg')
    }

    it('shows an icon, hidden from assistive technology, in the email, LinkedIn, GitHub and website links', async () => {
      renderFooter({
        contact: fakeContactRepository([...contactLinks, website]),
      })

      const links = [
        await screen.findByRole('link', { name: 'ada@example.com' }),
        screen.getByRole('link', { name: /^LinkedIn/ }),
        screen.getByRole('link', { name: /^GitHub/ }),
        screen.getByRole('link', { name: /^Website/ }),
      ]

      for (const link of links) {
        expect(iconOf(link)).toHaveAttribute('aria-hidden', 'true')
      }
    })

    it('shows no icon in a link of another kind, only its label', async () => {
      renderFooter({ contact: fakeContactRepository([other]) })

      const link = await screen.findByRole('link', { name: /^mastodon\.example\/@ada/ })

      expect(iconOf(link)).toBeNull()
    })

    it('puts each icon before its label', async () => {
      renderFooter({
        contact: fakeContactRepository([...contactLinks, website]),
      })

      const links = [
        await screen.findByRole('link', { name: 'ada@example.com' }),
        screen.getByRole('link', { name: /^LinkedIn/ }),
        screen.getByRole('link', { name: /^GitHub/ }),
        screen.getByRole('link', { name: /^Website/ }),
      ]

      for (const link of links) {
        expect(link.firstChild).toBe(iconOf(link))
      }
    })

    it('keeps the links named by their label alone, icons or not', async () => {
      renderFooter({
        contact: fakeContactRepository([...contactLinks, website]),
      })

      expect(await screen.findByRole('link', { name: 'ada@example.com' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'LinkedIn (opens in a new tab)' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'GitHub (opens in a new tab)' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Website (opens in a new tab)' })).toBeInTheDocument()
    })
  })

  describe('while the data loads or fails', () => {
    it('shows the copyright but no links, status or alert while the links load', () => {
      renderFooter({ contact: pendingContactRepository() })

      expect(screen.getByText(/^© \d{4} Ada Lovelace$/)).toBeInTheDocument()
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows the copyright but no links, status or alert when the links fail to load', async () => {
      renderFooter({ contact: failingContactRepository() })
      await settle()

      expect(screen.getByText(/^© \d{4} Ada Lovelace$/)).toBeInTheDocument()
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows the links but no copyright, status or alert without a name', async () => {
      renderFooter({ fullName: undefined })

      expect(await screen.findByRole('link', { name: 'ada@example.com' })).toBeInTheDocument()
      expect(screen.queryByText(/©/)).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows nothing, not even an empty band, while the links load and there is no name', () => {
      renderFooter({ fullName: undefined, contact: pendingContactRepository() })

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    })

    it('shows nothing, without status or alert, when the links fail and there is no name', async () => {
      renderFooter({ fullName: undefined, contact: failingContactRepository() })
      await settle()

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
