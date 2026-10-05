import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { Locale } from '@/domain/i18n/Locale'
import {
  failingContactRepository,
  fakeContactRepository,
  pendingContactRepository,
} from '@/test/fakeContactRepository'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ContactPage } from '@/ui/pages/ContactPage'

function renderPage(repository: ContactRepository, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ContactPage contactRepository={repository} />
    </LocaleProvider>,
  )
}

/** The link whose accessible name starts with the given text (it may be followed by a hint). */
function linkStartingWith(text: string) {
  return screen.findByRole('link', { name: (name) => name.startsWith(text) })
}

const email: ContactLink = { kind: 'email', url: 'mailto:ada@example.com' }
const linkedin: ContactLink = { kind: 'linkedin', url: 'https://www.linkedin.com/in/ada' }
const github: ContactLink = { kind: 'github', url: 'https://github.com/ada' }
const website: ContactLink = { kind: 'website', url: 'https://ada.example.com' }

describe('ContactPage', () => {
  describe('introduction', () => {
    it('shows the title as the main heading', () => {
      renderPage(fakeContactRepository())

      expect(screen.getByRole('heading', { level: 1, name: 'Contact' })).toBeInTheDocument()
    })

    it('invites the visitor to write or to look elsewhere', () => {
      renderPage(fakeContactRepository())

      expect(screen.getByText('Write to me, or find me elsewhere.')).toBeInTheDocument()
    })

    it('says so in French', () => {
      renderPage(fakeContactRepository(), 'fr')

      expect(screen.getByRole('heading', { level: 1, name: 'Contact' })).toBeInTheDocument()
      expect(screen.getByText('Écrivez-moi, ou retrouvez-moi ailleurs.')).toBeInTheDocument()
    })
  })

  describe('links', () => {
    it('says the links are loading', () => {
      renderPage(pendingContactRepository())

      expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    })

    it('shows the links in the order the repository returns them', async () => {
      renderPage(fakeContactRepository([email, linkedin, github, website]))

      await linkStartingWith('GitHub')
      expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
        'mailto:ada@example.com',
        'https://www.linkedin.com/in/ada',
        'https://github.com/ada',
        'https://ada.example.com',
      ])
    })

    it('shows email links first, then the other links in the order received', async () => {
      renderPage(fakeContactRepository([github, email, linkedin, website]))

      await linkStartingWith('GitHub')
      expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
        'mailto:ada@example.com',
        'https://github.com/ada',
        'https://www.linkedin.com/in/ada',
        'https://ada.example.com',
      ])
    })

    it('shows an email link as its address, without the mailto scheme', async () => {
      renderPage(fakeContactRepository([email]))

      expect(await screen.findByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
        'href',
        'mailto:ada@example.com',
      )
    })

    it('shows an email link large, and the other links regular', async () => {
      renderPage(fakeContactRepository([email, github]))

      expect(await screen.findByRole('link', { name: 'ada@example.com' })).toHaveClass(
        'contact-links__link--large',
      )
      expect(await linkStartingWith('GitHub')).not.toHaveClass('contact-links__link--large')
    })

    it.each<[string, ContactLink]>([
      ['LinkedIn', linkedin],
      ['GitHub', github],
      ['Website', website],
    ])('names the %s link in English', async (label, link) => {
      renderPage(fakeContactRepository([link]))

      expect(await linkStartingWith(label)).toHaveAttribute('href', link.url)
    })

    it('names a website link in French', async () => {
      renderPage(fakeContactRepository([website]), 'fr')

      expect(await linkStartingWith('Site web')).toHaveAttribute('href', website.url)
    })

    it.each([
      ['https://www.example.com/me/', 'example.com/me'],
      ['http://blog.example.org/', 'blog.example.org'],
      ['https://example.com/a/b', 'example.com/a/b'],
    ])('shows an other link %s as its address without scheme, www. or trailing slash', async (url, text) => {
      renderPage(fakeContactRepository([{ kind: 'other', url }]))

      expect(await linkStartingWith(text)).toHaveAttribute('href', url)
    })

    it('says when the links could not be loaded, and still shows the form', async () => {
      renderPage(failingContactRepository())

      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    })
  })

  describe('form', () => {
    it('has labelled fields and a send button in English', () => {
      renderPage(fakeContactRepository())

      expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    })

    it('has labelled fields and a send button in French', () => {
      renderPage(fakeContactRepository(), 'fr')

      expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    })
  })

  it('switches the texts when the language changes, without loading the links again', async () => {
    const user = userEvent.setup()
    const repository = fakeContactRepository([email, website])
    render(
      <LocaleProvider initialLocale="en">
        <LanguageSwitch />
        <ContactPage contactRepository={repository} />
      </LocaleProvider>,
    )
    await linkStartingWith('Website')

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByText('Écrivez-moi, ou retrouvez-moi ailleurs.')).toBeInTheDocument()
    expect(await linkStartingWith('Site web')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    expect(repository.links).toHaveBeenCalledTimes(1)
  })
})
