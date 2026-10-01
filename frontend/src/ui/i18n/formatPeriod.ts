import type { Locale } from '@/domain/i18n/Locale'
import type { Period } from '@/domain/period/Period'
import { messages } from '@/ui/i18n/messages'

/** e.g. "Sep 2015 – Jun 2017", or "Oct 2021 – Present" while ongoing. */
export function formatPeriod(period: Period, locale: Locale): string {
  // ISO dates are read as UTC midnight, so they are shown in UTC too:
  // west of Greenwich the 1st of a month would otherwise fall in the previous one.
  const month = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const end = period.end === null
    ? messages[locale].ongoing
    : month.format(new Date(period.end))
  return `${month.format(new Date(period.start))} – ${end}`
}
