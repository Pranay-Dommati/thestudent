import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'
import { forceDownload } from './utils/download'

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
  const navigate = useNavigate()
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
  const [activeTab, setActiveTab] = useState('generate')
  const [historyItems, setHistoryItems] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const location = useLocation()

  const loadHistory = async () => {
    if (!isLoggedIn) return
    setIsLoadingHistory(true)
    try {
      const [notesRes, packsRes] = await Promise.all([
        axiosInstance.get('/scrib/my-notes/'),
        axiosInstance.get('/scrib/my-study-packs/')
      ])
      
      const notes = (notesRes.data || []).map(item => ({
        ...item,
        type: 'note',
        name: item.prompt || 'Note'
      }))
      const packs = (packsRes.data || []).map(item => ({
        ...item,
        type: 'pack',
        name: item.title || 'Study Pack'
      }))
      
      const combined = [...notes, ...packs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )

      setHistoryItems(prev => {
        const pendingItems = prev.filter(item => item._isPending)
        return [...pendingItems, ...combined]
      })
    } catch (err) {
      console.error(err)
      customToast.error('Failed to load history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // ── Share helper ────────────────────────────────────────────────────────
  const handleShareOption = async (option, item, isPack, url, titleStr) => {
    setOpenDropdownId(null)

    // Always get a fresh presigned URL for packs so links don't expire
    let freshUrl = url
    if (isPack && item.id && !String(item.id).startsWith('pending-')) {
      try {
        const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
          maxRedirects: 0,
          validateStatus: (s) => s < 400,
        })
        freshUrl = res.request?.responseURL || url
      } catch (err) {
        console.error('Failed to get fresh PDF URL for share', err)
      }
    }

    if (option === 'copy') {
      if (!freshUrl) return
      try {
        await navigator.clipboard.writeText(freshUrl)
        customToast.success('Link copied to clipboard!')
      } catch {
        customToast.error('Failed to copy link')
      }
    } else if (option === 'share') {
      if (!freshUrl) return
      if (navigator.share) {
        try {
          // Prefer sharing the actual PDF file so recipient can open it in any app
          const response = await fetch(freshUrl)
          const blob = await response.blob()
          const file = new File([blob], `${titleStr}.pdf`, { type: 'application/pdf' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: titleStr })
          } else {
            await navigator.share({ url: freshUrl, title: titleStr })
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            // Fallback: copy link
            await navigator.clipboard.writeText(freshUrl)
            customToast.success('Link copied! Share it manually.')
          }
        }
      } else {
        // Desktop browsers without Web Share API — just copy
        await navigator.clipboard.writeText(freshUrl)
        customToast.success('Link copied to clipboard!')
      }
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, isLoggedIn])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state])


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

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      customToast.error('Please log in to generate notes.', { id: 'gen-login' })
      return
    }

    if (isGenerating) return

    const sourceTopics = mode === 'paste' ? detectedTopics : topics
    const cleanedTopics = sourceTopics.map((item) => item.trim()).filter(Boolean)

    if (!cleanedTopics.length) {
      customToast.error('Add at least one topic to generate a note.')
      return
    }

    setIsGenerating(true)
    setGeneratedNote(null)
    setGeneratedPack(null)
    setGenerationNotice('')
    setImageLoaded(false)

    const packTitle = cleanedTopics.length === 1 
      ? cleanedTopics[0] 
      : `${cleanedTopics[0]} +${cleanedTopics.length - 1}`

    // Switch to history tab immediately and add a pending item
    setActiveTab('history')
    const tempId = `pending-${Date.now()}`
    const tempItem = {
      id: tempId,
      type: 'pack',
      name: packTitle,
      created_at: new Date().toISOString(),
      status: 'pending',
      total_pages: cleanedTopics.length,
      credits_used: cleanedTopics.length,
      _displayDate: 'Generating...',
      _isPending: true
    }
    setHistoryItems((prev) => [tempItem, ...prev])

    try {
      // One topic per page
      const pages = cleanedTopics.map(topic => [topic])
      const payload = { title: packTitle, pages }

      const response = await axiosInstance.post('/scrib/generate-study-pack/', payload)
      const data = response.data || {}
      setGeneratedPack({
        title: data.title || payload.title,
        pdfUrl: data.pdf_url,
        totalPages: data.total_pages ?? cleanedTopics.length,
      })
      if (typeof data.credit_balance === 'number') {
        setLatestCreditBalance(data.credit_balance)
      }
      customToast.success(cleanedTopics.length === 1 ? 'PDF generated successfully!' : 'Study pack ready!')
      setHistoryItems(prev => prev.filter(item => item.id !== tempId))
      loadHistory() // Refresh history to get the real item
    } catch (error) {
      // Remove the pending item if request fails
      setHistoryItems(prev => prev.filter(item => item.id !== tempId))
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
              <Link to="/dashboard" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3]">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3]"
              >
                Log out
              </button>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {creditBalance} credits
              </span>
              <Link
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold transition-colors hover:bg-[#f5f2ec]"
                title="Profile"
              >
                {getInitials(user?.full_name)}
              </Link>
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
        <div className="mb-6 flex space-x-6 border-b border-[#e2dbd2]">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'generate'
                ? 'border-b-2 border-[#1f1f1f] text-[#1f1f1f]'
                : 'text-[#8c857e] hover:text-[#1f1f1f]'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-[#1f1f1f] text-[#1f1f1f]'
                : 'text-[#8c857e] hover:text-[#1f1f1f]'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'generate' && (
          <>
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
                        PDF - {baseTopics.length} page{baseTopics.length !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : null}

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee6dc] bg-[#f7f4ee] px-6 py-4">
            <div>
              <p className="text-sm font-semibold">
                {baseTopics.length} credit{baseTopics.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#7b756d]">
                {isLoggedIn ? (
                  <>
                    {creditBalance} credits remaining{' '}
                    <span className="ml-2 rounded-full bg-[#f2e6c9] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a26]">
                      {Math.max(creditBalance - baseTopics.length, 0)} after
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
                    : 'Generate PDF'}
            </button>
          </div>
        </div>
        </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {isLoadingHistory && historyItems.filter(i => i._isPending).length === 0 ? (
              <p className="text-sm text-[#7b756d]">Loading history...</p>
            ) : historyItems.length === 0 ? (
              <p className="text-sm text-[#7b756d]">No history yet. Generate some notes first!</p>
            ) : (
              historyItems.map((item) => {
                const isPack = item.type === 'pack'
                const url = isPack ? item.pdfUrl || item.pdf_url : item.imageUrl || item.image_url
                const id = `${item.type}-${item.id}`
                const pages = item.total_pages || item.page_count || (isPack ? 3 : 1)
                const credits = item.credits_used || pages
                const titleStr = isPack ? `${item.name} — ${pages} pages` : item.name
                const dateStr = item._displayDate || new Date(item.created_at).toLocaleDateString()

                const openViewer = async () => {
                  if (item._isPending) return

                  let resolvedUrl = url

                  // For packs: always fetch a fresh presigned URL from the backend
                  // so it never expires, regardless of when the pack was created.
                  if (isPack && item.id && !String(item.id).startsWith('pending-')) {
                    try {
                      const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
                        maxRedirects: 0,
                        validateStatus: (s) => s < 400,
                      })
                      // The view returns a 302 redirect; axios follows it by default and
                      // ends up at the presigned URL. We use the final URL via res.request.
                      resolvedUrl = res.request?.responseURL || url
                    } catch (err) {
                      console.error('Failed to get fresh PDF URL', err)
                      // fall back to stored url
                    }
                  }

                  if (!resolvedUrl) return
                  const topicsArr = Array.isArray(item.topics_json)
                    ? item.topics_json.map(t => Array.isArray(t) ? t.join(', ') : t)
                    : Array.from({ length: pages }, (_, i) => `Page ${i + 1}`)
                  navigate('/view', {
                    state: {
                      pdfUrl: resolvedUrl,
                      title: item.name || titleStr,
                      topics: topicsArr,
                      totalPages: pages,
                      isPack: true,
                    }
                  })
                }

                return (
                  <div key={id} className="flex items-center justify-between rounded-xl border border-[#e2dbd2] bg-[#fbfaf7] px-4 py-3">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={openViewer}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white shadow-sm">
                        {item._isPending ? (
                           <svg className="animate-spin text-[#a39b92]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                           </svg>
                        ) : isPack ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="8" y1="13" x2="16" y2="13"></line>
                            <line x1="8" y1="17" x2="16" y2="17"></line>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="8" y1="13" x2="16" y2="13"></line>
                            <line x1="8" y1="17" x2="16" y2="17"></line>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1f1f1f]">{titleStr}</h3>
                        <p className="mt-0.5 text-xs text-[#7b756d]">
                          {dateStr} • {isPack ? 'PDF' : 'Image'} • {credits} credit{credits > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isPack ? 'bg-[#f0f0ff] text-[#6366f1]' : 'bg-[#ecfdf5] text-[#10b981]'}`}>
                        {isPack ? 'PDF' : 'Image'}
                      </span>
                      {item._isPending ? (
                        <div className="text-xs font-medium text-[#7b756d] italic px-2">Generating...</div>
                      ) : (
                        <>
                          <button onClick={openViewer} className="flex items-center gap-1.5 rounded-lg border border-[#e2dbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Open
                          </button>
                          <button onClick={(e) => forceDownload(url, titleStr, isPack)} className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee] ${!url && 'pointer-events-none opacity-50'}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          </button>
                          <div className="relative dropdown-container">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === `share-${id}` ? null : `share-${id}`)}
                              disabled={!url}
                              title="Share options"
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee] disabled:opacity-50`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            </button>
                            {openDropdownId === `share-${id}` && (
                              <div className="absolute bottom-full right-0 mb-2 z-50 min-w-[168px] rounded-xl border border-[#e2dbd2] bg-white shadow-xl overflow-hidden">
                                <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#a39b92]">Share options</p>
                                <button
                                  onClick={() => handleShareOption('copy', item, isPack, url, titleStr)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  Copy link
                                </button>
                                <button
                                  onClick={() => handleShareOption('share', item, isPack, url, titleStr)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 pb-2.5 text-xs font-medium text-left text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors border-t border-[#f0ede7]"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                  Share file
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default GeneratePage
