import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { getShareStats } from './services/shareService'

const toneColors = {
  blue: 'bg-[#7ba7ff]',
  mint: 'bg-[#86c4b5]',
  sand: 'bg-[#d1b98a]',
}

const DashboardPage = () => {
  const { user, logout, isLoggedIn, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [historyItems, setHistoryItems] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [statsData, setStatsData] = useState({ pdfs: 0, creditsUsed: 0 })
  const [shareModalPackId, setShareModalPackId] = useState(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [sharingStats, setSharingStats] = useState(null)
  const [loadingSharingStats, setLoadingSharingStats] = useState(false)

  const handleShareEarn = (packId) => {
    setShareModalPackId(packId)
  }

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login?redirect=/dashboard', { replace: true })
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
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
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

    // Fetch Earn While Learning stats separately so it doesn't block the main load
    const loadSharingStats = async () => {
      setLoadingSharingStats(true)
      try {
        const data = await getShareStats()
        setSharingStats(data)
      } catch {
        // Non-critical — silently ignore
      } finally {
        setLoadingSharingStats(false)
      }
    }
    loadSharingStats()
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
        {isLoggedIn && (
          <div className="mt-6 rounded-xl border border-[#e8eefb] bg-[#f0f5fd] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d8e6f8]">
              <p className="text-sm font-bold text-[#4a6aa6]">Share & Earn Credits ✨</p>
              <Link to="/generate?tab=history" className="text-xs font-semibold text-[#4a6aa6] hover:text-[#1f3a5f]">
                Share notes →
              </Link>
            </div>
            {loadingSharingStats ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4a6aa6] border-t-transparent" />
              </div>
            ) : sharingStats && sharingStats.notes_shared > 0 ? (
              <div className="grid grid-cols-3 divide-x divide-[#d8e6f8]">
                {[
                  { label: 'Notes Shared', value: sharingStats.notes_shared },
                  { label: 'Successful Purchases', value: sharingStats.successful_purchases },
                  { label: 'Rewards Earned', value: `${parseFloat(sharingStats.rewards_earned || 0).toFixed(1)} ${sharingStats.reward_type}` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-4 text-center">
                    <p className="text-xl font-bold text-[#1f3a5f]">{value}</p>
                    <p className="mt-0.5 text-[10px] text-[#5a7aae] uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-[#5a7aae]">
                  Share your notes and earn credits when friends purchase through your link.
                </p>
                <Link
                  to="/generate?tab=history"
                  className="mt-3 inline-block rounded-full border border-[#c4d9f5] bg-white px-4 py-1.5 text-xs font-semibold text-[#4a6aa6] hover:bg-[#e8f0fb] transition-colors"
                >
                  Start sharing →
                </Link>
              </div>
            )}
          </div>
        )}

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
              historyItems.slice(0, 5).map((item, index) => {
                const isPack = item.type === 'pack'
                const fileUrl = isPack ? item.pdf_url : item.image_url
                const toneKeys = Object.keys(toneColors)
                const tone = toneKeys[index % toneKeys.length]
                
                return (
                  <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 rounded-lg border border-[#e2dbd2] bg-[#faf8f3] p-2">
                        <div className={`h-1.5 w-10 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-8 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-6 rounded-full ${toneColors[tone]}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">{item.name}</p>
                        <p className="text-xs text-[#7b756d]">
                          {formatDate(item.created_at)} · {item.credits_used} credit{item.credits_used !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                      {item.status === 'failed' ? (
                        <span className="text-[11px] font-medium text-red-500">
                          Failed
                        </span>
                      ) : item.status === 'pending' || item.status === 'generating' ? (
                        <span className="rounded-full border border-[#e2dbd2] bg-[#f5f2ec] px-3 py-1 text-[10px] font-semibold text-[#6b655d] uppercase tracking-wider">
                          Generating...
                        </span>
                      ) : (
                        fileUrl && (
                          item.type === 'pack' && item.status === 'ready' ? (
                            <button
                              onClick={() => handleShareEarn(item.id)}
                              className="flex items-center gap-1 rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs hover:bg-[#faf8f3] text-[#4b4742]"
                              title="Share & Earn"
                            >
                              ✨ Share &amp; Earn
                            </button>
                          ) : null
                        )
                      )}
                      {fileUrl && (
                        <>
                          <button
                            onClick={() => forceDownload(fileUrl, `${item.name}.pdf`)}
                            className="rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs hover:bg-[#faf8f3]"
                          >
                            Download
                          </button>
                          <button
                            onClick={async () => {
                              let viewUrl = isPack ? item.pdf_url : item.image_url

                              // For packs: get a fresh presigned URL so it never expires
                              if (isPack && item.id) {
                                try {
                                  const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
                                    maxRedirects: 0,
                                    validateStatus: (s) => s < 400,
                                  })
                                  viewUrl = res.request?.responseURL || viewUrl
                                } catch (err) {
                                  console.error('Failed to get fresh PDF URL', err)
                                }
                              }

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
                                  returnUrl: '/dashboard'
                                }
                              })
                            }}
                            className="rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs hover:bg-[#faf8f3]"
                          >
                            View
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
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

    </div>
  )
}

export default DashboardPage
