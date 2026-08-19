import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFreeOffer, offerVisible } from '../services/packs'

// New key (not the old scrib_preview_modal_seen) so visitors who already
// dismissed the previews funnel still get shown this one once.
const STORAGE_KEY = 'scrib_welcome_choice_modal_seen'

// The interview-prep pack the modal opens on. Kept as a constant so swapping
// the featured pack is a one-line change.
const FEATURED_PACK_PATH = '/interview-prep/oop-interview-notes-quizzes'

// Someone arriving this way lands deep inside one subject having never seen
// the Library, so the prep page owes them a word about the other packs and
// the bundle. The flag is what tells it to bother.
const INTRO_PARAM = '?intro=1'

const WelcomeChoiceModal = ({ isLoggedIn, loading }) => {
  const [visible, setVisible] = useState(false)
  const [offer, setOffer] = useState(null)
  // The promo decides a badge and a line of copy. Rendering the no-offer
  // version first and swapping to FREE when the request lands reads as a
  // bait-and-switch, so those two spots hold a skeleton until the answer is in.
  const [offerLoading, setOfferLoading] = useState(true)

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

  useEffect(() => {
    if (!visible) return
    let alive = true
    // Fetched on show rather than on mount: most visits never reach the modal,
    // and a promo banner is not worth a request on every page load.
    fetchFreeOffer()
      .then((data) => alive && setOffer(data))
      .catch(() => {
        // The modal's two paths stand on their own without the promo line.
      })
      .finally(() => alive && setOfferLoading(false))
    return () => { alive = false }
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])

  if (!visible) return null

  // Someone who already claimed or bought a pack is past the launch offer, so
  // the modal pitches the packs on their merits rather than a giveaway.
  const showOffer = offerVisible(offer)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm animate-fadeIn"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-choice-title"
    >
      <div
        className="relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#7b756d] transition-colors hover:bg-[#f0ece5] hover:text-[#1f1f1f]"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1f3a5f] via-[#4a6aa6] to-[#f0c06a]" />

        <div className="px-5 pb-6 pt-7 sm:px-7">
          {/* Heading */}
          <div className="text-center">
            <h2 id="welcome-choice-title" className="text-xl font-bold leading-snug text-[#1f1f1f] sm:text-2xl">
              What are you here for?
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-[#6f6a63]">
              Pick a starting point.
            </p>
          </div>

          {/* Two paths */}
          <div className="mt-6 space-y-3">
            {/* Path 1 — Custom generation (the core product) */}
            <Link
              to="/generate"
              onClick={dismiss}
              className="group flex items-center gap-4 rounded-xl border border-[#e2dbd2] bg-[#fdfcf9] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#cfc7bd] hover:shadow-[0_12px_26px_-18px_rgba(31,31,31,0.45)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f0dfba] bg-[#fdf4e3] text-[#a6784a]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#1f1f1f]">
                  Generate custom notes
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#6f6a63]">
                  Paste your syllabus — get your custom handwritten notes.
                </span>
              </span>

              <span className="shrink-0 text-[#a6784a] transition-transform group-hover:translate-x-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            {/* Path 2 — Interview prep (newly launched) */}
            <Link
              to={`${FEATURED_PACK_PATH}${INTRO_PARAM}`}
              onClick={dismiss}
              className="group flex items-center gap-4 rounded-xl border border-[#dfe7f2] bg-[#f7faff] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#b9cde6] hover:shadow-[0_12px_26px_-18px_rgba(31,58,95,0.55)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d0e3f5] bg-[#e8eefb] text-[#4a6aa6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 2 8l10 5 10-5-10-5Z" />
                  <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
                  <path d="M22 8v6" />
                </svg>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1f1f1f]">
                    Prep for interviews
                  </span>
                  {offerLoading ? (
                    <span className="h-[17px] w-11 animate-pulse rounded-full bg-[#e2dbd2]" />
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                      showOffer ? 'bg-[#c2542f]' : 'bg-[#1f3a5f]'
                    }`}>
                      {showOffer ? 'Free' : 'New'}
                    </span>
                  )}
                </span>
                {offerLoading ? (
                  <span className="mt-2 block space-y-1.5" aria-hidden="true">
                    <span className="block h-2.5 w-full animate-pulse rounded bg-[#eae3d8]" />
                    <span className="block h-2.5 w-2/3 animate-pulse rounded bg-[#eae3d8]" />
                  </span>
                ) : (
                  <span className="mt-1 block text-xs leading-relaxed text-[#6f6a63]">
                    {showOffer
                      ? <>Your first pack is <strong>free</strong> — notes + quizzes.</>
                      : 'Ready-made handwritten packs with practice quizzes.'}
                  </span>
                )}
              </span>

              <span className="shrink-0 text-[#4a6aa6] transition-transform group-hover:translate-x-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          </div>
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

export default WelcomeChoiceModal
