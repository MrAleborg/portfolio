import type { ContactMessage } from '@/domain/contact/ContactMessage'

export type ContactFieldErrors = Partial<Record<keyof ContactMessage, string[]>>

/** Why a message could not be sent. */
export type ContactSendFailure = 'invalid' | 'throttled' | 'unavailable'

export class ContactSendError extends Error {
  readonly reason: ContactSendFailure
  readonly fieldErrors: ContactFieldErrors

  constructor(reason: ContactSendFailure, fieldErrors: ContactFieldErrors = {}) {
    super(`The message could not be sent: ${reason}`)
    this.reason = reason
    this.fieldErrors = fieldErrors
  }
}
