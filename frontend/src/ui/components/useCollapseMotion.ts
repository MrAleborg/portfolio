import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const TIMING: KeyframeAnimationOptions = { duration: 200, easing: 'ease-out' }

function canAnimate() {
  return (
    typeof Element.prototype.animate === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Motion for a card whose details open and close. The card slides between its closed and open
 * heights while the details fade; `open` tells whether the details are on screen, which is
 * the case until a closing card has finished shrinking. Without animation support, or with
 * reduced motion, `open` simply follows `expanded`.
 */
export function useCollapseMotion(expanded: boolean) {
  const cardRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(expanded)
  const previousExpanded = useRef(expanded)
  const restHeight = useRef(0)
  const running = useRef<Animation[]>([])

  if (expanded !== open && (expanded || !canAnimate())) setOpen(expanded)

  useLayoutEffect(() => {
    const card = cardRef.current
    const body = bodyRef.current
    if (previousExpanded.current === expanded) return
    previousExpanded.current = expanded
    if (!card || !body) return

    const interrupted = running.current.length > 0
    const height = card.getBoundingClientRect().height
    const opacity = interrupted ? Number.parseFloat(getComputedStyle(body).opacity) : undefined
    running.current.forEach((animation) => animation.cancel())
    running.current = []
    card.style.overflow = ''
    if (!canAnimate()) return

    const from = expanded && !interrupted ? restHeight.current : height
    let to = card.getBoundingClientRect().height
    if (!expanded) {
      // Measure the closed card, showing its closed layout for a moment, before any paint.
      const preview = previewRef.current
      body.hidden = true
      if (preview) preview.hidden = false
      to = card.getBoundingClientRect().height
      body.hidden = false
      if (preview) preview.hidden = true
    }

    card.style.overflow = 'hidden'
    const cardAnimation = card.animate({ height: [`${from}px`, `${to}px`] }, TIMING)
    const bodyAnimation = body.animate(
      { opacity: [opacity ?? (expanded ? 0 : 1), expanded ? 1 : 0] },
      TIMING,
    )
    running.current = [cardAnimation, bodyAnimation]
    cardAnimation.onfinish = () => {
      running.current = []
      card.style.overflow = ''
      if (!expanded) flushSync(() => setOpen(false))
    }
  }, [expanded])

  useLayoutEffect(() => {
    const card = cardRef.current
    if (card && running.current.length === 0) {
      restHeight.current = card.getBoundingClientRect().height
    }
  })

  useLayoutEffect(
    () => () => {
      running.current.forEach((animation) => animation.cancel())
    },
    [],
  )

  return { cardRef, bodyRef, previewRef, open }
}
