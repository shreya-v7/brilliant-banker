import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const DIM = 'rgba(15, 23, 42, 0.72)'

/**
 * Dims the viewport except for a padded rectangle around `selector`.
 * Highlighted region stays at full opacity; everything else is darker.
 */
export default function WalkthroughSpotlight({ selector, padding = 12 }) {
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    if (!selector) {
      setBox(null)
      return
    }

    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) {
        setBox(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) {
        setBox(null)
        return
      }
      const p = padding
      setBox({
        top: r.top - p,
        left: r.left - p,
        width: r.width + 2 * p,
        height: r.height + 2 * p,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const el = document.querySelector(selector)
    const ro = new ResizeObserver(measure)
    if (el) ro.observe(el)

    const id = window.setInterval(measure, 400)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      ro.disconnect()
      window.clearInterval(id)
    }
  }, [selector, padding])

  if (!selector || !box) return null

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0
  const { top: t, left: l, width: w, height: h } = box

  const topH = Math.max(0, t)
  const leftW = Math.max(0, l)
  const midTop = t
  const midLeft = l
  const midW = w
  const midH = h
  const bottomTop = t + h
  const bottomH = Math.max(0, vh - bottomTop)
  const rightLeft = l + w
  const rightW = Math.max(0, vw - rightLeft)

  const bar = { backgroundColor: DIM, pointerEvents: 'none' }

  return createPortal(
    <div className="fixed inset-0 z-[58] pointer-events-none" aria-hidden="true">
      {/* top */}
      <div className="absolute left-0 right-0 top-0" style={{ ...bar, height: topH }} />
      {/* bottom */}
      <div className="absolute left-0 right-0" style={{ ...bar, top: bottomTop, height: bottomH }} />
      {/* left strip */}
      <div className="absolute left-0" style={{ ...bar, top: midTop, width: leftW, height: midH }} />
      {/* right strip */}
      <div className="absolute" style={{ ...bar, top: midTop, left: rightLeft, width: rightW, height: midH }} />
      {/* focus ring */}
      <div
        className="absolute rounded-2xl ring-2 ring-pnc-orange/70 shadow-[0_0_0_4px_rgba(249,115,22,0.15)] pointer-events-none"
        style={{ top: midTop, left: midLeft, width: midW, height: midH }}
      />
    </div>,
    document.body,
  )
}
