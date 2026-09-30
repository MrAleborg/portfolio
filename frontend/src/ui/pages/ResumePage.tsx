import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

export function ResumePage() {
  const text = messages[useLocale().locale]

  return (
    <>
      <h1>{text.resumeTitle}</h1>
      <p>{text.comingSoon}</p>
    </>
  )
}
