import avatarSrc from '@/assets/avatar.webp'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { useAsync } from '@/ui/async/useAsync'
import { Avatar } from '@/ui/components/Avatar'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'
import './HomePage.css'

interface HomePageProps {
  profileRepository: ProfileRepository
}

export function HomePage({ profileRepository }: HomePageProps) {
  const { locale } = useLocale()
  const state = useAsync(profileRepository.get)

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
        alt={messages[locale].avatarAlt(state.value.fullName)}
      />
      <h1>{state.value.fullName}</h1>
      <p className="home__headline">{state.value.headline[locale]}</p>
      {paragraphs(state.value.bio[locale]).map((paragraph) => (
        <p key={paragraph} className="home__bio">{paragraph}</p>
      ))}
    </>
  )
}
