export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export type Localized<T> = Record<Locale, T>

const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(language: string): language is Locale {
  return (LOCALES as readonly string[]).includes(language)
}

/** The address without its leading Locale segment (`/fr/resume` gives `/resume`), or unchanged when it has none. */
export function withoutLocale(pathname: string): string {
  return isLocale(pathname.split('/')[1] ?? '') ? pathname.replace(/^\/[^/]+/, '') : pathname
}

/** Picks the first supported language from the browser's preference list. */
export function resolveLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const language = tag.split('-')[0]?.toLowerCase() ?? ''
    if (isLocale(language)) return language
  }
  return DEFAULT_LOCALE
}
