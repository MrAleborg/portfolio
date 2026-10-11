import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  it('is marked as an external link, so the print styles can reach it', () => {
    renderLink()

    expect(screen.getByRole('link')).toHaveClass('external-link')
  })

  describe('styles', () => {
    // jsdom does not render ::after, so the printed address is checked in the stylesheet itself.
    function css() {
      return readFileSync(join(import.meta.dirname, 'ExternalLink.css'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
    }

    it('prints the address in parentheses after the link', () => {
      expect(css()).toMatch(
        /@media\s+print\s*\{\s*\.external-link::after\s*\{[^}]*content:\s*' \(' attr\(href\) '\)'/,
      )
    })

    it('lets a long address wrap anywhere', () => {
      expect(css()).toMatch(/\.external-link::after\s*\{[^}]*overflow-wrap:\s*anywhere/)
    })

    it('adds nothing on screen', () => {
      expect(css().replace(/@media\s+print\s*\{[\s\S]*\}\s*$/, '').trim()).toBe('')
    })
  })
})
