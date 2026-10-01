import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Hobby } from '@/domain/hobby/Hobby'
import type { Locale } from '@/domain/i18n/Locale'
import { chess, climbing } from '@/test/fakeHobbyRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { HobbyTile } from '@/ui/resume/HobbyTile'

function renderTile(hobby: Hobby, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <HobbyTile hobby={hobby} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(name: string) {
  await userEvent.setup().click(screen.getByRole('button', { name }))
}

describe('HobbyTile', () => {
  describe('in English', () => {
    it('is a tile named by the hobby', () => {
      renderTile(climbing)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Climbing' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Climbing')
    })

    it('shows the description once expanded', async () => {
      renderTile(climbing)

      await expand('Climbing')

      expect(screen.getByText('Bouldering twice a week.')).toBeVisible()
    })

    it('has no expand button without a description', () => {
      renderTile(chess)

      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.getByRole('article')).toHaveTextContent(/^Chess$/)
    })
  })

  describe('in French', () => {
    it('is a tile named by the hobby', () => {
      renderTile(climbing, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Escalade')
    })

    it('shows the description once expanded', async () => {
      renderTile(climbing, 'fr')

      await expand('Escalade')

      expect(screen.getByText('De la bloc deux fois par semaine.')).toBeVisible()
    })

    it('has no expand button without a description', () => {
      renderTile(chess, 'fr')

      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.getByRole('article')).toHaveTextContent(/^Échecs$/)
    })
  })

  it('shows each paragraph of the description apart', async () => {
    renderTile({
      ...climbing,
      description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
    })

    await expand('Climbing')

    expect(screen.getByText('First paragraph.')).toBeVisible()
    expect(screen.getByText('Second paragraph.')).toBeVisible()
  })
})
