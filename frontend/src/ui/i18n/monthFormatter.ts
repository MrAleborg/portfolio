import type { Locale } from '@/domain/i18n/Locale'

/** Formats a date as a short month and a year, e.g. "Sep 2015". */
export function monthFormatter(locale: Locale): Intl.DateTimeFormat {
  // ISO dates are read as UTC midnight, so they are shown in UTC too:
  // west of Greenwich the 1st of a month would otherwise fall in the previous one.
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
