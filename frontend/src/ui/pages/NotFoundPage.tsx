import { Link } from 'react-router'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

export function NotFoundPage() {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <>
      <h1>{text.notFoundTitle}</h1>
      <p>{text.notFoundText}</p>
      <p>
        <Link to={`/${locale}/`}>{text.notFoundHome}</Link>
      </p>
    </>
  )
}
