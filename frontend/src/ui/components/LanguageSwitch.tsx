import { useId } from 'react'
import type { Locale } from '@/domain/i18n/Locale'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './LanguageSwitch.css'

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale()
  const clipId = useId()
  const otherLocale: Locale = locale === 'en' ? 'fr' : 'en'

  return (
    <button
      type="button"
      className="language-switch"
      lang={otherLocale}
      aria-label={messages[locale].switchLanguage}
      data-locale={locale}
      onClick={() => setLocale(otherLocale)}
    >
      <svg
        className="language-switch__flag language-switch__flag--fr"
        viewBox="0 0 3 2"
        aria-hidden="true"
      >
        <rect width="1" height="2" fill="#002654" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#ce1126" />
      </svg>
      <svg
        className="language-switch__flag language-switch__flag--en"
        viewBox="0 0 60 30"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <clipPath id={clipId}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath={`url(#${clipId})`}
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    </button>
  )
}
