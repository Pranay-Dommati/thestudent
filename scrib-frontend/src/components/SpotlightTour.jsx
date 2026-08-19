import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

/**
 * A product tour: dim the page, cut a hole around one real control, and anchor
 * a small tooltip to it.
 *
 * Pointing at the actual element beats describing it in a panel — the user
 * learns where the control *is*, not just that it exists, and the copy can stay
 * to one line because the highlight carries the rest.
 *
 * Each step names candidate targets rather than one element, because the same
 * control lives in different places per breakpoint (a rail on desktop, a
 * scrolling row on a phone). The first candidate that is actually on screen
 * wins — a hidden element measures zero, which is exactly the test.
 */

const TIP_WIDTH = 296
const GAP = 14          // space between the highlight and the tooltip
const PAD = 6           // breathing room around the highlighted element
const EDGE = 12         // keep the tooltip this far from the viewport edge

const visibleRect = (candidates = []) => {
  for (const ref of candidates) {
    const el = ref?.current
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return rect
  }
  return null
}

const SpotlightTour = ({ steps = [], onFinish }) => {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)

  const step = steps[index]
  const isLast = index === steps.length - 1

  const measure = useCallback(() => {
    setRect(visibleRect(step?.targets))
  }, [step])

  // Layout effect so the first paint already has the hole in the right place —
  // measuring in a passive effect shows one frame of a full-screen dimmer.
  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    // Bring the target into view first, then re-measure once the
    // smooth scroll has settled.
    for (const ref of step?.targets || []) {
      const node = ref?.current
      if (node && node.getBoundingClientRect().width > 0) {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' })
        break
      }
    }
    const settle = setTimeout(measure, 380)
    return () => clearTimeout(settle)
  }, [step, measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onFinish?.()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onFinish, steps.length])

  if (!step) return null

  // With no measurable target the tour has nothing to point at, so it centres
  // the tooltip rather than highlighting a corner of the page at random.
  const hole = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 400

  // A tall target — the full-height desktop rail — has no usable space above or
  // below it, so the tooltip goes alongside instead. Stacking it under a
  // viewport-height element would put it off the bottom of the screen.
  const tall = hole && hole.height > viewportH * 0.55
  const roomRight = hole && hole.left + hole.width + GAP + TIP_WIDTH + EDGE < viewportW
  const placement = !hole
    ? 'center'
    : tall && roomRight
      ? 'right'
      : hole.top + hole.height + GAP + 170 < viewportH
        ? 'bottom'
        : 'top'
  const below = placement === 'bottom'

  let tipTop
  let tipLeft
  if (placement === 'center') {
    tipTop = viewportH / 2
    tipLeft = Math.max((viewportW - TIP_WIDTH) / 2, EDGE)
  } else if (placement === 'right') {
    tipTop = Math.min(
      Math.max(hole.top + hole.height / 2 - 80, EDGE),
      Math.max(viewportH - 200, EDGE),
    )
    tipLeft = hole.left + hole.width + GAP
  } else {
    tipTop = below ? hole.top + hole.height + GAP : hole.top - GAP
    tipLeft = Math.min(
      Math.max(hole.left + hole.width / 2 - TIP_WIDTH / 2, EDGE),
      viewportW - TIP_WIDTH - EDGE,
    )
  }

  // Caret tracks the middle of the target, not the middle of the tooltip — they
  // differ whenever the tooltip has been nudged off a viewport edge.
  const caretLeft = hole
    ? Math.min(Math.max(hole.left + hole.width / 2 - tipLeft, 20), TIP_WIDTH - 20)
    : TIP_WIDTH / 2
  const caretTop = hole ? Math.min(Math.max(hole.top + hole.height / 2 - tipTop, 20), 140) : 40

  const advance = () => (isLast ? onFinish?.() : setIndex((i) => i + 1))

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* The dimmer is the highlight's own shadow, so the hole is always exactly
          the element and never drifts out of sync with a second overlay. */}
      <div
        className="absolute rounded-xl transition-all duration-300 ease-out"
        style={{
          top: hole?.top ?? 0,
          left: hole?.left ?? 0,
          width: hole?.width ?? 0,
          height: hole?.height ?? 0,
          boxShadow: '0 0 0 9999px rgba(17,19,24,0.66)',
          outline: hole ? '2px solid rgba(255,255,255,0.9)' : 'none',
          outlineOffset: 0,
        }}
        onClick={() => onFinish?.()}
      />

      <div
        className="absolute"
        style={{
          top: tipTop,
          left: tipLeft,
          width: TIP_WIDTH,
          transform: placement === 'top' ? 'translateY(-100%)' : undefined,
        }}
      >
        <div className="relative rounded-2xl bg-white p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] animate-tourIn">
          {hole && (
            <span
              className="absolute h-3 w-3 rotate-45 bg-white"
              style={
                placement === 'right'
                  ? { left: -5, top: caretTop - 6 }
                  : { left: caretLeft - 6, ...(below ? { top: -5 } : { bottom: -5 }) }
              }
            />
          )}

          <div className="relative">
            <p className="text-[13.5px] font-bold leading-snug text-[#1f1f1f]">
              {step.title}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#6f6a63]">
              {step.body}
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-4 bg-[#1f3a5f]' : 'w-1.5 bg-[#dcd6cd]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                {!isLast && (
                  <button
                    onClick={() => onFinish?.()}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#9a9289] transition-colors hover:text-[#1f1f1f]"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={step.onAction || advance}
                  className="rounded-lg bg-[#1f1f1f] px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#333]"
                >
                  {step.actionLabel || (isLast ? 'Got it' : 'Next')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tourIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; }
        }
        .animate-tourIn { animation: tourIn 0.22s ease-out; }
      `}</style>
    </div>
  )
}

export default SpotlightTour
