import { useEffect } from 'react'

const SWATCHES = {
  blue:   { bg: '#eef5fb', pattern: '#d0e3f5' },
  green:  { bg: '#eefbf5', pattern: '#d0f5e3' },
  purple: { bg: '#f5eefb', pattern: '#e3d0f5' },
  orange: { bg: '#fbeee6', pattern: '#f5d0ba' },
  red:    { bg: '#fbeeee', pattern: '#f5d0d0' },
  olive:  { bg: '#f4f5ee', pattern: '#e3e6d0' },
}

const Cover = ({ theme, size = 'md' }) => {
  const swatch = SWATCHES[theme] || SWATCHES.blue
  const dims = size === 'sm'
    ? 'h-[30px] w-[25px] sm:h-[34px] sm:w-[28px]'
    : 'h-[38px] w-[31px] sm:h-[46px] sm:w-[38px]'
  return (
    <span
      className={`${dims} flex-shrink-0 rounded-[5px] border`}
      style={{
        backgroundColor: swatch.bg,
        borderColor: swatch.pattern,
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${swatch.pattern} 3px, ${swatch.pattern} 4px)`,
      }}
    />
  )
}

/**
 * The one gate in front of the free claim.
 *
 * The offer gives one pack per person, ever, and until the button is pressed
 * every subject is still on the table. Claiming straight from the CTA meant a
 * click meant as "tell me more" could spend the whole entitlement on whichever
 * pack happened to be open — so this names the pack, says plainly that it is
 * the only one, and puts the other subjects a tap away before anything is
 * spent.
 *
 * `onPick(slug)` moves to another subject rather than claiming here; the claim
 * only ever fires from the confirm button.
 */
const FreeClaimConfirmModal = ({
  open,
  pack,
  siblings = [],
  offer,
  claiming,
  onConfirm,
  onPick,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !claiming) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, claiming, onClose])

  if (!open || !pack) return null

  // Only the subjects they could still switch to: the one already open is the
  // subject of the question, and an owned pack is not an alternative.
  const alternatives = siblings.filter((s) => s.slug !== pack.slug && !s.owned)

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/45 px-3 py-4 backdrop-blur-sm animate-claimFadeIn sm:px-4 sm:py-6"
      onClick={() => !claiming && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-claim-title"
    >
      <div
        className="relative my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white shadow-2xl animate-claimScaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#c2542f] via-[#e8a84e] to-[#f0c06a] sm:h-1.5" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
          <div className="text-center">
            <span className="text-xl leading-none sm:text-2xl">🎁</span>
            <h2 id="free-claim-title" className="mt-1.5 text-[17px] font-bold leading-snug text-[#1f1f1f] sm:mt-2 sm:text-xl">
              You get one pack free — this one?
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-[#6f6a63] sm:mt-2 sm:max-w-sm sm:text-sm">
              One subject per person. Once you claim it, the rest stay paid.
            </p>
          </div>

          {/* What the claim is about to be spent on */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#f0dfba] bg-[#fdf9f0] p-3 sm:mt-5 sm:p-3.5">
            <Cover theme={pack.theme} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1f1f1f]">
                {pack.category || pack.title}
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#7b756d] sm:text-[12px]">
                {pack.page_count} pages · {pack.quiz_count} quizzes
                {pack.question_count > 0 && (
                  <span className="hidden sm:inline"> · {pack.question_count} questions</span>
                )}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-[#557a3f]">FREE</p>
              {pack.price > 0 && (
                <p className="text-[11px] text-[#9a9289] line-through">₹{pack.price}</p>
              )}
            </div>
          </div>

          <button
            onClick={onConfirm}
            disabled={claiming}
            className="mt-3.5 w-full rounded-full bg-[#c2542f] px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#c2542f]/25 transition-all hover:bg-[#a94526] active:scale-[0.99] disabled:opacity-60 sm:mt-4 sm:py-3 sm:text-[13.5px]"
          >
            {claiming ? 'Claiming…' : `Yes, claim ${pack.category || 'this pack'} free`}
          </button>

          {alternatives.length > 0 && (
            <div className="mt-4 sm:mt-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#9a9289] sm:text-[11px]">
                Or pick a different subject
              </p>
              <div className="mt-2 space-y-1.5 sm:space-y-2">
                {alternatives.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onPick?.(item.slug)}
                    disabled={claiming}
                    className="group flex w-full items-center gap-2.5 rounded-xl border border-[#e2dbd2] bg-white p-2 text-left transition-colors hover:border-[#cfc7bd] hover:bg-[#faf8f4] disabled:opacity-60 sm:gap-3 sm:p-2.5"
                  >
                    <Cover theme={item.theme} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-bold text-[#1f1f1f] sm:text-[13px]">
                        {item.category || item.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#7b756d]">
                        {item.page_count} pages · {item.quiz_count} quizzes
                      </span>
                    </span>
                    <span className="shrink-0 text-[#9a9289] transition-transform group-hover:translate-x-0.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#efe9e0] pt-3 sm:mt-5 sm:pt-3.5">
            <span className="text-[11px] text-[#9a9289]">
              {offer?.remaining > 0
                ? `Only ${offer.remaining} of ${offer.total_slots} free packs left`
                : 'Launch offer'}
            </span>
            <button
              onClick={onClose}
              disabled={claiming}
              className="text-[12px] font-semibold text-[#7b756d] underline decoration-[#c9c1b6] underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes claimFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes claimScaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px) }
          to { opacity: 1; transform: scale(1) translateY(0) }
        }
        .animate-claimFadeIn { animation: claimFadeIn 0.2s ease-out }
        .animate-claimScaleIn { animation: claimScaleIn 0.25s ease-out }
      `}</style>
    </div>
  )
}

export default FreeClaimConfirmModal
