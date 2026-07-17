import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'
import Breadcrumb from './components/Breadcrumb'
import MobilePDFViewer from './components/MobilePDFViewer'
import ShareAndEarnModal from './components/ShareAndEarnModal'
import axiosInstance from './utils/axios'
import { getSharePdf } from './services/shareService'

// In development the backend returns absolute URLs like http://127.0.0.1:8000/media/...
// We strip the host so the Vite proxy (localhost:5173/media → 127.0.0.1:8000/media) handles it.
// In production the URL will be a CDN/S3 absolute URL which is left unchanged.
const BACKEND_ORIGINS = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
]

const normalizeUrl = (url) => {
  if (!url) return url
  for (const origin of BACKEND_ORIGINS) {
    if (url.startsWith(origin)) {
      return url.slice(origin.length)
    }
  }
  return url
}

// Detect image URLs (Cloudinary image upload path, or common image extensions)
// Kept for legacy safety — all new content is PDF
const isImageUrl = (url) => {
  if (!url) return false
  // Only treat as image if it explicitly has an image extension AND is NOT a PDF
  return /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url) && !/\.pdf(\?|$)/i.test(url)
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const PDFViewerPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { shareToken, slug } = useParams()
  const { user } = useAuth()

  // State for fetched mode (data fetched from the public API)
  const [fetchedData, setFetchedData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState(null)
  
  const [shareModalData, setShareModalData] = useState(null)
  const [shareModalPackId, setShareModalPackId] = useState(null)

  useEffect(() => {
    if (shareToken) {
      setDataLoading(true)
      // Detect Base36 share codes (exactly 8 alphanumeric chars) vs legacy UUIDs
      const isShareCode = /^[A-Z0-9]{8}$/i.test(shareToken) && shareToken.length === 8
      if (isShareCode) {
        // New Earn While Learning share code — requires auth, returns presigned URL
        const tryLoadPdf = (retryCount = 0) => {
          getSharePdf(shareToken)
            .then((data) => {
              if (data.pdf_url) {
                setFetchedData(data)
              } else {
                setDataError('Could not load the PDF. Please try again.')
              }
              setDataLoading(false)
            })
            .catch((err) => {
              const status = err?.response?.status
              const code = err?.response?.data?.code

              // If 401 and we haven't retried yet — token may have just been refreshed
              // by the interceptor; wait briefly and retry once
              if (status === 401 && retryCount === 0) {
                setTimeout(() => tryLoadPdf(1), 500)
                return
              }

              setDataLoading(false)

              if (status === 401 || status === 403 && code !== 'purchase_required') {
                // Not authenticated — send to login and come back after
                navigate(`/login?next=/view/share/${shareToken}`)
                return
              }

              if (code === 'purchase_required') {
                // Not purchased — send back to share landing page to pay
                navigate(`/share/${shareToken}`, { replace: true })
                return
              }

              setDataError('Failed to load the PDF. Please try again.')
            })
        }
        tryLoadPdf()
      } else {
        // Legacy UUID share token — public endpoint, no auth needed
        fetch(`${API_BASE}/scrib/packs/share/${shareToken}/`)
          .then((r) => r.json())
          .then((data) => {
            if (data.pdf_url) {
              setFetchedData(data)
            } else {
              setDataError('This share link is invalid or the PDF is not ready yet.')
            }
          })
          .catch(() => setDataError('Failed to load the shared PDF.'))
          .finally(() => setDataLoading(false))
      }
    } else if (slug && !location.state?.pdfUrl) {
      setDataLoading(true)
      fetch(`${API_BASE}/scrib/previews/${slug}/`)
        .then((r) => {
          if (!r.ok) throw new Error('Not found')
          return r.json()
        })
        .then((data) => {
          if (data.pdf_url || data.image_url) {
            setFetchedData({
              pdf_url: data.pdf_url || data.image_url,
              title: data.title,
              topics_json: data.tags,
              total_pages: data.page_count,
              isImage: !data.pdf_url && data.image_url
            })
          } else {
            setDataError('This note could not be found.')
          }
        })
        .catch(() => setDataError('Failed to load the preview note.'))
        .finally(() => setDataLoading(false))
    }
  }, [shareToken, slug, location.state])

  const routeState = location.state || {}
  const rawPdfUrl = fetchedData ? fetchedData.pdf_url : routeState.pdfUrl
  const title = fetchedData ? fetchedData.title : routeState.title
  const topics = fetchedData ? (fetchedData.topics_json || []) : (routeState.topics || [])
  const totalPages = fetchedData ? (fetchedData.total_pages || 1) : (routeState.totalPages || 1)
  const forceImage = fetchedData ? (fetchedData.isImage || false) : (routeState.isImage || false)
  const isPreviewMode = routeState.isPreviewMode || (rawPdfUrl && rawPdfUrl.includes('/preview/')) || false

  // Rewrite backend absolute URL → relative path so Vite proxy handles it
  const pdfUrl = normalizeUrl(rawPdfUrl)

  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(null)

  useEffect(() => {
    // If the PDF URL is a backend preview endpoint, resolve it to the direct S3 URL first
    // to prevent react-pdf from bouncing through 302 redirects for every chunk request.
    if (pdfUrl && pdfUrl.includes('/api/scrib/share/preview/') && !resolvedPreviewUrl) {
      setDataLoading(true)
      fetch(pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 'json=true', {
        headers: { 'Accept': 'application/json' }
      })
      .then(r => r.json())
      .then(data => {
        if (data.pdf_url) {
          setResolvedPreviewUrl(data.pdf_url)
        } else {
          setDataError('Failed to resolve secure preview URL.')
        }
      })
      .catch(() => setDataError('Failed to load preview.'))
      .finally(() => setDataLoading(false))
    }
  }, [pdfUrl, resolvedPreviewUrl])

  const finalPdfUrl = resolvedPreviewUrl || pdfUrl

  // True if we should render as an image (preview notes) rather than PDF iframe
  const renderAsImage = forceImage || isImageUrl(rawPdfUrl)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    
    // Clear toasts if page goes to background or is restored from bfcache (iOS Safari back button fix)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        customToast.dismiss()
      }
    }
    const handlePageShow = (event) => {
      if (event.persisted) {
        customToast.dismiss()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  const creditBalance = user?.credit_balance ?? 0
  const pageCount = totalPages

  const handleShare = async () => {
    // If we are already on a share page, the URL is perfect.
    if (shareToken) {
      setShareModalData({ title, url: window.location.href, isLoading: false })
      return
    }

    const { isPack, packId, shareToken: stateShareToken } = routeState

    if (isPack && packId) {
      setShareModalPackId(packId)
      return
    }
    
    // Fallback: copy current url
    setShareModalData({ title, url: window.location.href, isLoading: false })
  }

  const copyShareLink = async () => {
    if (!shareModalData || shareModalData.isLoading) return
    try {
      await navigator.clipboard.writeText(shareModalData.url)
      customToast.success('Link copied to clipboard!')
      setShareModalData(null)
    } catch {
      customToast.error('Failed to copy link')
    }
  }

  const handleDownload = async () => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    try {
      await forceDownload(finalPdfUrl, title || 'Scrib_Notes', !renderAsImage)
      if (isIOS) {
        customToast.success('Opening PDF — tap the Share icon to save to Files', { duration: 4000 })
      } else {
        customToast.success('Download started')
      }
    } catch (err) {
      customToast.error('Download failed. Try again.')
    }
  }

  const handleBack = () => {
    if (shareToken) {
      navigate('/')
    } else {
      navigate(-1)
    }
  }

  if ((shareToken || slug) && dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#1f1f1f] border-t-transparent"></div>
          <p className="text-sm text-[#7b756d]">Loading document…</p>
        </div>
      </div>
    )
  }

  if ((shareToken || slug) && dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="text-center max-w-sm px-6">
          <p className="text-sm font-semibold text-[#1f1f1f] mb-2">Link not found</p>
          <p className="text-sm text-[#7b756d] mb-4">{dataError}</p>
          <Link to="/" className="rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white">
            Go to Scrib
          </Link>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="text-center">
          <p className="text-sm text-[#7b756d]">No PDF to display.</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-[100dvh] flex-col overflow-hidden ${isMobile ? 'bg-black' : 'bg-[#f0ede7]'}`}>
      {/* ── Top bar ── */}
      <header className={`flex flex-shrink-0 items-center justify-between px-3 py-2.5 md:px-5 md:py-3 ${isMobile ? 'bg-black text-white' : 'border-b border-[#e0d9ce] bg-white'}`}>
        {/* Left section: Back button, Logo, Breadcrumb */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Back Button (icon only) */}
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:hidden"
            aria-label="Go back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          
          {/* Desktop Back Button (with text) */}
          <button
            onClick={handleBack}
            className="hidden items-center gap-1.5 rounded-full border border-[#e0d9ce] bg-[#f7f4ee] px-3 py-1.5 text-xs font-semibold text-[#5a554f] hover:bg-[#ede9e1] transition-colors md:flex"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>

          <span className="hidden text-[#e0d9ce] md:inline">|</span>
          <Link to="/" className="hidden flex-shrink-0 md:flex hover:opacity-90 transition-opacity">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
          </Link>
          <div className="hidden md:block">
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'View' },
            ]} />
          </div>
        </div>

        {/* Center section: Document Title */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden px-3">
          <p className={`max-w-[160px] truncate text-xs font-semibold sm:max-w-[300px] sm:text-sm ${isMobile ? 'text-white' : 'text-[#1f1f1f]'}`}>{title || 'Study Notes'}</p>
          <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline ${renderAsImage ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#f0f0ff] text-[#6366f1]'}`}>
            {renderAsImage ? 'Image' : 'PDF'}
          </span>
          <span className="hidden text-xs text-[#9a9289] sm:inline">· {pageCount} page{pageCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Right section: Mobile Actions & Desktop Credits */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Actions (hidden in preview mode since they must purchase first) */}
          {!isPreviewMode && (
            <>
              {routeState.isPack && routeState.packId ? (
                <button
                  onClick={handleShare}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#f59e0b] bg-[#fef3c7] px-3 text-[#b45309] hover:bg-[#fde68a] transition-colors"
                  aria-label="Share and Earn"
                  title="Share and Earn Credits"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                  <span className="hidden text-xs font-bold md:inline">Share &amp; Earn</span>
                </button>
              ) : (
                <button
                  onClick={handleShare}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:border md:border-[#e0d9ce] md:bg-[#f7f4ee] md:text-[#5a554f] md:hover:bg-[#ede9e1]"
                  aria-label="Share"
                  title="Copy Link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:border md:border-[#e0d9ce] md:bg-[#f7f4ee] md:text-[#5a554f] md:hover:bg-[#ede9e1]"
                aria-label="Download"
                title="Download PDF"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </>
          )}

          {/* Desktop-only credits */}
          {user && (
            <div className="hidden md:block">
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                ⚡ {creditBalance}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main PDF viewer ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Content area: image, MobilePDFViewer, or native iframe */}
          <div className={`flex flex-1 items-start justify-center overflow-auto ${isMobile ? 'bg-black' : 'bg-[#e8e4dc]'}`}>
            {renderAsImage ? (
              <div className="py-4 md:py-6 flex justify-center items-center h-full w-full bg-[#f0f0f0]">
                <img
                  src={rawPdfUrl}
                  alt={title}
                  className="max-h-full max-w-full rounded-sm object-contain shadow-xl"
                />
              </div>
            ) : isMobile || isPreviewMode ? (
              <div className="w-full h-full">
                <MobilePDFViewer 
                  url={resolvedPreviewUrl || pdfUrl} 
                  isPreviewMode={isPreviewMode} 
                  totalOriginalPages={totalPages} 
                  onUnlock={() => handleBack()}
                />
              </div>
            ) : (
              <div className="h-full w-full overflow-hidden">
                <iframe
                  src={`${pdfUrl}#view=FitH`}
                  title={title || 'Study Notes'}
                  className="h-full w-full border-0"
                />
              </div>
            )}
          </div>


          {/* Footer — desktop only */}
          <div className="hidden flex-shrink-0 items-center justify-center border-t border-[#e0d9ce] bg-white py-2 md:flex">
            <p className="text-[11px] text-[#a39b92]">
              AI may make mistakes. Verify important information.
            </p>
          </div>
        </main>
      </div>

      {/* Share Modal */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-all duration-300">
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#e2dbd2] transform scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1f1f1f]">Share link</h3>
              <button 
                onClick={() => setShareModalData(null)}
                className="rounded-full p-1.5 text-[#9a9289] hover:bg-[#f5f2ec] hover:text-[#1f1f1f] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <p className="text-sm text-[#7b756d] mb-4">
              Anyone with this link can view and download.
            </p>
            
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={shareModalData.url} 
                className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-3 py-2 text-sm text-[#5a554f] focus:border-[#1f1f1f] focus:outline-none"
                disabled={shareModalData.isLoading}
              />
              <button 
                onClick={copyShareLink}
                disabled={shareModalData.isLoading}
                className="flex-shrink-0 rounded-xl bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
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

export default PDFViewerPage
