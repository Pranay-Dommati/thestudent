import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Document, Page } from 'react-pdf'
import { useAuth } from './context/AuthContext'
import { getShareMeta, startSharePurchaseFlow, createShareLink, getPreviewUrl } from './services/shareService'
import ShareAndEarnModal from './components/ShareAndEarnModal'
import customToast from './utils/customToast'
import { getInitials } from './utils/user'
import MobileMenu from './components/MobileMenu'
import HeaderAuthSkeleton from './components/HeaderAuthSkeleton'

// ─── Blurred Page Preview ─────────────────────────────────────────────────────

function PagePreviewCard({ pageNumber, topics, isFirst, singlePage, previewToken, totalOriginalPages, isUnlocked, pdfUrl }) {
  const [containerWidth, setContainerWidth] = useState(null)
  const cardRef = useRef(null)

  useEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        setContainerWidth(cardRef.current.offsetWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    if (cardRef.current) ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [])

  const docUrl = isUnlocked && pdfUrl ? pdfUrl : (previewToken ? getPreviewUrl(previewToken) : null)

  return (
    <div ref={cardRef} className={`rounded-xl border border-[#e2dbd2] overflow-hidden bg-white ${isFirst ? '' : 'relative'}`}>
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
      {((isFirst && previewToken) || (isUnlocked && pdfUrl)) && docUrl ? (
        <div className="relative w-full overflow-hidden bg-white min-h-[300px] flex justify-center">
          <Document
            file={docUrl}
            loading={
              <div className="flex flex-col items-center justify-center py-20 bg-[#faf8f3] w-full">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#1f3a5f] border-t-transparent mb-2" />
                <span className="text-xs text-[#7b756d]">Loading preview...</span>
              </div>
            }
            error={
              <div className="flex items-center justify-center py-20 text-xs text-red-500 w-full">
                Could not load preview image.
              </div>
            }
            className="flex justify-center w-full"
          >
            {containerWidth && (
              <Page
                pageNumber={isUnlocked ? pageNumber : 1}
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            )}
          </Document>

          {/* For single-page notes, blur the bottom half to encourage unlocking */}
          {singlePage && !isUnlocked && (
            <div className="absolute inset-x-0 bottom-0 top-1/2 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md border-t border-white/40 shadow-[0_-10px_20px_rgba(255,255,255,0.8)]">
              <div className="flex flex-col items-center p-4 bg-white/80 rounded-2xl shadow-sm border border-white/50 backdrop-blur-xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f3a5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5 opacity-90">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[10px] font-bold text-[#1f3a5f] uppercase tracking-widest opacity-90">Locked</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-square p-4 select-none">
          {/* Simulated handwritten lines */}
          <div className="absolute inset-0 p-6 space-y-4 opacity-60 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
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
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth()

  const [meta, setMeta] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState(null)

  const [paymentState, setPaymentState] = useState('idle') // idle | processing
  const [showShareModal, setShowShareModal] = useState(false)
  const [purchasedPackId, setPurchasedPackId] = useState(null)

  const purchaseCardRef = useRef(null)

  // Fetch share metadata.
  // We wait for authLoading to finish so we know if the user is logged in.
  // This ensures already_purchased / is_own_link fields are correct.
  useEffect(() => {
    if (!shareCode) return
    if (authLoading) return  // wait until we know the auth state

    let isMounted = true

    const load = async (isRetry = false) => {
      if (!isMounted) return
      try {
        const data = await getShareMeta(shareCode)
        if (isMounted) {
          setMeta(data)
          setLoadingMeta(false)
        }
      } catch (err) {
        if (!isMounted) return

        // If we had an expired/invalid token, the Axios interceptor clears it and rejects.
        // Retry once — this time the request runs anonymously and will succeed.
        if (!isRetry && err?.response?.status === 401) {
          load(true)
          return
        }

        const code = err?.response?.data?.code
        if (code === 'not_found') setMetaError('not_found')
        else setMetaError('error')

        setLoadingMeta(false)
      }
    }
    load()

    return () => { isMounted = false }
  }, [shareCode, authLoading, isLoggedIn])

  const navigateWithPdfUrl = (pdfUrl, title, totalPages, packId) => {
    const slug = encodeURIComponent((title || 'notes').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    const targetUrl = shareCode && meta?.pdf_url ? `/view/share/${shareCode}` : `/view/${slug}`
    navigate(targetUrl, {
      state: {
        pdfUrl,
        title,
        totalPages,
        isPack: true,
        packId: packId || meta?.pack_id,
        shareToken: shareCode,
        returnUrl: `/share/${shareCode}`,
      }
    })
  }

  const handleViewInDashboard = () => {
    navigate('/dashboard', {
      state: {
        highlightPackId: purchasedPackId || meta?.pack_id
      }
    })
  }

  const handleUnlock = () => {
    if (!isLoggedIn) {
      navigate(`/login?next=/share/${shareCode}`)
      return
    }
    if (isAlreadyPurchased || meta?.is_own_link) {
      handleViewInDashboard()
      return
    }
    setPaymentState('processing')
    startSharePurchaseFlow({
      shareCode,
      meta,
      user,
      onSuccess: (result) => {
        if (result.pack_id) setPurchasedPackId(result.pack_id)
        navigate('/dashboard', {
          state: {
            highlightPackId: result.pack_id,
            purchaseSuccess: true
          }
        })
      },
      onAlreadyPurchased: (data) => {
        setPaymentState('idle')
        navigate('/dashboard', {
          state: {
            highlightPackId: data?.pack_id || meta?.pack_id
          }
        })
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

  const isAlreadyPurchased = meta?.already_purchased
  const isOwnLink = meta?.is_own_link
  const totalPages = meta?.total_pages || 1
  const isSinglePage = totalPages === 1
  const topicsPerPage = meta?.topics_per_page || []

  // ── Render Purchase Card ──────────────────────────────────────────────────────
  const renderPurchaseCard = () => (
    <>
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
                onClick={handleViewInDashboard}
                className="w-full rounded-xl bg-[#1f3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#2d5fa6] transition-colors"
              >
                View in Dashboard
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
    </>
  )

  // ── Main landing page ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>{meta?.title ? `${meta.title} — Scrib Notes` : 'Scrib Notes'}</title>
        <meta name="description" content={`Unlock ${meta?.total_pages}-page AI handwritten notes for just ₹${meta?.total_price} on Scrib.`} />
      </Helmet>

      {/* Standard full header */}
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm" />
              <div>
                <p className="text-sm font-semibold leading-none">Scrib</p>
                <p className="text-[10px] text-[#7b756d]">by EasyLearnova</p>
              </div>
            </Link>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
            {isLoggedIn && (
              <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
            )}
          </nav>
          {authLoading ? (
            <HeaderAuthSkeleton />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold sm:inline-flex">
                Dashboard
              </Link>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} credits
              </span>
              <Link
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold transition-colors hover:bg-[#f5f2ec]"
                title="Profile"
              >
                {getInitials(user?.full_name)}
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={`/login?next=/share/${shareCode}`} className="hidden sm:inline-flex rounded-full border border-[#d9d1c7] bg-white px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2">
                Log in
              </Link>
              <Link to={`/signup?next=/share/${shareCode}`} className="rounded-full bg-[#1f3a5f] px-3 py-1.5 text-xs font-semibold text-white md:px-4 md:py-2">
                Get started
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
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

            {/* ── MOBILE ONLY: Purchase card rendered before preview ── */}
            <div className="block lg:hidden mt-6">
              {renderPurchaseCard()}
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9a9289]">Preview</p>
                {meta?.preview_token && (
                  <Link
                    to={meta?.pdf_url ? `/view/share/${shareCode}` : "/view"}
                    state={{ 
                      pdfUrl: meta?.pdf_url || getPreviewUrl(meta.preview_token), 
                      title: meta?.pdf_url ? (meta?.title || 'Notes') : `Preview: ${meta?.title || 'Notes'}`,
                      totalPages: totalPages,
                      isPreviewMode: !meta?.pdf_url,
                      isPack: true,
                      packId: meta?.pack_id,
                      shareToken: shareCode,
                      returnUrl: `/share/${shareCode}`
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#e2dbd2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1f1f1f] hover:bg-[#faf8f3] transition-colors shadow-sm"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    Open Viewer
                  </Link>
                )}
              </div>
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
                    isUnlocked={!!meta?.pdf_url}
                    pdfUrl={meta?.pdf_url}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sticky purchase card (Desktop) ── */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            {renderPurchaseCard()}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[#e2dbd2] py-8 text-center text-sm text-[#7b756d] bg-[#fcf9f4]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

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
