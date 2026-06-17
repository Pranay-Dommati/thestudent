import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import PreviewCard from './components/PreviewCard'
import { usePostHog } from '@posthog/react'

const fallbackPreviewCards = [
  { id: 'osi-model', title: 'OSI Model', subject: 'Computer Networks', pdfUrl: null, pageCount: 1 },
  { id: 'newtons-laws', title: "Newton's Laws", subject: 'Physics', pdfUrl: null, pageCount: 1 },
  { id: 'krebs-cycle', title: 'Krebs Cycle', subject: 'Biology', pdfUrl: null, pageCount: 1 },
  { id: 'sql-joins', title: 'SQL Joins', subject: 'DBMS', pdfUrl: null, pageCount: 1 },
  { id: 'thermodynamics', title: 'Thermodynamics', subject: 'Physics', pdfUrl: null, pageCount: 1 },
]

const PreviewsPage = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const posthog = usePostHog()
  const navigate = useNavigate()
  const [previewCards, setPreviewCards] = useState(fallbackPreviewCards)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)

  // Reset visible count on new search
  useEffect(() => {
    setVisibleCount(10)
  }, [query])

  useEffect(() => {
    let isMounted = true

    const loadPreviews = async () => {
      try {
        const response = await axiosInstance.get('/scrib/previews/')
        const data = response.data
        if (!isMounted || !Array.isArray(data)) return
        const mapped = data.map((item) => ({
          id: item.id ?? item.slug ?? item.title,
          slug: item.slug,
          title: item.title,
          subject: item.tags?.[0] || 'Preview',
          pdfUrl: item.pdf_url || null,
          imageUrl: item.image_url || null,
          pageCount: item.page_count || 1,
        }))
        if (mapped.length) setPreviewCards(mapped)
      } catch {
        // keep fallback cards
      }
    }

    loadPreviews()
    return () => { isMounted = false }
  }, [])

  const featuredTitles = ['software engineering', 'vlsi fabrication steps', 'ray optics']
  const featuredItems = useMemo(() => {
    return featuredTitles
      .map(t => previewCards.find(item => item.title.toLowerCase() === t))
      .filter(Boolean)
  }, [previewCards])

  // Live search: filter by title or subject
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return previewCards
    return previewCards.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.subject && n.subject.toLowerCase().includes(q))
    )
  }, [query, previewCards])

  const displayFiltered = useMemo(() => {
    if (!query) {
      const featuredIds = new Set(featuredItems.map(item => item.id))
      return filtered.filter(item => !featuredIds.has(item.id))
    }
    return filtered
  }, [filtered, query, featuredItems])

  const renderNote = (note) => (
    <div
      key={`note-${note.id}`}
      className={`transition-all duration-200 ${note.pdfUrl ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg rounded-xl' : 'opacity-70'}`}
      onClick={() => {
        if (!note.pdfUrl) return
        posthog?.capture('preview_viewed', {
          title: note.title,
          subject: note.subject,
        })
        navigate(`/view/${note.slug}`, {
          state: {
            pdfUrl: note.pdfUrl,
            title: note.title,
            topics: [note.subject || note.title],
            totalPages: note.pageCount || 1,
            isPack: true,
          }
        })
      }}
    >
      {!note.pdfUrl && !note.imageUrl ? (
        <div className="animate-pulse h-full flex flex-col rounded-xl border border-[#e2dbd2] bg-white overflow-hidden">
          <div className="h-32 w-full bg-[#e8e2d9]"></div>
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-2 h-3 w-1/3 rounded bg-[#e8e2d9]"></div>
            <div className="h-4 w-3/4 rounded bg-[#e8e2d9]"></div>
            <div className="mt-auto pt-4 flex justify-between">
               <div className="h-3 w-16 rounded bg-[#e8e2d9]"></div>
               <div className="h-5 w-12 rounded-full bg-[#e8e2d9]"></div>
            </div>
          </div>
        </div>
      ) : (
        <PreviewCard title={note.title} subject={note.subject} />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#1f1f1f]">
      <Helmet>
        <title>Browse Topics - Scrib by EasyLearnova</title>
        <meta name="description" content="Browse hundreds of free AI-generated handwritten exam notes for Computer Science, Engineering, Physics, and Mathematics." />
        <link rel="canonical" href="https://scrib.easylearnova.com/previews" />
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-9 w-9 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Previews' },
            ]} />
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex">
                Dashboard
              </Link>
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
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:inline-flex rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                Get started free
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        {/* Search bar — no filter button, no subject chips */}
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#d9d1c7] bg-white px-4 py-3 shadow-sm focus-within:border-[#1f1f1f] transition-colors">
          {/* Clean search icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9a948c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="preview-search"
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#b3aca5]"
            placeholder="Search topics — OSI, Newton's Laws, SQL Joins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex-shrink-0 rounded-full p-0.5 text-[#9a948c] hover:text-[#1f1f1f]"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Generate CTA */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-black/[0.08] to-transparent -skew-x-12" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1f1f1f]">
                Wanna generate your own custom notes?
              </h3>
              <p className="mt-1 text-[13px] text-[#6f6a63]">
                Try it for ₹19 · ready in a minute · 2 PDF pages
              </p>
            </div>
            <Link 
              to="/generate" 
              className="flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-[#1f1f1f] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-black transition-colors"
            >
              Try for ₹19 &rarr;
            </Link>
          </div>
        </div>

        {/* Featured Previews (if no query) */}
        {!query && featuredItems.length > 0 && (
          <div className="mt-10 mb-12">
            <div className="mb-5 flex items-center gap-4">
              <h2 className="text-xs font-bold tracking-widest text-[#1f1f1f] uppercase flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Featured Picks
              </h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#e4ddd4] to-transparent"></div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {featuredItems.map((note) => renderNote(note))}
            </div>
          </div>
        )}

        {/* Preview cards grid */}
        <div className="mt-8">
          {!query && <h2 className="mb-5 text-xs font-bold tracking-widest text-[#9a9289] uppercase">All Topics</h2>}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {displayFiltered.length === 0 && (
              <div className="col-span-3 py-16 text-center text-sm text-[#9a9289]">
                No notes match &quot;{query}&quot;
              </div>
            )}

            {displayFiltered.slice(0, visibleCount).map((note) => renderNote(note, false))}

            {/* Load more inline button */}
            {visibleCount < displayFiltered.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d6cfc6] bg-[#f4f1ea] p-4 transition-colors hover:bg-[#f0ece5] md:min-h-[22rem]"
              >
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#cfc7bd]" />
                  ))}
                </div>
                <p className="text-sm font-medium text-[#8a847c]">Load more</p>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PreviewsPage
