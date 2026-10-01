import type { Period } from '@/domain/period/Period'
import { MonthTime } from '@/ui/components/MonthTime'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

interface PeriodTimeProps {
  period: Period
}

/** A period as machine-readable months, e.g. "Sep 2015 – Jun 2017", or "Oct 2021 – Present" while ongoing. */
export function PeriodTime({ period }: PeriodTimeProps) {
  const { locale } = useLocale()

  return (
    <>
      <MonthTime date={period.start} /> –{' '}
      {period.end === null ? messages[locale].ongoing : <MonthTime date={period.end} />}
    </>
  )
}
