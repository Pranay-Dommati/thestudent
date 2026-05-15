import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { forceDownload } from './utils/download'
import customToast from './utils/customToast'

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

  const [currentPage, setCurrentPage] = useState(1)
  const [iframeKey, setIframeKey] = useState(0) // force re-mount on page nav

  const creditBalance = user?.credit_balance ?? 0
  const pageCount = totalPages

  const goToPage = (p) => {
    if (p < 1 || p > pageCount) return
    setCurrentPage(p)
    // Append #page=N — Chrome/Edge/Firefox all support this for embedded PDFs
    setIframeKey((k) => k + 1)
  }

  const handleShare = () => {
    if (!pdfUrl) return
    navigator.clipboard.writeText(window.location.href)
    customToast.success('Link copied to clipboard!')
  }

  const handleDownload = () => forceDownload(rawPdfUrl || pdfUrl, title, !renderAsImage)

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
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0ede7]">
      {/* ── Top bar ── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-[#e0d9ce] bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-full border border-[#e0d9ce] bg-[#f7f4ee] px-3 py-1.5 text-xs font-semibold text-[#5a554f] hover:bg-[#ede9e1]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/scrib-favicon.svg" alt="Scrib" className="h-5 w-5" />
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-hidden">
          <p className="max-w-[240px] truncate text-sm font-semibold text-[#1f1f1f]">{title || 'Study Notes'}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${renderAsImage ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#f0f0ff] text-[#6366f1]'}`}>
            {renderAsImage ? 'Image' : 'PDF'}
          </span>
          <span className="text-xs text-[#9a9289]">· {pageCount} page{pageCount !== 1 ? 's' : ''} · all ready</span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
              ⚡ {creditBalance} credits
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="flex w-56 flex-shrink-0 flex-col border-r border-[#e0d9ce] bg-white">
          <div className="flex-shrink-0 border-b border-[#eee6dc] px-4 py-3">
            <p className="text-xs font-semibold text-[#1f1f1f]">{title || 'Study Notes'}</p>
            <p className="mt-0.5 text-[11px] text-[#9a9289]">{renderAsImage ? 'Image' : 'PDF'} · {pageCount} page{pageCount !== 1 ? 's' : ''}</p>
            <button
              onClick={handleDownload}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e0d9ce] bg-[#f7f4ee] px-3 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#ede9e1]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {renderAsImage ? 'Download image' : 'Download PDF'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {Array.from({ length: pageCount }).map((_, i) => {
              const pageNum = i + 1
              const topic = topics[i] || `Page ${pageNum}`
              const isActive = currentPage === pageNum
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-[#f0ede7]' : 'hover:bg-[#faf8f4]'}`}
                >
                  <div className={`flex h-10 w-8 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold shadow-sm ${isActive ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#e0d9ce] bg-[#faf8f4] text-[#9a9289]'}`}>
                    {pageNum}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-semibold ${isActive ? 'text-[#1f1f1f]' : 'text-[#3f3a35]'}`}>
                      Page {pageNum}
                    </p>
                    <p className="truncate text-[10px] text-[#9a9289]">
                      {Array.isArray(topic) ? topic.join(', ') : topic}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* ── Main PDF viewer ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-[#e0d9ce] bg-white px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e0d9ce] bg-white text-[#5a554f] disabled:opacity-40 hover:bg-[#f7f4ee]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>
              <span className="rounded-lg border border-[#e0d9ce] bg-white px-3 py-1 text-xs font-semibold text-[#1f1f1f]">
                Page {currentPage} / {pageCount}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e0d9ce] bg-white text-[#5a554f] disabled:opacity-40 hover:bg-[#f7f4ee]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg border border-[#e0d9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save page
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg border border-[#e0d9ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Content area: image or PDF iframe */}
          <div className="flex flex-1 items-start justify-center overflow-auto bg-[#e8e4dc] py-6">
            {renderAsImage ? (
              <img
                src={rawPdfUrl}
                alt={title}
                className="max-h-full max-w-full rounded-sm object-contain shadow-xl"
              />
            ) : (
              <div className="h-full w-full overflow-hidden">
                <iframe
                  key={iframeKey}
                  src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                  title={title || 'Study Notes'}
                  className="h-full w-full border-0"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 items-center justify-center border-t border-[#e0d9ce] bg-white py-2">
            <p className="text-[11px] text-[#a39b92]">
              Scroll or use sidebar to navigate pages · Re-download anytime from{' '}
              <Link to="/generate" className="underline hover:text-[#1f1f1f]">My notes</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PDFViewerPage
