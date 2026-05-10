import { Link } from 'react-router-dom'

const previewCards = [
  { id: 'osi-model', title: 'OSI Model', subject: 'Computer Networks', tone: 'gold' },
  { id: 'newtons-laws', title: "Newton's Laws", subject: 'Physics', tone: 'mint' },
  { id: 'krebs-cycle', title: 'Krebs Cycle', subject: 'Biology', tone: 'rose' },
  { id: 'sql-joins', title: 'SQL Joins', subject: 'DBMS', tone: 'sand' },
  { id: 'thermodynamics', title: 'Thermodynamics', subject: 'Physics', tone: 'blue' },
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

const toneColors = {
  gold: 'bg-[#d1b98a]',
  sand: 'bg-[#cbb58e]',
  rose: 'bg-[#c48e9a]',
  blue: 'bg-[#8aa7d9]',
  mint: 'bg-[#86c4b5]',
}

const PreviewsPage = () => {
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
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
              20 credits
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold">
              S
            </div>
          </div>
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
            <button className="rounded-full bg-[#1b1b1b] px-4 py-2 text-xs font-semibold text-white">
              Generate now
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {previewCards.map((note) => (
            <div key={note.id} className="rounded-2xl border border-[#e2dbd2] bg-white p-4">
              <div className="rounded-xl border border-[#ece5db] bg-[#fbfaf7] p-4">
                <div className={`h-1.5 w-4/5 rounded-full ${toneColors[note.tone]}`} />
                <div className={`mt-2 h-1.5 w-3/4 rounded-full ${toneColors[note.tone]}`} />
                <div className={`mt-2 h-1.5 w-2/3 rounded-full ${toneColors[note.tone]}`} />
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
