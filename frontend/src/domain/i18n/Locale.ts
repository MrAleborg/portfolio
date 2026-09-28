export type Locale = 'en' | 'fr'

export type Localized<T> = Record<Locale, T>

const SUPPORTED_LOCALES: readonly string[] = ['en', 'fr'] satisfies Locale[]
const DEFAULT_LOCALE: Locale = 'en'

function isLocale(language: string): language is Locale {
  return SUPPORTED_LOCALES.includes(language)
}

/** Picks the first supported language from the browser's preference list. */
export function resolveLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const language = tag.split('-')[0]?.toLowerCase() ?? ''
    if (isLocale(language)) return language
  }
  return DEFAULT_LOCALE
}
