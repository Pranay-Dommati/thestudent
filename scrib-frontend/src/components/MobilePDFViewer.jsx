import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN for worker to prevent module resolution errors on older mobile browsers
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const MobilePDFViewer = ({ url, isPreviewMode, totalOriginalPages, onUnlock }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return Math.min(document.documentElement.clientWidth || window.innerWidth, 900)
    }
    return null
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showIndicator, setShowIndicator] = useState(true)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const indicatorTimeoutRef = useRef(null)

  // Use window.innerWidth to determine width. It is completely immune to flexbox layout 
  // quirks that happen when the iOS Safari address bar expands/collapses.
  const measureWidth = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // PDF takes full width on mobile, capped at 900px
      // We use document.documentElement.clientWidth because window.innerWidth changes during pinch-zoom!
      const clientWidth = typeof document !== 'undefined' ? document.documentElement.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 400)
      const w = Math.min(clientWidth, 900)
      setPageWidth(prev => {
        // Only update if width actually changed (ignores vertical resizes from browser chrome)
        if (prev === null || Math.abs(w - prev) > 10) return w
        return prev
      })
    }, 100)
  }, [])

  useEffect(() => {
    measureWidth()
    
    window.addEventListener('resize', measureWidth)
    window.addEventListener('orientationchange', measureWidth)
    
    return () => {
      window.removeEventListener('resize', measureWidth)
      window.removeEventListener('orientationchange', measureWidth)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [measureWidth])

  // Track scrolling and interaction to show/hide indicator
  useEffect(() => {
    const show = () => {
      setShowIndicator(true)
      if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current)
      indicatorTimeoutRef.current = setTimeout(() => {
        setShowIndicator(false)
      }, 2500)
    }

    show() // Initial show

    window.addEventListener('scroll', show, { passive: true })
    window.addEventListener('touchstart', show, { passive: true })
    window.addEventListener('touchmove', show, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', show)
      window.removeEventListener('touchstart', show)
      window.removeEventListener('touchmove', show)
      if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current)
    }
  }, [])

  // Intersection Observer to track current page
  useEffect(() => {
    if (!numPages) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number'), 10)
            if (!isNaN(pageNum)) {
              setCurrentPage(pageNum)
            }
          }
        })
      },
      { rootMargin: '-40% 0px -40% 0px' }
    )

    const pageContainers = document.querySelectorAll('.pdf-page-container')
    pageContainers.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [numPages, pageWidth])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center w-full bg-transparent"
    >
      {/* Floating page indicator */}
      {numPages && (
        <div className="sticky top-20 z-50 self-start ml-4" style={{ marginBottom: '-32px' }}>
          <div className={`flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-sm pointer-events-none transition-opacity duration-500 ${showIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            {currentPage} of {(isPreviewMode && totalOriginalPages) ? Math.max(totalOriginalPages, numPages) : numPages}
          </div>
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col items-center w-full"
        loading={
          <div 
            className="bg-white p-8 animate-pulse border border-[#e2dbd2] shadow-sm flex flex-col mt-2" 
            style={{ 
              width: pageWidth ? `${pageWidth}px` : '100%', 
              minHeight: pageWidth ? `${pageWidth * 1.414}px` : '600px', // standard A4 aspect ratio
              maxWidth: '900px'
            }}
          >
            <div className="h-6 rounded-full bg-[#e4ddd4] w-2/5 mx-auto mb-10" />
            <div className="space-y-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded-full bg-[#f0ede7]"
                  style={{ width: `${60 + Math.sin(i * 1.5) * 35}%` }}
                />
              ))}
            </div>
            <div className="mt-12 space-y-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`b_${i}`}
                  className="h-3.5 rounded-full bg-[#f0ede7]"
                  style={{ width: `${50 + Math.cos(i * 1.2) * 45}%` }}
                />
              ))}
            </div>
          </div>
        }
        error={<div className="py-20 text-sm text-red-500 text-center">Failed to load PDF.</div>}
      >
        {pageWidth && Array.from(new Array(numPages || 0), (el, index) => (
          <div
            key={`page_${index + 1}`}
            className="w-full mb-3 flex justify-center relative pdf-page-container"
            data-page-number={index + 1}
            style={{ contain: 'layout' }}
          >
            <Page
              pageNumber={index + 1}
              width={pageWidth}
              // Increased devicePixelRatio multiplier for sharper text, especially when users pinch-zoom
              devicePixelRatio={typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 3) : 3}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
            {/* Blur bottom half of first page for single-page preview */}
            {isPreviewMode && totalOriginalPages === 1 && index === 0 && (
              <div
                className="absolute inset-x-0 bottom-0 top-1/2 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md border-t border-white/40 shadow-[0_-10px_20px_rgba(255,255,255,0.8)] pointer-events-auto"
                style={{ width: pageWidth, left: '50%', transform: 'translateX(-50%)' }}
              >
                <div className="flex flex-col items-center p-4 bg-white/90 rounded-2xl shadow-sm border border-white/50 backdrop-blur-xl">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-xs font-bold text-[#1f1f1f] uppercase tracking-widest mb-3">Locked</span>
                  {onUnlock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onUnlock() }}
                      className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-black transition-colors"
                    >
                      Unlock to Read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Locked pages for multi-page previews */}
        {isPreviewMode && totalOriginalPages > (numPages || 1) && (
          Array.from(new Array(totalOriginalPages - (numPages || 1)), (_, index) => (
            <div key={`locked_${index}`} className="w-full mb-3 flex justify-center px-4 md:px-0">
              <div
                style={{ width: pageWidth, height: pageWidth }}
                className="relative bg-white flex flex-col items-center justify-center border border-[#e2dbd2] rounded-md overflow-hidden select-none"
              >
                {/* Simulated handwritten lines */}
                <div className="absolute inset-0 p-8 space-y-5 opacity-40 overflow-hidden">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3.5 rounded-full bg-[#d6cfc4]"
                      style={{ width: `${60 + Math.sin(i * 1.3) * 30}%` }}
                    />
                  ))}
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[4px]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-sm text-[#1f1f1f] font-bold tracking-wide uppercase mb-4">Locked Page</span>
                  {onUnlock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onUnlock() }}
                      className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-black transition-colors"
                    >
                      Unlock Full Notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Document>
    </div>
  )
}

export default MobilePDFViewer
