import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { resolveLocale, type Locale } from '@/domain/i18n/Locale'
import { LocaleContext } from '@/ui/i18n/LocaleContext'

interface LocaleProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(
    () => initialLocale ?? resolveLocale(navigator.languages),
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale }), [locale])

  return <LocaleContext value={value}>{children}</LocaleContext>
}
