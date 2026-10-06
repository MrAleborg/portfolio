import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { ContactSendError } from '@/domain/contact/ContactSendError'
import type { ContactFieldErrors, ContactSendFailure } from '@/domain/contact/ContactSendError'

export const contactLinks: ContactLink[] = [
  { kind: 'email', url: 'mailto:ada@example.com' },
  { kind: 'linkedin', url: 'https://www.linkedin.com/in/ada' },
  { kind: 'github', url: 'https://github.com/ada' },
]

/** A repository that answers with the given links and accepts every message. */
export function fakeContactRepository(links: ContactLink[] = contactLinks) {
  return {
    links: vi.fn(() => Promise.resolve(links)),
    send: vi.fn(() => Promise.resolve()),
  } satisfies ContactRepository
}

/** A repository whose links request fails. */
export function failingContactRepository() {
  return {
    links: vi.fn(() => Promise.reject(new Error('Network error'))),
    send: vi.fn(() => Promise.resolve()),
  } satisfies ContactRepository
}

/** A repository whose links request never answers. */
export function pendingContactRepository() {
  return {
    links: vi.fn(() => new Promise<ContactLink[]>(() => {})),
    send: vi.fn(() => Promise.resolve()),
  } satisfies ContactRepository
}

/** A repository that refuses every message for the given reason. */
export function refusingContactRepository(
  reason: ContactSendFailure,
  fieldErrors: ContactFieldErrors = {},
) {
  return {
    links: vi.fn(() => Promise.resolve(contactLinks)),
    send: vi.fn(() => Promise.reject(new ContactSendError(reason, fieldErrors))),
  } satisfies ContactRepository
}

/** A repository whose message never gets an answer. */
export function pendingSendContactRepository() {
  return {
    links: vi.fn(() => Promise.resolve(contactLinks)),
    send: vi.fn(() => new Promise<void>(() => {})),
  } satisfies ContactRepository
}
