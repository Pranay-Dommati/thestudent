import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'

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
  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)
  const [aiGroups, setAiGroups] = useState([])
  const [aiMeta, setAiMeta] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [latestCreditBalance, setLatestCreditBalance] = useState(null)
  const [generatedNote, setGeneratedNote] = useState(null)
  const [generatedPack, setGeneratedPack] = useState(null)
  const [generationNotice, setGenerationNotice] = useState('')
  const [dragGroup, setDragGroup] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [addingToGroupIndex, setAddingToGroupIndex] = useState(null)
  const [newGroupTopic, setNewGroupTopic] = useState('')
  const [aiGeneratedWarning, setAiGeneratedWarning] = useState(false)
  const location = useLocation()

  const detectedTopics = useMemo(() => parseTopics(pasteText), [pasteText])

  const handleOrganizeTopics = async () => {
    const trimmed = pasteText.trim()
    if (!trimmed) {
      customToast.error('Please paste some syllabus text first.')
      return
    }

    setIsOrganizing(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini API key not found in environment variables')

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract all specific study topics from the following syllabus. Rules:\n1. Make each topic standalone and understandable out of context. If it's a sub-topic, prepend its parent category (e.g., 'Testing Strategies: Strategic issues', 'Testing: Testing Concepts').\n2. Do NOT exclude sub-topics. For example, in 'Testing Strategies: A Strategic approach to software testing', the topic is 'Testing Strategies: A Strategic approach to software testing'.\n3. Return ONLY a valid JSON array of strings, and nothing else. No markdown or code block tags.\n\nSyllabus:\n${trimmed}`
            }]
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Gemini API Error Response:', response.status, errorData)
        throw new Error('Failed to parse syllabus with AI')
      }
      
      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const jsonMatch = content.match(/\[.*\]/s)
      let parsedTopics = []
      
      try {
        parsedTopics = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
      } catch (err) {
        throw new Error('AI did not return valid JSON')
      }

      if (!Array.isArray(parsedTopics) || !parsedTopics.length) {
         throw new Error('AI returned an empty or invalid array')
      }

      setTopics(parsedTopics)
      setMode('manual')
      setPasteText('')
      setAiGeneratedWarning(true)
      customToast.success('Topics organized successfully!')
    } catch (error) {
      console.error(error)
      customToast.error('Failed to organize topics using AI. Please try again.')
    } finally {
      setIsOrganizing(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const incoming = params.get('topic')
    if (!incoming) return
    const parsed = parseTopics(incoming)
    if (parsed.length) {
      setMode('manual')
      setTopics(parsed)
    }
  }, [location.search])

  const handleAddTopic = () => {
    const trimmed = newTopic.trim()
    if (!trimmed) return
    setTopics((prev) => [...prev, trimmed])
    setNewTopic('')
  }

  const handleTopicChange = (value, index) => {
    setTopics((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  const handleRemoveTopic = (index) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleEditTopic = (event) => {
    const row = event.currentTarget.closest('[data-topic-row]')
    const input = row ? row.querySelector('input') : null
    const index = row ? Number.parseInt(row.dataset.topicIndex, 10) : null
    if (Number.isInteger(index)) {
      setEditingIndex(index)
    }
    if (input) {
      input.focus()
      input.select()
    }
  }

  const baseTopics = useMemo(
    () => (mode === 'paste' ? detectedTopics : topics).map((item) => item.trim()).filter(Boolean),
    [mode, detectedTopics, topics],
  )
  const isMultiTopic = baseTopics.length > 1

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      customToast.error('Please log in to generate notes.', { id: 'gen-login' })
      return
    }

    if (isGenerating) return

    const sourceTopics = mode === 'paste' ? detectedTopics : topics
    const cleanedTopics = sourceTopics.map((item) => item.trim()).filter(Boolean)
    const isPdfMode = cleanedTopics.length > 1

    if (!cleanedTopics.length) {
      customToast.error('Add at least one topic to generate a note.')
      return
    }

    setIsGenerating(true)
    setGeneratedNote(null)
    setGeneratedPack(null)
    setGenerationNotice('')

    try {
      if (isPdfMode) {
        // One topic per page
        const pages = cleanedTopics.map(topic => [topic])
        const payload = { title: 'Study Pack', pages }

        const response = await axiosInstance.post('/scrib/generate-study-pack/', payload)
        const data = response.data || {}
        setGeneratedPack({
          title: data.title || 'Study Pack',
          pdfUrl: data.pdf_url,
          totalPages: data.total_pages ?? cleanedTopics.length,
        })
        if (typeof data.credit_balance === 'number') {
          setLatestCreditBalance(data.credit_balance)
        }
        customToast.success('Study pack ready!')
      } else {
        const response = await axiosInstance.post('/scrib/generate-note/', {
          topic: cleanedTopics[0],
        })
        const data = response.data || {}
        setGeneratedNote({
          title: cleanedTopics[0],
          imageUrl: data.image_url,
        })
        if (typeof data.credit_balance === 'number') {
          setLatestCreditBalance(data.credit_balance)
        }
        if (data.cache_hit) {
          setGenerationNotice('We found a matching note in the cache, so it was delivered faster.')
        }
        customToast.success('Note generated successfully!')
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Generation failed. Please try again.'
      customToast.error(message, { id: 'gen-error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const creditBalance = latestCreditBalance ?? user?.credit_balance ?? 0

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
                {creditBalance} credits
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
              <>
                <div className="mt-4 rounded-xl border border-[#ded6cc]">
                  {topics.map((topic, index) => (
                    <div
                      key={`topic-${index}`}
                    className="flex items-center gap-3 border-b border-[#efe7dd] px-4 py-3 last:border-b-0"
                    data-topic-row
                    data-topic-index={index}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d9d1c7] text-xs text-[#6b655d]">
                      {index + 1}
                    </span>
                    <input
                      className={`w-full text-sm outline-none ${
                        editingIndex === index
                          ? 'rounded-md border border-[#e0d9ce] bg-white px-2 py-1 text-[#1f1f1f]'
                          : 'border-none bg-transparent text-[#6b655d]'
                      }`}
                      value={topic}
                      onChange={(event) => handleTopicChange(event.target.value, index)}
                      readOnly={editingIndex !== index}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          setEditingIndex(null)
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      {editingIndex === index ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault() // prevent onBlur from firing first
                            setEditingIndex(null)
                          }}
                          className="rounded-full border border-[#1f1f1f] bg-[#1f1f1f] p-1 text-white"
                          aria-label="Save topic"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleEditTopic}
                          className="rounded-full border border-[#e0d9ce] bg-white p-1 text-[#a39b92] transition-colors hover:text-[#1f1f1f]"
                          aria-label="Edit topic"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        className="rounded-full border border-[#e0d9ce] bg-white p-1 text-[#a39b92] transition-colors hover:text-[#dc2626]"
                        aria-label="Remove topic"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </button>
                    </div>
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
              {aiGeneratedWarning && (
                <p className="mt-2 text-xs text-[#8a847c]">AI makes mistakes so recheck once.</p>
              )}
            </>
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
                ) : (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleOrganizeTopics}
                      disabled={isOrganizing}
                      className="rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isOrganizing ? 'Organizing...' : 'Organize topics'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'manual' ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[#6f6a63]">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                      Output:{' '}
                      <span className="font-semibold text-[#1f1f1f]">
                        {isMultiTopic ? `PDF - ${baseTopics.length} pages` : '1 image'}
                      </span>
                      {isMultiTopic ? null : ' - PNG - 1 credit'}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee6dc] bg-[#f7f4ee] px-6 py-4">
            <div>
              <p className="text-sm font-semibold">
                {isMultiTopic ? `${baseTopics.length} credits` : '1 credit'}
              </p>
              <p className="text-xs text-[#7b756d]">
                {isLoggedIn ? (
                  <>
                    {creditBalance} credits remaining{' '}
                    <span className="ml-2 rounded-full bg-[#f2e6c9] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a26]">
                      {isMultiTopic
                        ? `${Math.max(creditBalance - baseTopics.length, 0)} after`
                        : `${Math.max(creditBalance - 1, 0)} after`}
                    </span>
                  </>
                ) : (
                  'Log in to see your credits'
                )}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isLoggedIn || mode === 'paste' || isOrganizing}
              className={`rounded-xl px-5 py-2 text-xs font-semibold ${
                isGenerating || !isLoggedIn || mode === 'paste' || isOrganizing
                  ? 'bg-[#e7e2db] text-[#b1aaa0]'
                  : 'bg-[#1b1b1b] text-white'
              }`}
            >
              {isGenerating
                  ? 'Generating...'
                  : mode === 'paste'
                    ? 'Organize topics first'
                    : isMultiTopic
                      ? 'Generate PDF'
                      : 'Generate note'}
            </button>
          </div>
        </div>

        {generationNotice ? (
          <div className="mt-4 rounded-xl border border-[#e8e0d6] bg-[#fbfaf7] px-5 py-3 text-xs text-[#6f6a63]">
            {generationNotice}
          </div>
        ) : null}

        {generatedNote ? (
          <div className="mt-6 rounded-2xl border border-[#e2dbd2] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Generated note</p>
                <p className="text-xs text-[#7b756d]">{generatedNote.title}</p>
              </div>
              {generatedNote.imageUrl ? (
                <a
                  href={generatedNote.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold"
                >
                  Open image
                </a>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-[#ece5db] bg-[#fbfaf7] p-3">
              {generatedNote.imageUrl ? (
                <img
                  src={generatedNote.imageUrl}
                  alt={generatedNote.title}
                  className="w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-[#e0d9ce] bg-white text-xs text-[#9a9289]">
                  Image will appear here
                </div>
              )}
            </div>
          </div>
        ) : null}

        {generatedPack ? (
          <div className="mt-6 rounded-2xl border border-[#e2dbd2] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Study pack ready</p>
                <p className="text-xs text-[#7b756d]">{generatedPack.totalPages} pages</p>
              </div>
              {generatedPack.pdfUrl ? (
                <a
                  href={generatedPack.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold"
                >
                  Download PDF
                </a>
              ) : null}
            </div>
            <div className="mt-4 rounded-xl border border-[#ece5db] bg-[#fbfaf7] p-4 text-xs text-[#7b756d]">
              {generatedPack.pdfUrl
                ? 'Your study pack is ready to download.'
                : 'PDF link will appear here when ready.'}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default GeneratePage
