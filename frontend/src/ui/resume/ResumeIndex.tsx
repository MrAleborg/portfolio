import { useEffect, useRef, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { resumeSections } from '@/ui/resume/resumeSections'
import { useActiveSection } from '@/ui/resume/useActiveSection'
import './ResumeIndex.css'

const sectionIds = resumeSections.map(({ id }) => id)

const USER_INTERACTIONS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/** How long a deep link keeps its target aligned while the page above it loads. */
const REALIGN_MS = 3000
/** How long a smooth scroll may take to end, and how long the page must stay still to count as ended. */
const SETTLE_TIMEOUT_MS = 2000
const SETTLE_STILL_MS = 150
/** A section this close (px) to its scroll margin is aligned. */
const OFF_TARGET_PX = 2
/** The correction itself may toggle the address bar once more. */
const MAX_CORRECTIONS = 2

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs `cleanup` at the first of: the end of `ms`, the user's first interaction, or a call to the
 * returned `stop`. `cleanup` and `stop` may run more than once.
 */
function stopOnInteractionOrTimeout(ms: number, cleanup: () => void): () => void {
  const timer = setTimeout(stop, ms)
  USER_INTERACTIONS.forEach((type) => window.addEventListener(type, stop, { passive: true }))
  function stop() {
    clearTimeout(timer)
    USER_INTERACTIONS.forEach((type) => window.removeEventListener(type, stop))
    cleanup()
  }
  return stop
}

/**
 * A browser whose viewport changes mid-scroll (a collapsing address bar) can end a smooth scroll
 * off target. Once the page has been still for a moment after scrolling or resizing, scroll to
 * `target` again, up to `MAX_CORRECTIONS` times. The wait ends when `target` is aligned, when the
 * page cannot scroll further, after the corrections, at the timeout or at the user's first
 * interaction. Returns a function that cancels it.
 */
function correctAfterSmoothScroll(target: Element): () => void {
  let left = MAX_CORRECTIONS
  let debounce: ReturnType<typeof setTimeout> | undefined
  // Only these events start the wait, so a click that caused no scroll never settles.
  const sources: EventTarget[] = window.visualViewport ? [window, window.visualViewport] : [window]
  const events = ['scroll', 'resize']
  const rearm = () => {
    clearTimeout(debounce)
    debounce = setTimeout(settle, SETTLE_STILL_MS)
  }
  sources.forEach((source) =>
    events.forEach((type) => source.addEventListener(type, rearm, { passive: true })),
  )
  const stop = stopOnInteractionOrTimeout(SETTLE_TIMEOUT_MS, () => {
    clearTimeout(debounce)
    sources.forEach((source) => events.forEach((type) => source.removeEventListener(type, rearm)))
  })
  function settle() {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    const gap = Math.abs(target.getBoundingClientRect().top - margin)
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
    if (gap <= OFF_TARGET_PX || atEnd) return stop()
    // A gap of half the viewport is no address bar: the page may only have paused, or the user
    // scrolled away. Keep waiting for the page to settle, without fighting the user.
    if (gap >= window.innerHeight / 2) return
    target.scrollIntoView({ behavior: 'auto', block: 'start' })
    if (--left === 0) stop()
  }
  return stop
}

/**
 * Sections load asynchronously, so content above the section named by the address keeps growing:
 * scroll to it, then keep it aligned until the user takes over or time runs out.
 * Returns a function that stops the alignment.
 */
function useDeepLink(): () => void {
  const stopAligning = useRef(() => {})
  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1))
    if (!target) return
    const align = () => target.scrollIntoView({ behavior: 'auto', block: 'start' })
    align()

    // The anchors' container, whose height grows as the sections above the target load.
    const resizeObserver = new ResizeObserver(align)
    resizeObserver.observe(target.parentElement as Element)
    stopAligning.current = stopOnInteractionOrTimeout(REALIGN_MS, () => resizeObserver.disconnect())
    return stopAligning.current
  }, [])
  return () => stopAligning.current()
}

export function ResumeIndex() {
  const text = messages[useLocale().locale]
  const active = useActiveSection(sectionIds)
  const list = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()
  const { hash } = useLocation()
  const cancelCorrection = useRef(() => {})
  const stopDeepLink = useDeepLink()

  useEffect(() => () => cancelCorrection.current(), [])

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
    const smooth = !prefersReducedMotion()
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    // Preventing the default also prevented the move of focus a fragment link makes.
    target.focus({ preventScroll: true })
    stopDeepLink()
    cancelCorrection.current()
    if (smooth) cancelCorrection.current = correctAfterSmoothScroll(target)
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
