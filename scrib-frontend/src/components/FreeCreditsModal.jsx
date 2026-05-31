import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'scrib_promo_modal_seen'

const FreeCreditsModal = ({ isLoggedIn }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if user is logged in or has already seen the modal
    if (isLoggedIn) return
    if (localStorage.getItem(STORAGE_KEY)) return

    // Show after a short delay so the page loads first
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [isLoggedIn])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={dismiss}
    >
      <div
        className="relative w-[90%] max-w-md overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#7b756d] transition-colors hover:bg-[#f0ece5] hover:text-[#1f1f1f]"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#f0c06a] via-[#e8a84e] to-[#f0c06a]" />

        <div className="px-6 pb-6 pt-7 text-center">
          {/* Gift icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef7df] border border-[#dbe8c3] shadow-sm">
            <span className="text-3xl">🎁</span>
          </div>

          {/* Heading */}
          <h2 className="mt-5 text-xl font-bold text-[#1f1f1f]">
            Get your first <span className="text-[#557a3f]">2 free credits</span>
          </h2>

          {/* Description */}
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#6f6a63]">
            Sign up now and get <strong>2 free credits</strong> to generate your own custom handwritten notes — no card needed.
          </p>

          {/* Feature pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ee] px-3 py-1 text-xs text-[#6f6a63]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> AI handwritten notes
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ee] px-3 py-1 text-xs text-[#6f6a63]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Instant PDF download
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ee] px-3 py-1 text-xs text-[#6f6a63]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> No card required
            </span>
          </div>

          {/* CTA button */}
          <Link
            to="/signup"
            onClick={dismiss}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#333] hover:shadow-lg"
          >
            Sign up & claim your free credits
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          {/* Secondary link */}
          <p className="mt-3 text-xs text-[#9a9289]">
            Already have an account?{' '}
            <Link to="/login" onClick={dismiss} className="font-semibold text-[#1f1f1f] underline decoration-[#d9d1c7] underline-offset-2 hover:decoration-[#1f1f1f]">
              Log in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  )
}

export default FreeCreditsModal
