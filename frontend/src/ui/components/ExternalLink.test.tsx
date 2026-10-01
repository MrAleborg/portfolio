import { render, screen } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderLink(locale: Locale = 'en', context?: string) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ExternalLink href="https://example.com/talk" context={context}>
        See online
      </ExternalLink>
    </LocaleProvider>,
  )
}

describe('ExternalLink', () => {
  it('is a link that goes to the address', () => {
    renderLink()

    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/talk')
  })

  it('opens in a new tab without giving the page access to this one', () => {
    renderLink()

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('tells in English that it opens in a new tab', () => {
    renderLink()

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'See online (opens in a new tab)',
    )
  })

  it('tells in French that it opens in a new tab', () => {
    renderLink('fr')

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'See online (s’ouvre dans un nouvel onglet)',
    )
  })

  it('names what it is about in English, after its text and before the new tab notice', () => {
    renderLink('en', 'Acme Corp')

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'See online: Acme Corp (opens in a new tab)',
    )
  })

  it('names what it is about in French, with a space before the colon', () => {
    renderLink('fr', 'Acme Corp')

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'See online : Acme Corp (s’ouvre dans un nouvel onglet)',
    )
  })
})
