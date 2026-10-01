import type { Period } from '@/domain/period/Period'
import { monthFormatter } from '@/ui/i18n/monthFormatter'
import { useLocale } from '@/ui/i18n/useLocale'
import { messages } from '@/ui/i18n/messages'

interface PeriodTimeProps {
  period: Period
}

/** A period as machine-readable months, e.g. "Sep 2015 – Jun 2017", or "Oct 2021 – Present" while ongoing. */
export function PeriodTime({ period }: PeriodTimeProps) {
  const { locale } = useLocale()
  const month = monthFormatter(locale)
  const monthTime = (date: string) => (
    <time dateTime={date.slice(0, 7)}>{month.format(new Date(date))}</time>
  )

  return (
    <>
      {monthTime(period.start)} –{' '}
      {period.end === null ? messages[locale].ongoing : monthTime(period.end)}
    </>
  )
}
