import type { Locale } from '@/domain/i18n/Locale'
import type { PeriodDuration } from '@/domain/period/periodDuration'
import { messages } from '@/ui/i18n/messages'

/** A duration as short text, e.g. "1 yr 10 mos": years and months, or only the one that is not zero. */
export function durationText(duration: PeriodDuration, locale: Locale): string {
  const plural = new Intl.PluralRules(locale)
  const { durationYears, durationMonths } = messages[locale]
  const withUnit = (count: number, unit: typeof durationYears) =>
    `${count} ${plural.select(count) === 'one' ? unit.one : unit.other}`

  return [
    duration.years > 0 && withUnit(duration.years, durationYears),
    duration.months > 0 && withUnit(duration.months, durationMonths),
  ]
    .filter(Boolean)
    .join(' ')
}
