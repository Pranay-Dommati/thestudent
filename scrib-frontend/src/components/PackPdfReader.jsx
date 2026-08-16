import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Same CDN worker setup as MobilePDFViewer — avoids bundler worker-resolution
// issues across browsers. Setting it twice (if both components are mounted) is
// harmless; it's just a URL assignment.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Wide, matching how Adobe/Edge's own viewer fills most of the window rather
// than sitting in a narrow centered column. The source page image is fixed at
// 1024px wide (see PackPdfReader's module docs), so this doesn't add detail —
// it just uses the available screen the way a dedicated reader should.
const MAX_WIDTH = 1200
const PAGE_RATIO = 1.414 // A4

/**
 * Canvas-rendered PDF reader for Interview Prep packs.
 *
 * Deliberately not a plain `<iframe src={pdfUrl}>` — that hands rendering to
 * whichever native PDF viewer the browser ships (Edge, Chrome and Firefox all
 * look different, some browsers force a download instead), and it draws its
 * own full toolbar on top of ours. Rendering through react-pdf instead means
 * every page is fit-to-width and framed consistently, on every browser.
 *
 * Packs run long — one already in the catalogue is 271 pages — so pages are
 * virtualized: only the ones within a scroll buffer of the viewport actually
 * mount a `<Page>` (which rasterizes to a canvas); everything else is a
 * lightweight skeleton div, and a page unmounts again once it scrolls back out
 * of that buffer. Mounting every canvas at once — or leaving every canvas
 * ever scrolled past still mounted — would grow memory without bound on a
 * pack this long. That bound is what makes rendering at a sharp, fixed 3x
 * pixel density (see the `devicePixelRatio` below) affordable: only a handful
 * of pages are ever live at once, however far the reader has scrolled.
 *
 * A ceiling worth knowing before "fixing" blur again: these packs are
 * scanned/generated as a single raster image per page, embedded at a fixed
 * 1024×1536px (checked directly against the source PDF's XObject — both the
 * compressed upload and the original uncompressed file carry the same
 * 1024×1536 image, just different JPEG encodings). No amount of
 * `devicePixelRatio` or display width here can exceed that — past it, every
 * knob just upscales a fixed-resolution image and looks softer, not sharper.
 * A real sharpness gain has to come from the note-generation step producing
 * larger source images, not from anything in this component.
 */
const PackPdfReader = ({ url, totalPages, accessiblePages, onUnlock, zoom = 1 }) => {
  const [numPages, setNumPages] = useState(null)
  const [fitWidth, setFitWidth] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [renderSet, setRenderSet] = useState(() => new Set([1, 2, 3]))
  const [badgeVisible, setBadgeVisible] = useState(true)
  const containerRef = useRef(null)
  const observerRef = useRef(null)
  const hideBadgeTimerRef = useRef(null)

  const locked = totalPages > accessiblePages
  const lockedCount = Math.max(totalPages - accessiblePages, 0)

  const measureWidth = useCallback(() => {
    const w = containerRef.current?.clientWidth
    if (w) setFitWidth(Math.min(w - 32, MAX_WIDTH))
  }, [])

  useEffect(() => {
    measureWidth()
    window.addEventListener('resize', measureWidth)
    return () => window.removeEventListener('resize', measureWidth)
  }, [measureWidth])

  // One observer watches every page slot (real + locked placeholders). A page
  // scrolling near the viewport gets added to renderSet permanently — once
  // rendered it stays mounted, trading a little memory for zero re-render
  // flicker when scrolling back up.
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let currentSeen = null
        setRenderSet((prev) => {
          let changed = false
          const next = new Set(prev)
          for (const entry of entries) {
            const n = Number(entry.target.getAttribute('data-page-number'))
            if (!n) continue
            if (entry.isIntersecting) {
              if (!next.has(n)) {
                next.add(n)
                changed = true
              }
              if (entry.intersectionRatio > 0.5) currentSeen = n
            } else if (next.has(n)) {
              // Unmount pages once they scroll past the buffer, not just mount
              // new ones — otherwise every page ever scrolled through on a
              // 271-page pack stays a live canvas for the rest of the session.
              // That's affordable at 1x; it isn't at the sharper 3x below.
              next.delete(n)
              changed = true
            }
          }
          return changed ? next : prev
        })
        if (currentSeen) setCurrentPage(currentSeen)
      },
      { rootMargin: '2200px 0px', threshold: [0, 0.5] },
    )
    return () => observerRef.current?.disconnect()
  }, [])

  const observe = useCallback((el) => {
    if (el && observerRef.current) observerRef.current.observe(el)
  }, [])

  // The page badge is only useful while actively scrolling through the
  // reader — pinned on screen at all times it just becomes clutter. Show it
  // on scroll, then fade it out once scrolling has been idle for a beat.
  useEffect(() => {
    const revealBadge = () => {
      setBadgeVisible(true)
      if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
      hideBadgeTimerRef.current = setTimeout(() => setBadgeVisible(false), 1100)
    }
    revealBadge()
    window.addEventListener('scroll', revealBadge, { passive: true })
    return () => {
      window.removeEventListener('scroll', revealBadge)
      if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
    }
  }, [])

  if (!url) return null

  const pageWidth = fitWidth ? Math.round(fitWidth * zoom) : null
  const pageHeight = pageWidth ? pageWidth * PAGE_RATIO : 0

  return (
    <div ref={containerRef} className="mx-auto flex w-full flex-col items-center px-4 py-6">
      {numPages && (
        <div
          className={`sticky top-3 z-10 mb-[-40px] self-start rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-opacity duration-500 ease-out ${
            badgeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {currentPage} of {totalPages}
        </div>
      )}

      {/* Horizontal scroll is isolated to this wrapper (not the outer,
          sticky-hosting container) — height stays intrinsic so it never
          becomes a vertical scroll region of its own, only a sideways one
          once zoomed-in pages outgrow the available width. */}
      <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="mx-auto flex w-max flex-col items-center">
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={
          <div
            className="animate-pulse rounded-md border border-[#e2dbd2] bg-white shadow-sm"
            style={{ width: pageWidth || 400, height: pageHeight || 566 }}
          />
        }
        error={
          <div className="py-16 text-center text-sm text-[#c05252]">
            This PDF couldn’t be loaded. Try refreshing the page.
          </div>
        }
      >
        {pageWidth &&
          Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              ref={observe}
              data-page-number={n}
              className="mb-3 flex w-full justify-center"
              style={{ minHeight: pageHeight }}
            >
              {renderSet.has(n) ? (
                <Page
                  pageNumber={n}
                  width={pageWidth}
                  // A floor, not a ceiling — matches MobilePDFViewer. On a
                  // standard (non-Retina) 1x display, window.devicePixelRatio
                  // is 1, so a cap here means zero supersampling: the canvas
                  // rasterizes at exact display resolution and every stroke
                  // looks soft. Forcing at least 3x keeps handwriting crisp
                  // regardless of screen density — affordable because the
                  // observer above only keeps a handful of pages mounted at
                  // once, not all of them.
                  devicePixelRatio={typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 3) : 3}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="overflow-hidden rounded-md border border-[#e2dbd2] bg-white shadow-sm"
                  loading={
                    <div
                      className="animate-pulse rounded-md border border-[#e2dbd2] bg-[#f4f1ea] shadow-sm"
                      style={{ width: pageWidth, height: pageHeight }}
                    />
                  }
                />
              ) : (
                <div
                  className="animate-pulse rounded-md border border-[#e2dbd2] bg-[#f4f1ea] shadow-sm"
                  style={{ width: pageWidth, height: pageHeight }}
                />
              )}
            </div>
          ))}
      </Document>

      {locked &&
        pageWidth &&
        Array.from({ length: lockedCount }, (_, i) => i).map((i) => (
          <div
            key={`locked-${i}`}
            className="relative mb-3 flex w-full justify-center overflow-hidden rounded-md border border-[#e2dbd2] bg-white shadow-sm select-none"
            style={{ width: pageWidth, height: pageHeight }}
          >
            <div className="absolute inset-0 space-y-4 p-8 opacity-40">
              {Array.from({ length: 14 }, (_, j) => (
                <div
                  key={j}
                  className="h-3 rounded-full bg-[#d6cfc4]"
                  style={{ width: `${55 + Math.sin(j * 1.4) * 30}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/65 backdrop-blur-[3px]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {/* Only the first locked page carries the CTA — repeating a
                  giant button on every one of a few hundred placeholders
                  would be absurd, not persuasive. */}
              {i === 0 && (
                <>
                  <span className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1f1f1f]">
                    {lockedCount} more page{lockedCount === 1 ? '' : 's'} locked
                  </span>
                  {onUnlock && (
                    <button
                      onClick={onUnlock}
                      className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-black"
                    >
                      Unlock full notes
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default PackPdfReader
