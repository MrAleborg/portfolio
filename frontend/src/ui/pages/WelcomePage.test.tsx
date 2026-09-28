import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { Profile } from '@/domain/profile/Profile'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { WelcomePage } from '@/ui/pages/WelcomePage'

const profile: Profile = {
  fullName: 'Ada Lovelace',
  headline: { en: 'Analyst', fr: 'Analyste' },
  avatar: {
    src: '/ada.webp',
    alt: { en: 'Portrait of Ada', fr: "Portrait d'Ada" },
  },
}

function renderPage(initialLocale?: Locale) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <WelcomePage profile={profile} />
    </LocaleProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WelcomePage', () => {
  describe('in English', () => {
    it('shows the full name as the main heading', () => {
      renderPage('en')

      expect(
        screen.getByRole('heading', { level: 1, name: 'Ada Lovelace' }),
      ).toBeInTheDocument()
    })

    it('shows the headline', () => {
      renderPage('en')

      expect(screen.getByText('Analyst')).toBeInTheDocument()
    })

    it('shows the avatar', () => {
      renderPage('en')

      expect(
        screen.getByRole('img', { name: 'Portrait of Ada' }),
      ).toHaveAttribute('src', '/ada.webp')
    })

    it('says the site is under construction', () => {
      renderPage('en')

      expect(
        screen.getByText('This site is under construction. Come back soon!'),
      ).toBeInTheDocument()
    })

    it('sets the document language', () => {
      renderPage('en')

      expect(document.documentElement).toHaveAttribute('lang', 'en')
    })
  })

  describe('in French', () => {
    it('shows the headline', () => {
      renderPage('fr')

      expect(screen.getByText('Analyste')).toBeInTheDocument()
    })

    it('shows the avatar', () => {
      renderPage('fr')

      expect(
        screen.getByRole('img', { name: "Portrait d'Ada" }),
      ).toHaveAttribute('src', '/ada.webp')
    })

    it('says the site is under construction', () => {
      renderPage('fr')

      expect(
        screen.getByText('Ce site est en construction. Revenez bientôt !'),
      ).toBeInTheDocument()
    })

    it('sets the document language', () => {
      renderPage('fr')

      expect(document.documentElement).toHaveAttribute('lang', 'fr')
    })
  })

  describe('choosing the language', () => {
    it('defaults to the browser language', () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

      renderPage()

      expect(screen.getByText('Analyste')).toBeInTheDocument()
    })

    it('switches from English to French', async () => {
      const user = userEvent.setup()
      renderPage('en')

      await user.click(screen.getByRole('button', { name: 'Français' }))

      expect(screen.getByText('Analyste')).toBeInTheDocument()
      expect(document.documentElement).toHaveAttribute('lang', 'fr')
    })

    it('switches from French to English', async () => {
      const user = userEvent.setup()
      renderPage('fr')

      await user.click(screen.getByRole('button', { name: 'English' }))

      expect(screen.getByText('Analyst')).toBeInTheDocument()
      expect(document.documentElement).toHaveAttribute('lang', 'en')
    })
  })
})
