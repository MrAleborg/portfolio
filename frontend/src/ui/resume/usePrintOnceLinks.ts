import { useEffect, type RefObject } from 'react'

/**
 * On paper an external link shows its address, so one that appears several times would repeat
 * it. CSS cannot tell repeats apart: before each print, mark every link whose address
 * appeared earlier in the container, the printed part of the page. Done on each print so
 * sections loaded late are included.
 */
export function usePrintOnceLinks(container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const markRepeats = () => {
      const seen = new Set<string>()
      const links = container.current?.querySelectorAll<HTMLAnchorElement>('.external-link')
      for (const link of links ?? []) {
        link.classList.remove('external-link--repeat')
        if (seen.has(link.href)) link.classList.add('external-link--repeat')
        seen.add(link.href)
      }
    }
    window.addEventListener('beforeprint', markRepeats)
    return () => window.removeEventListener('beforeprint', markRepeats)
  }, [container])
}
