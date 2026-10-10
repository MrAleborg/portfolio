import { useEffect, useState } from 'react'

/** The viewport width from which the index is a column rather than a bar (`ResumeIndex.css`). */
const DESKTOP_QUERY = '(min-width: 64rem)'

/**
 * The id, among `ids` (in page order), of the section currently under the sticky header.
 *
 * Observed band: from the line where a scrolled-to section lands (its `scroll-margin-top`, which
 * clears the header and, on narrow screens, the bar) down to 40% of the viewport. The active section
 * is the first one crossing it; the last one stays active while none does, and a page scrolled to
 * its end activates the last section, which may be too short to ever reach the band.
 */
export function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const elements = ids.flatMap((id) => {
      const element = document.getElementById(id)
      return element ? [element] : []
    })
    const visible = new Set<string>()

    function update() {
      const scrolledToEnd =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
      const current = scrolledToEnd ? ids[ids.length - 1] : ids.find((id) => visible.has(id))
      if (current) setActive(current)
    }

    let observer: IntersectionObserver | undefined
    function observe() {
      observer?.disconnect()
      visible.clear()
      const [first] = elements
      const bandTop = first ? parseFloat(getComputedStyle(first).scrollMarginTop) || 0 : 0
      observer = new IntersectionObserver(
        (entries) => {
          for (const { target, isIntersecting } of entries) {
            if (isIntersecting) visible.add(target.id)
            else visible.delete(target.id)
          }
          update()
        },
        { rootMargin: `-${bandTop}px 0px -60% 0px` },
      )
      elements.forEach((element) => observer?.observe(element))
    }

    observe()
    // The scroll margin changes with the breakpoint.
    const breakpoint = window.matchMedia(DESKTOP_QUERY)
    breakpoint.addEventListener('change', observe)
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      observer?.disconnect()
      breakpoint.removeEventListener('change', observe)
      window.removeEventListener('scroll', update)
    }
  }, [ids])

  return active
}
