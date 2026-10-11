import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { ContactForm } from '@/ui/components/ContactForm'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

interface ContactPageProps {
  contactRepository: ContactRepository
}

export function ContactPage({ contactRepository }: ContactPageProps) {
  const text = messages[useLocale().locale]

  return (
    <>
      <h1>{text.contactTitle}</h1>
      <p>{text.contactIntro}</p>
      <ContactForm repository={contactRepository} />
    </>
  )
}
