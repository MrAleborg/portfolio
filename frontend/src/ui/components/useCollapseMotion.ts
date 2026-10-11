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
  const running = useRef<Animation[]>([])

  if (expanded !== open && (expanded || !canAnimate())) setOpen(expanded)

  useLayoutEffect(() => {
    const card = cardRef.current
    const body = bodyRef.current
    if (previousExpanded.current === expanded) return
    previousExpanded.current = expanded
    if (!card || !body) return

    const interrupted = running.current.length > 0
    const live = card.getBoundingClientRect().height
    const opacity = interrupted ? Number.parseFloat(getComputedStyle(body).opacity) : undefined
    running.current.forEach((animation) => animation.cancel())
    running.current = []
    card.style.overflowY = ''
    if (!canAnimate()) return

    // The card is laid out open; measure it closed too, as it is now, before any paint.
    const openHeight = card.getBoundingClientRect().height
    const preview = previewRef.current
    body.hidden = true
    if (preview) preview.hidden = false
    const closedHeight = card.getBoundingClientRect().height
    body.hidden = false
    if (preview) preview.hidden = true

    const from = interrupted ? live : expanded ? closedHeight : openHeight
    const to = expanded ? openHeight : closedHeight
    card.style.overflowY = 'clip'
    const cardAnimation = card.animate({ height: [`${from}px`, `${to}px`] }, TIMING)
    const bodyAnimation = body.animate(
      { opacity: [opacity ?? (expanded ? 0 : 1), expanded ? 1 : 0] },
      TIMING,
    )
    running.current = [cardAnimation, bodyAnimation]
    cardAnimation.onfinish = () => {
      running.current = []
      card.style.overflowY = ''
      if (!expanded) flushSync(() => setOpen(false))
    }
  }, [expanded])

  useLayoutEffect(
    () => () => {
      running.current.forEach((animation) => animation.cancel())
    },
    [],
  )

  return { cardRef, bodyRef, previewRef, open }
}
