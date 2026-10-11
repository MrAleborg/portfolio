import { useEffect } from 'react'

/**
 * On paper an external link shows its address, so one that appears several times would repeat
 * it. CSS cannot tell repeats apart: before each print, mark every link whose address
 * appeared earlier on the page. Done on each print so sections loaded late are included.
 */
export function usePrintOnceLinks() {
  useEffect(() => {
    const markRepeats = () => {
      const seen = new Set<string>()
      for (const link of document.querySelectorAll<HTMLAnchorElement>('.external-link')) {
        link.classList.remove('external-link--repeat')
        if (seen.has(link.href)) link.classList.add('external-link--repeat')
        seen.add(link.href)
      }
    }
    window.addEventListener('beforeprint', markRepeats)
    return () => window.removeEventListener('beforeprint', markRepeats)
  }, [])
}
