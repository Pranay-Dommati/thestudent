import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'scrib_preview_modal_seen'

const PreviewPromoModal = ({ isLoggedIn, loading }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Wait until auth state is determined
    if (loading) return
    
    // Don't show if user is logged in or has already seen the modal
    if (isLoggedIn) {
      setVisible(false)
      return
    }
    if (localStorage.getItem(STORAGE_KEY)) return

    // Show after a few seconds to avoid aggressive bouncing
    const timer = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(timer)
  }, [isLoggedIn, loading])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn px-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-[#7b756d] transition-colors hover:bg-[#f0ece5] hover:text-[#1f1f1f]"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4e8c3a] via-[#6db05d] to-[#4e8c3a]" />

        <div className="px-6 pb-6 pt-7 text-center">
          {/* Eye icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef7df] border border-[#dbe8c3] shadow-sm text-[#4e8c3a]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>

          {/* Heading */}
          <h2 className="mt-5 text-xl font-bold text-[#1f1f1f]">
            See exactly what you're paying for
          </h2>

          {/* Description */}
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#6f6a63]">
            Browse <strong>50+ free handwritten note previews</strong> — no account needed. Verify the quality before spending a single rupee.
          </p>

          {/* Feature pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ee] px-3 py-1 text-xs text-[#6f6a63]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> View real samples
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4ee] px-3 py-1 text-xs text-[#6f6a63]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Free PDF downloads
            </span>
          </div>

          {/* CTA button */}
          <Link
            to="/previews"
            onClick={dismiss}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#333] hover:shadow-lg"
          >
            Browse free previews
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          {/* Secondary link */}
          <p className="mt-4 text-sm text-[#5f5a54]">
            Ready to generate your own?{' '}
            <Link to="/signup" onClick={dismiss} className="font-bold text-[#1f1f1f] underline decoration-[#1f1f1f] underline-offset-2 hover:opacity-80 transition-opacity">
              Sign up now
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

export default PreviewPromoModal
