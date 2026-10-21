import { useEffect, useState, type ReactNode } from 'react'
import type { Locale } from '@/domain/i18n/Locale'
import { LocaleContext } from '@/ui/i18n/LocaleContext'
import { storeLocale } from '@/ui/i18n/preferredLocale'

interface LocaleProviderProps {
  initialLocale?: Locale
  /** The Locale of the address. When set it wins, and switching only asks `onSwitch` to change the address. */
  locale?: Locale
  onSwitch?: (locale: Locale) => void
  children: ReactNode
}

export function LocaleProvider({
  initialLocale,
  locale: addressLocale,
  onSwitch,
  children,
}: LocaleProviderProps) {
  const [chosen, setChosen] = useState<Locale>(initialLocale ?? 'en')
  const locale = addressLocale ?? chosen

  const setLocale = (next: Locale) => {
    if (addressLocale === undefined) setChosen(next)
    storeLocale(next)
    onSwitch?.(next)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>
}
