import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * A one-shot confetti burst that rains down from the top edge of the viewport.
 *
 * Used for the moments worth marking — claiming the free pack, mainly. It is
 * deliberately short and brand-coloured rather than a rainbow party popper: the
 * point is a beat of delight on top of the toast, not a takeover.
 *
 * Renders on top of everything with pointer-events off, so nothing underneath
 * is blocked while it plays, and unmounts itself when the last piece lands.
 *
 * Usage:
 *   const [celebrate, setCelebrate] = useState(false)
 *   ...
 *   <CelebrationBurst active={celebrate} onDone={() => setCelebrate(false)} />
 */

// Scrib's own palette — navy, amber, cream and a single green — so the burst
// reads as part of the product rather than a stock confetti library.
const COLORS = ['#1f3a5f', '#4a6aa6', '#e8a84e', '#f0c06a', '#c2542f', '#6db05d', '#f4f1ea']

const PIECE_COUNT = 64
// Longest a piece can be in flight (delay + duration), used to unmount on time.
const MAX_LIFE_MS = 4200

const buildPieces = () =>
  Array.from({ length: PIECE_COUNT }, (_, i) => {
    const round = i % 5 === 0
    const size = 6 + Math.random() * 6
    return {
      id: i,
      left: Math.random() * 100,
      // Pieces near the edges drift inward, middle ones scatter either way, so
      // the fall reads as a spread from the top rather than straight lines.
      drift: (Math.random() - 0.5) * 42,
      delay: Math.random() * 0.55,
      duration: 2.6 + Math.random() * 1.2,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      flutter: 0.5 + Math.random() * 0.6,
      color: COLORS[i % COLORS.length],
      width: round ? size : size * 0.6,
      height: size,
      round,
    }
  })

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const CelebrationBurst = ({ active, onDone }) => {
  // Bumped on every activation so the pieces are re-randomised and the CSS
  // animations restart from zero instead of resuming mid-fall.
  const [run, setRun] = useState(0)
  const [playing, setPlaying] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!active) return

    // Someone who asked the OS for less motion gets the toast and nothing else.
    if (prefersReducedMotion()) {
      onDoneRef.current?.()
      return
    }

    setRun((n) => n + 1)
    setPlaying(true)
    const timer = setTimeout(() => {
      setPlaying(false)
      onDoneRef.current?.()
    }, MAX_LIFE_MS)
    return () => clearTimeout(timer)
  }, [active])

  const pieces = useMemo(() => (playing ? buildPieces() : []), [run, playing])

  if (!playing) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="scrib-confetti"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}vw`,
            '--spin': `${p.spin}deg`,
          }}
        >
          <span
            className="scrib-confetti-piece"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : '1.5px',
              animationDuration: `${p.flutter}s`,
            }}
          />
        </span>
      ))}

      <style>{`
        .scrib-confetti {
          position: absolute;
          top: 0;
          will-change: transform, opacity;
          animation-name: scribConfettiFall;
          animation-timing-function: cubic-bezier(0.25, 0.55, 0.5, 1);
          animation-fill-mode: both;
        }
        .scrib-confetti-piece {
          display: block;
          animation-name: scribConfettiFlutter;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes scribConfettiFall {
          0% {
            transform: translate3d(0, -8vh, 0) rotate(0deg);
            opacity: 0;
          }
          6% { opacity: 1; }
          85% { opacity: 1; }
          100% {
            transform: translate3d(var(--drift), 104vh, 0) rotate(var(--spin));
            opacity: 0;
          }
        }
        @keyframes scribConfettiFlutter {
          0%, 100% { transform: rotateY(0deg) scaleX(1); }
          50% { transform: rotateY(180deg) scaleX(0.35); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scrib-confetti, .scrib-confetti-piece { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default CelebrationBurst
