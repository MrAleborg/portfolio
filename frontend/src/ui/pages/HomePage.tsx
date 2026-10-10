import { Link } from 'react-router'
import avatarSrc from '@/assets/avatar.svg?no-inline'
import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { useAsync } from '@/ui/async/useAsync'
import { Avatar } from '@/ui/components/Avatar'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'
import './HomePage.css'

interface HomePageProps {
  profileRepository: ProfileRepository
  experienceRepository: ProfessionalExperienceRepository
}

export function HomePage({ profileRepository }: HomePageProps) {
  const { locale } = useLocale()
  const state = useAsync(profileRepository.get)

  if (state.status === 'loading') {
    return <p role="status">{messages[locale].loading}</p>
  }

  if (state.status === 'error') {
    return <p role="alert">{messages[locale].profileUnavailable}</p>
  }

  const text = messages[locale]

  return (
    <div className="home">
      <div className="home__text">
        <h1>{state.value.fullName}</h1>
        <p className="home__headline">{state.value.headline[locale]}</p>
        {paragraphs(state.value.bio[locale]).map((paragraph, index) => (
          <p key={index} className="home__bio">{paragraph}</p>
        ))}
        <div className="home__actions">
          <Link to="/resume" className="home__cta home__cta--primary">
            {text.homeResumeCta}
          </Link>
          <Link to="/contact" className="home__cta home__cta--secondary">
            {text.homeContactCta}
          </Link>
        </div>
      </div>
      <Avatar
        src="/media/avatar.webp"
        fallbackSrc={avatarSrc}
        alt={text.avatarAlt(state.value.fullName)}
      />
    </div>
  )
}
