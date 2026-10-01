import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import { ThemeSwitch } from '@/ui/components/ThemeSwitch'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function setOsPrefersDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: dark, media: query }) as MediaQueryList,
  )
}

function renderSwitch(locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ThemeSwitch />
    </LocaleProvider>,
  )
}

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('ThemeSwitch', () => {
  it('offers light mode when nothing is stored and the OS prefers dark', () => {
    setOsPrefersDark(true)

    renderSwitch()

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
  })

  it('offers dark mode when nothing is stored and the OS prefers light', () => {
    setOsPrefersDark(false)

    renderSwitch()

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
  })

  it('prefers the stored theme over the OS', () => {
    setOsPrefersDark(true)
    localStorage.setItem('theme', 'light')

    renderSwitch()

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
  })

  it('ignores an invalid stored theme and follows the OS', () => {
    setOsPrefersDark(true)
    localStorage.setItem('theme', 'blue')

    renderSwitch()

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
  })

  it('switches to dark on click and remembers it', async () => {
    const user = userEvent.setup()
    setOsPrefersDark(false)
    renderSwitch()

    await user.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    )

    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('switches back to light on a second click and remembers it', async () => {
    const user = userEvent.setup()
    setOsPrefersDark(true)
    renderSwitch()

    await user.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    )

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('labels the action in French', () => {
    setOsPrefersDark(false)

    renderSwitch('fr')

    expect(
      screen.getByRole('button', { name: 'Passer en mode sombre' }),
    ).toBeInTheDocument()
  })
})
