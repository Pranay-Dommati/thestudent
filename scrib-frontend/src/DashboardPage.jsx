import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'

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
  const [openShareId, setOpenShareId] = useState(null)

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.share-dropdown-container')) setOpenShareId(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleShareOption = async (option, item, isPack, fileUrl, titleStr) => {
    setOpenShareId(null)
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
    if (option === 'copy') {
      if (!freshUrl) return
      await navigator.clipboard.writeText(freshUrl)
      customToast.success('Link copied to clipboard!')
    } else if (option === 'share') {
      if (!freshUrl) return
      if (navigator.share) {
        try {
          const response = await fetch(freshUrl)
          const blob = await response.blob()
          const file = new File([blob], `${titleStr}.pdf`, { type: 'application/pdf' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: titleStr })
          } else {
            await navigator.share({ url: freshUrl, title: titleStr })
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            await navigator.clipboard.writeText(freshUrl)
            customToast.success('Link copied! Share it manually.')
          }
        }
      } else {
        await navigator.clipboard.writeText(freshUrl)
        customToast.success('Link copied to clipboard!')
      }
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3]"
              >
                Log out
              </button>
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
            <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-5xl px-6 py-10">
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
            Running low? <span className="font-semibold text-[#1f1f1f]">Top up credits</span> - starts at Rs 49 for 10.
          </p>
          <button className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
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
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-[#e2dbd2] bg-[#faf8f3] p-2">
                        <div className={`h-1.5 w-10 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-8 rounded-full ${toneColors[tone]}`} />
                        <div className={`mt-2 h-1.5 w-6 rounded-full ${toneColors[tone]}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-[#7b756d]">
                          {formatDate(item.created_at)} - {item.credits_used} credit{item.credits_used !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'pending' || item.status === 'generating' ? (
                        <span className="rounded-full border border-[#e2dbd2] bg-[#f5f2ec] px-3 py-1 text-[10px] font-semibold text-[#6b655d] uppercase tracking-wider">
                          Generating...
                        </span>
                      ) : (
                        fileUrl && (
                          <div className="relative share-dropdown-container">
                            <button
                              onClick={() => setOpenShareId(openShareId === item.id ? null : item.id)}
                              className="flex items-center gap-1 rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs hover:bg-[#faf8f3] text-[#4b4742]"
                              title="Share options"
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
                            {openShareId === item.id && (
                              <div className="absolute bottom-full right-0 mb-2 z-50 min-w-[168px] rounded-xl border border-[#e2dbd2] bg-white shadow-xl overflow-hidden">
                                <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#a39b92]">Share options</p>
                                <button
                                  onClick={() => handleShareOption('copy', item, isPack, fileUrl, item.name)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  Copy link
                                </button>
                                <button
                                  onClick={() => handleShareOption('share', item, isPack, fileUrl, item.name)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 pb-2.5 text-xs font-medium text-left text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors border-t border-[#f0ede7]"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                  Share file
                                </button>
                              </div>
                            )}
                          </div>
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
    </div>
  )
}

export default DashboardPage
