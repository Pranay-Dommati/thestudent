import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import PreviewCard from './components/PreviewCard'
import InterviewPackCard from './components/InterviewPackCard'
import InterviewPackCardSkeleton from './components/InterviewPackCardSkeleton'
import FreeOfferBanner from './components/FreeOfferBanner'
import { fetchCatalogue, purchasePack } from './services/packs'
import { usePostHog } from '@posthog/react'
import customToast from './utils/customToast'

const fallbackPreviewCards = [
  { id: 'osi-model', title: 'OSI Model', subject: 'Computer Networks', pdfUrl: null, pageCount: 1 },
  { id: 'newtons-laws', title: "Newton's Laws", subject: 'Physics', pdfUrl: null, pageCount: 1 },
  { id: 'krebs-cycle', title: 'Krebs Cycle', subject: 'Biology', pdfUrl: null, pageCount: 1 },
  { id: 'sql-joins', title: 'SQL Joins', subject: 'DBMS', pdfUrl: null, pageCount: 1 },
  { id: 'thermodynamics', title: 'Thermodynamics', subject: 'Physics', pdfUrl: null, pageCount: 1 },
]

const LibraryPage = () => {
  const { user, logout, isLoggedIn, refreshUser } = useAuth()
  const posthog = usePostHog()
  const navigate = useNavigate()
  const [previewCards, setPreviewCards] = useState(fallbackPreviewCards)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  const [activePackIndex, setActivePackIndex] = useState(0)
  const [packs, setPacks] = useState([])
  const [bundle, setBundle] = useState(null)
  const [packsLoading, setPacksLoading] = useState(true)
  const [freeOffer, setFreeOffer] = useState(null)
  const [buyingBundle, setBuyingBundle] = useState(false)

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

  // Interview Picks — the paid packs shown above the free grid.
  const loadPacks = useCallback(async () => {
    try {
      const data = await fetchCatalogue('interview')
      setPacks(data.packs || [])
      setBundle(data.bundle || null)
      setFreeOffer(data.free_offer || null)
    } catch {
      // Library still works as a free-notes browser if this fails.
    } finally {
      setPacksLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPacks()
  }, [loadPacks, isLoggedIn])

  const buyBundle = async () => {
    if (!isLoggedIn) {
      customToast.error('Log in to unlock the bundle')
      navigate('/login?next=/library')
      return
    }
    if (buyingBundle || !bundle) return
    try {
      setBuyingBundle(true)
      const result = await purchasePack({ bundle: bundle.slug, user })
      if (!result) return  // checkout dismissed

      posthog?.capture('interview_pack_purchased', { pack: null, bundle: bundle.slug })
      customToast.success('All packs unlocked!')
      await Promise.all([loadPacks(), refreshUser?.()])
      // Land them straight in the reader — /interview-prep with no slug opens
      // the first pack in the catalogue, now actually unlocked.
      navigate('/interview-prep')
    } catch (error) {
      customToast.error(error?.response?.data?.message || error.message || 'The purchase did not go through')
    } finally {
      setBuyingBundle(false)
    }
  }

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

  // Everything free lives under "All topics" now — the slot above it belongs to
  // Interview Picks, so nothing is held back from this grid any more.
  const displayFiltered = filtered

  const visiblePacks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packs
    return packs.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [packs, query])

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
            returnUrl: '/library'
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
        <title>Library - Scrib by EasyLearnova</title>
        <meta name="description" content="Interview-ready handwritten note packs with practice quizzes, plus hundreds of free AI-generated exam notes for Computer Science, Engineering, Physics and Mathematics." />
        <link rel="canonical" href="https://scrib.easylearnova.com/library" />
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-9 w-9 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Library' },
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
              <Link to="/login" className="hidden sm:inline-flex rounded-full border border-[#d9d1c7] bg-white px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f3a5f] px-3 py-1.5 text-xs font-semibold text-white md:px-4 md:py-2">
                Get started
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

          <div className="relative z-10 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1f1f1f]">
                Wanna generate your own custom notes?
              </h3>
              <p className="mt-1 hidden text-[13px] text-[#6f6a63] sm:block">
                Try it for ₹19 · ready in a minute · 2 PDF pages
              </p>
            </div>
            <Link
              to="/generate"
              className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-[#1f1f1f] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-black transition-colors sm:rounded-xl sm:px-6 sm:py-2.5 sm:text-sm sm:font-bold"
            >
              Try now &rarr;
            </Link>
          </div>
        </div>

        {/* Interview Picks — the paid subject packs. Shown while loading too
            (as skeletons) so this doesn't just pop into existence once the
            fetch resolves — a real fetch failure still hides it entirely. */}
        {(packsLoading || visiblePacks.length > 0) && (
          <section className="mt-11">
            <FreeOfferBanner
              offer={freeOffer}
              variant="strip"
              className="mb-5 rounded-2xl border border-[#f0dfba]"
            />
            <div className="flex flex-col items-start gap-4 border-b border-[#e2dbd2] pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[21px] font-bold tracking-tight text-[#1f1f1f]">
                  Interview Prep Packs
                </h2>
                <p className="text-[13px] text-[#7b756d]">
                  Complete handwritten notes + quizzes for each core SDE subject
                </p>
              </div>

              {/* On mobile the bundle offer becomes its own bounded card with a
                  full-width CTA — floating it as loose text next to a button read
                  as an afterthought. From sm: up the card chrome is stripped back
                  off so the desktop header row is unchanged. */}
              {bundle && !bundle.owned && (
                <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e2dbd2] bg-white p-3 sm:w-auto sm:flex-shrink-0 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                  <span className="flex flex-col text-[13px] text-[#7b756d] sm:flex-row sm:items-baseline sm:gap-1.5">
                    {/* The offer only ever covers packs this user hasn't bought,
                        so "all" would be a lie once they own one of them. */}
                    <span>
                      {bundle.pack_count >= packs.length ? 'All' : 'Remaining'} {bundle.pack_count} packs
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      {bundle.original_price > bundle.price && (
                        <span className="text-[12.5px] text-[#9a9289] line-through">
                          ₹{bundle.original_price}
                        </span>
                      )}
                      <b className="text-[15px] font-bold text-[#1f1f1f]" style={{ fontFamily: 'Sora, sans-serif' }}>
                        ₹{bundle.price}
                      </b>
                    </span>
                  </span>
                  <button
                    onClick={buyBundle}
                    disabled={buyingBundle}
                    className="flex-shrink-0 whitespace-nowrap rounded-lg bg-[#1f3a5f] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5fa6] disabled:opacity-60 transition-colors sm:rounded-[10px] sm:px-4 sm:py-2.5 sm:text-[12.5px] sm:font-bold"
                  >
                    {buyingBundle ? 'Opening checkout…' : 'Get the bundle'}
                  </button>
                </div>
              )}
            </div>

            <div
              className="mt-5 flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:pb-0 md:grid-cols-3"
              onScroll={(e) => {
                const scrollLeft = e.target.scrollLeft
                const itemWidth = 264 // 248px card + 16px gap
                setActivePackIndex(Math.round(scrollLeft / itemWidth))
              }}
            >
              {packsLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="w-[248px] shrink-0 snap-start sm:w-auto">
                      <InterviewPackCardSkeleton />
                    </div>
                  ))
                : visiblePacks.map((pack) => (
                    <div key={pack.id} className="w-[248px] shrink-0 snap-start sm:w-auto">
                      <InterviewPackCard pack={pack} freeOffer={freeOffer} />
                    </div>
                  ))}
            </div>

            {/* Scroll indicators (dots) — mobile only */}
            {!packsLoading && visiblePacks.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5 sm:hidden">
                {visiblePacks.map((pack, idx) => (
                  <div
                    key={pack.id}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activePackIndex ? 'w-4 bg-[#1f1f1f]' : 'w-1.5 bg-[#d6cfc6]'
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Free preview cards grid */}
        <div className="mt-12">
          {!query && (
            <div className="mb-5 border-b border-[#e2dbd2] pb-4">
              <h2 className="text-[18px] font-bold tracking-tight text-[#1f1f1f]">Explore Free Notes</h2>
              <p className="mt-1 text-[12.5px] text-[#7b756d]">
                Individual handwritten notes on various topics
              </p>
            </div>
          )}
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

export default LibraryPage
