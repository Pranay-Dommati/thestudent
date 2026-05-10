import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'

const parseTopics = (text) => {
  if (!text) return []
  return text
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const chunkTopics = (items, size) => {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const GeneratePage = () => {
  const { user, logout, isLoggedIn } = useAuth()
  const [mode, setMode] = useState('manual')
  const [topics, setTopics] = useState(["Dijkstra's Algorithm"])
  const [newTopic, setNewTopic] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)

  const detectedTopics = useMemo(() => parseTopics(pasteText), [pasteText])
  const pageGroups = useMemo(() => {
    const source = mode === 'paste' ? detectedTopics : topics
    return chunkTopics(source, 3).map((group, index) => ({
      id: `page-${index + 1}`,
      title: group[0] || `Page ${index + 1}`,
      tags: group,
    }))
  }, [mode, detectedTopics, topics])

  useEffect(() => {
    if (!isOrganizing) return
    const timeout = setTimeout(() => {
      setIsOrganizing(false)
      setIsOrganized(true)
    }, 1200)
    return () => clearTimeout(timeout)
  }, [isOrganizing])

  useEffect(() => {
    setIsOrganized(false)
    setIsOrganizing(false)
  }, [pasteText, mode])

  const handleAddTopic = () => {
    const trimmed = newTopic.trim()
    if (!trimmed) return
    setTopics((prev) => [...prev, trimmed])
    setNewTopic('')
  }

  const handleTopicChange = (value, index) => {
    setTopics((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Scrib</p>
              <p className="text-xs text-[#7b756d]">Generate</p>
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-[#e2dbd2] bg-white">
          <div className="border-b border-[#eee6dc] px-6 py-4">
            <h1 className="text-lg font-semibold">Generate handwritten notes</h1>
            <p className="text-sm text-[#7b756d]">
              Type topics one by one, or paste your full syllabus - AI will organise it.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setMode('manual')}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  mode === 'manual'
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#3f3a35]'
                }`}
              >
                Add topics
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  mode === 'paste'
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#3f3a35]'
                }`}
              >
                Paste syllabus
              </button>
            </div>

            {mode === 'manual' ? (
              <div className="mt-4 rounded-xl border border-[#ded6cc]">
                {topics.map((topic, index) => (
                  <div key={`${topic}-${index}`} className="flex items-center gap-3 border-b border-[#efe7dd] px-4 py-3 last:border-b-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d9d1c7] text-xs text-[#6b655d]">
                      {index + 1}
                    </span>
                    <input
                      className="w-full border-none bg-transparent text-sm outline-none"
                      value={topic}
                      onChange={(event) => handleTopicChange(event.target.value, index)}
                    />
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3 border-t border-[#efe7dd] px-4 py-3">
                  <span className="text-base">+</span>
                  <input
                    className="flex-1 border-none bg-transparent text-xs outline-none"
                    placeholder="Add another topic for a multi-page PDF"
                    value={newTopic}
                    onChange={(event) => setNewTopic(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddTopic()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTopic}
                    className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold text-[#5a554f]"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[#ded6cc] bg-[#faf8f3] p-4">
                <textarea
                  className="min-h-[120px] w-full resize-none border-none bg-transparent text-sm outline-none"
                  placeholder="Paste your syllabus here"
                  value={pasteText}
                  onChange={(event) => setPasteText(event.target.value)}
                />
                {!pasteText ? (
                  <div className="mt-4 text-xs text-[#8a847c]">
                    <p className="font-semibold text-[#7b756d]">Examples:</p>
                    <ul className="mt-2 space-y-1">
                      <li>Unit 1: Cloud Computing, Virtualization, IaaS, PaaS</li>
                      <li>Chapter 3 - Sorting: Bubble Sort, Merge Sort, Quick Sort</li>
                      <li>Krebs Cycle, Photosynthesis, Cell Division</li>
                      <li>Or just a messy list - AI will figure it out</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {mode === 'manual' ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#efe7dd] bg-[#faf8f3] px-4 py-2 text-xs text-[#6f6a63]">
                  <span className="text-base">&#128269;</span>
                  Checking preview library...{' '}
                  <span className="font-semibold text-[#8c6b2d]">Not found</span> - will generate
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#6f6a63]">
                  <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                  Output: <span className="font-semibold text-[#1f1f1f]">1 image</span> - PNG - 1 credit
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#2b7a4b]">
                  {detectedTopics.length ? `${detectedTopics.length} topics detected` : 'Paste topics to see cost'}
                  {detectedTopics.length ? ' across units' : ''}
                </span>
                <button
                  onClick={() => setIsOrganizing(true)}
                  disabled={!detectedTopics.length || isOrganizing}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    !detectedTopics.length || isOrganizing
                      ? 'border border-[#e2dbd2] bg-[#f2f0ea] text-[#b1aaa0]'
                      : 'bg-[#1f1f1f] text-white'
                  }`}
                >
                  Organise with AI
                </button>
              </div>
            )}

            {mode === 'paste' && isOrganizing ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#7b756d]">
                <span className="h-4 w-4 rounded-full border border-[#cfc7bd]" /> AI is reading your syllabus...
              </div>
            ) : null}

            {mode === 'paste' && isOrganized ? (
              <div className="mt-6 rounded-xl border border-[#e8e0d6] bg-[#fbfaf7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-[#2b7a4b]">
                    {detectedTopics.length} topics organised into {pageGroups.length} pages
                    <span className="ml-2 rounded-full bg-[#eef1ff] px-2 py-0.5 text-[10px] font-semibold text-[#4c5ea5]">AI</span>
                  </div>
                  <button
                    onClick={() => setIsOrganized(false)}
                    className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold text-[#5a554f]"
                  >
                    Edit paste
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {pageGroups.map((page) => (
                    <div key={page.id} className="rounded-xl border border-[#e8e0d6] bg-white px-4 py-3">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>
                          <span className="mr-2 rounded-full bg-[#e8eefb] px-2 py-1 text-[10px] font-semibold text-[#4a6aa6]">Page</span>
                          {page.title}
                        </span>
                        <span className="text-xs text-[#9a9289]">Split</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {page.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#e0d9ce] bg-white px-3 py-1 text-[11px] text-[#5a554f]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee6dc] bg-[#f7f4ee] px-6 py-4">
            <div>
              <p className="text-sm font-semibold">
                {mode === 'paste' && isOrganized ? `${pageGroups.length} credits` : '1 credit'}
              </p>
              <p className="text-xs text-[#7b756d]">
                20 credits remaining{' '}
                <span className="ml-2 rounded-full bg-[#f2e6c9] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a26]">
                  {mode === 'paste' && isOrganized ? `${20 - pageGroups.length} after` : '19 after'}
                </span>
              </p>
            </div>
            <button
              className={`rounded-xl px-5 py-2 text-xs font-semibold ${
                mode === 'paste' && !isOrganized
                  ? 'bg-[#e7e2db] text-[#b1aaa0]'
                  : 'bg-[#1b1b1b] text-white'
              }`}
            >
              {mode === 'paste' && isOrganized ? 'Generate PDF' : 'Generate note'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GeneratePage
