import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderSwitch(initialLocale?: Locale) {
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <LanguageSwitch />
    </LocaleProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LanguageSwitch', () => {
  it('defaults to the browser language', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

    renderSwitch()

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'fr')
  })

  it('names the other language in that language', () => {
    renderSwitch('en')

    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute(
      'lang',
      'fr',
    )
  })

  it('switches from English to French', async () => {
    const user = userEvent.setup()
    renderSwitch('en')

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'fr')
  })

  it('switches from French to English', async () => {
    const user = userEvent.setup()
    renderSwitch('fr')

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('button', { name: 'Français' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })
})
