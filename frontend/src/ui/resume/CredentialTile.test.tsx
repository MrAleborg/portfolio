import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Credential } from '@/domain/credential/Credential'
import type { Locale } from '@/domain/i18n/Locale'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { CredentialTile } from '@/ui/resume/CredentialTile'

const full: Credential = {
  id: 1,
  name: { en: 'Cloud Practitioner', fr: 'Praticien du cloud' },
  issuer: 'Amazon',
  issueDate: '2023-05-15',
  expirationDate: '2026-05-15',
  credentialUrl: 'https://example.com/credential',
  description: { en: 'Covers the basics.', fr: 'Couvre les bases.' },
}

const minimal: Credential = {
  id: 2,
  name: { en: 'Scrum Master', fr: 'Scrum Master' },
  issuer: 'Scrum.org',
  issueDate: '2022-10-01',
  expirationDate: null,
  credentialUrl: '',
  description: { en: '', fr: '' },
}

function renderTile(credential: Credential, locale: Locale = 'en', children?: string) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <CredentialTile credential={credential}>{children}</CredentialTile>
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(name: string) {
  await userEvent.setup().click(screen.getByRole('button', { name }))
}

describe('CredentialTile', () => {
  describe('in English', () => {
    it('is a tile named by the credential', () => {
      renderTile(full)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Cloud Practitioner' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Cloud Practitioner')
    })

    it('shows the issuer', () => {
      renderTile(full)

      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    it('shows when it was issued and when it expires, in time elements', () => {
      renderTile(full)

      const [issued, expires] = screen.getAllByRole('time')
      expect(issued).toHaveTextContent('May 2023')
      expect(issued).toHaveAttribute('datetime', '2023-05')
      expect(expires).toHaveTextContent('May 2026')
      expect(screen.getByRole('article')).toHaveTextContent('Issued May 2023')
      expect(screen.getByRole('article')).toHaveTextContent('Expires May 2026')
    })

    it('does not show an expiration when it never expires', () => {
      renderTile(minimal)

      expect(screen.getByText(/Issued/)).toBeInTheDocument()
      expect(screen.queryByText(/Expires/)).toBeNull()
      expect(screen.getAllByRole('time')).toHaveLength(1)
    })

    it('shows the description and a link to the credential once expanded', async () => {
      renderTile(full)

      await expand('Cloud Practitioner')

      expect(screen.getByText('Covers the basics.')).toBeVisible()
      const link = screen.getByRole('link', { name: /^See credential: Cloud Practitioner/ })
      expect(link).toBeVisible()
      expect(link).toHaveAttribute('href', 'https://example.com/credential')
    })

    it('shows each paragraph of the description apart', async () => {
      renderTile({
        ...full,
        description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
      })

      await expand('Cloud Practitioner')

      expect(screen.getByText('First paragraph.')).toBeVisible()
      expect(screen.getByText('Second paragraph.')).toBeVisible()
    })

    it('shows its children in the details', async () => {
      renderTile(minimal, 'en', 'Extra details')

      await expand('Scrum Master')

      expect(screen.getByText('Extra details')).toBeVisible()
    })
  })

  describe('in French', () => {
    it('is a tile named by the credential', () => {
      renderTile(full, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Praticien du cloud')
    })

    it('shows when it was issued and when it expires', () => {
      renderTile(full, 'fr')

      expect(screen.getByRole('article')).toHaveTextContent('Obtenue en mai 2023')
      expect(screen.getByRole('article')).toHaveTextContent('Expire en mai 2026')
    })

    it('shows the description and a link to the credential once expanded', async () => {
      renderTile(full, 'fr')

      await expand('Praticien du cloud')

      expect(screen.getByText('Couvre les bases.')).toBeVisible()
      expect(screen.getByRole('link', { name: /^Voir le certificat : Praticien du cloud/ })).toBeVisible()
    })
  })

  it('has no expand button when there is nothing to show in the details', () => {
    renderTile(minimal)

    expect(screen.getByRole('article')).toHaveAccessibleName('Scrum Master')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('can be expanded to reach the link when it has no description', async () => {
    renderTile({ ...minimal, credentialUrl: 'https://example.com/scrum' })

    await expand('Scrum Master')

    expect(screen.getByRole('link', { name: /^See credential: Scrum Master/ })).toBeVisible()
  })
})
