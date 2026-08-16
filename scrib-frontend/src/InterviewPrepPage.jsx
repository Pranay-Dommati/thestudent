import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import customToast from './utils/customToast'
import MobileMenu from './components/MobileMenu'
import QuizRunner from './components/QuizRunner'
import PackPdfReader from './components/PackPdfReader'
import { fetchCatalogue, fetchPack, fetchPackPdf, purchasePack } from './services/packs'
import { usePostHog } from '@posthog/react'

const SWATCHES = {
  blue:   { bg: '#eef5fb', pattern: '#d0e3f5' },
  green:  { bg: '#eefbf5', pattern: '#d0f5e3' },
  purple: { bg: '#f5eefb', pattern: '#e3d0f5' },
  orange: { bg: '#fbeee6', pattern: '#f5d0ba' },
  red:    { bg: '#fbeeee', pattern: '#f5d0d0' },
  olive:  { bg: '#f4f5ee', pattern: '#e3e6d0' },
}

const LockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const BackArrowIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const PanelIcon = ({ open, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <line x1="9.5" y1="4" x2="9.5" y2="20" />
    {open && <path d="M6.5 10.5 L4.5 12 L6.5 13.5" />}
    {!open && <path d="M6.5 10.5 L8.5 12 L6.5 13.5" />}
  </svg>
)

const MinusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

const InterviewPrepPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const posthog = usePostHog()
  const { user, logout, isLoggedIn, refreshUser } = useAuth()

  const [detail, setDetail] = useState(null)
  const [catalogue, setCatalogue] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [tab, setTab] = useState('notes')
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [zoom, setZoom] = useState(1)

  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  const resetZoom = () => setZoom(1)

  // With no slug in the URL, send the reader to the first pack so the workspace
  // always opens on something readable.
  useEffect(() => {
    if (slug) return
    let alive = true

    fetchCatalogue('interview')
      .then((data) => {
        if (!alive) return
        const first = (data.packs || [])[0]
        if (first) navigate(`/interview-prep/${first.slug}`, { replace: true })
        else {
          setCatalogue(data)
          setLoading(false)
        }
      })
      .catch(() => alive && setLoading(false))

    return () => { alive = false }
  }, [slug, navigate])

  const load = useCallback(async () => {
    if (!slug) return
    try {
      setLoading(true)
      const data = await fetchPack(slug)
      setDetail(data)

      try {
        setPdf(await fetchPackPdf(slug))
      } catch {
        setPdf(null)  // pack has no PDF yet — the reader shows an empty state
      }
    } catch {
      customToast.error('Could not open that pack')
      navigate('/library')
    } finally {
      setLoading(false)
    }
  }, [slug, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pack = detail?.pack
  const owned = detail?.owned
  const siblings = useMemo(() => detail?.siblings || [], [detail])
  const quizzes = useMemo(() => detail?.quizzes || [], [detail])
  const bundle = detail?.bundle || catalogue?.bundle

  const bundleQuestionTotal = useMemo(
    () => siblings.reduce((sum, item) => sum + (item.question_count || 0), 0),
    [siblings],
  )

  const quizzesDone = useMemo(
    () => quizzes.filter((q) => q.best_score !== null && q.best_score !== undefined).length,
    [quizzes],
  )

  // Pack-level progress — appears once at least one quiz has been attempted,
  // rather than waiting for the whole pack to be finished.
  const progressSummary = useMemo(() => {
    const attempted = quizzes.filter((q) => q.best_score !== null && q.best_score !== undefined)
    if (attempted.length === 0) return null

    let correctSum = 0
    let totalSum = 0
    let weakest = null
    let strongest = null

    for (const quiz of attempted) {
      const pct = quiz.question_count ? (quiz.best_score / quiz.question_count) * 100 : 0
      correctSum += quiz.best_score
      totalSum += quiz.question_count
      if (!weakest || pct < weakest.pct) weakest = { quiz, pct }
      if (!strongest || pct > strongest.pct) strongest = { quiz, pct }
    }

    return {
      attemptedCount: attempted.length,
      totalCount: quizzes.length,
      accuracyPct: totalSum ? Math.round((correctSum / totalSum) * 100) : 0,
      weakest,
      // Only worth showing as a separate line when it's actually a different quiz.
      strongest: strongest && weakest && strongest.quiz.id !== weakest.quiz.id ? strongest : null,
    }
  }, [quizzes])

  const buy = async ({ bundleSlug } = {}) => {
    if (!isLoggedIn) {
      customToast.error('Log in to unlock this pack')
      navigate('/login', { state: { next: `/interview-prep/${slug || ''}` } })
      return
    }
    try {
      setBuying(true)
      const result = await purchasePack({
        pack: bundleSlug ? undefined : pack.slug,
        bundle: bundleSlug,
        user,
      })
      if (!result) return  // checkout dismissed

      posthog?.capture('interview_pack_purchased', {
        pack: bundleSlug ? null : pack.slug,
        bundle: bundleSlug || null,
      })
      customToast.success(bundleSlug ? 'All packs unlocked!' : `${pack.title} unlocked!`)
      await Promise.all([load(), refreshUser?.()])
    } catch (error) {
      customToast.error(error?.response?.data?.message || error.message || 'The purchase did not go through')
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f3] text-sm text-[#7b756d]">
        Loading your prep workspace…
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f7f3] px-6 text-center">
        <h1 className="text-xl font-bold text-[#1f1f1f]">No interview packs yet</h1>
        <p className="text-sm text-[#7b756d]">They&apos;ll show up here as soon as they&apos;re published.</p>
        <Link to="/library" className="rounded-xl bg-[#1f1f1f] px-5 py-2.5 text-sm font-bold text-white">
          Back to the Library
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#1f1f1f]">
      <Helmet>
        <title>{pack.title} — Interview Prep | Scrib</title>
        <meta name="description" content={pack.description || `Handwritten ${pack.category} interview notes with ${pack.quiz_count} practice quizzes.`} />
        <link rel="canonical" href={`https://scrib.easylearnova.com/interview-prep/${pack.slug}`} />
      </Helmet>

      <div className={fullscreen ? '' : `grid ${sidebarOpen ? 'md:grid-cols-[264px_minmax(0,1fr)]' : 'md:grid-cols-[64px_minmax(0,1fr)]'}`}>
        {/* ── Left rail: every pack, always one click away ── */}
        {!fullscreen && (
          <aside
            className={`sticky top-0 hidden h-screen flex-col gap-1 overflow-y-auto border-r border-[#e2dbd2] bg-white pb-5 pt-4 md:flex ${
              sidebarOpen ? 'px-3' : 'px-2'
            }`}
          >
            <div className={`mb-3 flex items-center gap-2 ${sidebarOpen ? 'justify-between px-2' : 'flex-col'}`}>
              {sidebarOpen && (
                <Link to="/" className="flex min-w-0 items-center gap-2.5">
                  <img src="/scrib_favicon.svg" alt="Scrib" className="h-[30px] w-[30px] flex-shrink-0 rounded-lg border border-[#e2dbd2]" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13.5px] font-bold">Interview Prep</span>
                    <span className="block truncate text-[10px] text-[#9a9289]">by EasyLearnova</span>
                  </span>
                </Link>
              )}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white text-[#7b756d] transition-colors hover:bg-[#f4f1ea]"
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <PanelIcon open={sidebarOpen} />
              </button>
            </div>

            {sidebarOpen && (
              <p className="px-2.5 pb-2 pt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9a9289]">
                Subject packs
              </p>
            )}

            {siblings.map((item) => {
              const swatch = SWATCHES[item.theme] || SWATCHES.blue
              const active = item.slug === pack.slug
              return (
                <Link
                  key={item.id}
                  to={`/interview-prep/${item.slug}`}
                  title={item.category}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] border transition-colors ${
                    sidebarOpen ? 'px-2.5 py-2.5' : 'justify-center px-1.5 py-1.5'
                  } ${
                    active
                      ? 'border-[#d8e2ec] bg-[#eef2f7]'
                      : 'border-transparent hover:bg-[#f4f1ea]'
                  }`}
                >
                  <span
                    className="relative h-[34px] w-[30px] flex-shrink-0 rounded-[5px] border"
                    style={{
                      backgroundColor: swatch.bg,
                      borderColor: swatch.pattern,
                      backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${swatch.pattern} 3px, ${swatch.pattern} 4px)`,
                    }}
                  >
                    {!sidebarOpen && (
                      <span
                        className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white ${
                          item.owned ? 'bg-[#eef7df] text-[#557a3f]' : 'bg-white text-[#9a9289]'
                        }`}
                      >
                        {item.owned ? <CheckIcon size={8} /> : <LockIcon size={8} />}
                      </span>
                    )}
                  </span>
                  {sidebarOpen && (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-bold">{item.category}</span>
                        <span className="mt-0.5 block text-[10.5px] text-[#9a9289]">
                          {item.owned
                            ? `Unlocked · ${item.quiz_count} quizzes`
                            : `${item.page_count || '—'} pages · ${item.quiz_count} quizzes`}
                        </span>
                      </span>
                      <span className={item.owned ? 'text-[#557a3f]' : 'text-[#9a9289]'}>
                        {item.owned ? <CheckIcon /> : <LockIcon />}
                      </span>
                    </>
                  )}
                </Link>
              )
            })}

            {bundle && !bundle.owned && sidebarOpen && (
              <div className="mt-auto flex flex-col gap-2 rounded-xl border border-[#d8e2ec] bg-gradient-to-b from-[#eef2f7] to-[#f4f1ea] p-3.5">
                <span className="text-[14px] font-extrabold leading-snug tracking-tight text-[#1f1f1f]">
                  Unlock all {bundle.pack_count} packs
                  {bundleQuestionTotal > 0 && <> + {bundleQuestionTotal} quiz q's</>}
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[17px] font-extrabold text-[#1f3a5f]">₹{bundle.price}</span>
                  {bundle.original_price > bundle.price && (
                    <span className="text-[11.5px] text-[#9a9289] line-through decoration-[#c05252]">
                      ₹{bundle.original_price}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => buy({ bundleSlug: bundle.slug })}
                  disabled={buying}
                  className="mt-0.5 rounded-[9px] bg-[#1f3a5f] px-3 py-2 text-[11.5px] font-bold text-white hover:bg-[#2d5fa6] disabled:opacity-60 transition-colors"
                >
                  {buying ? 'Opening…' : 'Get the bundle'}
                </button>
              </div>
            )}

            {bundle && !bundle.owned && !sidebarOpen && (
              <button
                onClick={() => buy({ bundleSlug: bundle.slug })}
                disabled={buying}
                title={`Unlock all ${bundle.pack_count} packs${bundleQuestionTotal > 0 ? ` + ${bundleQuestionTotal} quiz q's` : ''} — ₹${bundle.price}`}
                className="mt-auto flex h-8 w-8 flex-shrink-0 items-center justify-center self-center rounded-lg bg-[#1f3a5f] text-[11px] font-bold text-white transition-colors hover:bg-[#2d5fa6] disabled:opacity-60"
              >
                ₹
              </button>
            )}
          </aside>
        )}

        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-col">
          {!fullscreen && (
            <>
              <div className="px-4 pt-3 md:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <button
                      onClick={() => navigate('/library')}
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-[#1f1f1f] transition-colors hover:bg-[#f4f1ea]"
                      title="Back to Library"
                      aria-label="Back to Library"
                    >
                      <BackArrowIcon />
                    </button>
                    <div className="min-w-0">
                      <h1 className="text-[19px] font-bold tracking-tight">{pack.category}</h1>
                      <p className="mt-0.5 text-[12px] text-[#7b756d]">
                        {pack.page_count > 0 && `${pack.page_count} pages · `}
                        handwritten · {pack.quiz_count} quizzes · {pack.question_count} questions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {owned ? (
                      <span className="rounded-full bg-[#eef7df] px-3 py-1.5 text-[10.5px] font-bold text-[#557a3f]">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <button
                        onClick={() => buy()}
                        disabled={buying}
                        className="rounded-[10px] bg-[#1f3a5f] px-4 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#2d5fa6] disabled:opacity-60 transition-colors"
                      >
                        {buying ? 'Opening checkout…' : `Unlock full notes + ${pack.quiz_count} quizzes — ₹${pack.price}`}
                      </button>
                    )}
                    <div className="flex items-center gap-2 md:hidden">
                      <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
                    </div>
                    {isLoggedIn && (
                      <Link
                        to="/profile"
                        className="hidden h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold md:flex"
                        title="Profile"
                      >
                        {getInitials(user?.full_name)}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-0.5 border-b border-[#e2dbd2] px-4 md:px-7">
                <button
                  onClick={() => setTab('notes')}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-[13px] font-bold transition-colors ${
                    tab === 'notes'
                      ? 'border-[#1f1f1f] text-[#1f1f1f]'
                      : 'border-transparent text-[#7b756d] hover:text-[#1f1f1f]'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setTab('quizzes')}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-[13px] font-bold transition-colors ${
                    tab === 'quizzes'
                      ? 'border-[#1f1f1f] text-[#1f1f1f]'
                      : 'border-transparent text-[#7b756d] hover:text-[#1f1f1f]'
                  }`}
                >
                  Quizzes
                  <span className="rounded-full bg-[#f4f1ea] px-1.5 py-0.5 text-[10px] font-bold text-[#7b756d]">
                    {pack.quiz_count}
                  </span>
                  {!owned && <span className="text-[#9a9289]"><LockIcon size={11} /></span>}
                </button>
              </div>
            </>
          )}

          {/* ── Notes tab: the reader ── */}
          {tab === 'notes' && (
            <div className="flex flex-1 flex-col">
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#e2dbd2] bg-white/95 px-4 py-1.5 backdrop-blur md:px-7">
                <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-semibold">
                  <span className="truncate">{pack.title}</span>
                  <span className="rounded-full bg-[#f0f0ff] px-2 py-0.5 text-[9.5px] font-bold text-[#6366f1]">PDF</span>
                  {pdf && (
                    <span className="text-[11.5px] font-normal text-[#9a9289]">
                      {owned
                        ? `${pdf.total_pages} pages`
                        : `${pdf.accessible_pages} of ${pdf.total_pages} pages free`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {pdf?.pdf_url && (
                    <div className="flex items-center gap-0.5 rounded-lg border border-[#e2dbd2] bg-white p-0.5">
                      <button
                        onClick={zoomOut}
                        disabled={zoom <= ZOOM_MIN}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#1f1f1f] transition-colors hover:bg-[#f4f1ea] disabled:opacity-30"
                        title="Zoom out"
                        aria-label="Zoom out"
                      >
                        <MinusIcon />
                      </button>
                      <button
                        onClick={resetZoom}
                        className="w-10 text-center text-[11px] font-semibold tabular-nums text-[#1f1f1f] hover:text-[#7b756d]"
                        title="Reset zoom"
                      >
                        {Math.round(zoom * 100)}%
                      </button>
                      <button
                        onClick={zoomIn}
                        disabled={zoom >= ZOOM_MAX}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#1f1f1f] transition-colors hover:bg-[#f4f1ea] disabled:opacity-30"
                        title="Zoom in"
                        aria-label="Zoom in"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setFullscreen((v) => !v)}
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#e2dbd2] bg-white transition-colors hover:border-[#cfc7bd] hover:bg-[#f4f1ea]"
                    title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
                    aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                  </button>
                </div>
              </div>

              {pdf?.pdf_url ? (
                <PackPdfReader
                  url={pdf.pdf_url}
                  totalPages={pdf.total_pages}
                  accessiblePages={pdf.accessible_pages}
                  onUnlock={() => buy()}
                  zoom={zoom}
                />
              ) : (
                <div className="flex min-h-[460px] items-center justify-center px-6 text-center text-sm text-[#9a9289]">
                  The notes for this pack are being prepared.
                </div>
              )}
            </div>
          )}

          {/* ── Quizzes tab ── */}
          {tab === 'quizzes' && (
            <div className="px-4 py-6 md:px-7">
              {!owned ? (
                <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-14 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-[#1f3a5f]">
                    <LockIcon size={17} />
                  </span>
                  <h3 className="text-[17px] font-bold">{pack.quiz_count} quizzes are locked</h3>
                  <p className="text-[12.5px] leading-relaxed text-[#7b756d]">
                    Unlock the {pack.category} pack to practise all {pack.question_count} questions.
                  </p>
                  <button
                    onClick={() => buy()}
                    disabled={buying}
                    className="mt-1 rounded-[11px] bg-[#1f3a5f] px-6 py-3 text-[13px] font-bold text-white hover:bg-[#2d5fa6] disabled:opacity-60 transition-colors"
                  >
                    {buying ? 'Opening checkout…' : `Unlock — ₹${pack.price}`}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <h2 className="text-[17px] font-bold">Practice quizzes</h2>
                      <p className="mt-1 text-[12.5px] text-[#7b756d]">
                        {pack.quiz_count} quizzes · {pack.question_count} questions across the{' '}
                        {pack.category} syllabus
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] text-[#7b756d]">
                      <span>{quizzesDone} of {quizzes.length} done</span>
                      <span className="h-1.5 w-[120px] overflow-hidden rounded-full bg-[#f4f1ea]">
                        <span
                          className="block h-full rounded-full bg-[#557a3f] transition-all"
                          style={{ width: `${quizzes.length ? (quizzesDone / quizzes.length) * 100 : 0}%` }}
                        />
                      </span>
                    </div>
                  </div>

                  {progressSummary && (
                    <div className="mb-5 rounded-2xl border border-[#e2dbd2] bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9a9289]">
                            Your progress
                          </span>
                          <span className="text-[26px] font-bold leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
                            {progressSummary.accuracyPct}%
                          </span>
                          <span className="text-[12px] text-[#7b756d]">overall accuracy</span>
                        </div>
                        <span className="text-[12px] text-[#7b756d]">
                          {progressSummary.attemptedCount} of {progressSummary.totalCount} quizzes attempted
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#f4f1ea] pt-3.5">
                        <div className="flex items-center gap-2 text-[12.5px]">
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#c05252]" />
                          <span className="text-[#7b756d]">Weakest:</span>
                          <span className="font-semibold text-[#1f1f1f]">
                            {progressSummary.weakest.quiz.title} · {Math.round(progressSummary.weakest.pct)}%
                          </span>
                        </div>
                        {progressSummary.strongest && (
                          <div className="flex items-center gap-2 text-[12.5px]">
                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#557a3f]" />
                            <span className="text-[#7b756d]">Strongest:</span>
                            <span className="font-semibold text-[#1f1f1f]">
                              {progressSummary.strongest.quiz.title} · {Math.round(progressSummary.strongest.pct)}%
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => setActiveQuiz(progressSummary.weakest.quiz)}
                          className="ml-auto rounded-full border border-[#e2dbd2] bg-white px-3.5 py-[7px] text-xs font-bold text-[#1f1f1f] hover:bg-[#f4f1ea] transition-colors"
                        >
                          Practice weakest →
                        </button>
                      </div>
                    </div>
                  )}

                  {quizzes.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#9a9289]">
                      Quizzes for this pack are being written.
                    </p>
                  ) : (
                    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {quizzes.map((quiz) => {
                        const attempted = quiz.best_score !== null && quiz.best_score !== undefined
                        return (
                          <div
                            key={quiz.id}
                            className="flex flex-col gap-2.5 rounded-2xl border border-[#e2dbd2] bg-white p-[18px]"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14.5px] font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                                {quiz.title}
                              </h4>
                              <span
                                className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${
                                  attempted
                                    ? 'bg-[#eef7df] text-[#557a3f]'
                                    : 'bg-[#f4f1ea] text-[#8a847c]'
                                }`}
                              >
                                {attempted ? `${quiz.best_score} / ${quiz.question_count}` : 'Not started'}
                              </span>
                            </div>

                            <p className="text-[11.5px] text-[#7b756d]">
                              {quiz.question_count} questions{quiz.topic ? ` · ${quiz.topic}` : ''}
                            </p>

                            <div className="mt-auto flex items-center gap-2 pt-1">
                              <button
                                onClick={() => setActiveQuiz(quiz)}
                                disabled={quiz.question_count === 0}
                                className={`rounded-full px-3.5 py-[7px] text-xs font-bold transition-colors disabled:opacity-40 ${
                                  attempted
                                    ? 'border border-[#e2dbd2] bg-white text-[#1f1f1f] hover:bg-[#f4f1ea]'
                                    : 'bg-[#1f1f1f] text-white hover:bg-black'
                                }`}
                              >
                                {quiz.question_count === 0
                                  ? 'Coming soon'
                                  : attempted ? 'Retake' : 'Start quiz'}
                              </button>
                              {attempted && (
                                <span className="text-[11px] text-[#9a9289]">
                                  {quiz.attempts} attempt{quiz.attempts === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {activeQuiz && (
        <QuizRunner
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onFinished={() => { setActiveQuiz(null); load() }}
        />
      )}
    </div>
  )
}

export default InterviewPrepPage
