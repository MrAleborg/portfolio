import type { PeriodDuration } from '@/domain/period/periodDuration'
import { durationText } from '@/ui/i18n/durationText'
import { useLocale } from '@/ui/i18n/useLocale'

interface DurationTimeProps {
  duration: PeriodDuration
}

/** A duration as a machine-readable ISO 8601 one, leaving out parts that are zero, e.g. "P1Y10M". */
function isoDuration({ years, months }: PeriodDuration): string {
  return `P${years > 0 ? `${years}Y` : ''}${months > 0 ? `${months}M` : ''}`
}

/** A duration as a short text, e.g. "1 yr 10 mos". */
export function DurationTime({ duration }: DurationTimeProps) {
  const { locale } = useLocale()

  return (
    <time dateTime={isoDuration(duration)}>
      {durationText(duration, locale)}
    </time>
  )
}
