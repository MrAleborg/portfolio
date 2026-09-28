import { createContext } from 'react'
import type { Locale } from '@/domain/i18n/Locale'

export interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
