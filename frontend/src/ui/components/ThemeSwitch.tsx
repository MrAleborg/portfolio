import { useState } from 'react'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ThemeSwitch.css'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

// The storage can be missing or refuse access (private mode): the choice is then just not kept.
function readStoredTheme(): Theme | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : undefined
  } catch {
    return undefined
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Not kept, see above.
  }
}

function initialTheme(): Theme {
  return (
    readStoredTheme() ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
}

const ICON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
} as const

export function ThemeSwitch() {
  const text = messages[useLocale().locale]
  const [theme, setTheme] = useState<Theme>(initialTheme)

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    storeTheme(next)
  }

  return (
    <button
      type="button"
      className="theme-switch"
      aria-label={theme === 'dark' ? text.switchToLight : text.switchToDark}
      data-theme={theme}
      onClick={toggle}
    >
      <svg className="theme-switch__icon theme-switch__icon--light" {...ICON}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg className="theme-switch__icon theme-switch__icon--dark" {...ICON}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
