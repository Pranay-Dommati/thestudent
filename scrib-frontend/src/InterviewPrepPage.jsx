import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import customToast from './utils/customToast'
import QuizRunner from './components/QuizRunner'
import PrepLoadingScreen from './components/PrepLoadingScreen'
import PackPdfReader from './components/PackPdfReader'
import FreeOfferBanner from './components/FreeOfferBanner'
import CelebrationBurst from './components/CelebrationBurst'
import FreeClaimConfirmModal from './components/FreeClaimConfirmModal'
import SpotlightTour from './components/SpotlightTour'
import { claimFreePack, fetchCatalogue, fetchPack, fetchPackPdf, purchasePack } from './services/packs'
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

const UpArrowIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
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

// Orientation is a one-time thing: once someone knows the packs are
// switchable, saying so again on every visit is noise.
const INTRO_SEEN_KEY = 'scrib_prep_intro_seen'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1
const ZOOM_DEFAULT_DESKTOP = 0.9
const ZOOM_DEFAULT_MOBILE = 1

// Matches the md: breakpoint used throughout this page's layout classes.
const getDefaultZoom = () => (
  typeof window !== 'undefined' && window.innerWidth < 768 ? ZOOM_DEFAULT_MOBILE : ZOOM_DEFAULT_DESKTOP
)

const InterviewPrepPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const posthog = usePostHog()
  const { user, isLoggedIn, refreshUser } = useAuth()

  // Always the Library, never navigate(-1): the pack page is reached from a
  // dozen places (a shared link, the welcome modal, a quiz), and "back" from a
  // pack means "back to the shelf" every time rather than retracing history.
  const goBack = () => navigate('/library')

  const [detail, setDetail] = useState(null)
  const [catalogue, setCatalogue] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [tab, setTab] = useState('notes')
  const [loading, setLoading] = useState(true)
  // Tracks which purchase is in flight — null, 'pack', or a bundle slug — so
  // only the button that was actually clicked shows "Opening…"; the others
  // stay disabled (to block a second checkout popup) but keep their label.
  const [buyingTarget, setBuyingTarget] = useState(null)
  const buying = buyingTarget !== null
  const [claiming, setClaiming] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [confirmingFree, setConfirmingFree] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [zoom, setZoom] = useState(getDefaultZoom)
  const [scrolled, setScrolled] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  // Each control exists twice — once in the desktop rail, once in the mobile
  // row — and only one is ever on screen. The tour picks whichever measures.
  const railRef = useRef(null)
  const packRowRef = useRef(null)
  const bundleCardRef = useRef(null)
  const bundleChipRef = useRef(null)

  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))
  const resetZoom = () => setZoom(getDefaultZoom())

  useEffect(() => {
    if (new URLSearchParams(location.search).get('intro') !== '1') return
    if (localStorage.getItem(INTRO_SEEN_KEY)) return
    setShowIntro(true)
  }, [location.search])

  const dismissIntro = () => {
    setShowIntro(false)
    localStorage.setItem(INTRO_SEEN_KEY, '1')
    // Drop the flag so a refresh — or a shared copy of this URL — doesn't
    // re-open the tip for someone who has already read it.
    navigate(location.pathname, { replace: true })
  }

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

  // Once the header (and its unlock CTA) scrolls away, the sticky bar picks the
  // CTA up so the offer is never off-screen while someone reads the free pages.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pack = detail?.pack
  const owned = detail?.owned
  const siblings = useMemo(() => detail?.siblings || [], [detail])
  const quizzes = useMemo(() => detail?.quizzes || [], [detail])
  const bundle = detail?.bundle || catalogue?.bundle
  const freeOffer = detail?.free_offer || catalogue?.free_offer

  // Logged-out visitors see the free CTA too. The offer is the whole reason to
  // sign up, so hiding it until after login would bury the pitch behind the
  // friction it exists to remove — the button routes them to /login instead.
  const canClaimFree = Boolean(
    !owned && freeOffer?.open && (freeOffer.eligible || freeOffer.reason === 'anonymous'),
  )

  // Built here rather than inside the tour so the copy can quote this pack's
  // real numbers — a tour that says "3 packs" when there are four is worse
  // than no tour.
  const tourSteps = useMemo(() => {
    const list = [{
      targets: [railRef, packRowRef],
      title: `${siblings.length} subjects, not just this one`,
      body: 'Jump between packs from here. Each one keeps its own free preview, so you can read before you decide.',
    }]

    if (bundle && !bundle.owned) {
      const saving = bundle.original_price - bundle.price
      list.push({
        targets: [bundleCardRef, bundleChipRef],
        title: `Take ${bundle.pack_count >= siblings.length ? 'all' : 'the remaining'} ${bundle.pack_count} for ₹${bundle.price}`,
        body: saving > 0
          ? `Buying them separately costs ₹${bundle.original_price}, so the bundle saves you ₹${saving}.`
          : 'One purchase unlocks every pack, notes and quizzes included.',
      })
    }

    return list
  }, [siblings.length, bundle])

  // The backend scopes the offer to the packs this user doesn't own yet, so its
  // counts describe what they'd actually be buying — summing the siblings here
  // would go back to pitching packs they already paid for.
  const bundleQuestionTotal = bundle?.question_count || 0
  const bundleLabel = bundle
    ? `Unlock ${bundle.pack_count >= siblings.length ? 'all' : 'the remaining'} ${bundle.pack_count} packs`
    : ''

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
      navigate(`/login?next=${encodeURIComponent(`/interview-prep/${slug || ''}`)}`)
      return
    }
    if (buying) return  // a purchase is already in flight — don't open a second checkout
    try {
      setBuyingTarget(bundleSlug || 'pack')
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
      setBuyingTarget(null)
    }
  }

  // What the free CTA does: ask, don't claim. The entitlement is one per
  // person for good, so the last thing between a curious click and spending it
  // on whichever pack happened to be open is a modal naming the pack.
  const requestClaimFree = () => {
    if (!isLoggedIn) {
      customToast.success('Create a free account to claim your pack')
      navigate(`/login?next=${encodeURIComponent(`/interview-prep/${slug || ''}`)}`)
      return
    }
    if (claiming || buying) return
    setConfirmingFree(true)
  }

  // Only ever called from the confirmation modal.
  const claimFree = async () => {
    if (claiming || buying) return
    try {
      setClaiming(true)
      const result = await claimFreePack(pack.slug)
      posthog?.capture('interview_pack_claimed_free', {
        pack: pack.slug,
        remaining: result?.free_offer?.remaining,
      })
      setConfirmingFree(false)
      customToast.success(`${pack.title} is yours — free!`)
      // Confetti instead of a "you already claimed yours" strip that would
      // otherwise sit on the page for good after a one-time offer is spent.
      setCelebrating(true)
      await Promise.all([load(), refreshUser?.()])
    } catch (error) {
      customToast.error(
        error?.response?.data?.message || error.message || 'Could not claim the free pack',
      )
      // The last slot may have gone between render and click. Reload so the
      // page stops advertising an offer that is no longer there, and drop the
      // confirmation with it — there is nothing left to confirm.
      setConfirmingFree(false)
      load()
    } finally {
      setClaiming(false)
    }
  }

  // Every paywall CTA on the page reads from these, so the free offer never
  // shows up in one place and a price in another.
  const unlockBusy = canClaimFree ? claiming : buyingTarget === 'pack'
  const onUnlock = canClaimFree ? requestClaimFree : () => buy()
  const unlockBusyLabel = canClaimFree ? 'Claiming…' : 'Opening checkout…'
  const unlockLabel = canClaimFree
    ? `🎁 Get ${pack?.category || 'this pack'} FREE`
    : `🔓 Unlock ${pack?.category || 'this pack'} · ₹${pack?.price}`
  const unlockShortLabel = canClaimFree ? '🎁 FREE' : `🔓 ₹${pack?.price}`
  // Amber for the giveaway, navy for a sale — the colour is doing the work of
  // saying "this one costs nothing" before the label is read.
  const unlockButtonClass = canClaimFree
    ? 'bg-[#c2542f] shadow-md shadow-[#c2542f]/25 ring-1 ring-[#c2542f]/40 hover:bg-[#a94526]'
    : 'bg-[#1f3a5f] shadow-md shadow-[#1f3a5f]/25 ring-1 ring-[#1f3a5f]/40 hover:bg-[#2d5fa6]'

  if (loading) {
    return <PrepLoadingScreen />
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
      {showIntro && <SpotlightTour steps={tourSteps} onFinish={dismissIntro} />}
      <CelebrationBurst active={celebrating} onDone={() => setCelebrating(false)} />
      <FreeClaimConfirmModal
        open={confirmingFree}
        pack={pack}
        siblings={siblings}
        offer={freeOffer}
        claiming={claiming}
        onConfirm={claimFree}
        onPick={(nextSlug) => {
          setConfirmingFree(false)
          navigate(`/interview-prep/${nextSlug}`)
        }}
        onClose={() => setConfirmingFree(false)}
      />
      <Helmet>
        <title>{pack.title} — Interview Prep | Scrib</title>
        <meta name="description" content={pack.description || `Handwritten ${pack.category} interview notes with ${pack.quiz_count} practice quizzes.`} />
        <link rel="canonical" href={`https://scrib.easylearnova.com/interview-prep/${pack.slug}`} />
      </Helmet>

      <div className={fullscreen ? '' : `grid ${sidebarOpen ? 'md:grid-cols-[264px_minmax(0,1fr)]' : 'md:grid-cols-[64px_minmax(0,1fr)]'}`}>
        {/* ── Left rail: every pack, always one click away ── */}
        {!fullscreen && (
          <aside
            ref={railRef}
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

            {/* Pinned to the bottom of the rail. One wrapper rather than an
                `mt-auto` on each, so the bundle still sits at the foot on its
                own when the free offer is off and renders nothing. */}
            {sidebarOpen && (
              <div className="mt-auto flex flex-col gap-3">
              {!owned && (
              <FreeOfferBanner
                offer={freeOffer}
                variant="inline"
                onCta={canClaimFree ? onUnlock : undefined}
                ctaLabel={claiming ? 'Claiming…' : `Claim ${pack.category} free`}
              />
            )}

            {bundle && !bundle.owned && (
              <div
                ref={bundleCardRef}
                className="flex flex-col gap-2 rounded-xl border border-[#d8e2ec] bg-gradient-to-b from-[#eef2f7] to-[#f4f1ea] p-3.5"
              >
                <span className="text-[14px] font-extrabold leading-snug tracking-tight text-[#1f1f1f]">
                  {bundleLabel}
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
                  {buyingTarget === bundle.slug ? 'Opening…' : 'Get the bundle'}
                </button>
              </div>
            )}
              </div>
            )}

            {bundle && !bundle.owned && !sidebarOpen && (
              <button
                onClick={() => buy({ bundleSlug: bundle.slug })}
                disabled={buying}
                title={`${bundleLabel}${bundleQuestionTotal > 0 ? ` + ${bundleQuestionTotal} quiz q's` : ''} — ₹${bundle.price}`}
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
              <div className="px-4 pb-4 pt-3 md:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <button
                      onClick={goBack}
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-[#1f1f1f] transition-colors hover:bg-[#f4f1ea]"
                      title="Back"
                      aria-label="Back"
                    >
                      <BackArrowIcon />
                    </button>
                    <div className="min-w-0">
                      <h1 className="text-[19px] font-bold tracking-tight">{pack.category}</h1>
                      <p className="mt-0.5 text-[12px] text-[#7b756d]">
                        {pack.page_count > 0 && `${pack.page_count} pages · `}
                        {pack.quiz_count} quizzes · {pack.question_count} questions
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-2 md:w-auto">
                    {owned ? (
                      <span className="flex-1 rounded-full bg-[#eef7df] px-3 py-1.5 text-center text-[10.5px] font-bold text-[#557a3f] md:flex-none">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <button
                        onClick={onUnlock}
                        disabled={buying || claiming}
                        className={`flex-1 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60 md:flex-none ${unlockButtonClass}`}
                      >
                        {unlockBusy ? unlockBusyLabel : unlockLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* The rail carries the offer on desktop; on a phone there is no
                  rail, so it needs its own strip under the header. */}
              {!owned && (
                <FreeOfferBanner
                  offer={freeOffer}
                  variant="strip"
                  className="md:hidden"
                  onCta={canClaimFree ? onUnlock : undefined}
                  ctaLabel={claiming ? 'Claiming…' : 'Claim free'}
                />
              )}

              {/* ── Mobile pack switcher — the left rail is desktop-only, so on a
                  phone this is the only way to move between packs or reach the
                  bundle offer. One scrollable row keeps it cheap vertically. ── */}
              <div
                ref={packRowRef}
                className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
              >
                {siblings.map((item) => {
                  const swatch = SWATCHES[item.theme] || SWATCHES.blue
                  const active = item.slug === pack.slug
                  return (
                    <Link
                      key={item.id}
                      to={`/interview-prep/${item.slug}`}
                      className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] font-bold transition-colors ${
                        active
                          ? 'border-[#d8e2ec] bg-[#eef2f7] text-[#1f1f1f]'
                          : 'border-[#e2dbd2] bg-white text-[#7b756d]'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3 flex-shrink-0 rounded-[3px] border"
                        style={{
                          backgroundColor: swatch.bg,
                          borderColor: swatch.pattern,
                          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${swatch.pattern} 3px, ${swatch.pattern} 4px)`,
                        }}
                      />
                      <span className="max-w-[124px] truncate">{item.category}</span>
                      <span className={item.owned ? 'text-[#557a3f]' : 'text-[#9a9289]'}>
                        {item.owned ? <CheckIcon size={10} /> : <LockIcon size={10} />}
                      </span>
                    </Link>
                  )
                })}

                {bundle && !bundle.owned && (
                  <button
                    ref={bundleChipRef}
                    onClick={() => buy({ bundleSlug: bundle.slug })}
                    disabled={buying}
                    className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8e2ec] bg-[#eef2f7] px-3 py-1.5 text-[11.5px] font-bold text-[#1f3a5f] transition-colors disabled:opacity-60"
                  >
                    {bundle.pack_count >= siblings.length ? 'All' : 'Remaining'} {bundle.pack_count} packs · ₹{bundle.price}
                    {bundle.original_price > bundle.price && (
                      <span className="text-[10px] font-semibold text-[#9a9289] line-through decoration-[#c05252]">
                        ₹{bundle.original_price}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Tab switcher + reader controls — sticky so it survives scroll,
              and rendered outside the fullscreen check so it's the only nav
              surface left once the header/sidebar are hidden. ── */}
          <div className="sticky top-0 z-20 flex flex-nowrap items-center justify-between gap-2 border-b border-[#e2dbd2] bg-white/95 px-4 py-2 backdrop-blur md:flex-wrap md:gap-3 md:px-7">
            <div className="flex min-w-0 items-center gap-1">
              {/* Exits fullscreen while in it; otherwise scrolls back to the
                  header (with the real back button) instead of navigating —
                  scrolled this far down, "back" reads as "take me up", not
                  "leave the page". */}
              {(fullscreen || scrolled) && (
                <button
                  onClick={() => (fullscreen ? setFullscreen(false) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
                  className="mr-1 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border border-[#e2dbd2] bg-white transition-colors hover:bg-[#f4f1ea]"
                  title={fullscreen ? 'Exit full screen (Esc)' : 'Scroll to top'}
                  aria-label={fullscreen ? 'Exit full screen' : 'Scroll to top'}
                >
                  {fullscreen ? <BackArrowIcon /> : <UpArrowIcon />}
                </button>
              )}
              <button
                onClick={() => setTab('notes')}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-bold transition-colors md:px-3 ${
                  tab === 'notes'
                    ? 'bg-[#f4f1ea] text-[#1f1f1f]'
                    : 'text-[#7b756d] hover:bg-[#f4f1ea]/60 hover:text-[#1f1f1f]'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setTab('quizzes')}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-bold transition-colors md:px-3 ${
                  tab === 'quizzes'
                    ? 'bg-[#f4f1ea] text-[#1f1f1f]'
                    : 'text-[#7b756d] hover:bg-[#f4f1ea]/60 hover:text-[#1f1f1f]'
                }`}
              >
                Quizzes
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#7b756d]">
                  {pack.quiz_count}
                </span>
              </button>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1.5">
              {!owned && (scrolled || fullscreen) && (
                <button
                  onClick={onUnlock}
                  disabled={buying || claiming}
                  className={`mr-0.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60 md:px-5 ${unlockButtonClass}`}
                >
                  {/* The full pitch only fits once the column is wide enough —
                      below lg the sidebar still takes 264px, so the price
                      alone carries the bar and keeps it to one row. */}
                  <span className="lg:hidden">{unlockBusy ? '…' : unlockShortLabel}</span>
                  <span className="hidden lg:inline">
                    {unlockBusy ? unlockBusyLabel : unlockLabel}
                  </span>
                </button>
              )}

              {tab === 'notes' && pdf?.pdf_url && (
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
                    className="hidden w-10 text-center text-[11px] font-semibold tabular-nums text-[#1f1f1f] hover:text-[#7b756d] md:block"
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
                className="hidden h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#e2dbd2] bg-white transition-colors hover:border-[#cfc7bd] hover:bg-[#f4f1ea] md:flex"
                title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
                aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Notes tab: the reader ── */}
          {tab === 'notes' && (
            <div className="flex flex-1 flex-col">
              {pdf?.pdf_url ? (
                <PackPdfReader
                  // A different document deserves a clean reader: without this
                  // the previous pack's rendered-page set, page counter and
                  // scroll anchor survive the switch and describe a PDF that is
                  // no longer on screen.
                  key={pack.slug}
                  url={pdf.pdf_url}
                  totalPages={pdf.total_pages}
                  accessiblePages={pdf.accessible_pages}
                  onUnlock={onUnlock}
                  unlocking={unlockBusy}
                  zoom={zoom}
                  price={pack.price}
                  free={canClaimFree}
                  quizCount={pack.quiz_count}
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
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e2dbd2] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#e2dbd2] bg-[#f4f1ea] text-[#1f3a5f]">
                        <LockIcon size={17} />
                      </span>
                      <div>
                        <h3 className="text-[15px] font-bold">{pack.quiz_count} quizzes are locked</h3>
                        <p className="text-[12.5px] text-[#7b756d]">
                          Unlock the {pack.category} pack to practise all {pack.question_count} questions.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onUnlock}
                      disabled={buying || claiming}
                      className={`flex-shrink-0 rounded-[11px] px-6 py-3 text-[13px] font-bold text-white disabled:opacity-60 transition-colors ${
                        canClaimFree ? 'bg-[#c2542f] hover:bg-[#a94526]' : 'bg-[#1f3a5f] hover:bg-[#2d5fa6]'
                      }`}
                    >
                      {unlockBusy
                        ? unlockBusyLabel
                        : canClaimFree ? '🎁 Unlock free' : `Unlock — ₹${pack.price}`}
                    </button>
                  </div>

                  {quizzes.length > 0 && (
                    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white p-[18px] opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-[14.5px] font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {quiz.title}
                            </h4>
                            <span className="text-[#9a9289]">
                              <LockIcon size={13} />
                            </span>
                          </div>

                          <p className="text-[11.5px] text-[#7b756d]">
                            {quiz.question_count} questions{quiz.topic ? ` · ${quiz.topic}` : ''}
                          </p>

                          <div className="mt-auto pt-1">
                            <button
                              onClick={onUnlock}
                              disabled={buying || claiming}
                              className="rounded-full border border-[#e2dbd2] bg-white px-3.5 py-[7px] text-xs font-bold text-[#1f1f1f] hover:bg-[#f4f1ea] disabled:opacity-40 transition-colors"
                            >
                              {unlockBusy
                                ? 'Opening…'
                                : canClaimFree ? 'Unlock free' : 'Unlock to start'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
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
