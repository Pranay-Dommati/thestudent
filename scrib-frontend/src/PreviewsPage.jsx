import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'

const fallbackPreviewCards = [
  { id: 'osi-model', title: 'OSI Model', subject: 'Computer Networks', pdfUrl: null, pageCount: 1 },
  { id: 'newtons-laws', title: "Newton's Laws", subject: 'Physics', pdfUrl: null, pageCount: 1 },
  { id: 'krebs-cycle', title: 'Krebs Cycle', subject: 'Biology', pdfUrl: null, pageCount: 1 },
  { id: 'sql-joins', title: 'SQL Joins', subject: 'DBMS', pdfUrl: null, pageCount: 1 },
  { id: 'thermodynamics', title: 'Thermodynamics', subject: 'Physics', pdfUrl: null, pageCount: 1 },
]

const subjectChips = [
  'All subjects',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Maths',
  'Biology',
  'History',
]


const PreviewsPage = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [previewCards, setPreviewCards] = useState(fallbackPreviewCards)

  useEffect(() => {
    let isMounted = true

    const loadPreviews = async () => {
      try {
        const response = await axiosInstance.get('/scrib/previews/')
        const data = response.data
        if (!isMounted || !Array.isArray(data)) {
          return
        }
        const mapped = data.map((item) => ({
          id: item.id ?? item.slug ?? item.title,
          title: item.title,
          subject: item.tags?.[0] || 'Preview',
          pdfUrl: item.pdf_url || null,
          pageCount: item.page_count || 1,
        }))
        if (mapped.length) {
          setPreviewCards(mapped)
        }
      } catch {
        // Keep fallback cards if API is unavailable.
      }
    }

    loadPreviews()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#1f1f1f]">
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Scrib</p>
              <p className="text-xs text-[#7b756d]">Free previews</p>
            </div>
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold"
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
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                Get started free
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-[#d9d1c7] bg-white px-4 py-3">
              <span className="text-[#9a948c]">&#128269;</span>
              <input
                className="w-full border-none bg-transparent text-sm outline-none"
                placeholder="Search topics — OSI, Newton's Laws, SQL Joins..."
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-[#d9d1c7] bg-white px-4 py-3 text-sm font-semibold">
              <span className="text-[#7b756d]">&#9881;</span>
              Filter
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {subjectChips.map((chip, index) => (
              <span
                key={chip}
                className={`rounded-full border px-4 py-1 text-xs font-semibold ${
                  index === 0
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#5a554f]'
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#e2dbd2] bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold">
              Don't see your topic? Generate custom handwritten notes for any topic in seconds.
            </p>
            <Link to="/generate" className="rounded-full bg-[#1b1b1b] px-4 py-2 text-xs font-semibold text-white">
              Generate now
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {previewCards.map((note) => (
            <div
              key={note.id}
              className={`rounded-2xl border border-[#e2dbd2] bg-white p-4 transition-shadow ${note.pdfUrl ? 'cursor-pointer hover:shadow-md' : 'opacity-60'}`}
              onClick={() => {
                if (!note.pdfUrl) return
                navigate('/view', {
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
              {/* PDF preview placeholder — shows PDF icon + page count */}
              <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#ece5db] bg-[#fbfaf7]">
                {note.pdfUrl ? (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="8" y1="13" x2="16" y2="13" />
                      <line x1="8" y1="17" x2="16" y2="17" />
                    </svg>
                    <span className="rounded-full bg-[#f0f0ff] px-2 py-0.5 text-[10px] font-semibold text-[#6366f1]">
                      PDF · {note.pageCount || 1} page
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[#9a9289]">Coming soon</span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{note.title}</p>
                  <p className="text-xs text-[#7b756d]">{note.subject}</p>
                </div>
                <span className="rounded-full border border-[#e2dbd2] bg-[#f5f2ec] px-3 py-1 text-[10px] font-semibold text-[#6b655d]">
                  Free
                </span>
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d6cfc6] bg-[#f4f1ea] p-4">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="h-1 w-1 rounded-full bg-[#cfc7bd]" />
              ))}
            </div>
            <p className="text-sm text-[#8a847c]">495 more previews</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PreviewsPage
