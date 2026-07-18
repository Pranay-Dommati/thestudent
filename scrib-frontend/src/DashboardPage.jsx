import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Helmet } from 'react-helmet-async'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'
import BuyCreditsModal from './components/BuyCreditsModal'
import MobileMenu from './components/MobileMenu'
import HeaderAuthSkeleton from './components/HeaderAuthSkeleton'
import RedeemCouponCard from './components/RedeemCouponCard'
import ShareAndEarnModal from './components/ShareAndEarnModal'
import DownloadReminderModal from './components/DownloadReminderModal'
import ShareStatsBanner from './components/ShareStatsBanner'

const toneColors = {
  blue: 'bg-[#7ba7ff]',
  mint: 'bg-[#86c4b5]',
  sand: 'bg-[#d1b98a]',
}

const DashboardPage = () => {
  const { user, logout, isLoggedIn, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [historyItems, setHistoryItems] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [statsData, setStatsData] = useState({ pdfs: 0, creditsUsed: 0 })
  const [shareModalPackId, setShareModalPackId] = useState(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)
  const [downloadReminderData, setDownloadReminderData] = useState(null)
  const [highlightedItem, setHighlightedItem] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)
  const [resolvingAction, setResolvingAction] = useState(null)

  const handleShareEarn = (packId) => {
    setShareModalPackId(packId)
  }

  const resolveFreshUrl = async (item, fallbackUrl) => {
    const isPack = item.type === 'pack'
    let resolvedUrl = fallbackUrl || (isPack ? item.pdf_url : item.image_url)
    if (isPack && item.id && !String(item.id).startsWith('pending-')) {
      try {
        const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
          params: { json: 'true' },
          validateStatus: (status) => status >= 200 && status < 400
        })
        resolvedUrl = res.data?.pdf_url || res.headers?.location || res.request?.responseURL || resolvedUrl
      } catch (err) {
        console.error('Failed to resolve fresh PDF download URL:', err)
      }
    }
    return resolvedUrl
  }

  const handleDownloadClick = async (item, fileUrl) => {
    const isPack = item.type === 'pack'
    if (isPack && item.id && user) {
      setDownloadReminderData({ item, fileUrl })
    } else {
      setResolvingId(item.id)
      setResolvingAction('download')
      try {
        const freshUrl = await resolveFreshUrl(item, fileUrl)
        forceDownload(freshUrl, `${item.name}.pdf`, isPack)
      } finally {
        setResolvingId(null)
        setResolvingAction(null)
      }
    }
  }

  useEffect(() => {
    if (location.state?.purchaseSuccess) {
      customToast.success('✅ Purchase successful! Your notes are now available below.', { duration: 5000 })
    }
    if (location.state?.highlightPackId) {
      setHighlightedItem(location.state.highlightPackId)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  useEffect(() => {
    if (highlightedItem && !loadingData && historyItems.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`history-item-${highlightedItem}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const timer = setTimeout(() => {
            setHighlightedItem(null)
          }, 4000)
          return () => clearTimeout(timer)
        }
      }, 100)
    }
  }, [highlightedItem, loadingData, historyItems])

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login?next=/dashboard', { replace: true })
      return
    }
    if (!isLoggedIn) return
    const loadData = async () => {
      setLoadingData(true)
      try {
        const [notesRes, packsRes] = await Promise.all([
          axiosInstance.get('/scrib/my-notes/'),
          axiosInstance.get('/scrib/my-study-packs/')
        ])
        
        const notes = (notesRes.data || []).map(item => ({
          ...item,
          type: 'note',
          name: item.prompt || 'Note'
        }))
        const packs = (packsRes.data || []).map(item => ({
          ...item,
          type: 'pack',
          name: item.title || 'Study Pack'
        }))
        
        const combined = [...notes, ...packs].sort(
          (a, b) => new Date(b.purchased_at || b.created_at) - new Date(a.purchased_at || a.created_at)
        )
        
        setHistoryItems(combined)

        const totalCreditsUsed = combined.reduce((acc, curr) => acc + (curr.credits_used || 0), 0)
        setStatsData({ pdfs: combined.length, creditsUsed: totalCreditsUsed })
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [loading, isLoggedIn, navigate])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9f4]">
      <Helmet>
        <title>Dashboard - Scrib</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-9 w-9 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <div>
              <p className="text-sm font-semibold">Scrib</p>
              <p className="text-xs text-[#7b756d]">by EasyLearnova</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
            {isLoggedIn && (
              <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
            )}
          </nav>
          {loading ? (
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
              <Link to="/login" className="hidden sm:inline-flex rounded-full border border-[#d9d1c7] bg-white px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f3a5f] px-3 py-1.5 text-xs font-semibold text-white md:px-4 md:py-2">
                Get started
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div>
          <h1 className="text-xl font-semibold">Good afternoon, {user?.full_name ?? 'friend'}</h1>
          <p className="text-sm text-[#7b756d]">
            You have {user?.credit_balance ?? 0} credits remaining.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a9289]">Credits left</p>
            <p className="mt-3 text-2xl font-semibold">{user?.credit_balance ?? 0}</p>
          </div>
          <div className="rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a9289]">PDFs Generated</p>
            <p className="mt-3 text-2xl font-semibold">{statsData.pdfs}</p>
          </div>
          <div className="rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a9289]">Credits Used</p>
            <p className="mt-3 text-2xl font-semibold">{statsData.creditsUsed}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
          <p className="text-sm text-[#6f6a63]">
            Running low? <span className="font-semibold text-[#1f1f1f]">Top up credits</span> - starts at ₹19 for 2.
          </p>
          <button
            id="dashboard-buy-credits-btn"
            onClick={() => setShowBuyModal(true)}
            className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#faf8f3] transition-colors"
          >
            + Buy credits
          </button>
        </div>

        {/* Earn While Learning stats */}
        <ShareStatsBanner isLoggedIn={isLoggedIn} className="mt-6" />

        {/* Redeem Coupon */}
        {isLoggedIn && (
          <RedeemCouponCard
            onSuccess={async ({ new_balance }) => {
              await refreshUser?.()
            }}
          />
        )}

        <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee6dc] px-4 py-3">
            <p className="text-sm font-semibold">Recent generations</p>
            <Link to="/generate" state={{ tab: 'history' }} className="text-xs font-semibold text-[#7b756d] hover:text-[#1f1f1f]">View all in History</Link>
          </div>
          <div className="divide-y divide-[#eee6dc]">
            {loading || loadingData ? (
              <div className="space-y-3 p-4">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-[#f0ebe1]" />
                      <div className="space-y-1.5 flex-1 max-w-sm">
                        <div className="h-4 w-2/3 rounded bg-[#f0ebe1]" />
                        <div className="h-3 w-1/3 rounded bg-[#f0ebe1]" />
                      </div>
                    </div>
                    <div className="h-7 w-16 rounded bg-[#f0ebe1]" />
                  </div>
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#7b756d]">
                No generations yet. Create your first study pack!
              </div>
            ) : (
              historyItems.slice(0, visibleCount).map((item, index) => {
                const isPack = item.type === 'pack'
                const fileUrl = isPack ? item.pdf_url : item.image_url
                const toneKeys = Object.keys(toneColors)
                const tone = toneKeys[index % toneKeys.length]
                const isHighlighted = highlightedItem === item.id
                
                return (
                  <div key={item.id} id={`history-item-${item.id}`} className="relative">
                    {isHighlighted && (
                      <div className="absolute inset-0 z-0 animate-pulse rounded-xl bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#4ade80] blur-md opacity-60" />
                    )}
                    <div 
                      className={`relative flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-700 ${isHighlighted ? 'bg-white z-10 rounded-xl scale-[1.02] shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400 my-2 mx-1' : ''}`}
                    >
                      {isHighlighted && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg animate-bounce flex items-center gap-1 z-20 whitespace-nowrap">
                          <span>✨</span>
                          YOUR NEW NOTES
                          <span>✨</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                      <div className="flex-shrink-0 rounded-lg border border-[#e2dbd2] bg-[#faf8f3] p-2">
                        <div className={`h-1.5 w-10 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-8 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-6 rounded-full ${toneColors[tone]}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">{item.name}</p>
                        <p className="text-xs text-[#7b756d] flex items-center gap-1.5">
                          {formatDate(item.purchased_at || item.created_at)}
                          {item.is_purchased ? (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 text-[#4a6aa6] font-medium">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                Purchased
                              </span>
                            </>
                          ) : (
                            <>
                              <span>·</span>
                              <span>{item.credits_used} credit{item.credits_used !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full pt-1 sm:flex sm:w-auto sm:pt-0 sm:items-center sm:justify-end">
                      {item.status === 'failed' ? (
                        <span className="text-[11px] font-medium text-red-500 col-span-3 sm:col-span-1">
                          Failed
                        </span>
                      ) : item.status === 'pending' || item.status === 'generating' ? (
                        <span className="rounded-full border border-[#e2dbd2] bg-[#f5f2ec] px-3 py-1 text-[10px] font-semibold text-[#6b655d] uppercase tracking-wider col-span-3 sm:col-span-1">
                          Generating...
                        </span>
                      ) : fileUrl && (
                        <>
                          <button
                            onClick={async () => {
                              setResolvingId(item.id)
                              setResolvingAction('view')
                              try {
                                const viewUrl = await resolveFreshUrl(item, isPack ? item.pdf_url : item.image_url)

                                const slug = (item.name || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                navigate(`/view/${slug}`, {
                                  state: {
                                    pdfUrl: isPack ? viewUrl : null,
                                    imageUrl: isPack ? null : viewUrl,
                                    title: item.name,
                                    topics: Array.isArray(item.topics_json)
                                      ? item.topics_json.map(t => {
                                          if (Array.isArray(t)) return t.join(', ');
                                          if (t && typeof t === 'object' && Array.isArray(t.topics)) {
                                            return t.topics.map(sub => typeof sub === 'object' ? `${sub.name}${sub.instruction ? ` (${sub.instruction})` : ''}` : String(sub)).join(', ');
                                          }
                                          if (t && typeof t === 'object' && (t.name || t.topic)) {
                                            return `${t.name || t.topic}${t.instruction ? ` (${t.instruction})` : ''}`;
                                          }
                                          return String(t);
                                        })
                                      : [item.name],
                                    totalPages: item.total_pages || 1,
                                    isPack,
                                    packId: isPack ? item.id : null,
                                    returnUrl: '/dashboard'
                                  }
                                })
                              } finally {
                                setResolvingId(null)
                                setResolvingAction(null)
                              }
                            }}
                            disabled={resolvingId === item.id}
                            title="Open Viewer"
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2dbd2] bg-white px-3 h-9 text-xs font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#faf8f3] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {resolvingId === item.id && resolvingAction === 'view' ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                            <span>Open</span>
                          </button>
                          <button
                            onClick={() => handleDownloadClick(item, fileUrl)}
                            disabled={resolvingId === item.id}
                            title="Download PDF"
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2dbd2] bg-white px-3 h-9 text-xs font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#faf8f3] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {resolvingId === item.id && resolvingAction === 'download' ? (
                              <svg className="animate-spin text-[#1f1f1f]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            )}
                            <span>Download</span>
                          </button>
                          {item.type === 'pack' && item.status === 'ready' && (
                            <button
                              onClick={() => handleShareEarn(item.id)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3 h-9 text-xs font-semibold hover:bg-[#fef3c7] text-[#b45309] shadow-sm transition-colors"
                              title="Share & Earn Credits"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b] flex-shrink-0">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/>
                              </svg>
                              <span className="truncate">Share &amp; Earn</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  </div>
                )
              })
            )}
            
            {!loading && !loadingData && historyItems.length > visibleCount && (
              <div className="border-t border-[#eee6dc] p-4 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + 5)}
                  className="rounded-lg border border-[#e2dbd2] bg-[#faf8f3] px-4 py-2 text-xs font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f0ebe1]"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={({ credits_added }) => {
            customToast.success(`${credits_added} credits added to your account!`)
          }}
        />
      )}

      {/* Share & Earn Modal */}
      {shareModalPackId && (
        <ShareAndEarnModal
          packId={shareModalPackId}
          onClose={() => setShareModalPackId(null)}
        />
      )}

      {/* Download Reminder Modal */}
      {downloadReminderData && (
        <DownloadReminderModal
          onShare={() => {
            const { item } = downloadReminderData
            setDownloadReminderData(null)
            setShareModalPackId(item.id)
          }}
          onDownload={async () => {
            const { item, fileUrl } = downloadReminderData
            setDownloadReminderData(null)
            const freshUrl = await resolveFreshUrl(item, fileUrl)
            forceDownload(freshUrl, `${item.name}.pdf`, item.type === 'pack')
          }}
          onClose={() => setDownloadReminderData(null)}
        />
      )}

    </div>
  )
}

export default DashboardPage
