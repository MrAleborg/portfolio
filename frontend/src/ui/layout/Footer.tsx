import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { useAsync } from '@/ui/async/useAsync'
import { contactLinkIcon } from '@/ui/components/contactLinkIcons'
import { contactLinkLabel } from '@/ui/components/contactLinkLabel'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './Footer.css'

interface FooterProps {
  /** The owner's name, once known. */
  fullName?: string
  contactRepository: ContactRepository
}

export function Footer({ fullName, contactRepository }: FooterProps) {
  const text = messages[useLocale().locale]
  const links = useAsync(contactRepository.links)

  // Nothing to show yet, or ever: no empty bordered band.
  if (links.status !== 'loaded' && !fullName) return null

  return (
    <footer className="footer">
      {links.status === 'loaded' && (
        <nav aria-label={text.footerLabel} className="footer__links">
          {links.value.map((link) =>
            link.kind === 'email' ? (
              <a key={`${link.kind}:${link.url}`} href={link.url}>
                {contactLinkIcon(link.kind)}
                {contactLinkLabel(link, text)}
              </a>
            ) : (
              <ExternalLink key={`${link.kind}:${link.url}`} href={link.url}>
                {contactLinkIcon(link.kind)}
                {contactLinkLabel(link, text)}
              </ExternalLink>
            ),
          )}
        </nav>
      )}
      {fullName && (
        <p className="footer__copyright">
          {`© ${new Date().getFullYear()} ${fullName}`}
        </p>
      )}
    </footer>
  )
}
