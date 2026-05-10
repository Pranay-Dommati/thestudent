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
  const [topics, setTopics] = useState(["Dijkstra's Algorithm"])
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
  const [dragIndex, setDragIndex] = useState(null)
  const [dragGroup, setDragGroup] = useState(null)
  const location = useLocation()

  const detectedTopics = useMemo(() => parseTopics(pasteText), [pasteText])
  const pageGroups = useMemo(() => {
    if (isOrganized && aiGroups.length) {
      return aiGroups.map((group, index) => ({
        id: `page-${index + 1}`,
        title: group.title || `Page ${index + 1}`,
        tags: group.topics || [],
      }))
    }
    const source = mode === 'paste' ? detectedTopics : topics
    return chunkTopics(source, 3).map((group, index) => ({
      id: `page-${index + 1}`,
      title: group[0] || `Page ${index + 1}`,
      tags: group,
    }))
  }, [mode, detectedTopics, topics, isOrganized, aiGroups])

  useEffect(() => {
    setIsOrganized(false)
    setIsOrganizing(false)
    setAiGroups([])
    setAiMeta(null)
  }, [pasteText, mode])

  useEffect(() => {
    if (mode !== 'manual') return
    setIsOrganized(false)
    setAiGroups([])
    setAiMeta(null)
  }, [topics, mode])

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

  const handleDragStart = (index) => (event) => {
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
  }

  const handleTopicDrop = (event) => {
    event.preventDefault()
    const data = event.dataTransfer.getData('text/plain')
    const fromIndex = Number.parseInt(data, 10)
    const row = event.target.closest('[data-topic-index]')
    const toIndex = row ? Number.parseInt(row.dataset.topicIndex, 10) : null
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) {
      setDragIndex(null)
      return
    }
    setTopics((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  const handleGroupDragStart = (groupIndex, topicIndex) => (event) => {
    setDragGroup({ groupIndex, topicIndex })
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${groupIndex}:${topicIndex}`)
  }

  const handleGroupDrop = (event) => {
    event.preventDefault()
    const data = event.dataTransfer.getData('text/plain')
    if (!data || !data.includes(':')) {
      setDragGroup(null)
      return
    }
    const [fromGroupRaw, fromIndexRaw] = data.split(':')
    const fromGroup = Number.parseInt(fromGroupRaw, 10)
    const fromIndex = Number.parseInt(fromIndexRaw, 10)
    const target = event.target.closest('[data-group-index][data-tag-index]')
    if (!target) {
      setDragGroup(null)
      return
    }
    const toGroup = Number.parseInt(target.dataset.groupIndex, 10)
    const toIndex = Number.parseInt(target.dataset.tagIndex, 10)
    if (!Number.isInteger(fromGroup) || !Number.isInteger(fromIndex) || !Number.isInteger(toGroup) || !Number.isInteger(toIndex)) {
      setDragGroup(null)
      return
    }
    if (fromGroup !== toGroup || fromIndex === toIndex) {
      setDragGroup(null)
      return
    }

    setAiGroups((prev) => {
      const next = [...prev]
      const group = { ...next[toGroup] }
      const topics = [...(group.topics || [])]
      const [moved] = topics.splice(fromIndex, 1)
      topics.splice(toIndex, 0, moved)
      group.topics = topics
      next[toGroup] = group
      return next
    })
    setDragGroup(null)
  }

  const handleOrganize = async () => {
    const source = mode === 'paste' ? detectedTopics : topics
    const cleaned = source.map((item) => item.trim()).filter(Boolean)
    if (cleaned.length < 2) {
      customToast.error('Add at least two topics to organize.')
      return
    }

    setIsOrganizing(true)
    setIsOrganized(false)
    setAiGroups([])
    setAiMeta(null)

    try {
      const response = await axiosInstance.post('/scrib/organize-topics/', { topics: cleaned })
      const data = response.data || {}
      const groups = Array.isArray(data.groups) ? data.groups : []
      if (!groups.length) {
        throw new Error('AI grouping returned no pages')
      }
      setAiGroups(groups)
      setAiMeta(data.credit_savings || null)
      setIsOrganized(true)
      customToast.success('Topics organized into pages!')
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to organize topics right now.'
      customToast.error(message, { id: 'organize-error' })
    } finally {
      setIsOrganizing(false)
    }
  }

  const baseTopics = useMemo(
    () => (mode === 'paste' ? detectedTopics : topics).map((item) => item.trim()).filter(Boolean),
    [mode, detectedTopics, topics],
  )
  const isMultiTopic = baseTopics.length > 1

  useEffect(() => {
    if (!isMultiTopic) return
    const timeout = setTimeout(() => {
      if (!isOrganizing) {
        handleOrganize()
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [isMultiTopic, baseTopics, mode])

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

    if (isPdfMode && !isOrganized) {
      customToast.error('Organise your topics before generating.')
      return
    }

    setIsGenerating(true)
    setGeneratedNote(null)
    setGeneratedPack(null)
    setGenerationNotice('')

    try {
      if (isPdfMode) {
        const payload = { title: 'Study Pack', pages: pageGroups.map((group) => group.tags) }

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
              <div className="mt-4 rounded-xl border border-[#ded6cc]" onDragOver={handleDragOver} onDrop={handleTopicDrop}>
                {topics.map((topic, index) => (
                  <div
                    key={`${topic}-${index}`}
                    className="flex items-center gap-3 border-b border-[#efe7dd] px-4 py-3 last:border-b-0"
                    onDragEnter={handleDragEnter}
                    data-topic-index={index}
                    draggable
                    onDragStart={handleDragStart(index)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d9d1c7] text-xs text-[#6b655d]">
                      {index + 1}
                    </span>
                    <input
                      className="w-full border-none bg-transparent text-sm outline-none"
                      value={topic}
                      onChange={(event) => handleTopicChange(event.target.value, index)}
                    />
                    <span className="grid grid-cols-2 gap-0.5 text-[#b9b1a7] cursor-grab">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[#6f6a63]">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                      Output:{' '}
                      <span className="font-semibold text-[#1f1f1f]">
                        {isMultiTopic ? `PDF - ${pageGroups.length} pages` : '1 image'}
                      </span>
                      {isMultiTopic ? null : ' - PNG - 1 credit'}
                    </span>
                    {isMultiTopic ? (
                      <span className="text-[#7b756d]">AI will group topics into pages</span>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#2b7a4b]">
                  {detectedTopics.length ? `${detectedTopics.length} topics detected` : 'Paste topics to see cost'}
                  {detectedTopics.length ? ' across units' : ''}
                </span>
              </div>
            )}

            {isOrganizing ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#7b756d]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cfc7bd] border-t-[#6f6a63]" />
                AI is reading your syllabus...
              </div>
            ) : null}

            {isOrganized ? (
              <div className="mt-6 rounded-xl border border-[#e8e0d6] bg-[#fbfaf7]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#efe7dd] px-4 py-3 text-xs">
                  <div className="text-[#2b7a4b]">
                    {baseTopics.length} topics organized into {pageGroups.length} pages
                    <span className="ml-2 rounded-full bg-[#eef1ff] px-2 py-0.5 text-[10px] font-semibold text-[#4c5ea5]">AI</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsOrganized(false)
                      setAiGroups([])
                      setAiMeta(null)
                    }}
                    className="text-xs font-semibold text-[#4a6aa6]"
                  >
                    Edit
                  </button>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9289]">
                    <span>AI page grouping</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {pageGroups.map((page, index) => (
                      <div key={page.id} className="rounded-xl border border-[#e8e0d6] bg-white">
                        <div className="flex items-center justify-between border-b border-[#f1e9df] px-4 py-2 text-sm font-semibold">
                          <span className="flex items-center gap-2">
                            <span className="rounded-full bg-[#e8eefb] px-2 py-1 text-[10px] font-semibold text-[#4a6aa6]">
                              Page {index + 1}
                            </span>
                            {page.title}
                          </span>
                        </div>
                        <div className="px-4 py-3">
                          <div className="flex flex-wrap gap-2" onDragOver={handleDragOver} onDrop={handleGroupDrop}>
                            {page.tags.map((tag, tagIndex) => (
                              <span
                                key={`${tag}-${tagIndex}`}
                                className="inline-flex items-center gap-2 rounded-full border border-[#e0d9ce] bg-white px-3 py-1 text-[11px] text-[#5a554f]"
                                data-group-index={index}
                                data-tag-index={tagIndex}
                                draggable
                                onDragStart={handleGroupDragStart(index, tagIndex)}
                                onDragEnd={() => setDragGroup(null)}
                              >
                                <span className="grid grid-cols-2 gap-0.5 text-[#c3bbb1]">
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                </span>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eee6dc] bg-[#f7f4ee] px-6 py-4">
            <div>
              <p className="text-sm font-semibold">
                {isMultiTopic ? `${pageGroups.length} credits` : '1 credit'}
              </p>
              <p className="text-xs text-[#7b756d]">
                {isLoggedIn ? (
                  <>
                    {creditBalance} credits remaining{' '}
                    <span className="ml-2 rounded-full bg-[#f2e6c9] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a26]">
                      {isMultiTopic
                        ? `${Math.max(creditBalance - pageGroups.length, 0)} after`
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
              disabled={isGenerating || !isLoggedIn || (isMultiTopic && !isOrganized)}
              className={`rounded-xl px-5 py-2 text-xs font-semibold ${
                isGenerating || !isLoggedIn || (isMultiTopic && !isOrganized)
                  ? 'bg-[#e7e2db] text-[#b1aaa0]'
                  : 'bg-[#1b1b1b] text-white'
              }`}
            >
              {isGenerating
                ? 'Generating...'
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
