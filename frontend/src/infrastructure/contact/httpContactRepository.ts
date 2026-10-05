import type { ContactLink } from '@/domain/contact/ContactLink'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import { ContactSendError } from '@/domain/contact/ContactSendError'
import { getJson } from '@/infrastructure/http/getJson'
import { postJson } from '@/infrastructure/http/postJson'

export function createHttpContactRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): ContactRepository {
  return {
    async links() {
      return getJson<ContactLink[]>(apiUrl, '/api/v1/profile/contact-links/', fetchFn)
    },
    async send(message) {
      let response: Response
      try {
        response = await postJson(
          apiUrl,
          '/api/v1/profile/contact/',
          { ...message, website: '' },
          fetchFn,
        )
      } catch {
        throw new ContactSendError('unavailable')
      }
      if (response.status === 400) {
        throw new ContactSendError('invalid', await response.json())
      }
      if (response.status === 429) {
        throw new ContactSendError('throttled')
      }
      if (!response.ok) {
        throw new ContactSendError('unavailable')
      }
    },
  }
}
