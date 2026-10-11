import type { ContactLink } from '@/domain/contact/ContactLink'
import { contactAddress } from '@/ui/components/contactAddress'
import { contactLinkLabel } from '@/ui/components/contactLinkLabel'
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

  return (
    <>
      {emails.length > 0 && (
        <div className="contact-links__emails">
          {emails.map((link) => (
            <a
              key={`${link.kind}:${link.url}`}
              href={link.url}
              className="contact-links__link--large"
            >
              {contactAddress(link)}
            </a>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="contact-links__others">
          {others.map((link) => (
            <ExternalLink key={`${link.kind}:${link.url}`} href={link.url}>
              {contactLinkLabel(link, text)}
            </ExternalLink>
          ))}
        </div>
      )}
    </>
  )
}
