import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactMessage } from '@/domain/contact/ContactMessage'

/** Where the owner's contact links come from, and where messages to the owner go. */
export interface ContactRepository {
  links(): Promise<ContactLink[]>
  /** Rejects with a `ContactSendError` when the message is not sent. */
  send(message: ContactMessage): Promise<void>
}
