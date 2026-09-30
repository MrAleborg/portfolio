import avatarSrc from '@/assets/avatar.webp'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { Avatar } from '@/ui/components/Avatar'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { useProfile } from '@/ui/profile/useProfile'
import './HomePage.css'

interface HomePageProps {
  profileRepository: ProfileRepository
}

/** Splits a text on blank lines; an empty text has no paragraph. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function HomePage({ profileRepository }: HomePageProps) {
  const { locale } = useLocale()
  const state = useProfile(profileRepository)

  if (state.status === 'loading') {
    return <p role="status">{messages[locale].loadingProfile}</p>
  }

  if (state.status === 'error') {
    return <p role="alert">{messages[locale].profileUnavailable}</p>
  }

  return (
    <>
      <Avatar
        src={avatarSrc}
        alt={messages[locale].avatarAlt(state.profile.fullName)}
      />
      <h1>{state.profile.fullName}</h1>
      <p className="home__headline">{state.profile.headline[locale]}</p>
      {paragraphs(state.profile.bio[locale]).map((paragraph) => (
        <p key={paragraph} className="home__bio">{paragraph}</p>
      ))}
    </>
  )
}
