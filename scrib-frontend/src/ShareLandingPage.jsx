import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getShareMeta, startSharePurchaseFlow, createShareLink } from './services/shareService'
import ShareAndEarnModal from './components/ShareAndEarnModal'
import customToast from './utils/customToast'

// ─── Payment Success Transition ───────────────────────────────────────────────

function PaymentSuccessScreen({ result, onOpenNotes, onShareEarn }) {
  const [step, setStep] = useState(1) // 1 = "Payment Successful", 2 = "Unlocking", 3 = "Done"

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 900)
    const t2 = setTimeout(() => setStep(3), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcf9f4] px-6 text-center">
      {step === 1 && (
        <div className="animate-fade-in space-y-3">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-[#1f1f1f]">Payment Successful!</h2>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in space-y-4">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-[#1f3a5f] border-t-transparent" />
          <h2 className="text-xl font-semibold text-[#1f1f1f]">Unlocking your notes…</h2>
          <p className="text-sm text-[#7b756d]">{result.title}</p>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in w-full max-w-sm space-y-5">
          <div className="text-4xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-[#1f1f1f]">You now own these notes.</h2>
            <p className="mt-1 text-sm text-[#7b756d]">{result.title} · {result.total_pages} page{result.total_pages !== 1 ? 's' : ''}</p>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onOpenNotes}
            className="w-full rounded-xl bg-[#1f3a5f] py-3 text-sm font-bold text-white hover:bg-[#2d5fa6] transition-colors"
          >
            Open Notes
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2dbd2]" />
            </div>
          </div>

          {/* Secondary CTA — Share & Earn */}
          <div className="rounded-2xl border border-[#dbe8c3] bg-[#f2f9e8] px-5 py-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <p className="text-sm font-bold text-[#3a5c20]">Want to earn credits?</p>
            </div>
            <p className="text-xs text-[#5a7a38] leading-relaxed">
              Share these notes with classmates. When someone buys through your link,
              you earn <strong>0.5 credits per page</strong>.
            </p>
            <button
              onClick={onShareEarn}
              className="w-full rounded-xl border border-[#c4dea0] bg-white py-2.5 text-sm font-semibold text-[#3a5c20] hover:bg-[#eaf5d6] transition-colors"
            >
              Share & Earn ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Blurred Page Preview ─────────────────────────────────────────────────────

function PagePreviewCard({ pageNumber, topics, isFirst, singlePage, previewToken, totalOriginalPages }) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  return (
    <div className={`rounded-xl border border-[#e2dbd2] overflow-hidden bg-white ${isFirst ? '' : 'relative'}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e2dbd2] bg-[#faf8f3]">
        <span className="text-xs font-semibold text-[#5a554f]">Page {pageNumber}</span>
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {topics.map((t, i) => (
              <span key={i} className="text-[10px] text-[#7b756d] bg-[#f0ebe1] rounded-full px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note paper illustration */}
      {isFirst && previewToken ? (
        <div className="relative w-full aspect-square overflow-hidden bg-white">
          {/* Loading Skeleton */}
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#faf8f3]">
              <div className="space-y-3 w-3/4 opacity-40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-3 rounded-full bg-[#d6cfc4]" style={{ width: `${70 + Math.sin(i) * 20}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1f3a5f] border-t-transparent" />
              </div>
            </div>
          )}
          <iframe 
            src={`/api/scrib/share/preview/${previewToken}/#toolbar=0&navpanes=0&scrollbar=0`}
            className={`absolute inset-0 w-full h-full border-0 pointer-events-none transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            title="Page 1 Preview"
            style={{ width: '100%', height: '100%' }}
            onLoad={() => setIframeLoaded(true)}
          />
          {/* Prevent interacting with the iframe to hide standard viewer UI on hover */}
          <div className="absolute inset-0 z-10" />

          {/* Full-screen viewer button */}
          <Link
            to="/view"
            state={{ 
              pdfUrl: `/api/scrib/share/preview/${previewToken}/`, 
              title: `Preview: ${topics[0] || 'Notes'}`,
              totalPages: totalOriginalPages || 1,
              isPreviewMode: true
            }}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-[#1f1f1f]/80 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md hover:bg-[#1f1f1f] transition-all hover:scale-105 shadow-sm"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Open Viewer
          </Link>
        </div>
      ) : (
        <div className="relative w-full aspect-square p-4 select-none">
          {/* Simulated handwritten lines */}
          <div className="space-y-2 opacity-60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-2.5 rounded-full bg-[#e8e2d9]"
                style={{ width: `${70 + Math.sin(i * 1.3) * 20}%` }}
              />
            ))}
          </div>

          {/* Protection Watermark overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[5px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a9289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px] text-[#9a9289] font-medium tracking-wide uppercase">Locked Page</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ShareLandingPage ────────────────────────────────────────────────────

export default function ShareLandingPage() {
  const { shareCode } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn, loading: authLoading } = useAuth()

  const [meta, setMeta] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState(null)

  const [paymentState, setPaymentState] = useState('idle') // idle | processing | success | error
  const [paymentResult, setPaymentResult] = useState(null)
  const [purchasedPackId, setPurchasedPackId] = useState(null) // set from verify response

  const [showShareModal, setShowShareModal] = useState(false)

  const purchaseCardRef = useRef(null)

  // Fetch share metadata
  useEffect(() => {
    if (!shareCode) return
    const load = async () => {
      try {
        const data = await getShareMeta(shareCode)
        setMeta(data)
      } catch (err) {
        const code = err?.response?.data?.code
        if (code === 'not_found') setMetaError('not_found')
        else setMetaError('error')
      } finally {
        setLoadingMeta(false)
      }
    }
    load()
  }, [shareCode])

  const handleUnlock = () => {
    if (!isLoggedIn) {
      navigate(`/login?next=/share/${shareCode}`)
      return
    }
    if (meta?.is_own_link) return
    setPaymentState('processing')
    startSharePurchaseFlow({
      shareCode,
      meta,
      user,
      onSuccess: (result) => {
        setPaymentResult(result)
        if (result.pack_id) setPurchasedPackId(result.pack_id)
        setPaymentState('success')
      },
      onFailure: (msg) => {
        setPaymentState('idle')
        customToast.error(msg || 'Payment failed. Please try again.')
      },
      onDismiss: () => {
        setPaymentState('idle')
      },
    })
  }

  const handleOpenNotes = () => {
    // Navigate to PDF viewer via share code — the backend resolves access
    // for the buyer via SharedPackPurchase check.
    navigate(`/view/share/${shareCode}`, {
      state: {
        title: meta?.title || paymentResult?.title,
        totalPages: meta?.total_pages || paymentResult?.total_pages,
        isPack: true,
        returnUrl: `/share/${shareCode}`,
      }
    })
  }

  const handleShareEarnPostPurchase = () => {
    setShowShareModal(true)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (authLoading || loadingMeta) {
    return (
      <div className="min-h-screen bg-[#fcf9f4] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1f3a5f] border-t-transparent" />
      </div>
    )
  }

  // ── Error states ──────────────────────────────────────────────────────────────
  if (metaError === 'not_found') {
    return (
      <div className="min-h-screen bg-[#fcf9f4] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🔍</div>
        <h1 className="text-xl font-bold text-[#1f1f1f]">Share link not found</h1>
        <p className="text-sm text-[#7b756d]">This link may have expired or been deactivated.</p>
        <Link to="/" className="rounded-full bg-[#1f3a5f] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fa6] transition-colors">
          Go to Scrib
        </Link>
      </div>
    )
  }

  if (metaError) {
    return (
      <div className="min-h-screen bg-[#fcf9f4] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-[#7b756d]">Something went wrong. Please try again.</p>
        <Link to="/" className="text-sm text-[#1f3a5f] font-semibold hover:underline">Go to Scrib</Link>
      </div>
    )
  }

  // ── Payment success screen ────────────────────────────────────────────────────
  if (paymentState === 'success' && paymentResult) {
    return (
      <>
        <PaymentSuccessScreen
          result={paymentResult}
          onOpenNotes={handleOpenNotes}
          onShareEarn={handleShareEarnPostPurchase}
        />
        {showShareModal && purchasedPackId && (
          <ShareAndEarnModal
            packId={purchasedPackId}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </>
    )
  }

  const isAlreadyPurchased = meta?.already_purchased
  const isOwnLink = meta?.is_own_link
  const totalPages = meta?.total_pages || 1
  const isSinglePage = totalPages === 1
  const topicsPerPage = meta?.topics_per_page || []

  // ── Main landing page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fcf9f4]">
      <Helmet>
        <title>{meta?.title ? `${meta.title} — Scrib Notes` : 'Scrib Notes'}</title>
        <meta name="description" content={`Unlock ${meta?.total_pages}-page AI handwritten notes for just ₹${meta?.total_price} on Scrib.`} />
      </Helmet>

      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm" />
            <div>
              <p className="text-sm font-semibold leading-none">Scrib</p>
              <p className="text-[10px] text-[#7b756d]">by EasyLearnova</p>
            </div>
          </Link>
          {!isLoggedIn && (
            <div className="flex items-center gap-2">
              <Link to={`/login?next=/share/${shareCode}`} className="rounded-full border border-[#d9d1c7] bg-white px-4 py-1.5 text-xs font-semibold hover:bg-[#faf8f3]">
                Log in
              </Link>
              <Link to={`/signup?next=/share/${shareCode}`} className="rounded-full bg-[#1f3a5f] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5fa6]">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">

          {/* ── LEFT: Note info + Topics + Preview ── */}
          <div className="flex-1 space-y-6">

            {/* Note title & meta */}
            <div>
              <h1 className="text-2xl font-bold text-[#1f1f1f] md:text-3xl">{meta?.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#7b756d]">
                <span className="inline-flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  {totalPages} page{totalPages !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-[#1f1f1f]">₹{meta?.total_price}</span>
                <span className="rounded-full bg-[#eef7df] px-2.5 py-0.5 text-[11px] font-semibold text-[#557a3f]">
                  ✓ Instant access after payment
                </span>
              </div>
            </div>

            {/* Topics Included */}
            {topicsPerPage.length > 0 && (
              <div className="rounded-2xl border border-[#e2dbd2] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9a9289] mb-4">Topics Included</p>
                <div className="space-y-3">
                  {topicsPerPage.map((page) => (
                    <div key={page.page} className="flex items-start gap-3">
                      <span className="flex-shrink-0 rounded-md bg-[#f0ebe1] px-2 py-0.5 text-[11px] font-semibold text-[#6b655d]">
                        Pg {page.page}
                      </span>
                      <p className="text-sm text-[#5a554f]">
                        {page.topics.length > 0 ? page.topics.join(' · ') : 'Covered topics'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview section */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9a9289] mb-3">Preview</p>
              <div className="space-y-3">
                {topicsPerPage.map((page, idx) => (
                  <PagePreviewCard
                    key={page.page}
                    pageNumber={page.page}
                    topics={page.topics}
                    isFirst={idx === 0}
                    singlePage={isSinglePage}
                    previewToken={meta?.preview_token}
                    totalOriginalPages={totalPages}
                    isPreviewMode={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sticky purchase card ── */}
          <div className="lg:w-80 lg:flex-shrink-0">
            <div
              ref={purchaseCardRef}
              className="sticky top-20 rounded-2xl border border-[#e2dbd2] bg-white shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-[#e2dbd2] bg-[#faf8f3]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#1f1f1f]">₹{meta?.total_price}</p>
                    <p className="text-xs text-[#7b756d]">{totalPages} page{totalPages !== 1 ? 's' : ''} · ₹{meta?.price_per_page}/page</p>
                  </div>
                  <div className="rounded-xl bg-[#1f3a5f] px-3 py-1.5">
                    <p className="text-xs font-bold text-white">{totalPages}p</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Benefits */}
                <ul className="space-y-2">
                  {[
                    '✓ Instant Access',
                    '✓ High-Quality PDF',
                    '✓ Download Anytime',
                    '✓ Share & Earn Credits',
                  ].map((item) => (
                    <li key={item} className="text-xs text-[#5a554f] flex items-center gap-2">
                      <span className="text-[#4caf50] font-bold">{item.slice(0, 1)}</span>
                      <span>{item.slice(2)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isAlreadyPurchased ? (
                  <div className="space-y-2">
                    <div className="w-full rounded-xl bg-[#eef7df] py-2.5 text-center text-sm font-semibold text-[#557a3f]">
                      ✓ Already Purchased
                    </div>
                    <button
                      onClick={handleOpenNotes}
                      className="w-full rounded-xl bg-[#1f3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fa6] transition-colors"
                    >
                      Open Notes
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full rounded-xl border border-[#dbe8c3] bg-[#f2f9e8] py-2.5 text-sm font-semibold text-[#3a5c20] hover:bg-[#eaf5d6] transition-colors"
                    >
                      Share & Earn ✨
                    </button>
                  </div>
                ) : isOwnLink ? (
                  <div className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] py-2.5 text-center text-xs font-medium text-[#9a9289]">
                    This is your own share link
                  </div>
                ) : (
                  <button
                    onClick={handleUnlock}
                    disabled={paymentState === 'processing'}
                    className="w-full rounded-xl bg-[#1f3a5f] py-3 text-sm font-bold text-white hover:bg-[#2d5fa6] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {paymentState === 'processing' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing…
                      </span>
                    ) : !isLoggedIn ? (
                      'Sign in to Unlock'
                    ) : (
                      'Unlock Complete Notes'
                    )}
                  </button>
                )}

                {/* Security badge */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9a9289]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Secured by Razorpay · UPI, cards accepted
                </div>
              </div>
            </div>

            {/* Share & Earn Credits info card */}
            <div className="mt-4 rounded-2xl border border-[#e8eefb] bg-[#f0f5fd] p-4">
              <p className="text-xs font-bold text-[#4a6aa6]">💡 Share & Earn Credits</p>
              <p className="mt-1 text-[11px] text-[#5a7aae] leading-relaxed">
                After purchasing, share with your classmates and earn <strong>0.5 credits per page</strong> every time someone buys through your link.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Share & Earn Modal */}
      {showShareModal && meta && (
        <ShareAndEarnModal
          packId={meta.pack_id}
          shareCode={shareCode}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
