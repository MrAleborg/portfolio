import { render } from '@testing-library/react'
import { useRef, type RefObject } from 'react'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { usePrintOnceLinks } from '@/ui/resume/usePrintOnceLinks'

function Printable({ container }: { container: RefObject<HTMLElement | null> }) {
  usePrintOnceLinks(container)
  return null
}

function Links({ hrefs, prefix = 'Link' }: { hrefs: string[]; prefix?: string }) {
  return (
    <>
      {hrefs.map((href, index) => (
        <ExternalLink key={index} href={href}>
          {`${prefix} ${index + 1}`}
        </ExternalLink>
      ))}
    </>
  )
}

/**
 * Links in a container the hook watches, with optional links before and after it that it must
 * ignore, and the hook itself, which can be taken away while the links stay.
 */
function Page({
  hrefs,
  before = [],
  after = [],
  watching = true,
}: {
  hrefs: string[]
  before?: string[]
  after?: string[]
  watching?: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  return (
    <LocaleProvider initialLocale="en">
      <Links hrefs={before} prefix="Before" />
      <div ref={container}>
        <Links hrefs={hrefs} />
      </div>
      <Links hrefs={after} prefix="After" />
      {watching ? <Printable container={container} /> : null}
    </LocaleProvider>
  )
}

function beforePrint() {
  window.dispatchEvent(new Event('beforeprint'))
}

/** The labels of the links marked as repeats, such as `Link 3` or `After 1`. */
function repeatedLabels(container: HTMLElement) {
  return [...container.querySelectorAll('.external-link--repeat')].map(
    (link) => /^\w+ \d+/.exec(link.textContent ?? '')?.[0],
  )
}

const a = 'https://example.com/a'
const b = 'https://example.com/b'

describe('usePrintOnceLinks', () => {
  it('marks only the later of two links to the same address when printing', () => {
    const { container } = render(<Page hrefs={[a, b, a]} />)

    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 3'])
  })

  it('marks a repeat that appeared after the page was shown', () => {
    const { container, rerender } = render(<Page hrefs={[a]} />)
    rerender(<Page hrefs={[a, a]} />)

    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 2'])
  })

  it('forgets the marks of a previous print', () => {
    const { container, rerender } = render(<Page hrefs={[a, a]} />)
    beforePrint()
    expect(repeatedLabels(container)).toEqual(['Link 2'])

    rerender(<Page hrefs={[a]} />)
    beforePrint()

    expect(repeatedLabels(container)).toEqual([])
  })

  it('does not count a link outside the page as an earlier one', () => {
    const { container } = render(<Page before={[a]} hrefs={[a]} />)

    beforePrint()

    expect(repeatedLabels(container)).toEqual([])
  })

  it('never marks a link outside the page', () => {
    const { container } = render(<Page hrefs={[a]} after={[a]} before={[b, b]} />)

    beforePrint()

    expect(repeatedLabels(container)).toEqual([])
  })

  it('stops listening once unmounted', () => {
    const { container, rerender } = render(<Page hrefs={[a, a]} />)
    beforePrint()
    expect(repeatedLabels(container)).toEqual(['Link 2'])

    rerender(<Page hrefs={[a, a, a]} watching={false} />)
    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 2'])
  })
})
