import { useId } from 'react'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { ThemeSwitch } from '@/ui/components/ThemeSwitch'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './SettingsMenu.css'

export function SettingsMenu() {
  const text = messages[useLocale().locale]
  const id = useId()

  return (
    <>
      <button
        type="button"
        className="settings-menu__button"
        popoverTarget={id}
        aria-label={text.settings}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      <div
        id={id}
        role="group"
        popover="auto"
        className="settings-menu__panel"
        aria-label={text.settings}
      >
        <ThemeSwitch />
        <LanguageSwitch />
      </div>
    </>
  )
}
