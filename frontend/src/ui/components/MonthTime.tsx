import { monthFormatter } from '@/ui/i18n/monthFormatter'
import { useLocale } from '@/ui/i18n/useLocale'

interface MonthTimeProps {
  /** An ISO date (YYYY-MM-DD); only its month and year are shown. */
  date: string
}

/** A date as a machine-readable month, e.g. "Sep 2015". */
export function MonthTime({ date }: MonthTimeProps) {
  const { locale } = useLocale()

  return (
    <time dateTime={date.slice(0, 7)}>
      {monthFormatter(locale).format(new Date(date))}
    </time>
  )
}
