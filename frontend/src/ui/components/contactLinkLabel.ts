import type { ContactLink } from '@/domain/contact/ContactLink'
import { contactAddress } from '@/ui/components/contactAddress'
import type { messages } from '@/ui/i18n/messages'

/** What a contact link is called: LinkedIn and GitHub by name, a website by "Website", any other as its address. */
export function contactLinkLabel(
  link: ContactLink,
  text: (typeof messages)['en'],
): string {
  switch (link.kind) {
    case 'linkedin':
    case 'github':
      return text.contactLinkKinds[link.kind]
    case 'website':
      return text.websiteLink
    default:
      return contactAddress(link)
  }
}
