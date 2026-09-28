import type { Locale } from '@/domain/i18n/Locale'
import type { Profile } from '@/domain/profile/Profile'
import { Avatar } from '@/ui/components/Avatar'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './WelcomePage.css'

interface WelcomePageProps {
  profile: Profile
}

export function WelcomePage({ profile }: WelcomePageProps) {
  const { locale, setLocale } = useLocale()
  const text = messages[locale]
  const otherLocale: Locale = locale === 'en' ? 'fr' : 'en'

  return (
    <main className="welcome">
      <button
        type="button"
        className="welcome__language"
        lang={otherLocale}
        onClick={() => setLocale(otherLocale)}
      >
        {text.switchLanguage}
      </button>
      <Avatar src={profile.avatar.src} alt={profile.avatar.alt[locale]} />
      <h1>{profile.fullName}</h1>
      <p className="welcome__headline">{profile.headline[locale]}</p>
      <p className="welcome__status">{text.underConstruction}</p>
    </main>
  )
}
