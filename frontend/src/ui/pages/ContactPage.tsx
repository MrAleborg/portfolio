import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { useAsync } from '@/ui/async/useAsync'
import { ContactForm } from '@/ui/components/ContactForm'
import { ContactLinks } from '@/ui/components/ContactLinks'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

interface ContactPageProps {
  contactRepository: ContactRepository
}

export function ContactPage({ contactRepository }: ContactPageProps) {
  const text = messages[useLocale().locale]
  const links = useAsync(contactRepository.links)

  return (
    <>
      <h1>{text.contactTitle}</h1>
      <p>{text.contactIntro}</p>
      {links.status === 'loaded' && <ContactLinks links={links.value} />}
      {links.status === 'loading' && <p role="status">{text.loading}</p>}
      {links.status === 'error' && <p role="alert">{text.contactLinksUnavailable}</p>}
      <ContactForm />
    </>
  )
}
