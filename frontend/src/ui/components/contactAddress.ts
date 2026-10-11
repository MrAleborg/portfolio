import type { ContactLink } from '@/domain/contact/ContactLink'

/** A link as written out: an email as its address, any other as its URL without scheme, `www.` and trailing slash. */
export function contactAddress({ kind, url }: ContactLink): string {
  return kind === 'email'
    ? url.replace(/^mailto:/, '')
    : url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}
