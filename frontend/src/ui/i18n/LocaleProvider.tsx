import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '@/domain/i18n/Locale'
import { LocaleContext } from '@/ui/i18n/LocaleContext'
import { preferredLocale, storeLocale } from '@/ui/i18n/preferredLocale'

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
  const [chosen, setChosen] = useState<Locale>(() => initialLocale ?? preferredLocale())
  const locale = addressLocale ?? chosen

  const setLocale = useCallback(
    (next: Locale) => {
      setChosen(next)
      storeLocale(next)
      onSwitch?.(next)
    },
    [onSwitch],
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext value={value}>{children}</LocaleContext>
}
