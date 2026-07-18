import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN for worker to prevent module resolution errors on older mobile browsers
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const MobilePDFViewer = ({ url, isPreviewMode, totalOriginalPages, onUnlock }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(null)
  const containerRef = useRef(null)

  // Measure the container width once on mount (and only on a real layout resize,
  // NOT on pinch-zoom — which changes visualViewport but not layout width).
  const measureWidth = useCallback(() => {
    if (containerRef.current) {
      setPageWidth(Math.min(containerRef.current.offsetWidth, 800))
    }
  }, [])

  useEffect(() => {
    measureWidth()

    // ResizeObserver fires on actual layout changes (orientation flip, etc.)
    // but NOT on pinch-zoom, which only changes the visual viewport scale.
    const ro = new ResizeObserver(measureWidth)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measureWidth])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [url])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center w-full min-h-screen bg-black pt-4 pb-16"
    >
      {/* Floating page indicator */}
      {numPages && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-[#1c1c1e]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          1 of {(isPreviewMode && totalOriginalPages) ? Math.max(totalOriginalPages, numPages) : numPages}
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col items-center w-full"
        loading={<div className="py-20 text-sm text-gray-400">Loading document...</div>}
        error={<div className="py-20 text-sm text-red-500">Failed to load PDF.</div>}
      >
        {pageWidth && Array.from(new Array(numPages || 0), (el, index) => (
          <div key={`page_${index + 1}`} className="w-full mb-4 flex justify-center relative group">
            <Page
              pageNumber={index + 1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
            {/* If single-page PDF and in preview mode, blur the bottom half of the first page */}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnlock()
                      }}
                      className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-black hover:scale-105 transition-all"
                    >
                      Unlock to Read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {isPreviewMode && totalOriginalPages > (numPages || 1) && (
          Array.from(new Array(totalOriginalPages - (numPages || 1)), (_, index) => (
            <div key={`locked_${index}`} className="w-full mb-4 flex justify-center px-4 md:px-0">
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
                {/* Lock icon overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[4px]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-sm text-[#1f1f1f] font-bold tracking-wide uppercase mb-4">Locked Page</span>
                  {onUnlock && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnlock()
                      }}
                      className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-black hover:scale-105 transition-all"
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
