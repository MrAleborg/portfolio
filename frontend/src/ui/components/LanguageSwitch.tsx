import type { Locale } from '@/domain/i18n/Locale'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './LanguageSwitch.css'

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale()
  const otherLocale: Locale = locale === 'en' ? 'fr' : 'en'

  return (
    <button
      type="button"
      className="language-switch"
      lang={otherLocale}
      onClick={() => setLocale(otherLocale)}
    >
      {messages[locale].switchLanguage}
    </button>
  )
}
