import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import axiosInstance from './utils/axios'
import { getInitials } from './utils/user'
import MobileMenu from './components/MobileMenu'
import BuyCreditsModal from './components/BuyCreditsModal'
import FreeCreditsModal from './components/FreeCreditsModal'
import PreviewCard from './components/PreviewCard'
import { startPaymentFlow } from './services/paymentService'
import customToast from './utils/customToast'

const fallbackPreviewStrip = [
  { id: 'osi-model', title: 'OSI Model', pdfUrl: null },
  { id: 'linked-lists', title: 'Linked Lists', pdfUrl: null },
  { id: 'dbms-normalization', title: 'DBMS Normalization', pdfUrl: null },
]

const pricingTiers = [
  {
    id: 'starter',
    label: 'Rs 59',
    note: '10 credits',
    helper: '10 PDF pages',
    highlight: false,
  },
  {
    id: 'popular',
    label: 'Rs 99',
    note: '20 credits',
    helper: '20 PDF pages',
    highlight: true,
  },
  {
    id: 'pro',
    label: 'Rs 199',
    note: '40 credits',
    helper: '40 PDF pages',
    highlight: false,
  },
]

const topicChips = ['Cloud Computing', 'Photosynthesis', "Ohm's Law", 'Recursion', 'French Revolution']


const App = () => {
  const { user, refreshUser, logout, isLoggedIn, loading } = useAuth()
  const [previewStrip, setPreviewStrip] = useState(fallbackPreviewStrip)
  const [topicInput, setTopicInput] = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [processingPack, setProcessingPack] = useState(null)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)
  const navigate = useNavigate()

  const handleBuyClick = async (packId) => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (processingPack) return
    setProcessingPack(packId)

    await startPaymentFlow({
      pack: packId,
      user,
      onSuccess: async ({ credit_balance, credits_added }) => {
        setProcessingPack(null)
        await refreshUser?.()
        customToast.success(
          `🎉 ${credits_added} credits added! New balance: ${credit_balance} credits`,
          { duration: 4000 }
        )
      },
      onFailure: (message) => {
        setProcessingPack(null)
        customToast.error(message || 'Payment failed. Please try again.')
      },
      onDismiss: () => {
        setProcessingPack(null)
      },
    })
  }

  useEffect(() => {
    let isMounted = true

    const loadPreviews = async () => {
      try {
        const response = await axiosInstance.get('/scrib/previews/')
        const data = response.data
        if (!isMounted || !Array.isArray(data)) {
          return
        }
        const desiredTitles = [
          'software engineering',
          'vlsi fabrication steps',
          'ray optics'
        ]
        
        const selectedItems = desiredTitles.map(t => data.find(item => item.title.toLowerCase() === t)).filter(Boolean)
        
        // Fallback to top items if any are missing
        if (selectedItems.length < 3) {
          const usedIds = new Set(selectedItems.map(i => i.id || i.slug || i.title))
          for (const item of data) {
            if (selectedItems.length >= 3) break
            const id = item.id || item.slug || item.title
            if (!usedIds.has(id)) {
              selectedItems.push(item)
              usedIds.add(id)
            }
          }
        }
        
        const mapped = selectedItems.map((item) => ({
          id: item.id ?? item.slug ?? item.title,
          slug: item.slug,
          title: item.title,
          pdfUrl: item.pdf_url || null,
          imageUrl: item.image_url || null,
        }))
        if (mapped.length) {
          setPreviewStrip(mapped)
        }
      } catch {
        // Keep fallback previews if API is unavailable.
      }
    }

    loadPreviews()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1f1f1f] font-sans overflow-x-hidden selection:bg-[#d9d1c7] selection:text-[#1f1f1f]">
      <Helmet>
        <title>Scrib by EasyLearnova – AI Handwritten Exam Notes Generator</title>
        <meta name="description" content="Generate handwritten exam notes PDFs instantly using AI. Browse free previews or create custom handwritten notes for any topic in seconds." />
        <meta name="keywords" content="handwritten notes generator, exam notes pdf, AI handwritten notes, study notes pdf, handwritten pdf generator" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Generate Handwritten Exam Notes with AI" />
        <meta property="og:description" content="Turn any topic into handwritten exam notes instantly." />
        <meta property="og:image" content="https://scrib.easylearnova.com/og-image.png" />
        <meta property="og:url" content="https://scrib.easylearnova.com" />
        <meta property="og:site_name" content="Scrib by EasyLearnova" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Generate Handwritten Exam Notes with AI" />
        <meta name="twitter:description" content="AI-generated handwritten exam notes PDFs in seconds." />
        <meta name="twitter:image" content="https://scrib.easylearnova.com/og-image.png" />
        <link rel="canonical" href="https://scrib.easylearnova.com/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Scrib by EasyLearnova",
              "url": "https://scrib.easylearnova.com"
            }
          `}
        </script>
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-9 w-9 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            <div>
              <p className="text-sm font-semibold">Scrib</p>
              <p className="text-xs text-[#7b756d]">by EasyLearnova</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
            {isLoggedIn && (
              <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
            )}
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold sm:inline-flex">
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

      <main>
        <section className="border-b border-[#e4ddd4]">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eefb] px-4 py-1.5 text-sm font-medium text-[#4a6aa6]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Free previews available now
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Turn any topic into <br className="hidden sm:block" />
              <span className="inline-block border-b-[4px] border-[#f0c06a] pb-1 mt-2">
                handwritten exam notes
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-[#6f6a63] md:text-xl leading-relaxed">
              Search 50+ free previews or generate your own custom <br className="hidden sm:block" />
              handwritten notes for any topic — in seconds.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                to="/previews"
                className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#faf8f3] transition-colors"
              >
                Browse free previews
              </Link>
              <button
                onClick={() => navigate('/generate')}
                className="rounded-full btn-shine-effect px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Generate custom notes
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-[#9a9289]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Handwritten exam notes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Instant PDF generation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Built for students
              </span>
            </div>
          </div>
        </section>

        <section id="landing-previews" className="py-10">
          <div className="mx-auto max-w-6xl px-6">
            <div>
              <Link to="/previews" className="inline-block hover:opacity-80">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b756d]">
                  Free previews - browse and download &rarr;
                </p>
              </Link>
              <div 
                className="mt-4 flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar md:grid md:grid-cols-4 md:overflow-x-visible md:pb-0" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => {
                  const scrollLeft = e.target.scrollLeft;
                  const itemWidth = 296; // 280px width + 16px gap
                  const index = Math.round(scrollLeft / itemWidth);
                  setActivePreviewIndex(index);
                }}
              >
                {previewStrip.map((note) => (
                  <div
                    key={note.id}
                    className={`shrink-0 w-[280px] md:w-auto snap-start transition-transform duration-200 ${note.pdfUrl ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg rounded-xl' : 'opacity-70'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      if (!note.pdfUrl) return
                      navigate(`/view/${note.slug}`, {
                        state: {
                          pdfUrl: note.pdfUrl,
                          title: note.title,
                          topics: [note.title],
                          totalPages: 1,
                          isPack: true,
                        }
                      })
                    }}
                  >
                    {!note.pdfUrl && !note.imageUrl ? (
                      <div className="animate-pulse h-full flex flex-col rounded-xl border border-[#e2dbd2] bg-white overflow-hidden">
                        <div className="h-28 w-full bg-[#e8e2d9]"></div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="mb-2 h-3 w-1/3 rounded bg-[#e8e2d9]"></div>
                          <div className="h-4 w-3/4 rounded bg-[#e8e2d9]"></div>
                          <div className="mt-auto pt-4 flex justify-between">
                            <div className="h-3 w-16 rounded bg-[#e8e2d9]"></div>
                            <div className="h-5 w-12 rounded-full bg-[#e8e2d9]"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <PreviewCard title={note.title} subject={note.subject || 'Preview'} />
                    )}
                  </div>
                ))}
                
                {/* 50+ more card */}
                <Link to="/previews" className="shrink-0 w-[280px] md:w-auto snap-start flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#d6cfc6] bg-[#f4f1ea] p-4 transition-colors hover:bg-[#f0ece5]">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className="h-1 w-1 rounded-full bg-[#cfc7bd]" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[#8a847c]">50+ more</p>
                </Link>
              </div>

              {/* Scroll indicators (Dots) for mobile only */}
              <div className="mt-2 flex justify-center gap-1.5 md:hidden">
                {Array.from({ length: previewStrip.length + 1 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activePreviewIndex ? 'w-4 bg-[#1f1f1f]' : 'w-1.5 bg-[#d6cfc6]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-2xl border border-[#e2dbd2] bg-[#f7f4ee] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Generate your custom notes</p>
                  <p className="text-xs text-[#7b756d]">
                    Enter any topic - we will create handwritten notes just for it. 1 credit per page.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const encoded = encodeURIComponent(topicInput.trim())
                    navigate(encoded ? `/generate?topic=${encoded}` : '/generate')
                  }}
                  className="rounded-lg bg-[#1b1b1b] px-5 py-2 text-sm font-semibold text-white"
                  type="button"
                >
                  Generate
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="w-full flex-1 rounded-lg border border-[#e0d9ce] bg-white px-3 py-2 text-sm"
                  placeholder="e.g. Dijkstra's Algorithm, Dopamine, Keynesian Economics"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      const encoded = encodeURIComponent(topicInput.trim())
                      navigate(encoded ? `/generate?topic=${encoded}` : '/generate')
                    }
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {topicChips.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setTopicInput(topic)}
                    className="rounded-full border border-[#e0d9ce] bg-white px-3 py-1 text-xs text-[#4b4742]"
                    type="button"
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#8a847c]">10 credits = Rs 59. Sign in to generate.</p>
            </div>
          </div>
        </section>

        <section id="landing-pricing" className="py-10">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            
            {/* --- Mobile View (Compact Horizontal Cards) --- */}
            <div className="md:hidden rounded-[24px] border border-[#e2dbd2] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a847c]">Pricing</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1f]">Credit packs</h2>
              <p className="mt-1 text-sm text-[#5f5a54]">Pay only for what you generate. Credits never expire. Built to remain affordable while supporting AI generation and cloud processing.</p>
              
              <div className="mt-8 flex flex-col gap-4">
                {pricingTiers.map((tier) => (
                  <div
                    key={`mobile-${tier.id}`}
                    className={`relative flex items-center justify-between rounded-xl p-3 ${
                      tier.highlight ? 'border-2 border-[#6246ea] bg-white shadow-sm' : 'border border-[#e2dbd2] bg-white'
                    }`}
                  >
                    {tier.highlight && (
                      <span className="absolute -top-[14px] left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#efedfc] border-4 border-white px-2 py-0.5 text-[10px] font-bold text-[#6246ea] shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.1 4.5 2.3 7.5-6.2-4.6-6.2 4.6 2.3-7.5L2 9.6h7.6z"/></svg>
                        Best value
                      </span>
                    )}
                    
                    {/* Left: Price */}
                    <div className="flex w-20 flex-col justify-center">
                      <span className={`text-2xl font-bold leading-none tracking-tight ${tier.highlight ? 'text-[#6246ea]' : 'text-[#1f1f1f]'}`}>
                        {tier.label.replace('Rs ', '₹')}
                      </span>
                      <span className="mt-1 text-[11px] leading-none text-[#8a847c]">/ pack</span>
                    </div>

                    {/* Middle: Details */}
                    <div className="flex flex-1 flex-col items-start px-2">
                      <span className="text-sm font-bold text-[#1f1f1f]">{tier.note.split(' ')[0]} credits</span>
                      <span className="text-[11px] text-[#8a847c]">{tier.helper.split(' ')[0]} PDF pages</span>
                    </div>

                    {/* Right: Button */}
                    <div className="flex-shrink-0">
                      <button
                        id={`landing-buy-mobile-${tier.id}`}
                        onClick={() => handleBuyClick(tier.id)}
                        disabled={processingPack === tier.id}
                        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          tier.highlight
                            ? 'bg-[#1a1a1a] text-white hover:bg-[#333333]'
                            : 'border border-[#e2dbd2] bg-white text-[#1f1f1f] hover:bg-[#f7f4ee]'
                        } disabled:opacity-50`}
                      >
                        {processingPack === tier.id ? 'Processing...' : isLoggedIn ? 'Buy' : 'Sign in to buy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#8a847c]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Secured by Razorpay · UPI, cards accepted
              </div>
            </div>

            {/* --- Desktop View (Original Grid Cards) --- */}
            <div className="hidden md:block">
              <p className="text-sm font-semibold">Credit packs</p>
              <p className="text-sm text-[#7b756d]">Pay only for what you generate. Credits never expire. Built to remain affordable while supporting AI generation and cloud processing.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {pricingTiers.map((tier) => (
                  <div
                    key={`desktop-${tier.id}`}
                    className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                      tier.highlight ? 'border-[1.5px] border-black shadow-sm' : 'border-[#e2dbd2]'
                    }`}
                  >
                    {tier.highlight ? (
                      <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 rounded-full bg-[#1a1a1a] ring-4 ring-white px-3 py-0.5 text-[11px] font-semibold text-[#f0c06a]">
                        Best value
                      </span>
                    ) : null}
                    
                    <div className="flex flex-col">
                      <span className="text-4xl font-medium tracking-tight text-[#1f1f1f]">
                        {tier.label.replace('Rs ', '₹')}
                      </span>
                      <span className="mt-1 text-sm text-[#5f5a54]">/ pack</span>
                    </div>

                    <div className="mt-6 flex flex-col">
                      <span className="text-lg font-semibold text-[#1f1f1f]">{tier.note.split(' ')[0]} credits</span>
                      <span className="mt-1 text-[13px] leading-snug text-[#5f5a54]">
                        {tier.helper}
                      </span>
                    </div>

                    <div className="mt-auto pt-8">
                      <button
                        id={`landing-buy-desktop-${tier.id}`}
                        onClick={() => handleBuyClick(tier.id)}
                        disabled={processingPack === tier.id}
                        className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          tier.highlight
                            ? 'bg-[#1a1a1a] text-white hover:bg-[#333333]'
                            : 'border border-[#e2dbd2] bg-white text-[#1f1f1f] hover:bg-[#f7f4ee]'
                        } disabled:opacity-50`}
                      >
                        {processingPack === tier.id ? 'Processing...' : isLoggedIn ? 'Buy pack' : 'Sign in to buy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4ddd4] bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#7b756d]">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Free Credits Promo Modal for first-time visitors */}
      <FreeCreditsModal isLoggedIn={isLoggedIn} loading={loading} />
    </div>
  )
}

export default App
