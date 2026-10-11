import { render } from '@testing-library/react'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { usePrintOnceLinks } from '@/ui/resume/usePrintOnceLinks'

function Printable() {
  usePrintOnceLinks()
  return null
}

function Links({ hrefs }: { hrefs: string[] }) {
  return (
    <LocaleProvider initialLocale="en">
      {hrefs.map((href, index) => (
        <ExternalLink key={index} href={href}>
          {`Link ${index + 1}`}
        </ExternalLink>
      ))}
    </LocaleProvider>
  )
}

function beforePrint() {
  window.dispatchEvent(new Event('beforeprint'))
}

function repeatedLabels(container: HTMLElement) {
  return [...container.querySelectorAll('.external-link--repeat')].map((link) =>
    link.textContent?.slice(0, 'Link N'.length),
  )
}

const a = 'https://example.com/a'
const b = 'https://example.com/b'

describe('usePrintOnceLinks', () => {
  it('marks only the later of two links to the same address when printing', () => {
    const { container } = render(
      <>
        <Printable />
        <Links hrefs={[a, b, a]} />
      </>,
    )

    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 3'])
  })

  it('marks a repeat that appeared after the page was shown', () => {
    const { container, rerender } = render(
      <>
        <Printable />
        <Links hrefs={[a]} />
      </>,
    )
    rerender(
      <>
        <Printable />
        <Links hrefs={[a, a]} />
      </>,
    )

    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 2'])
  })

  it('forgets the marks of a previous print', () => {
    const { container, rerender } = render(
      <>
        <Printable />
        <Links hrefs={[a, a]} />
      </>,
    )
    beforePrint()
    expect(repeatedLabels(container)).toEqual(['Link 2'])

    rerender(
      <>
        <Printable />
        <Links hrefs={[a]} />
      </>,
    )
    beforePrint()

    expect(repeatedLabels(container)).toEqual([])
  })

  it('stops listening once unmounted', () => {
    const { container, rerender } = render(
      <>
        <Printable />
        <Links hrefs={[a, a]} />
      </>,
    )
    beforePrint()
    expect(repeatedLabels(container)).toEqual(['Link 2'])

    rerender(<Links hrefs={[a, a, a]} />)
    beforePrint()

    expect(repeatedLabels(container)).toEqual(['Link 2'])
  })
})
