import { useEffect, useRef, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { resumeSections } from '@/ui/resume/resumeSections'
import { useActiveSection } from '@/ui/resume/useActiveSection'
import './ResumeIndex.css'

const sectionIds = resumeSections.map(({ id }) => id)

/** How long a deep link keeps its target aligned while the page above it loads. */
const REALIGN_MS = 3000
const USER_INTERACTIONS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Sections load asynchronously, so content above the section named by the address keeps growing:
 * scroll to it, then keep it aligned until the user takes over or time runs out.
 */
function useDeepLink() {
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    if (!target) return
    const align = () => target.scrollIntoView({ behavior: 'auto', block: 'start' })
    align()

    // The anchors' container, whose height grows as the sections above the target load.
    const resizeObserver = new ResizeObserver(align)
    resizeObserver.observe(target.parentElement as Element)

    const timer = setTimeout(stop, REALIGN_MS)
    USER_INTERACTIONS.forEach((type) => window.addEventListener(type, stop, { passive: true }))
    function stop() {
      resizeObserver.disconnect()
      clearTimeout(timer)
      USER_INTERACTIONS.forEach((type) => window.removeEventListener(type, stop))
    }
    return stop
  }, [])
}

export function ResumeIndex() {
  const text = messages[useLocale().locale]
  const active = useActiveSection(sectionIds)
  const list = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()
  const { hash } = useLocation()
  useDeepLink()

  // On the chip bar, keep the active chip in view. Set `scrollLeft` rather than calling
  // `scrollIntoView`, which could also move the page vertically.
  useEffect(() => {
    const bar = list.current
    const chip = bar?.querySelector<HTMLElement>('[aria-current]')
    if (bar && chip) {
      bar.scrollLeft = Math.max(0, chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2)
    }
  }, [active])

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id)
    const opensElsewhere = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey
    if (!target || opensElsewhere) return
    event.preventDefault()
    navigate({ hash: id }, { replace: hash === `#${id}` })
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    // Preventing the default also prevented the move of focus a fragment link makes.
    target.focus({ preventScroll: true })
  }

  return (
    <nav className="resume-index" aria-label={text.resumeSectionsLabel}>
      <ul ref={list}>
        {resumeSections.map(({ id, titleKey, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={id === active ? 'location' : undefined}
              onClick={(event) => scrollToSection(event, id)}
            >
              <span className="resume-index__icon" aria-hidden="true">
                <Icon />
              </span>
              {text[titleKey]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
