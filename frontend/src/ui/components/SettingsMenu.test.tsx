import { render, screen } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import { SettingsMenu } from '@/ui/components/SettingsMenu'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderMenu(locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <SettingsMenu />
    </LocaleProvider>,
  )
}

// jsdom hides a closed popover: its content is only reachable with hidden: true,
// and a hidden element has no accessible name there, so the group is found by role alone.
describe('SettingsMenu', () => {
  it('points the settings button at the panel', () => {
    renderMenu()

    const button = screen.getByRole('button', { name: 'Settings' })
    const panel = screen.getByRole('group', { hidden: true })

    expect(button).toHaveAttribute('popovertarget', panel.id)
  })

  it('holds the theme and language switches in the panel', () => {
    renderMenu()

    const panel = screen.getByRole('group', { hidden: true })

    expect(panel).toContainElement(
      screen.getByRole('button', { name: 'Switch to dark mode', hidden: true }),
    )
    expect(panel).toContainElement(
      screen.getByRole('button', { name: 'Français', hidden: true }),
    )
  })

  it('labels the settings button in French', () => {
    renderMenu('fr')

    expect(
      screen.getByRole('button', { name: 'Préférences' }),
    ).toBeInTheDocument()
  })
})
