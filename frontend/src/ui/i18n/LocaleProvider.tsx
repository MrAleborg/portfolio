import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isLocale, resolveLocale, type Locale } from '@/domain/i18n/Locale'
import { LocaleContext } from '@/ui/i18n/LocaleContext'

const STORAGE_KEY = 'locale'

interface LocaleProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

// The storage can be missing or refuse access (private mode): the choice is then just not kept.
function readStoredLocale(): Locale | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null && isLocale(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not kept, see above.
  }
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () =>
      initialLocale ??
      readStoredLocale() ??
      resolveLocale(navigator.languages),
  )

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    storeLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext value={value}>{children}</LocaleContext>
}
