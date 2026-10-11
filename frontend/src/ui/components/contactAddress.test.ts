import { contactAddress } from '@/ui/components/contactAddress'

describe('contactAddress', () => {
  it('writes an email as its address, without mailto:', () => {
    expect(contactAddress({ kind: 'email', url: 'mailto:ada@example.com' })).toBe('ada@example.com')
  })

  it('writes a link as its URL without https:// and www.', () => {
    expect(contactAddress({ kind: 'website', url: 'https://www.ada.dev/about' })).toBe(
      'ada.dev/about',
    )
  })

  it('also drops http://', () => {
    expect(contactAddress({ kind: 'other', url: 'http://ada.dev/about' })).toBe('ada.dev/about')
  })

  it('drops the trailing slash only', () => {
    expect(contactAddress({ kind: 'website', url: 'https://ada.dev/a/b/' })).toBe('ada.dev/a/b')
  })
})
