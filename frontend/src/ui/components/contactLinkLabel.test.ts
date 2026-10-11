import type { ContactLink } from '@/domain/contact/ContactLink'
import { contactLinkLabel } from '@/ui/components/contactLinkLabel'
import { messages } from '@/ui/i18n/messages'

describe('contactLinkLabel', () => {
  it('names a LinkedIn link LinkedIn', () => {
    const link: ContactLink = { kind: 'linkedin', url: 'https://www.linkedin.com/in/ada' }

    expect(contactLinkLabel(link, messages.en)).toBe('LinkedIn')
  })

  it('names a GitHub link GitHub', () => {
    const link: ContactLink = { kind: 'github', url: 'https://github.com/ada' }

    expect(contactLinkLabel(link, messages.en)).toBe('GitHub')
  })

  it('names a website link in the language of the visitor', () => {
    const link: ContactLink = { kind: 'website', url: 'https://ada.example.com' }

    expect(contactLinkLabel(link, messages.en)).toBe('Website')
    expect(contactLinkLabel(link, messages.fr)).toBe('Site web')
  })
})
