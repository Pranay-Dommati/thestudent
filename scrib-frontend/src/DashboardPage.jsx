import { Link } from 'react-router-dom'

const stats = [
  { id: 'credits', label: 'Credits left', value: '4' },
  { id: 'notes', label: 'Notes generated', value: '14' },
  { id: 'pdfs', label: 'PDFs downloaded', value: '6' },
]

const recentItems = [
  { id: 'dijkstra', title: "Dijkstra's Algorithm", meta: 'Today - 1 credit', type: 'Note', tone: 'blue' },
  { id: 'cloud', title: 'Cloud Computing - 3 pages', meta: 'Yesterday - 3 credits', type: 'PDF', tone: 'mint' },
  { id: 'joins', title: 'Normalization + SQL Joins', meta: '3 days ago - 2 credits', type: 'PDF', tone: 'sand' },
]

const toneColors = {
  blue: 'bg-[#7ba7ff]',
  mint: 'bg-[#86c4b5]',
  sand: 'bg-[#d1b98a]',
}

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
          </nav>
          <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
            4 credits
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <h1 className="text-xl font-semibold">Good afternoon, Arjun</h1>
          <p className="text-sm text-[#7b756d]">You have 4 credits remaining.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.id} className="rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9a9289]">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2dbd2] bg-white px-4 py-3">
          <p className="text-sm text-[#6f6a63]">
            Running low? <span className="font-semibold text-[#1f1f1f]">Top up credits</span> - starts at Rs 49 for 10.
          </p>
          <button className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
            + Buy credits
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee6dc] px-4 py-3">
            <p className="text-sm font-semibold">Recent generations</p>
            <button className="text-xs font-semibold text-[#7b756d]">View all</button>
          </div>
          <div className="divide-y divide-[#eee6dc]">
            {recentItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-[#e2dbd2] bg-[#faf8f3] p-2">
                    <div className={`h-1.5 w-10 rounded-full ${toneColors[item.tone]}`} />
                    <div className={`mt-2 h-1.5 w-8 rounded-full ${toneColors[item.tone]}`} />
                    <div className={`mt-2 h-1.5 w-6 rounded-full ${toneColors[item.tone]}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[#7b756d]">{item.meta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#e2dbd2] bg-[#f5f2ec] px-3 py-1 text-[10px] font-semibold text-[#6b655d]">
                    {item.type}
                  </span>
                  <button className="rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs">Download</button>
                  <button className="rounded-lg border border-[#e2dbd2] bg-white px-2 py-1 text-xs">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
