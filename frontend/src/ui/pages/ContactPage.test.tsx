import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { ContactSendError } from '@/domain/contact/ContactSendError'
import type { Locale } from '@/domain/i18n/Locale'
import {
  contactLinks,
  failingContactRepository,
  fakeContactRepository,
  pendingContactRepository,
  pendingSendContactRepository,
  refusingContactRepository,
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

    it('shows no row of other links when there are only email links', async () => {
      const { container } = renderPage(fakeContactRepository([email]))

      await screen.findByRole('link', { name: 'ada@example.com' })
      expect(container.querySelector('.contact-links__others')).toBeNull()
    })

    it('shows no line of email links when there are none', async () => {
      const { container } = renderPage(fakeContactRepository([github]))

      await linkStartingWith('GitHub')
      expect(container.querySelector('.contact-links__emails')).toBeNull()
    })

    it('shows two links to the same address of different kinds, each once', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderPage(
        fakeContactRepository([
          { kind: 'website', url: 'https://ada.example.com' },
          { kind: 'other', url: 'https://ada.example.com' },
        ]),
      )

      await linkStartingWith('Website')
      const complaints = error.mock.calls.length
      error.mockRestore()
      expect(screen.getAllByRole('link')).toHaveLength(2)
      expect(complaints).toBe(0)
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
    it('asks the browser to check the name, email and message', () => {
      renderPage(fakeContactRepository())

      const name = screen.getByRole('textbox', { name: 'Name' })
      expect(name).toBeRequired()
      expect(name).toHaveAttribute('maxlength', '100')
      const email = screen.getByRole('textbox', { name: 'Email' })
      expect(email).toBeRequired()
      expect(email).toHaveAttribute('type', 'email')
      const message = screen.getByRole('textbox', { name: 'Message' })
      expect(message).toBeRequired()
      expect(message).toHaveAttribute('minlength', '10')
      expect(message).toHaveAttribute('maxlength', '5000')
    })

    it('lets the browser autofill the name and the email', () => {
      renderPage(fakeContactRepository())

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('autocomplete', 'name')
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email')
    })

    it.each<[Locale, string]>([
      ['en', 'Website'],
      ['fr', 'Site web'],
    ])('hides a trap field for bots, labelled %s', (locale, label) => {
      const { container } = renderPage(fakeContactRepository(), locale)

      const trap = screen.getByLabelText(label, { selector: 'input' })
      expect(trap).toHaveAttribute('aria-hidden', 'true')
      expect(trap).toHaveAttribute('tabindex', '-1')
      expect(trap).toHaveAttribute('autocomplete', 'off')
      expect(trap.closest('.visually-hidden')).not.toBeNull()
      expect(container.querySelectorAll('input')).toHaveLength(3)
    })

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

  describe('sending a message', () => {
    /** Fills the form with a valid message, then sends it. */
    async function fillAndSend(user: ReturnType<typeof userEvent.setup>, button = 'Send message') {
      await user.clear(screen.getByRole('textbox', { name: /^(Name|Nom)$/ }))
      await user.type(screen.getByRole('textbox', { name: /^(Name|Nom)$/ }), 'Grace')
      await user.type(screen.getByRole('textbox', { name: /^(Email|E-mail)$/ }), 'grace@example.com')
      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello, I would like to talk.')
      await user.click(screen.getByRole('button', { name: button }))
    }

    it('sends the name, email and message that were typed', async () => {
      const user = userEvent.setup()
      const repository = fakeContactRepository()
      renderPage(repository)

      await fillAndSend(user)

      expect(repository.send).toHaveBeenCalledWith({
        name: 'Grace',
        email: 'grace@example.com',
        message: 'Hello, I would like to talk.',
        website: '',
      })
    })

    it('passes the honeypot field along when it is filled', async () => {
      const user = userEvent.setup()
      const repository = fakeContactRepository()
      renderPage(repository)

      await user.type(screen.getByLabelText('Website', { selector: 'input' }), 'http://spam.example')
      await fillAndSend(user)

      expect(repository.send).toHaveBeenCalledWith(
        expect.objectContaining({ website: 'http://spam.example' }),
      )
    })

    it('disables the button and says it is sending while the message is on its way', async () => {
      const user = userEvent.setup()
      renderPage(pendingSendContactRepository())

      await fillAndSend(user)

      expect(await screen.findByRole('button', { name: 'Sending…' })).toBeDisabled()
    })

    it('says it is sending in French', async () => {
      const user = userEvent.setup()
      renderPage(pendingSendContactRepository(), 'fr')

      await fillAndSend(user, 'Envoyer le message')

      expect(await screen.findByRole('button', { name: 'Envoi…' })).toBeDisabled()
    })

    it('replaces the form with a confirmation naming the address it will reply to', async () => {
      const user = userEvent.setup()
      renderPage(fakeContactRepository())

      await fillAndSend(user)

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Message sent. I’ll reply to grace@example.com.',
      )
      expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument()
    })

    it('confirms in French', async () => {
      const user = userEvent.setup()
      renderPage(fakeContactRepository(), 'fr')

      await fillAndSend(user, 'Envoyer le message')

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Message envoyé. Je vous répondrai à grace@example.com.',
      )
    })

    describe('when the server refuses the values', () => {
      const fieldErrors = {
        name: ['This field may not be blank.'],
        email: ['The server’s own email wording.', 'A second email problem.'],
        message: ['Ensure this field has at least 10 characters.'],
      }

      it.each([
        ['Name', 'Enter your name (100 characters at most).'],
        ['Email', 'Enter a valid email address.'],
        ['Message', 'Write between 10 and 5000 characters.'],
      ])('shows our message for the %s field under it', async (field, error) => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', fieldErrors))

        await fillAndSend(user)

        const input = await screen.findByRole('textbox', { name: field })
        expect(input).toBeInvalid()
        expect(input).toHaveAccessibleDescription(error)
      })

      it.each([
        ['Nom', 'Indiquez votre nom (100 caractères au plus).'],
        ['E-mail', 'Indiquez une adresse e-mail valide.'],
        ['Message', 'Écrivez entre 10 et 5000 caractères.'],
      ])('shows our message for the %s field in French', async (field, error) => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', fieldErrors), 'fr')

        await fillAndSend(user, 'Envoyer le message')

        expect(await screen.findByRole('textbox', { name: field })).toHaveAccessibleDescription(error)
      })

      it('shows none of the wording of the server', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', fieldErrors))

        await fillAndSend(user)

        await screen.findByText('Enter a valid email address.')
        expect(screen.queryByText('The server’s own email wording.')).not.toBeInTheDocument()
        expect(screen.queryByText('A second email problem.')).not.toBeInTheDocument()
        expect(screen.queryByText('This field may not be blank.')).not.toBeInTheDocument()
      })

      it('marks only the fields that have an error', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', { email: ['Enter a valid email address.'] }))

        await fillAndSend(user)

        expect(await screen.findByRole('textbox', { name: 'Email' })).toHaveAttribute(
          'aria-invalid',
          'true',
        )
        expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByRole('textbox', { name: 'Message' })).not.toHaveAttribute(
          'aria-invalid',
          'true',
        )
      })

      it('keeps what was typed', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', fieldErrors))

        await fillAndSend(user)

        await screen.findByText('Enter a valid email address.')
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Grace')
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('grace@example.com')
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
          'Hello, I would like to talk.',
        )
      })
    })

    describe('when too many messages were sent', () => {
      it('says so in an alert above the button, and keeps what was typed', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('throttled'))

        await fillAndSend(user)

        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent('Too many messages; try again in an hour.')
        expect(
          alert.compareDocumentPosition(screen.getByRole('button', { name: 'Send message' })),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
          'Hello, I would like to talk.',
        )
      })

      it('says so in French', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('throttled'), 'fr')

        await fillAndSend(user, 'Envoyer le message')

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Trop de messages ; réessayez dans une heure.',
        )
      })
    })

    describe('when messages cannot be sent', () => {
      it('says so in an alert above the button, and keeps what was typed', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('unavailable'))

        await fillAndSend(user)

        const alert = await screen.findByRole('alert')
        expect(alert).toHaveTextContent('Messages can’t be sent right now; try again later.')
        expect(
          alert.compareDocumentPosition(screen.getByRole('button', { name: 'Send message' })),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Grace')
        expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('grace@example.com')
      })

      it('says so in French', async () => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('unavailable'), 'fr')

        await fillAndSend(user, 'Envoyer le message')

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Les messages ne peuvent pas être envoyés pour le moment ; réessayez plus tard.',
        )
      })
    })

    describe('when the failure is unexpected', () => {
      it('says messages cannot be sent when the request fails for another reason', async () => {
        const user = userEvent.setup()
        const send = vi.fn().mockRejectedValue(new Error('boom'))
        renderPage({ links: () => Promise.resolve(contactLinks), send })

        await fillAndSend(user)

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Messages can’t be sent right now; try again later.',
        )
        expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
      })

      it.each([
        ['no field error', {}],
        ['only an error on a field the form does not show', { website: ['Invalid.'] }],
      ])('says messages cannot be sent when the values are refused with %s', async (_, fieldErrors) => {
        const user = userEvent.setup()
        renderPage(refusingContactRepository('invalid', fieldErrors))

        await fillAndSend(user)

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Messages can’t be sent right now; try again later.',
        )
      })
    })

    it('moves the focus to the confirmation once the message is sent', async () => {
      const user = userEvent.setup()
      renderPage(fakeContactRepository())

      await fillAndSend(user)

      expect(await screen.findByRole('status')).toHaveFocus()
    })

    describe('when sending again after a failure', () => {
      it('clears the field errors of the previous attempt', async () => {
        const user = userEvent.setup()
        const send = vi
          .fn()
          .mockRejectedValueOnce(
            new ContactSendError('invalid', { email: ['Enter a valid email address.'] }),
          )
          .mockImplementationOnce(() => new Promise<void>(() => {}))
        renderPage({ links: () => Promise.resolve(contactLinks), send })
        await fillAndSend(user)
        await screen.findByText('Enter a valid email address.')

        await user.click(screen.getByRole('button', { name: 'Send message' }))

        expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute(
          'aria-invalid',
          'true',
        )
      })

      it('clears the alert of the previous attempt', async () => {
        const user = userEvent.setup()
        const send = vi
          .fn()
          .mockRejectedValueOnce(new ContactSendError('throttled'))
          .mockImplementationOnce(() => new Promise<void>(() => {}))
        renderPage({ links: () => Promise.resolve(contactLinks), send })
        await fillAndSend(user)
        await screen.findByRole('alert')

        await user.click(screen.getByRole('button', { name: 'Send message' }))

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
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
