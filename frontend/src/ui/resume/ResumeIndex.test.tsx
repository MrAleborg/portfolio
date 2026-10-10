import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumeIndex } from '@/ui/resume/ResumeIndex'
import { resumeSections } from '@/ui/resume/resumeSections'

const titles = {
  en: [
    'Expertise',
    'Professional experience',
    'Personal projects',
    'Education',
    'Certifications',
    'Scientific communications',
    'Commitments',
    'Hobbies',
  ],
  fr: [
    'Expertise',
    'Expérience professionnelle',
    'Projets personnels',
    'Formation',
    'Certifications',
    'Communications scientifiques',
    'Engagements',
    'Loisirs',
  ],
}

/** The sections are focusable anchors, like on the resume page; `scrollMargin` is their `scroll-margin-top`. */
function renderIndex(locale: Locale = 'en', scrollMargin = '126px') {
  return render(
    <BrowserRouter>
      <LocaleProvider initialLocale={locale}>
        <ResumeIndex />
        <div className="resume__sections">
          {resumeSections.map(({ id }) => (
            <div key={id} id={id} tabIndex={-1} style={{ scrollMarginTop: scrollMargin }} />
          ))}
        </div>
      </LocaleProvider>
    </BrowserRouter>,
  )
}

function stubIntersectionObserver() {
  let callback: IntersectionObserverCallback = () => {}
  const rootMargins: (string | undefined)[] = []
  let disconnected = 0
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(onChange: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        callback = onChange
        rootMargins.push(options?.rootMargin)
      }
      observe() {}
      unobserve() {}
      disconnect() {
        disconnected++
      }
      takeRecords() {
        return []
      }
    },
  )
  return {
    /** The `rootMargin` of each observer built so far. */
    rootMargins,
    get disconnected() {
      return disconnected
    },
    /** Reports these sections as entering (true) or leaving (false) the observed band. */
    report(changes: Record<string, boolean>) {
      const entries = Object.entries(changes).map(([id, isIntersecting]) => ({
        target: document.getElementById(id)!,
        isIntersecting,
      }))
      act(() => callback(entries as unknown as IntersectionObserverEntry[], {} as IntersectionObserver))
    },
  }
}

function stubResizeObserver() {
  let callback: ResizeObserverCallback = () => {}
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(onResize: ResizeObserverCallback) {
        callback = onResize
      }
      observe() {}
      unobserve() {}
      disconnect() {
        callback = () => {}
      }
    },
  )
  return {
    /** The sections grew or shrank. */
    resize() {
      act(() => callback([], {} as ResizeObserver))
    },
  }
}

function prefersReducedMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

/** A viewport whose crossing of the 64rem breakpoint the test triggers. */
function stubBreakpoint() {
  const listeners: (() => void)[] = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.splice(listeners.indexOf(listener), 1),
  }))
  return {
    cross() {
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

/** Scrolls the page to its end (or, with `false`, to the middle) and tells the page. */
function scrollPage(toEnd: boolean) {
  Object.defineProperty(window, 'scrollY', { value: toEnd ? 900 : 300, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 100, configurable: true })
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000)
  act(() => {
    fireEvent.scroll(window)
  })
}

const scrollIntoView = vi.fn()
// The global setup stubs these; each test puts them back after replacing them.
const defaultIntersectionObserver = globalThis.IntersectionObserver
const defaultResizeObserver = globalThis.ResizeObserver
const defaultMatchMedia = window.matchMedia
const defaultScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')!
const defaultInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')!

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView
})

afterEach(() => {
  scrollIntoView.mockReset()
  delete (Element.prototype as Partial<Element>).scrollIntoView
  window.history.replaceState(null, '', '/')
  vi.stubGlobal('IntersectionObserver', defaultIntersectionObserver)
  vi.stubGlobal('ResizeObserver', defaultResizeObserver)
  vi.stubGlobal('matchMedia', defaultMatchMedia)
  Object.defineProperty(window, 'scrollY', defaultScrollY)
  Object.defineProperty(window, 'innerHeight', defaultInnerHeight)
  vi.restoreAllMocks()
})

describe('ResumeIndex', () => {
  it.each([
    ['en', 'Resume sections'],
    ['fr', 'Sections du CV'],
  ] as const)('is a navigation labelled in %s', (locale, label) => {
    renderIndex(locale)

    expect(screen.getByRole('navigation', { name: label })).toBeInTheDocument()
  })

  it.each(['en', 'fr'] as const)(
    'links to the 8 sections in page order, titled in %s',
    (locale) => {
      renderIndex(locale)

      const links = within(screen.getByRole('navigation')).getAllByRole('link')

      expect(links.map((link) => link.textContent)).toEqual(titles[locale])
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        resumeSections.map(({ id }) => `#${id}`),
      )
    },
  )

  it('marks the first section as the current one by default', () => {
    renderIndex()

    expect(screen.getByRole('link', { name: 'Expertise' })).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(screen.getAllByRole('link', { current: 'location' })).toHaveLength(1)
  })

  it('moves the current mark to the section that scrolls into view', () => {
    const observer = stubIntersectionObserver()
    renderIndex()

    observer.report({ education: true })

    expect(screen.getByRole('link', { name: 'Education' })).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(screen.getByRole('link', { name: 'Expertise' })).not.toHaveAttribute('aria-current')
  })

  it('marks the first of several visible sections', () => {
    const observer = stubIntersectionObserver()
    renderIndex()

    observer.report({ certifications: true, education: true })

    expect(screen.getByRole('link', { current: 'location' })).toHaveTextContent('Education')
  })

  it('keeps the last current section when none is in view', () => {
    const observer = stubIntersectionObserver()
    renderIndex()
    observer.report({ education: true })

    observer.report({ education: false })

    expect(screen.getByRole('link', { current: 'location' })).toHaveTextContent('Education')
  })

  it('scrolls smoothly to a section and records it in the address when its link is clicked', async () => {
    renderIndex()

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))

    expect(window.location.hash).toBe('#education')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('education'))
  })

  it('scrolls without animation when the user prefers reduced motion', async () => {
    prefersReducedMotion()
    renderIndex()

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('scrolls to the section named by the address when the page opens', () => {
    window.history.replaceState(null, '', '/#certifications')

    renderIndex()

    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('certifications'))
  })

  it('does not scroll when the page opens without a section in the address', () => {
    renderIndex()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing special for a click that opens the link elsewhere', async () => {
    renderIndex()

    const user = userEvent.setup()
    await user.keyboard('{Control>}')
    await user.click(screen.getByRole('link', { name: 'Education' }))

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does not scroll when the section of a clicked link is not on the page', async () => {
    render(
      <BrowserRouter>
        <LocaleProvider initialLocale="en">
          <ResumeIndex />
        </LocaleProvider>
      </BrowserRouter>,
    )

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('puts focus on the section of a clicked link, so Tab continues inside it', async () => {
    renderIndex()

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))

    expect(document.getElementById('education')).toHaveFocus()
  })

  it('does not stack history entries when the same link is clicked again', async () => {
    renderIndex()
    await userEvent.click(screen.getByRole('link', { name: 'Education' }))
    const entries = window.history.length

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))

    expect(window.history.length).toBe(entries)
    expect(window.location.hash).toBe('#education')
  })

  it('adds a history entry for each new section', async () => {
    renderIndex()
    const entries = window.history.length

    await userEvent.click(screen.getByRole('link', { name: 'Education' }))
    await userEvent.click(screen.getByRole('link', { name: 'Hobbies' }))

    expect(window.history.length).toBe(entries + 2)
  })

  it('marks the last section once the page is scrolled to its end', () => {
    const observer = stubIntersectionObserver()
    renderIndex()
    observer.report({ commitments: true })

    scrollPage(true)

    expect(screen.getByRole('link', { current: 'location' })).toHaveTextContent('Hobbies')
  })

  it('goes back to the section in view when the page leaves its end', () => {
    const observer = stubIntersectionObserver()
    renderIndex()
    observer.report({ commitments: true })
    scrollPage(true)

    scrollPage(false)

    expect(screen.getByRole('link', { current: 'location' })).toHaveTextContent('Commitments')
  })

  it('ignores scrolling that stops short of the end of the page', () => {
    const observer = stubIntersectionObserver()
    renderIndex()
    observer.report({ commitments: true })

    scrollPage(false)

    expect(screen.getByRole('link', { current: 'location' })).toHaveTextContent('Commitments')
  })

  it('watches the band that starts below the sticky header and bar', () => {
    const observer = stubIntersectionObserver()

    renderIndex('en', '126px')

    expect(observer.rootMargins).toEqual(['-126px 0px -60% 0px'])
  })

  it('watches the band again when the viewport crosses the breakpoint', () => {
    const observer = stubIntersectionObserver()
    const viewport = stubBreakpoint()
    renderIndex('en', '126px')
    document.querySelectorAll<HTMLElement>('.resume__sections > div').forEach((anchor) => {
      anchor.style.scrollMarginTop = '90px'
    })

    viewport.cross()

    expect(observer.rootMargins).toEqual(['-126px 0px -60% 0px', '-90px 0px -60% 0px'])
    expect(observer.disconnected).toBe(1)
  })

  it('stops watching the viewport when the page is left', () => {
    const observer = stubIntersectionObserver()
    const viewport = stubBreakpoint()
    const { unmount } = renderIndex()
    unmount()

    viewport.cross()

    expect(observer.rootMargins).toHaveLength(1)
    expect(observer.disconnected).toBe(1)
  })

  describe('when the page opens on a section', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '/#education')
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders and scrolls nowhere when the address holds a malformed escape', () => {
      window.history.replaceState(null, '', '/#%E0%A4%A')

      renderIndex()

      expect(screen.getByRole('navigation', { name: 'Resume sections' })).toBeInTheDocument()
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('scrolls to that section instantly', () => {
      renderIndex()

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
    })

    it('keeps it aligned while the sections above it grow', () => {
      const resizing = stubResizeObserver()
      renderIndex()
      scrollIntoView.mockClear()

      resizing.resize()

      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
      expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('education'))
    })

    it.each([
      ['wheel', (target: Element) => fireEvent.wheel(target)],
      ['touchstart', (target: Element) => fireEvent.touchStart(target)],
      ['keydown', (target: Element) => fireEvent.keyDown(target, { key: 'ArrowDown' })],
      ['pointerdown', (target: Element) => fireEvent.pointerDown(target)],
    ])('stops aligning at the first %s', (_, interact) => {
      const resizing = stubResizeObserver()
      renderIndex()
      interact(document.body)
      scrollIntoView.mockClear()

      resizing.resize()

      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('stops aligning after 3 seconds', () => {
      vi.useFakeTimers()
      const resizing = stubResizeObserver()
      renderIndex()
      scrollIntoView.mockClear()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      resizing.resize()

      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    it('stops aligning once the page is left', () => {
      const resizing = stubResizeObserver()
      const { unmount } = renderIndex()
      unmount()
      scrollIntoView.mockClear()

      resizing.resize()

      expect(scrollIntoView).not.toHaveBeenCalled()
    })
  })

  describe('chip bar scrolling', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    function layOutChips(chipLeft: Record<string, number>) {
      vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        return chipLeft[this.textContent ?? ''] ?? 0
      })
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100)
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    }

    it('centres the chip of the section that becomes current', () => {
      layOutChips({ Education: 400 })
      const observer = stubIntersectionObserver()
      renderIndex()

      observer.report({ education: true })

      expect(screen.getByRole('list').scrollLeft).toBe(300)
    })

    it('never scrolls the bar before its start', () => {
      layOutChips({ Expertise: 20 })
      renderIndex()

      expect(screen.getByRole('list').scrollLeft).toBe(0)
    })
  })
})
