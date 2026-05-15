/**
 * PDFThumbnail — renders page 1 of a PDF into a <canvas> element.
 *
 * Lazy: the PDF is only fetched + rendered when the card scrolls into view
 * (via IntersectionObserver with a 150px rootMargin lookahead).
 *
 * Uses pdfjs-dist (included with react-pdf already in node_modules).
 * Worker is loaded from CDN to avoid Vite bundling complexity.
 */
import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Set worker via Vite's ?url import so it resolves locally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PDFThumbnail = ({ pdfUrl, title = 'PDF preview', className = '' }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    if (!pdfUrl) return

    let cancelled = false

    const render = async () => {
      setStatus('loading')
      try {
        // Normalise local backend URLs through the Vite proxy (same as PDFViewerPage)
        const BACKEND_ORIGINS = ['http://127.0.0.1:8000', 'http://localhost:8000']
        let url = pdfUrl
        for (const origin of BACKEND_ORIGINS) {
          if (url.startsWith(origin)) { url = url.slice(origin.length); break }
        }

        const pdf = await pdfjsLib.getDocument({
          url,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        }).promise

        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        // Scale to fit the container width (measured after mount)
        const container = containerRef.current
        const containerW = container ? container.clientWidth || 280 : 280
        const nativeViewport = page.getViewport({ scale: 1 })
        const scale = containerW / nativeViewport.width
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')

        await page.render({ canvasContext: ctx, viewport }).promise

        if (!cancelled) setStatus('done')
      } catch (err) {
        console.error('PDFThumbnail render error:', err)
        if (!cancelled) setStatus('error')
      }
    }

    // Lazy-load: only render when the card scrolls near the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          render()
        }
      },
      { rootMargin: '150px' }
    )

    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [pdfUrl])

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ minHeight: '160px' }}
    >
      {/* Loading shimmer */}
      {(status === 'idle' || status === 'loading') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-[#f0ede7] via-[#e8e4dc] to-[#f0ede7]" />
        </div>
      )}

      {/* Error fallback */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b9ae" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
          <span className="text-[10px] text-[#c4b9ae]">Preview unavailable</span>
        </div>
      )}

      {/* Actual rendered canvas */}
      <canvas
        ref={canvasRef}
        title={title}
        className={`w-full object-cover transition-opacity duration-300 ${status === 'done' ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
    </div>
  )
}

export default PDFThumbnail
