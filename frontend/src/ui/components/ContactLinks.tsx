import type { ContactLink } from '@/domain/contact/ContactLink'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ContactLinks.css'

interface ContactLinksProps {
  links: readonly ContactLink[]
}

export function ContactLinks({ links }: ContactLinksProps) {
  const text = messages[useLocale().locale]
  const emails = links.filter((link) => link.kind === 'email')
  const others = links.filter((link) => link.kind !== 'email')

  function label(link: ContactLink) {
    switch (link.kind) {
      case 'linkedin':
      case 'github':
        return text.contactLinkKinds[link.kind]
      case 'website':
        return text.websiteLink
      default:
        return link.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    }
  }

  return (
    <>
      <div className="contact-links__emails">
        {emails.map((link) => (
          <a key={link.url} href={link.url} className="contact-links__link--large">
            {link.url.replace(/^mailto:/, '')}
          </a>
        ))}
      </div>
      <div className="contact-links__others">
        {others.map((link) => (
          <ExternalLink key={link.url} href={link.url}>
            {label(link)}
          </ExternalLink>
        ))}
      </div>
    </>
  )
}
