import { Link } from 'react-router-dom'
import { offerVisible } from '../services/packs'

/**
 * The launch-promo strip: "your first interview pack is free, N of 150 left".
 *
 * Renders nothing unless `offerVisible` says this viewer should see the promo:
 * a bar advertising a promo that has ended — or one this person has already
 * taken — is worse than no bar at all. `offer` is the payload from
 * /scrib/packs/free-offer/ (also embedded in the catalogue and pack-detail
 * responses), so a caller that already fetched one of those needs no extra
 * request.
 *
 * `variant` picks the density, not the message:
 *   'strip'   — full-width bar for a page header
 *   'inline'  — boxed card for a sidebar or a paywall
 *   'compact' — one line, for tight spots like a modal
 */
const FreeOfferBanner = ({ offer, variant = 'strip', className = '', onCta, ctaLabel }) => {
  if (!offerVisible(offer)) return null

  const { total_slots: total = 0, remaining = 0, claimed = 0 } = offer
  const claimedPct = total > 0 ? Math.min(100, Math.round((claimed / total) * 100)) : 0

  // Under a fifth left reads as "about to go" — worth colouring differently
  // from a promo that has barely started.
  const urgent = total > 0 && remaining <= Math.max(1, Math.round(total * 0.2))

  const countLine = `Only ${remaining} of ${total} left`

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#fdf4e3] px-2.5 py-1 text-[11px] font-semibold text-[#8a6524] ring-1 ring-[#f0dfba] ${className}`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e8a84e] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#e8a84e]" />
        </span>
        1st pack free · {remaining} of {total} left
      </span>
    )
  }

  const Progress = () => (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#efe6d3]">
      <div
        className={`h-full rounded-full transition-all duration-500 ${urgent ? 'bg-[#c2542f]' : 'bg-[#e8a84e]'}`}
        style={{ width: `${Math.max(claimedPct, 3)}%` }}
      />
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className={`rounded-xl border border-[#f0dfba] bg-[#fdf9f0] p-3.5 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">🎁</span>
          <p className="text-[12.5px] font-bold leading-snug text-[#1f1f1f]">
            {offer.headline || 'Your first interview pack is free'}
          </p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#7b756d]">
          Launch offer for the first {total} students. Pick any pack — notes and
          quizzes, nothing to pay.
        </p>
        <div className="mt-2.5">
          <Progress />
          <p className={`mt-1.5 text-[11px] font-semibold ${urgent ? 'text-[#c2542f]' : 'text-[#8a6524]'}`}>
            {countLine}
          </p>
        </div>
        {onCta && (
          <button
            onClick={onCta}
            className="mt-3 w-full rounded-lg bg-[#1f1f1f] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#333]"
          >
            {ctaLabel || 'Claim it free'}
          </button>
        )}
      </div>
    )
  }

  // 'strip'
  return (
    <div className={`border-b border-[#f0dfba] bg-gradient-to-r from-[#fdf9f0] via-[#fdf4e3] to-[#fdf9f0] ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 text-lg leading-none">🎁</span>
          <p className="text-[13px] leading-snug text-[#1f1f1f]">
            <span className="font-bold">
              {offer.headline || 'Your first interview pack is free'}
            </span>
            <span className="hidden text-[#7b756d] sm:inline">
              {' '}— launch offer for the first {total} students.
            </span>
          </p>
        </div>

        {/* On a phone the bar gets its own full-width line and the count sits
            under it opposite the CTA — cramming all three onto one row is what
            squeezed the bar to a stub and clipped the count. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:shrink-0">
          <div className="w-full sm:w-36">
            <Progress />
          </div>
          <div className="flex items-center justify-between gap-3 sm:gap-3">
            <span className={`whitespace-nowrap text-[12px] font-bold ${urgent ? 'text-[#c2542f]' : 'text-[#8a6524]'}`}>
              {countLine}
            </span>
            {onCta ? (
              <button
                onClick={onCta}
                className="shrink-0 whitespace-nowrap rounded-full bg-[#1f1f1f] px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#333]"
              >
                {ctaLabel || 'Claim it free'}
              </button>
            ) : (
              <Link
                to="/interview-prep"
                className="shrink-0 whitespace-nowrap rounded-full bg-[#1f1f1f] px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#333]"
              >
                {ctaLabel || 'Claim it free'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FreeOfferBanner
