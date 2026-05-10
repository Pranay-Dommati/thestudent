import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './utils/axios'
import { getInitials } from './utils/user'

const fallbackPreviewStrip = [
  { id: 'osi-model', title: 'OSI Model', imageUrl: '' },
  { id: 'linked-lists', title: 'Linked Lists', imageUrl: '' },
  { id: 'dbms-normalization', title: 'DBMS Normalization', imageUrl: '' },
]

const pricingTiers = [
  {
    id: 'starter',
    label: 'Rs 49',
    note: '10 credits',
    helper: '10 note images or 10 PDF pages',
    highlight: false,
  },
  {
    id: 'standard',
    label: 'Rs 99',
    note: '20 credits',
    helper: '20 note images or 20 PDF pages',
    highlight: true,
  },
  {
    id: 'power',
    label: 'Rs 199',
    note: '40 credits',
    helper: '40 note images or 40 PDF pages',
    highlight: false,
  },
]

const topicChips = ['Cloud Computing', 'Photosynthesis', "Ohm's Law", 'Recursion', 'French Revolution']


const App = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const [previewStrip, setPreviewStrip] = useState(fallbackPreviewStrip)

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
          imageUrl: item.image_url,
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-5 w-5" />
            </div>
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
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                Dashboard
              </Link>
              <Link to="/profile" className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                Profile
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold"
              >
                Log out
              </button>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} credits
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold">
                {getInitials(user?.full_name)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f3a5f] px-4 py-2 text-xs font-semibold text-white">
                Get started free
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="border-b border-[#e4ddd4]">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <span className="inline-flex items-center rounded-full bg-[#e8eefb] px-4 py-1 text-xs font-semibold text-[#4a6aa6]">
              Free previews available now
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Turn any topic into <span className="border-b-4 border-[#f0c06a]">handwritten exam notes</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#6f6a63] md:text-lg">
              Search 500+ free previews or generate your own custom handwritten notes for any topic - in seconds.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/previews"
                className="rounded-full border border-[#d9d1c7] bg-white px-5 py-2 text-sm font-semibold text-[#1f1f1f]"
              >
                Browse free previews
              </Link>
              <button className="rounded-full border border-[#d9d1c7] bg-[#f1eee7] px-5 py-2 text-sm font-semibold text-[#1f1f1f]">
                Generate custom notes
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-[#7b756d]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6db05d]" /> No signup needed to browse
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6db05d]" /> UPI / Razorpay
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6db05d]" /> Instant PDF download
              </span>
            </div>
          </div>
        </section>

        <section id="landing-previews" className="py-10">
          <div className="mx-auto max-w-6xl px-6">
            <Link to="/previews" className="block">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b756d]">
                Free previews - browse and download
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {previewStrip.map((note) => (
                  <div key={note.id} className="rounded-xl border border-[#e2dbd2] bg-[#f7f4ee] p-3">
                    <div className="rounded-lg border border-[#e7dfd4] bg-white p-2">
                      {note.imageUrl ? (
                        <img
                          src={note.imageUrl}
                          alt={note.title}
                          className="h-24 w-full rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-[#e0d9ce] text-[11px] text-[#9a9289]">
                          Preview image
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{note.title}</p>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#d6cfc6] bg-[#f4f1ea] p-3">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className="h-1 w-1 rounded-full bg-[#cfc7bd]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#8a847c]">500+ more</p>
                </div>
              </div>
            </Link>
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
                <Link to="/generate" className="rounded-lg bg-[#1b1b1b] px-5 py-2 text-sm font-semibold text-white">
                  Generate
                </Link>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="w-full flex-1 rounded-lg border border-[#e0d9ce] bg-white px-3 py-2 text-sm"
                  placeholder="e.g. Dijkstra's Algorithm, Dopamine, Keynesian Economics"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {topicChips.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-[#e0d9ce] bg-white px-3 py-1 text-xs text-[#4b4742]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#8a847c]">10 credits = Rs 49. Sign in to generate.</p>
            </div>
          </div>
        </section>

        <section id="landing-pricing" className="py-10">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-sm font-semibold">Credit packs</p>
            <p className="text-sm text-[#7b756d]">Pay only for what you generate. Credits never expire.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border bg-[#f7f4ee] p-5 text-center ${
                    tier.highlight ? 'border-[#8fb0ff] ring-1 ring-[#8fb0ff]/50' : 'border-[#e2dbd2]'
                  }`}
                >
                  {tier.highlight ? (
                    <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-[#e8eefb] px-3 py-1 text-[10px] font-semibold text-[#4a6aa6]">
                      Most popular
                    </span>
                  ) : null}
                  <div className="mt-6 text-2xl font-semibold">
                    {tier.label} <span className="text-sm font-normal">/ pack</span>
                  </div>
                  <p className="mt-2 text-sm text-[#5f5a54]">{tier.note}</p>
                  <p className="mt-2 text-xs text-[#8a847c]">{tier.helper}</p>
                  <button
                    className={`mt-5 w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                      tier.highlight
                        ? 'bg-[#1b1b1b] text-white'
                        : 'border border-[#d9d1c7] bg-white text-[#1f1f1f]'
                    }`}
                  >
                    Buy pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
