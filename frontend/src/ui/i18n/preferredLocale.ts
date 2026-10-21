import { isLocale, resolveLocale, type Locale } from '@/domain/i18n/Locale'

const STORAGE_KEY = 'locale'

// The storage can be missing or refuse access (private mode): the choice is then just not kept.
function readStoredLocale(): Locale | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null && isLocale(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not kept, see above.
  }
}

/** The Locale a visitor with no address gets: their saved choice, else their browser's language. */
export function preferredLocale(): Locale {
  return readStoredLocale() ?? resolveLocale(navigator.languages)
}
