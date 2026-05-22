import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'
import Breadcrumb from './components/Breadcrumb'
import MobilePDFViewer from './components/MobilePDFViewer'

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

const PDFViewerPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { pdfUrl: rawPdfUrl, title, topics = [], totalPages = 1, isImage: forceImage = false } = location.state || {}

  // Rewrite backend absolute URL → relative path so Vite proxy handles it
  const pdfUrl = normalizeUrl(rawPdfUrl)

  // True if we should render as an image (preview notes) rather than PDF iframe
  const renderAsImage = forceImage || isImageUrl(rawPdfUrl)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const creditBalance = user?.credit_balance ?? 0
  const pageCount = totalPages

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    customToast.success('Link copied to clipboard')
  }

  const handleDownload = async () => {
    try {
      await forceDownload(rawPdfUrl || pdfUrl, title || 'Scrib_Notes', !renderAsImage)
      customToast.success('Download started')
    } catch (err) {
      customToast.error('Download failed. Try again.')
    }
  }

  if (!pdfUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="text-center">
          <p className="text-sm text-[#7b756d]">No PDF to display.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${isMobile ? 'bg-black' : 'bg-[#f0ede7]'}`}>
      {/* ── Top bar ── */}
      <header className={`flex flex-shrink-0 items-center justify-between px-3 py-2.5 md:px-5 md:py-3 ${isMobile ? 'bg-black text-white' : 'border-b border-[#e0d9ce] bg-white'}`}>
        {/* Left section: Back button, Logo, Breadcrumb */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Back Button (icon only) */}
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:hidden"
            aria-label="Go back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          
          {/* Desktop Back Button (with text) */}
          <button
            onClick={() => navigate(-1)}
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
          {/* Mobile-only actions (desktop has them in the secondary toolbar) */}
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:hidden"
            aria-label="Share"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors md:hidden"
            aria-label="Download"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

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
            ) : isMobile ? (
              <div className="w-full h-full">
                <MobilePDFViewer url={pdfUrl} />
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
    </div>
  )
}

export default PDFViewerPage
