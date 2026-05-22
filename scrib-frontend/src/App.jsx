import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './utils/axios'
import { getInitials } from './utils/user'
import PDFThumbnail from './components/PDFThumbnail'
import MobileMenu from './components/MobileMenu'

const fallbackPreviewStrip = [
  { id: 'osi-model', title: 'OSI Model', pdfUrl: null },
  { id: 'linked-lists', title: 'Linked Lists', pdfUrl: null },
  { id: 'dbms-normalization', title: 'DBMS Normalization', pdfUrl: null },
]

const pricingTiers = [
  {
    id: 'starter',
    label: 'Rs 49',
    note: '10 credits',
    helper: '10 PDF pages',
    highlight: false,
  },
  {
    id: 'standard',
    label: 'Rs 99',
    note: '20 credits',
    helper: '20 PDF pages',
    highlight: true,
  },
  {
    id: 'power',
    label: 'Rs 199',
    note: '40 credits',
    helper: '40 PDF pages',
    highlight: false,
  },
]

const topicChips = ['Cloud Computing', 'Photosynthesis', "Ohm's Law", 'Recursion', 'French Revolution']


const App = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const [previewStrip, setPreviewStrip] = useState(fallbackPreviewStrip)
  const [topicInput, setTopicInput] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const loadPreviews = async () => {
      try {
        const response = await axiosInstance.get('/scrib/previews/')
        const data = response.data
        if (!isMounted || !Array.isArray(data)) {
          return
        }
        const mapped = data.slice(0, 3).map((item) => ({
          id: item.id ?? item.slug ?? item.title,
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
    <div className="min-h-screen bg-white text-[#1f1f1f]">
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
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold sm:inline-flex">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex"
              >
                Log out
              </button>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} cr
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
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2">
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
                className="rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Generate custom notes
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-[#9a9289]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> No signup to browse
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> UPI / Razorpay
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6db05d]" /> Instant PDF
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
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {previewStrip.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-xl border border-[#e2dbd2] bg-[#f7f4ee] p-3 transition-shadow ${note.pdfUrl ? 'cursor-pointer hover:shadow-md' : 'opacity-60'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      if (!note.pdfUrl) return
                      navigate('/view', {
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
                      <div className="animate-pulse">
                        <div className="h-28 w-full rounded-lg bg-[#e8e2d9]"></div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="h-4 w-2/3 rounded bg-[#e8e2d9]"></div>
                          <div className="h-4 w-8 rounded-full bg-[#e8e2d9]"></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border border-[#e7dfd4] bg-white p-2">
                          {note.imageUrl ? (
                            <img src={note.imageUrl} alt={note.title} className="h-24 w-full rounded-md bg-[#fbfaf7] object-cover" />
                          ) : (
                            <PDFThumbnail pdfUrl={note.pdfUrl} title={note.title} className="h-24 rounded-md bg-[#fbfaf7]" />
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">{note.title}</p>
                          <span className="rounded-full border border-[#e2dbd2] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6b655d]">
                            Free
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <Link to="/previews" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d6cfc6] bg-[#f4f1ea] p-4 transition-colors hover:bg-[#f0ece5]">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className="h-1 w-1 rounded-full bg-[#cfc7bd]" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[#8a847c]">50+ more</p>
                </Link>
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
              <p className="mt-3 text-xs text-[#8a847c]">10 credits = Rs 49. Sign in to generate.</p>
            </div>
          </div>
        </section>

        <section id="landing-pricing" className="py-10">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            
            {/* --- Mobile View (Compact Horizontal Cards) --- */}
            <div className="md:hidden rounded-[24px] border border-[#e2dbd2] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a847c]">Pricing</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1f]">Credit packs</h2>
              <p className="mt-1 text-sm text-[#5f5a54]">Pay only for what you generate. Credits never expire.</p>
              
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
                        Most popular
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
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                          tier.highlight
                            ? 'bg-[#1b1b1b] text-white'
                            : 'bg-[#f7f4ee] text-[#1f1f1f] hover:bg-[#ede9e1]'
                        }`}
                      >
                        Buy
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
              <p className="text-sm text-[#7b756d]">Pay only for what you generate. Credits never expire.</p>
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
                        Most popular
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
                        className="w-full rounded-lg border border-[#d9d1c7] bg-white py-2 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-[#faf8f3]"
                      >
                        Buy pack
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
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-[#7b756d]">
          &copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default App
