import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { ScientificCommunication } from '@/domain/scientificCommunication/ScientificCommunication'
import {
  fullCommunication,
  minimalCommunication,
} from '@/test/fakeScientificCommunicationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ScientificCommunicationTile } from '@/ui/resume/ScientificCommunicationTile'

function renderTile(communication: ScientificCommunication, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ScientificCommunicationTile communication={communication} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(title: string) {
  await userEvent.setup().click(screen.getByRole('button', { name: title }))
}

describe('ScientificCommunicationTile', () => {
  describe('in English', () => {
    it('is a tile named by the title', () => {
      renderTile(fullCommunication)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Fast compilers' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Fast compilers')
    })

    it('shows the venue', () => {
      renderTile(fullCommunication)

      expect(screen.getByText('ICFP')).toBeInTheDocument()
    })

    it('shows the month in a time element and the kind', () => {
      renderTile(fullCommunication)

      expect(screen.getByRole('time')).toHaveTextContent('May 2023')
      expect(screen.getByRole('time')).toHaveAttribute('datetime', '2023-05')
      expect(screen.getByText('Talk')).toBeInTheDocument()
    })

    it('names every kind', () => {
      const expected = {
        talk: 'Talk',
        poster: 'Poster',
        paper: 'Paper',
        article: 'Article',
      } as const
      for (const [kind, label] of Object.entries(expected)) {
        const { unmount } = renderTile({
          ...fullCommunication,
          kind: kind as ScientificCommunication['kind'],
        })
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      }
    })

    it('shows the authors and a link once expanded', async () => {
      renderTile(fullCommunication)

      await expand('Fast compilers')

      expect(screen.getByText('A. Le Borgne, J. Doe')).toBeVisible()
      const link = screen.getByRole('link', { name: /^See online: Fast compilers/ })
      expect(link).toBeVisible()
      expect(link).toHaveAttribute('href', 'https://example.com/fast-compilers')
    })
  })

  describe('in French', () => {
    it('is a tile named by the title', () => {
      renderTile(fullCommunication, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Compilateurs rapides')
    })

    it('shows the month in a time element and the kind', () => {
      renderTile(fullCommunication, 'fr')

      expect(screen.getByRole('time')).toHaveTextContent('mai 2023')
      expect(screen.getByText('Exposé')).toBeInTheDocument()
    })

    it('names the papers', () => {
      renderTile({ ...fullCommunication, kind: 'paper' }, 'fr')

      expect(screen.getByText('Publication')).toBeInTheDocument()
    })

    it('shows the authors and a link once expanded', async () => {
      renderTile(fullCommunication, 'fr')

      await expand('Compilateurs rapides')

      expect(screen.getByText('A. Le Borgne, J. Doe')).toBeVisible()
      expect(screen.getByRole('link', { name: /^Voir en ligne : Compilateurs rapides/ })).toBeVisible()
    })
  })

  it('leaves out the optional fields that are empty', () => {
    renderTile(minimalCommunication)

    expect(screen.getByRole('article')).toHaveTextContent(
      /^Slow compilersSPLASHOct 2022 Poster$/,
    )
  })

  it('has no expand button without authors and without a link', () => {
    renderTile(minimalCommunication)

    expect(screen.getByRole('article')).toHaveAccessibleName('Slow compilers')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('can be expanded to reach the link when it has no authors', async () => {
    renderTile({ ...minimalCommunication, url: 'https://example.com/poster' })

    await expand('Slow compilers')

    expect(screen.getByRole('link', { name: /^See online: Slow compilers/ })).toBeVisible()
  })
})
