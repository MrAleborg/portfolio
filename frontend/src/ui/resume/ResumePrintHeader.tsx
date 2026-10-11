import { Fragment } from 'react'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { useAsync } from '@/ui/async/useAsync'
import { contactAddress } from '@/ui/components/contactAddress'
import { useLocale } from '@/ui/i18n/useLocale'
import './ResumePrintHeader.css'

interface ResumePrintHeaderProps {
  profileRepository: ProfileRepository
  contactRepository: ContactRepository
}

/**
 * The name, headline and contact links of the owner, shown on paper only, where they head the page.
 * It stays silent while loading and on failure: nothing on screen depends on it.
 */
export function ResumePrintHeader({ profileRepository, contactRepository }: ResumePrintHeaderProps) {
  const { locale } = useLocale()
  const profile = useAsync(profileRepository.get)
  const contact = useAsync(contactRepository.links)

  if (profile.status !== 'loaded') return null

  const links = contact.status === 'loaded' ? contact.value : []

  return (
    <div className="resume-print-header">
      <p className="resume-print-header__name">{profile.value.fullName}</p>
      <p className="resume-print-header__headline">{profile.value.headline[locale]}</p>
      {links.length > 0 && (
        <p className="resume-print-header__contact">
          {links.map((link, index) => (
            <Fragment key={`${link.kind}:${link.url}`}>
              {index > 0 && ' · '}
              <a href={link.url}>{contactAddress(link)}</a>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  )
}
