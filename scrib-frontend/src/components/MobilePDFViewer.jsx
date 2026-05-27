import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN for worker to prevent module resolution errors on older mobile browsers
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const MobilePDFViewer = ({ url }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageWidth, setPageWidth] = useState(null)
  const containerRef = useRef(null)

  // Measure the container width once on mount (and only on a real layout resize,
  // NOT on pinch-zoom — which changes visualViewport but not layout width).
  const measureWidth = useCallback(() => {
    if (containerRef.current) {
      setPageWidth(containerRef.current.offsetWidth)
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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center w-full h-full overflow-y-auto bg-black pt-16"
    >
      {/* Floating page indicator */}
      {numPages && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-[#1c1c1e]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          1 of {numPages}
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
          <div key={`page_${index + 1}`} className="w-full mb-4">
            <Page
              pageNumber={index + 1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </div>
        ))}
      </Document>
    </div>
  )
}

export default MobilePDFViewer
