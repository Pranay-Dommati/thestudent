import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'
import { forceDownload } from './utils/download'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'

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
  const [highlightAddBtn, setHighlightAddBtn] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)
  const [aiGroups, setAiGroups] = useState([])
  const [aiMeta, setAiMeta] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [latestCreditBalance, setLatestCreditBalance] = useState(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [processingPack, setProcessingPack] = useState(null)
  
  // Loading states for actions
  const [loadingItemId, setLoadingItemId] = useState(null)
  const [downloadingItemId, setDownloadingItemId] = useState(null)
  
  const [generatedNote, setGeneratedNote] = useState(null)
  const [generatedPack, setGeneratedPack] = useState(null)
  const [generationNotice, setGenerationNotice] = useState('')
  const [dragGroup, setDragGroup] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [invalidTopics, setInvalidTopics] = useState([])
  const [addingToGroupIndex, setAddingToGroupIndex] = useState(null)
  const [newGroupTopic, setNewGroupTopic] = useState('')
  const [aiGeneratedWarning, setAiGeneratedWarning] = useState(false)
  const location = useLocation()
  
  // Initialize tab from URL query parameter
  const initialTab = new URLSearchParams(location.search).get('tab') === 'history' ? 'history' : 'generate'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [historyItems, setHistoryItems] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [shareModalData, setShareModalData] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showNotice, setShowNotice] = useState(true)
  const [hideBanner, setHideBanner] = useState(false)

  // Sync active tab if URL changes
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab === 'history') setActiveTab('history')
    else if (tab === 'generate') setActiveTab('generate')
  }, [location.search])

  // --- Browser Notifications Setup ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const showNotification = (title, options) => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, options)
    }
  }


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

      // The API now returns the real pack (with generating/pending status),
      // so we can safely replace the whole state — no need to keep the temp _isPending item.
      setHistoryItems(combined)
    } catch (err) {
      console.error(err)
      customToast.error('Failed to load history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // ── Share helper ────────────────────────────────────────────────────────
  const handleShareClick = async (item, isPack, url, titleStr) => {
    setOpenDropdownId(null)
    setShareModalData({ title: titleStr, url: 'Generating share link...', isLoading: true })

    // For packs: generate a permanent share token — anyone can open this forever
    if (isPack && item.id && !String(item.id).startsWith('pending-')) {
      try {
        // If the pack already has a share_token, use it; otherwise POST to generate one
        let token = item.share_token
        if (!token) {
          const res = await axiosInstance.post(`/scrib/packs/${item.id}/pdf/`)
          token = res.data?.share_token
        }
        if (token) {
          const shareUrl = `${window.location.origin}/view/share/${token}`
          setShareModalData({ title: titleStr, url: shareUrl, isLoading: false })
          return
        }
      } catch (err) {
        console.error('Failed to generate share token', err)
      }
    }

    // Fallback for notes (no share token)
    setShareModalData({ title: titleStr, url: url || window.location.href, isLoading: false })
  }

  const handleDownloadClick = async (item, isPack, storedUrl, titleStr) => {
    if (downloadingItemId === item.id) return
    setDownloadingItemId(item.id)

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    let resolvedUrl = storedUrl

    if (isPack && item.id && !String(item.id).startsWith('pending-')) {
      try {
        const res = await axiosInstance.get(`/scrib/packs/${item.id}/pdf/`, {
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 400
          }
        })
        resolvedUrl = res.headers.location || res.data?.pdf_url || res.request?.responseURL || storedUrl
      } catch (err) {
        customToast.error('Failed to prepare download.')
        setDownloadingItemId(null)
        return
      }
    }

    if (isIOS) {
      // iOS Safari aggressively blocks popups from async callbacks.
      // The most reliable way to show/download a PDF on iOS is navigating to it in the same tab.
      window.location.href = resolvedUrl
    } else {
      await forceDownload(resolvedUrl, titleStr, isPack)
    }
    
    setDownloadingItemId(null)
  }

  const copyShareLink = async () => {
    if (!shareModalData || shareModalData.isLoading) return
    try {
      await navigator.clipboard.writeText(shareModalData.url)
      customToast.success('Link copied to clipboard!')
      setShareModalData(null)
    } catch {
      customToast.error('Failed to copy link')
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && !isGenerating) {
      loadHistory()
    }
  }, [activeTab, isLoggedIn])

  // --- Polling logic for generating packs ---
  useEffect(() => {
    const generatingPacks = historyItems.filter(item => item.type === 'pack' && item.status === 'generating')
    if (generatingPacks.length === 0) return

    const interval = setInterval(() => {
      generatingPacks.forEach(async (pack) => {
        try {
          const res = await axiosInstance.get(`/scrib/packs/${pack.id}/status/`)
          if (res.data && res.data.status === 'ready') {
            // Update the pack in historyItems
            setHistoryItems(prev => prev.map(item => {
              if (item.type === 'pack' && item.id === pack.id) {
                return { ...item, status: 'ready', pdf_url: res.data.pdf_url, s3_key: res.data.s3_key }
              }
              return item
            }))
            
            // Show notifications
            showNotification('Your Scrib notes are ready!', {
              body: `The study pack for ${pack.name || 'your notes'} has finished generating. Click to view.`,
              icon: '/scrib_favicon.svg'
            })
            customToast.success(`Study pack "${pack.name}" is ready!`)
          } else if (res.data && res.data.status === 'failed') {
            // Mark as failed
            setHistoryItems(prev => prev.map(item => {
              if (item.type === 'pack' && item.id === pack.id) {
                return { ...item, status: 'failed' }
              }
              return item
            }))
            customToast.error(`Failed to generate study pack "${pack.name}".`)
          }
        } catch (err) {
          console.error(`Failed to poll status for pack ${pack.id}`, err)
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [historyItems])

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
    setInvalidTopics([])
  }

  const handleTopicChange = (value, index) => {
    setTopics((prev) => prev.map((item, idx) => (idx === index ? value : item)))
    setInvalidTopics([])
  }

  const handleRemoveTopic = (index) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== index))
    setInvalidTopics([])
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
      if (mode === 'manual' && newTopic.trim()) {
        customToast.error('Please click "Add" to confirm your topic first.', { id: 'gen-error' })
        setHighlightAddBtn(true)
        setTimeout(() => setHighlightAddBtn(false), 2000)
      } else {
        customToast.error('Add at least one topic to generate a note.', { id: 'gen-error' })
      }
      return
    }

    setIsGenerating(true)

    // Moderation Check
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a strict content moderator for an educational app. Evaluate the following list of study topics. Return a JSON array of booleans corresponding to each topic. True means it is a valid, acceptable educational or general topic. False means it is highly inappropriate, sexually explicit, pornographic, or hate speech. Return ONLY the JSON array.\n\nTopics:\n${JSON.stringify(cleanedTopics)}`
              }]
            }]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const finishReason = data.candidates?.[0]?.finishReason
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

          if (finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'OTHER') {
            if (mode === 'paste') {
              setTopics(cleanedTopics)
              setMode('manual')
            }
            setInvalidTopics(cleanedTopics)
            customToast.error('Please enter appropriate educational topics.', { id: 'gen-error' })
            setIsGenerating(false)
            return
          }

          const jsonMatch = content.match(/\[.*\]/s)
          let validityArray = []
          try {
            validityArray = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
          } catch (err) {}

          if (Array.isArray(validityArray) && validityArray.length === cleanedTopics.length) {
            const badTopics = cleanedTopics.filter((_, idx) => validityArray[idx] === false)
            if (badTopics.length > 0) {
              if (mode === 'paste') {
                setTopics(cleanedTopics)
                setMode('manual')
              }
              setInvalidTopics(badTopics)
              customToast.error('Please enter appropriate educational topics.', { id: 'gen-error' })
              setIsGenerating(false)
              return
            }
          } else {
             if (mode === 'paste') {
               setTopics(cleanedTopics)
               setMode('manual')
             }
             setInvalidTopics(cleanedTopics)
             customToast.error('Please enter appropriate educational topics.', { id: 'gen-error' })
             setIsGenerating(false)
             return
          }
        } else if (response.status === 400) {
           if (mode === 'paste') {
             setTopics(cleanedTopics)
             setMode('manual')
           }
           setInvalidTopics(cleanedTopics)
           customToast.error('Please enter appropriate educational topics.', { id: 'gen-error' })
           setIsGenerating(false)
           return
        }
      }
    } catch (err) {
      console.error('Moderation check failed', err)
    }

    setGeneratedNote(null)
    setGeneratedPack(null)
    setGenerationNotice('')
    setImageLoaded(false)

    const packTitle = cleanedTopics.length === 1 
      ? cleanedTopics[0] 
      : `${cleanedTopics[0]} +${cleanedTopics.length - 1}`

    const creditsNeeded = cleanedTopics.length
    const currentCredits = latestCreditBalance ?? user?.credit_balance ?? 0

    if (currentCredits < creditsNeeded) {
      customToast.error('Please add credits first to generate this note.', { id: 'gen-error' })
      navigate('/pricing')
      return
    }

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
      
      // Request notification permission if they haven't yet
      requestNotificationPermission()

      const response = await axiosInstance.post('/scrib/generate-study-pack/', payload)
      const data = response.data || {}
      
      if (typeof data.credit_balance === 'number') {
        setLatestCreditBalance(data.credit_balance)
      }
      
      // Now it returns 202 Accepted instantly
      customToast.success('Generation started! We will notify you when it is ready.')
      setHideBanner(false)
      // Small delay to ensure the backend has committed the new pack
      // before we refresh the history list
      setTimeout(() => {
        setHistoryItems(prev => prev.filter(item => item.id !== tempId))
        loadHistory()
      }, 800)
    } catch (error) {
      // Remove the pending item if request fails
      setHistoryItems(prev => prev.filter(item => item.id !== tempId))
      setActiveTab('generate') // Switch back to generate tab so they aren't stuck on history
      
      if (error?.response?.status === 402) {
        customToast.error('Please add credits first to generate this note.', { id: 'gen-error' })
        navigate('/pricing')
      } else {
        const message = error?.response?.data?.message || 'Generation failed. Please try again.'
        customToast.error(message, { id: 'gen-error' })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const creditBalance = latestCreditBalance ?? user?.credit_balance ?? 0

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <Helmet>
        <title>Generate Notes - Scrib</title>
        <meta name="description" content="Create custom handwritten notes from your topics or syllabus. Organize and download PDF study packs instantly." />
        <link rel="canonical" href="https://scrib.easylearnova.com/generate" />
      </Helmet>
      <header className="sticky top-0 z-50 border-b border-[#e4ddd4] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-9 w-9 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Generate' },
            ]} />
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex">
                Dashboard
              </Link>
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
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold md:inline-block">
              Log in
              </Link>
              <Link to="/signup" className="hidden rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white md:inline-block">
                Get started free
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 md:px-6 py-4 md:py-10">
        <div className="mb-4 md:mb-6 flex space-x-6 border-b border-[#e2dbd2]">
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
            <div className="md:rounded-2xl md:border md:border-[#e2dbd2] md:bg-white pb-32 md:pb-0">
              <div className="md:border-b md:border-[#eee6dc] md:px-6 md:py-4 px-1 py-2">
                <h1 className="text-2xl md:text-lg font-medium md:font-semibold text-[#1f1f1f]">
                  <span className="md:hidden">Generate notes</span>
                  <span className="hidden md:inline">Generate handwritten notes</span>
                </h1>
                <p className="mt-1 md:mt-0 text-[13px] md:text-sm text-[#8a847c] md:text-[#7b756d] leading-relaxed">
                  <span className="md:hidden">Add topics below — each becomes one handwritten page in the PDF.</span>
                  <span className="hidden md:inline">Type topics one by one, or paste your full syllabus - AI will organise it.</span>
                </p>
                {showNotice && (
                  <div className="mt-4 md:mt-3 flex items-start gap-3 rounded-xl md:rounded-lg bg-white md:bg-[#fcf9f4] border border-[#e2dbd2] p-3.5 md:p-3 text-[13px] md:text-xs text-[#5f5a54] shadow-sm md:shadow-none relative pr-10">
                    <span className="md:hidden text-[#a39b92] mt-0.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </span>
                    <span className="md:hidden">Paste a full syllabus or add topics one by one. AI will organise and format each page.</span>
                    
                    <span className="hidden md:flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#8a847c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      Every topic added becomes a separate page in the PDF and costs 1 credit.
                    </span>
                    <button onClick={() => setShowNotice(false)} className="absolute right-3.5 top-3.5 md:top-3 text-[#a39b92] hover:text-[#1f1f1f]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

          <div className="px-1 py-4 md:px-6 md:py-5">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-6 md:mb-0">
              <button
                onClick={() => setMode('manual')}
                className={`rounded-xl md:rounded-full border px-4 py-3 md:py-2 text-sm md:text-xs font-medium md:font-semibold transition-colors ${
                  mode === 'manual'
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#5f5a54] hover:bg-[#f5f2ec]'
                }`}
              >
                Add topics
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`rounded-xl md:rounded-full border px-4 py-3 md:py-2 text-sm md:text-xs font-medium md:font-semibold transition-colors ${
                  mode === 'paste'
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#5f5a54] hover:bg-[#f5f2ec]'
                }`}
              >
                Paste syllabus
              </button>
            </div>

            {mode === 'manual' ? (
              <>
                <div className="mb-3 md:hidden text-[11px] font-bold tracking-widest text-[#a39b92] uppercase mt-4">
                  TOPICS · {topics.length} ADDED
                </div>
                
                <div className="mt-0 md:mt-4 flex flex-col gap-3 md:gap-0 md:rounded-xl md:border md:border-[#ded6cc]">
                  {topics.map((topic, index) => (
                    <div
                      key={`topic-${index}`}
                      className={`flex items-center gap-3 rounded-xl md:rounded-none border md:border-x-0 md:border-t-0 md:border-b p-3 md:px-4 md:py-3 last:border-b-0 shadow-sm md:shadow-none ${
                        invalidTopics.includes(topic.trim()) 
                          ? 'border-red-500 bg-red-50 md:border-red-500' 
                          : 'border-[#e2dbd2] md:border-[#efe7dd] bg-white md:bg-transparent'
                      }`}
                      data-topic-row
                      data-topic-index={index}
                    >
                      <span className="flex h-7 w-7 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-lg md:rounded-full bg-[#f5f2ec] md:bg-transparent md:border md:border-[#d9d1c7] text-xs font-semibold md:font-medium text-[#8a847c] md:text-[#6b655d]">
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
                            className="p-1 text-[#d9d1c7] md:text-[#a39b92] transition-colors hover:text-[#1f1f1f] md:rounded-full md:border md:border-[#e0d9ce] md:bg-white hidden md:block"
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
                          className="p-1 text-[#a39b92] transition-colors hover:text-[#dc2626] md:rounded-full md:border md:border-[#e0d9ce] md:bg-white"
                          aria-label="Remove topic"
                        >
                          <svg className="md:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <svg className="hidden md:block" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 md:mt-0 flex items-center gap-3 rounded-xl border border-dashed border-[#d9d1c7] md:border-solid md:border-x-0 md:border-b-0 md:border-t md:border-[#efe7dd] bg-white md:bg-transparent px-3 py-3 md:px-4 md:py-3 shadow-sm md:shadow-none">
                    <span className="text-[#a39b92] md:text-[#1f1f1f] text-base font-medium md:font-normal pl-1 pr-1">
                      +
                    </span>
                    
                    <input
                      className="flex-1 bg-transparent py-2 md:p-0 text-sm md:text-xs text-[#1f1f1f] outline-none placeholder:text-[#a39b92]"
                      placeholder={mode === 'manual' && topics.length === 0 ? "Add a topic..." : "Add another topic..."}
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
                      className={`rounded-lg md:rounded-full border px-4 py-2 md:px-3 md:py-1 text-sm md:text-xs font-medium md:font-semibold transition-all duration-300 ${
                        highlightAddBtn 
                          ? 'border-red-500 bg-red-50 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)] scale-110' 
                          : newTopic.trim()
                            ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white md:border-[#d9d1c7] md:bg-white md:text-[#1f1f1f]'
                            : 'border-[#f0ece5] md:border-[#d9d1c7] bg-transparent md:bg-white text-[#cfc7bd] md:text-[#5a554f]'
                      }`}
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
              <div className="mt-4 rounded-xl border border-[#ded6cc] bg-white md:bg-[#faf8f3] p-4 shadow-sm md:shadow-none">
                <textarea
                  className="min-h-[120px] w-full resize-none border-none bg-transparent text-sm outline-none"
                  placeholder="Paste your syllabus here"
                  value={pasteText}
                  onChange={(event) => { setPasteText(event.target.value); setInvalidTopics([]); }}
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
                <div className="mt-3 hidden md:flex flex-wrap items-center justify-between gap-3 text-xs">
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

          <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col md:static md:flex-row md:flex-wrap md:items-center justify-between gap-2 md:gap-4 border-t border-[#e2dbd2] md:border-[#eee6dc] bg-white md:bg-[#f7f4ee] px-5 py-3 md:py-4 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-none">
            {/* Mobile Top Row */}
            {mode !== 'paste' && (
              <div className="flex items-center justify-between md:hidden w-full mb-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#059669]" />
                  <span className="text-sm font-medium text-[#5f5a54]">PDF · <span className="font-bold text-[#1f1f1f]">{baseTopics.length} pages</span></span>
                </div>
                <span className="rounded-full bg-[#fdf2df] border border-[#f3d9a9] px-3 py-1 text-[11px] font-semibold text-[#b47a26]">
                  {baseTopics.length} credits
                </span>
              </div>
            )}

            {/* Desktop Left Side */}
            <div className="hidden md:block">
              {mode !== 'paste' ? (
                <>
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
                      <span className="text-[#a74c4c] font-medium">Sign up to start generating your custom notes!</span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#7b756d]">
                  {isLoggedIn ? `${creditBalance} credits available` : <span className="text-[#a74c4c] font-medium">Sign up to start generating your custom notes!</span>}
                </p>
              )}
            </div>
            
            <button
              onClick={
                !isLoggedIn 
                  ? () => navigate('/login?next=/generate') 
                  : (creditBalance < Math.max(1, baseTopics.length))
                    ? () => navigate('/pricing')
                    : handleGenerate
              }
              disabled={isGenerating || mode === 'paste' || isOrganizing}
              className={`w-full md:w-auto rounded-xl px-5 py-2.5 md:py-2 text-sm md:text-bold font-bold transition-all ${
                isGenerating || mode === 'paste' || isOrganizing
                  ? 'border border-[#f0ece5] bg-transparent text-[#e0d9ce] md:border-none md:bg-[#e7e2db] md:text-[#b1aaa0]'
                  : !isLoggedIn
                    ? 'border border-[#1b1b1b] bg-transparent text-[#1f1f1f] md:border-none md:bg-[#1b1b1b] md:text-white active:bg-[#1f1f1f] active:text-white md:hover:bg-black hover:-translate-y-0.5'
                    : 'border border-[#1b1b1b] bg-transparent text-[#1f1f1f] md:border-none md:bg-[#1b1b1b] md:text-white active:bg-[#1f1f1f] active:text-white md:hover:bg-black'
              }`}
            >
              {isGenerating
                  ? 'Generating...'
                  : mode === 'paste'
                    ? 'Organize topics first'
                    : !isLoggedIn
                      ? 'Sign up to Generate'
                      : (creditBalance < Math.max(1, baseTopics.length))
                        ? 'Add credits to generate'
                        : 'Generate PDF'}
            </button>
            
            <p className="mt-0.5 text-center text-[11px] text-[#a39b92] md:hidden">
               {mode !== 'paste' 
                 ? (isLoggedIn ? `${Math.max(creditBalance - baseTopics.length, 0)} credits remaining after` : 'Sign up to generate notes')
                 : (isLoggedIn ? `${creditBalance} credits available` : 'Sign up to generate notes')}
            </p>
          </div>
        </div>
        </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {!hideBanner && historyItems.some(i => i._isPending || i.status === 'generating' || i.status === 'pending') && (
              <div className="mb-6 rounded-xl border border-[#dbe8c3] bg-[#eef7df] p-4 text-[#557a3f] shadow-sm relative">
                <button onClick={() => setHideBanner(true)} className="absolute right-3 top-3 text-[#557a3f] hover:text-[#3f5c2d] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="flex items-start gap-3 pr-6">
                  <div>
                    <h3 className="text-sm font-bold">Your Scrib is being generated!</h3>
                    <p className="mt-1 text-xs text-[#557a3f]/90 leading-relaxed max-w-2xl">
                      Please feel free to explore the site or come back later. We will send you an email as soon as your handwritten notes are ready.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingHistory && historyItems.filter(i => i._isPending).length === 0 ? (
              <p className="text-sm text-[#7b756d]">Loading history...</p>
            ) : historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e2dbd2] py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f5f1]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a39b92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-bold text-[#1f1f1f]">No Scribs yet</h3>
                <p className="mb-6 max-w-sm text-sm text-[#7b756d]">You haven't generated any handwritten notes yet. Create your first custom Scrib in seconds!</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="rounded-full bg-[#1f1f1f] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                >
                  Create your first Scrib →
                </button>
              </div>
            ) : (
              historyItems.map((item) => {
                const isPack = item.type === 'pack'
                const url = isPack ? item.pdfUrl || item.pdf_url : item.imageUrl || item.image_url
                const id = `${item.type}-${item.id}`
                const pages = item.total_pages || item.page_count || (isPack ? 3 : 1)
                const credits = item.credits_used || pages
                const titleStr = isPack ? `${item.name} — ${pages} pages` : item.name
                const dateStr = item._displayDate || new Date(item.created_at).toLocaleDateString()

                const isGenerating = item.status === 'generating' || item.status === 'pending'
                const isFailed = item.status === 'failed'

                const openViewer = async () => {
                  if (item._isPending || isGenerating || isFailed || loadingItemId === id) return

                  setLoadingItemId(id)
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

                  setLoadingItemId(null)
                  if (!resolvedUrl) return
                  const topicsArr = Array.isArray(item.topics_json)
                    ? item.topics_json.map(t => Array.isArray(t) ? t.join(', ') : t)
                    : Array.from({ length: pages }, (_, i) => `Page ${i + 1}`)
                  const noteSlug = (item.name || 'study-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  navigate(`/view/${noteSlug}`, {
                    state: {
                      pdfUrl: resolvedUrl,
                      title: item.name || titleStr,
                      topics: topicsArr,
                      totalPages: pages,
                      isPack: isPack,
                      packId: isPack ? item.id : null,
                      shareToken: item.share_token || null
                    }
                  })
                }

                return (
                  <div key={id} className="flex flex-col gap-3 rounded-xl border border-[#e2dbd2] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-start gap-3 overflow-hidden cursor-pointer" onClick={openViewer}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white shadow-sm mt-0.5">
                        {item._isPending || isGenerating ? (
                           <svg className="animate-spin text-[#a39b92]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                           </svg>
                        ) : isFailed ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#1f1f1f] line-clamp-1 break-words">{titleStr}</h3>
                          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${isPack ? 'bg-[#f0f0ff] text-[#6366f1]' : 'bg-[#ecfdf5] text-[#10b981]'}`}>
                            {isPack ? 'PDF' : 'Image'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#7b756d]">
                          {dateStr} • {credits} credit{credits > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-shrink-0 items-center justify-end gap-2 sm:w-auto">
                      {item._isPending || isGenerating ? (
                        <div className="text-xs font-medium text-[#7b756d] italic px-2">Generating...</div>
                      ) : isFailed ? (
                        <div className="text-xs font-medium text-[#ef4444] italic px-2">Failed</div>
                      ) : (
                        <>
                          <button onClick={openViewer} disabled={loadingItemId === id} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e2dbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee] sm:flex-none disabled:opacity-50">
                            {loadingItemId === id ? (
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                            Open
                          </button>
                          <button onClick={(e) => handleDownloadClick(item, isPack, url, titleStr)} disabled={downloadingItemId === item.id || !url} className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee] disabled:opacity-50`}>
                            {downloadingItemId === item.id ? (
                              <svg className="animate-spin text-[#1f1f1f]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleShareClick(item, isPack, url, titleStr)}
                            disabled={!url}
                            title="Share"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f4ee] disabled:opacity-50`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                          </button>
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

      {/* Share Modal */}
      {shareModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setShareModalData(null)}
              className="absolute right-4 top-4 text-[#9a9289] hover:text-[#1f1f1f] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="mb-1 text-lg font-bold text-[#1f1f1f]">Share link</h2>
            <p className="mb-5 text-sm text-[#7b756d]">Anyone with this link can view and download.</p>
            
            <div className="flex items-center gap-2 rounded-xl border border-[#e2dbd2] bg-[#faf8f3] p-1.5">
              <input 
                type="text" 
                readOnly 
                value={shareModalData.url} 
                className="w-full bg-transparent px-3 py-2 text-sm text-[#5a554f] outline-none"
              />
              <button
                onClick={copyShareLink}
                disabled={shareModalData.isLoading}
                className="flex-shrink-0 rounded-lg bg-[#1f1f1f] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratePage
