import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
// Fallback only — the real height/width ratio is read off the PDF itself on
// load (see `pageRatio`). Guessing here is what made page slots disagree with
// the canvases that fill them: these packs are 1024×1536 images (ratio 1.5),
// not A4, so every mounted page was ~6% taller than the slot reserved for it.
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
const PackPdfReader = ({ url, totalPages, accessiblePages, onUnlock, zoom = 1, price, quizCount, unlocking = false, free = false }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageRatio, setPageRatio] = useState(PAGE_RATIO)
  const [fitWidth, setFitWidth] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [renderSet, setRenderSet] = useState(() => new Set([1, 2, 3]))
  const [badgeVisible, setBadgeVisible] = useState(true)
  const containerRef = useRef(null)
  const observerRef = useRef(null)
  const viewportObserverRef = useRef(null)
  const visiblePagesRef = useRef(new Set())
  const hideBadgeTimerRef = useRef(null)
  // Which page is on screen and how far scrolled into it — kept live on every
  // scroll so a zoom change (which resizes every page uniformly) can re-anchor
  // the view to the same reading position instead of leaving window.scrollY at
  // its old pixel value, which now points at a different page entirely.
  const currentPageRef = useRef(1)
  const scrollAnchorRef = useRef({ page: 1, fraction: 0 })
  const isFirstZoomRun = useRef(true)

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

  // Snapshot the reading position: which page is at the top of the viewport and
  // how far into it we've scrolled. Recorded both while scrolling and whenever
  // the viewport observer settles — the last scroll event of a gesture fires
  // *before* the observer reports the page it landed on, so scroll alone would
  // leave a stale page behind for the zoom handler to anchor to.
  const recordAnchor = useCallback(() => {
    const page = currentPageRef.current
    const el = containerRef.current?.querySelector(`[data-page-number="${page}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect.height) return
    scrollAnchorRef.current = {
      page,
      fraction: Math.min(Math.max(-rect.top / rect.height, 0), 1),
    }
  }, [])

  // One observer watches every page slot (real + locked placeholders). A page
  // scrolling near the viewport gets added to renderSet permanently — once
  // rendered it stays mounted, trading a little memory for zero re-render
  // flicker when scrolling back up.
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
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
      },
      { rootMargin: '2200px 0px', threshold: 0 },
    )
    return () => observerRef.current?.disconnect()
  }, [])

  // A second, unbuffered observer answers "which page am I actually looking
  // at?". The mounting observer above can't: its 2200px rootMargin means pages
  // thousands of pixels off screen still report as fully intersecting, so the
  // page it named was routinely not the one in the viewport — which is what
  // sent the zoom re-anchor below to the wrong page.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number(entry.target.getAttribute('data-page-number'))
          if (!n) continue
          if (entry.isIntersecting) visiblePagesRef.current.add(n)
          else visiblePagesRef.current.delete(n)
        }
        if (visiblePagesRef.current.size === 0) return
        const topMost = Math.min(...visiblePagesRef.current)
        setCurrentPage(topMost)
        currentPageRef.current = topMost
        recordAnchor()
      },
      { threshold: 0 },
    )
    viewportObserverRef.current = io
    // Ref callbacks fire before effects, so any slots already mounted by now
    // were never handed to this observer — sweep them up once.
    containerRef.current?.querySelectorAll('[data-page-number]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [recordAnchor])

  const observe = useCallback((el) => {
    if (!el) return
    observerRef.current?.observe(el)
    viewportObserverRef.current?.observe(el)
  }, [])

  // The page badge is only useful while actively scrolling through the
  // reader — pinned on screen at all times it just becomes clutter. Show it
  // on scroll, then fade it out once scrolling has been idle for a beat.
  useEffect(() => {
    const revealBadge = () => {
      setBadgeVisible(true)
      if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
      hideBadgeTimerRef.current = setTimeout(() => setBadgeVisible(false), 1100)
      recordAnchor()
    }
    revealBadge()
    window.addEventListener('scroll', revealBadge, { passive: true })
    return () => {
      window.removeEventListener('scroll', revealBadge)
      if (hideBadgeTimerRef.current) clearTimeout(hideBadgeTimerRef.current)
    }
  }, [recordAnchor])

  // Zoom resizes every page uniformly, but the browser leaves window.scrollY
  // at its old pixel value — under the new, taller/shorter layout that same
  // pixel offset now lands on a different page. Re-anchor to the page/offset
  // recorded just before the resize so zooming keeps you on the same spot.
  useLayoutEffect(() => {
    if (isFirstZoomRun.current) {
      isFirstZoomRun.current = false
      return
    }
    // At the top there is no reading position to preserve, and re-anchoring
    // from here actively hurts: `pageRatio` resolves a beat after the document
    // loads, so this would fire on arrival and align page 1 with the viewport
    // top — scrolling the pack header out of view before the reader has even
    // touched anything.
    if (window.scrollY <= 0) return

    const { page, fraction } = scrollAnchorRef.current
    const el = containerRef.current?.querySelector(`[data-page-number="${page}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + rect.top + fraction * rect.height, behavior: 'auto' })
  }, [zoom, pageRatio])

  // The slot heights below are what make scrolling and zooming stable, so they
  // have to match the canvases that land in them exactly — take the ratio from
  // the PDF rather than assuming a paper size.
  //
  // Page count is published *with* the ratio, never before it. Setting
  // numPages first paints every slot at the A4 guess, and the real ratio
  // landing a beat later then resizes all of them at once — a visible re-layout
  // of the whole reader a second after the notes have already appeared.
  // Committing both together costs one promise tick and paints once, correctly.
  const handleDocumentLoad = useCallback((pdf) => {
    const commit = (ratio) => {
      if (ratio) setPageRatio(ratio)
      setNumPages(pdf.numPages)
    }
    pdf
      .getPage(1)
      .then((page) => {
        const { width, height } = page.getViewport({ scale: 1 })
        commit(width > 0 && height > 0 ? height / width : null)
      })
      .catch(() => commit(null))  // keep the A4 fallback
  }, [])

  if (!url) return null

  const pageWidth = fitWidth ? Math.round(fitWidth * zoom) : null
  const pageHeight = pageWidth ? Math.round(pageWidth * pageRatio) : 0

  return (
    <div ref={containerRef} className="mx-auto flex w-full flex-col items-center px-4 pb-6 pt-4">
      {/* Zero-height so the badge floats over the pages without consuming any
          flow space — a negative margin here instead would eat into the
          container's top padding and pull the first page up under the bar. */}
      {numPages && (
        <div className="sticky top-[56px] z-[5] h-0 self-start">
          <div
            className={`rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-opacity duration-500 ease-out ${
              badgeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {currentPage} of {totalPages}
          </div>
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
        onLoadSuccess={handleDocumentLoad}
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
              // A fixed height, not a minimum: react-pdf swaps in a resized
              // canvas asynchronously after a zoom change, so a slot free to
              // grow would still be reporting the *old* page size when the
              // re-anchor below measures it. Pinning the height makes the
              // document's layout deterministic at every instant — mounting,
              // unmounting and re-rasterizing can't shift what's above you.
              className="mb-3 flex w-full justify-center overflow-hidden"
              style={{ height: pageHeight }}
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

      {/* One placeholder stands in for the whole locked tail — the page badge
          up top already says "5 of 269", so rendering a few hundred more
          skeleton pages here would just be dead weight, not information. */}
      {locked && pageWidth && (
        <div
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 p-6 text-center backdrop-blur-[3px]">
            <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md ${free ? 'bg-[#c2542f]' : 'bg-[#1f3a5f]'}`}>
              {free ? (
                <span className="text-lg leading-none">🎁</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </span>
            <span className="mb-1 text-sm font-bold text-[#1f1f1f]">
              {lockedCount} more page{lockedCount === 1 ? '' : 's'} locked
            </span>
            <span className="mb-4 max-w-[220px] text-xs text-[#7b756d]">
              {free
                ? 'Launch offer — take this whole pack for free, no card needed.'
                : 'Unlock this pack to keep reading the full handwritten notes.'}
            </span>
            {onUnlock && (
              <button
                onClick={onUnlock}
                disabled={unlocking}
                className={`rounded-full px-6 py-3 text-xs font-bold text-white shadow-lg transition-colors disabled:opacity-60 ${
                  free ? 'bg-[#c2542f] hover:bg-[#a94526]' : 'bg-[#1f3a5f] hover:bg-[#2d5fa6]'
                }`}
              >
                {unlocking
                  ? (free ? 'Claiming…' : 'Opening checkout…')
                  : free
                    ? `🎁 Get the full pack${quizCount ? ` + ${quizCount} quizzes` : ''} FREE`
                    : `🔓 Unlock full pack${quizCount ? ` + ${quizCount} quizzes` : ''}${price ? ` · ₹${price}` : ''}`}
              </button>
            )}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}

export default PackPdfReader
