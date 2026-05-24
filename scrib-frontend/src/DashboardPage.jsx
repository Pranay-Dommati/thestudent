import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'
import Breadcrumb from './components/Breadcrumb'
import BuyCreditsModal from './components/BuyCreditsModal'

const toneColors = {
  blue: 'bg-[#7ba7ff]',
  mint: 'bg-[#86c4b5]',
  sand: 'bg-[#d1b98a]',
}

const DashboardPage = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [historyItems, setHistoryItems] = useState([])
  const [statsData, setStatsData] = useState({ pdfs: 0, creditsUsed: 0 })
  const [shareModalData, setShareModalData] = useState(null)
  const [showBuyModal, setShowBuyModal] = useState(false)

  const handleShareOption = async (option, item, isPack, fileUrl, titleStr) => {
    // Use custom share modal immediately
    setShareModalData({ title: titleStr, url: 'Fetching secure link...', isLoading: true })
    let freshUrl = fileUrl
    if (isPack && item.id) {
      try {
        const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
          maxRedirects: 0,
          validateStatus: (s) => s < 400,
        })
        freshUrl = res.request?.responseURL || fileUrl
      } catch (err) {
        console.error('Failed to get fresh PDF URL for share', err)
      }
    }
    setShareModalData({ title: titleStr, url: freshUrl, isLoading: false })
  }

  const copyShareLink = async () => {
    if (!shareModalData || shareModalData.isLoading) return
    try {
      await navigator.clipboard.writeText(shareModalData.url)
      customToast.success('Link copied to clipboard!')
      setShareModalData(null)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return
    const loadData = async () => {
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
      }
    }
    loadData()
  }, [isLoggedIn])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Dashboard' },
            ]} />
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
            <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
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
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                Get started free
              </Link>
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
            Running low? <span className="font-semibold text-[#1f1f1f]">Top up credits</span> - starts at ₹59 for 10.
          </p>
          <button
            id="dashboard-buy-credits-btn"
            onClick={() => setShowBuyModal(true)}
            className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#faf8f3] transition-colors"
          >
            + Buy credits
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee6dc] px-4 py-3">
            <p className="text-sm font-semibold">Recent generations</p>
            <Link to="/generate" state={{ tab: 'history' }} className="text-xs font-semibold text-[#7b756d] hover:text-[#1f1f1f]">View all in History</Link>
          </div>
          <div className="divide-y divide-[#eee6dc]">
            {historyItems.length === 0 ? (
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
                          <button
                            onClick={() => handleShareOption('share', item, isPack, fileUrl, item.name)}
                            className="flex items-center gap-1 rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs hover:bg-[#faf8f3] text-[#4b4742]"
                            title="Share"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            Share
                          </button>
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

                              navigate('/view', {
                                state: {
                                  pdfUrl: isPack ? viewUrl : null,
                                  imageUrl: isPack ? null : viewUrl,
                                  title: item.name,
                                  topics: item.topics_json || [item.name],
                                  totalPages: item.total_pages || 1,
                                  isPack,
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
      {/* Share Modal */}
      {shareModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setShareModalData(null)}
              className="absolute right-4 top-4 text-[#9a9289] hover:text-[#1f1f1f] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="mb-1 text-lg font-bold text-[#1f1f1f]">Share link</h2>
            <p className="mb-5 text-sm text-[#7b756d]">Anyone with this link can view and download.</p>
            
            <div className="flex items-center gap-2 rounded-xl border border-[#e2dbd2] bg-[#faf8f3] p-1.5">
              <input 
                type="text" 
                readOnly 
                value={shareModalData.url} 
                className="w-full bg-transparent px-3 py-2 text-sm text-[#5a554f] outline-none"
              />
              <button
                onClick={copyShareLink}
                disabled={shareModalData.isLoading}
                className="flex-shrink-0 rounded-lg bg-[#1f1f1f] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage
