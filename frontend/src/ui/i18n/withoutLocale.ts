import { isLocale } from '@/domain/i18n/Locale'

/** The address without its leading Locale segment (`/fr/resume` gives `/resume`), or unchanged when it has none. */
export function withoutLocale(pathname: string): string {
  return isLocale(pathname.split('/')[1] ?? '') ? pathname.replace(/^\/[^/]+/, '') : pathname
}
