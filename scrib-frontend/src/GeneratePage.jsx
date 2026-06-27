import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'
import { forceDownload } from './utils/download'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import HeaderAuthSkeleton from './components/HeaderAuthSkeleton'
import { usePostHog } from '@posthog/react'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { startPaymentFlow } from './services/paymentService'



const GeneratePage = () => {
  const { user, logout, isLoggedIn, loading, googleLogin, refreshUser } = useAuth()
  const posthog = usePostHog()
  const navigate = useNavigate()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const { renderGoogleButton, isReady: googleReady } = useGoogleAuth(
    async (credential) => {
      const success = await googleLogin(credential)
      if (success) {
        setShowAuthModal(false)
      }
    },
    (error) => {
      customToast.error(error || 'Google login failed')
    }
  )

  useEffect(() => {
    if (showAuthModal && googleReady) {
      setTimeout(() => {
        if (document.getElementById('google-login-modal-btn')) {
          renderGoogleButton('google-login-modal-btn')
        }
      }, 50)
    }
  }, [showAuthModal, googleReady, renderGoogleButton])

  const handleAuthClick = () => {
    setShowAuthModal(true)
  }

  const handlePayClick = async (packId) => {
    if (!isLoggedIn) {
      customToast.info('Please sign in first', { icon: '👋' })
      setShowAuthModal(true)
      return
    }
    if (processingPack) return
    setProcessingPack(packId)

    await startPaymentFlow({
      pack: packId,
      user,
      onSuccess: async ({ credit_balance, credits_added }) => {
        setProcessingPack(null)
        await refreshUser?.()
        customToast.success(
          `🎉 ${credits_added} credits added! New balance: ${credit_balance} credits`,
          { duration: 4000 },
        )
      },
      onFailure: (message) => {
        setProcessingPack(null)
        customToast.error(message || 'Payment failed. Please try again.')
      },
      onDismiss: () => {
        setProcessingPack(null)
      },
    })
  }
  const MAX_PAGES = 8
  const MAX_TOPICS_PER_PAGE = 2

  const [mode, setMode] = useState(() => sessionStorage.getItem('scrib_draft_mode') || 'manual')

  // v2 state: array of page objects {topics: [{name, instruction}]}
  const [pages, setPages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scrib_draft_pages_v2')
      return saved ? JSON.parse(saved) : [{ topics: [{ name: '', instruction: '' }] }]
    } catch { return [{ topics: [{ name: '', instruction: '' }] }] }
  })
  const [pasteText, setPasteText] = useState(() => sessionStorage.getItem('scrib_draft_paste') || '')
  const [remainingTopics, setRemainingTopics] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scrib_draft_remaining')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Sync draft state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('scrib_draft_mode', mode)
    sessionStorage.setItem('scrib_draft_pages_v2', JSON.stringify(pages))
    sessionStorage.setItem('scrib_draft_paste', pasteText)
    sessionStorage.setItem('scrib_draft_remaining', JSON.stringify(remainingTopics))
  }, [mode, pages, pasteText, remainingTopics])
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [latestCreditBalance, setLatestCreditBalance] = useState(null)
  const [processingPack, setProcessingPack] = useState(null)
  const [loadingItemId, setLoadingItemId] = useState(null)
  const [downloadingItemId, setDownloadingItemId] = useState(null)
  const [invalidTopics, setInvalidTopics] = useState([])
  const [aiGeneratedWarning, setAiGeneratedWarning] = useState(false)
  const location = useLocation()
  
  // Initialize tab from URL query parameter
  const initialTab = new URLSearchParams(location.search).get('tab') === 'history' ? 'history' : 'generate'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [historyItems, setHistoryItems] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [shareModalData, setShareModalData] = useState(null)
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

    posthog?.capture('pdf_downloaded', {
      item_type: isPack ? 'pack' : 'note',
      title: titleStr,
    })

    setDownloadingItemId(null)
  }

  const copyShareLink = async () => {
    if (!shareModalData || shareModalData.isLoading) return
    try {
      await navigator.clipboard.writeText(shareModalData.url)
      posthog?.capture('pdf_shared', { title: shareModalData.title })
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
    const activePacks = historyItems.filter(
      item => item.type === 'pack' && (item.status === 'generating' || item.status === 'pending')
    )
    if (activePacks.length === 0) return

    const interval = setInterval(() => {
      activePacks.forEach(async (pack) => {
        try {
          const res = await axiosInstance.get(`/scrib/packs/${pack.id}/status/`)
          if (res.data && res.data.status === 'ready') {
            setHistoryItems(prev => prev.map(item => {
              if (item.type === 'pack' && item.id === pack.id) {
                return {
                  ...item,
                  status: 'ready',
                  pdf_url: res.data.pdf_url,
                  s3_key: res.data.s3_key,
                  _pagesDone: res.data.total_pages ?? item._pagesDone,
                }
              }
              return item
            }))
            showNotification('Your Scrib notes are ready!', {
              body: `The study pack for ${pack.name || 'your notes'} has finished generating. Click to view.`,
              icon: '/scrib_favicon.svg'
            })
            customToast.success(`Study pack "${pack.name}" is ready!`)
          } else if (res.data && res.data.status === 'failed') {
            setHistoryItems(prev => prev.map(item => {
              if (item.type === 'pack' && item.id === pack.id) {
                return { ...item, status: 'failed' }
              }
              return item
            }))
            customToast.error(`Failed to generate study pack "${pack.name}".`)
            try {
              const profileRes = await axiosInstance.get('/auth/profile/')
              if (profileRes.data && typeof profileRes.data.credit_balance === 'number') {
                setLatestCreditBalance(profileRes.data.credit_balance)
              }
            } catch (profileErr) {
              console.error('Failed to refresh credits after generation failure', profileErr)
            }
          } else if (res.data && (res.data.status === 'generating' || res.data.status === 'pending')) {
            // Update ETA countdown + live page progress in the history item
            setHistoryItems(prev => prev.map(item => {
              if (item.type === 'pack' && item.id === pack.id) {
                return {
                  ...item,
                  status: res.data.status,
                  _pagesDone: res.data.pages_done ?? item._pagesDone ?? 0,
                  _remainingSeconds: res.data.remaining_seconds ?? null,
                  _estimatedSeconds: res.data.estimated_seconds ?? null,
                  _elapsedSeconds: res.data.elapsed_seconds ?? null,
                }
              }
              return item
            }))
          }
        } catch (err) {
          console.error(`Failed to poll status for pack ${pack.id}`, err)
        }
      })
    }, 5000)

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



  const handleOrganizeTopics = async () => {
    const trimmed = pasteText.trim()
    if (!trimmed) {
      customToast.error('Please paste some syllabus text first.')
      return
    }
    setIsOrganizing(true)
    try {
      // Step 1: Parse raw topics from pasted text
      const parseRes = await axiosInstance.post('/scrib/parse-syllabus/', { syllabus: trimmed })
      const rawTopics = parseRes.data
      if (!Array.isArray(rawTopics) || !rawTopics.length) throw new Error('No topics found')

      // Step 2: Enrich + pack via organize-topics (2-step pipeline)
      const organizeRes = await axiosInstance.post('/scrib/organize-topics/', { topics: rawTopics })
      const groups = organizeRes.data?.groups
      if (!Array.isArray(groups) || !groups.length) throw new Error('Empty groups')

      // groups is already v2 format: [{topics: [{name, instruction}]}, ...]
      // Cap at MAX_PAGES
      const organized = groups.slice(0, MAX_PAGES)
      setPages(organized)
      
      const extraGroups = groups.slice(MAX_PAGES)
      const extraTopics = extraGroups.flatMap(g => g.topics.map(t => t.name))
      setRemainingTopics(extraTopics)
      setMode('manual')
      setPasteText('')
      setAiGeneratedWarning(true)
      customToast.success(`Organized into ${organized.length} page${organized.length !== 1 ? 's' : ''}!`)
    } catch (error) {
      console.error(error)
      customToast.error('Failed to organize topics. Please try again.')
    } finally {
      setIsOrganizing(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const incoming = params.get('topic')
    if (!incoming) return
    const names = incoming.split(/\n|,/).map(s => s.trim()).filter(Boolean)
    if (names.length) {
      setMode('manual')
      setPages([{ topics: names.map(n => ({ name: n, instruction: '' })) }])
    }
  }, [location.search])

  // ── Page builder helpers ────────────────────────────────────────────────
  const validPages = pages
    .map(p => ({ ...p, topics: (p.topics || []).filter(t => t.name.trim()) }))
    .filter(p => p.topics.length > 0)

  const addPage = () => {
    if (pages.length >= MAX_PAGES) return
    setPages(prev => [...prev, { topics: [{ name: '', instruction: '' }] }])
  }

  const removePage = (pi) => {
    setPages(prev => prev.length === 1 ? [{ topics: [{ name: '', instruction: '' }] }] : prev.filter((_, i) => i !== pi))
  }

  const addTopicToPage = (pi) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== pi || p.topics.length >= MAX_TOPICS_PER_PAGE) return p
      return { ...p, topics: [...p.topics, { name: '', instruction: '' }] }
    }))
  }

  const removeTopicFromPage = (pi, ti) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== pi) return p
      const filtered = p.topics.filter((_, j) => j !== ti)
      return { ...p, topics: filtered.length ? filtered : [{ name: '', instruction: '' }] }
    }))
  }

  const updateTopicField = (pi, ti, field, value) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== pi) return p
      return { ...p, topics: p.topics.map((t, j) => j === ti ? { ...t, [field]: value } : t) }
    }))
  }

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      customToast.error('Please log in to generate notes.', { id: 'gen-login' })
      return
    }
    if (isGenerating) return

    if (!validPages.length) {
      customToast.error('Add at least one topic to generate.', { id: 'gen-error' })
      return
    }

    setIsGenerating(true)

    // Flatten all topic names for moderation check
    const allTopicNames = validPages.flatMap(p => p.topics.map(t => t.name))

    // Moderation Check
    try {
      const response = await axiosInstance.post('/scrib/moderate-topics/', { topics: allTopicNames })
      const moderationFlags = response.data.moderation || []
      const isValid = moderationFlags.every((flag) => flag === true)
      if (!isValid) {
        const badTopics = allTopicNames.filter((_, idx) => moderationFlags[idx] === false)
        setInvalidTopics(badTopics.length > 0 ? badTopics : allTopicNames)
        customToast.error('One or more topics violate our content policy. Please revise.', { id: 'gen-error', duration: 5000 })
        setIsGenerating(false)
        return
      }
    } catch (err) {
      console.error('Moderation check failed', err)
    }


    const creditsNeeded = validPages.length
    const currentCredits = latestCreditBalance ?? user?.credit_balance ?? 0
    if (currentCredits < creditsNeeded) {
      customToast.error('Please add credits first.', { id: 'gen-error' })
      navigate('/pricing')
      return
    }

    const firstTopicName = validPages[0]?.topics[0]?.name || 'Study Pack'
    const packTitle = validPages.length === 1
      ? firstTopicName
      : `${firstTopicName} +${validPages.length - 1}`

    setActiveTab('history')
    const tempId = `pending-${Date.now()}`
    setHistoryItems(prev => [{
      id: tempId, type: 'pack', name: packTitle,
      created_at: new Date().toISOString(), status: 'pending',
      total_pages: validPages.length, credits_used: creditsNeeded,
      _displayDate: 'Generating...', _isPending: true
    }, ...prev])

    posthog?.capture('note_generation_started', {
      page_count: validPages.length, credits_cost: creditsNeeded, pack_title: packTitle,
    })

    try {
      // v2 payload: pages array of page objects
      const payload = { title: packTitle, pages: validPages }
      requestNotificationPermission()
      const response = await axiosInstance.post('/scrib/generate-study-pack/', payload)
      const data = response.data || {}

      if (typeof data.credit_balance === 'number') setLatestCreditBalance(data.credit_balance)

      posthog?.capture('note_generation_completed', {
        page_count: validPages.length, credits_used: creditsNeeded, pack_title: packTitle,
      })

      customToast.success('Generation started! We\'ll notify you when it\'s ready.')
      setHideBanner(false)
      setTimeout(() => {
        setHistoryItems(prev => prev.filter(item => item.id !== tempId))
        loadHistory()
        // Reset to blank page
        setPages([{ topics: [{ name: '', instruction: '' }] }])
        setPasteText('')
        setMode('manual')
      }, 800)
    } catch (error) {
      setHistoryItems(prev => prev.filter(item => item.id !== tempId))
      setActiveTab('generate')
      posthog?.capture('note_generation_failed', {
        page_count: validPages.length, error_status: error?.response?.status,
      })
      if (error?.response?.status === 402) {
        customToast.error('Please add credits first.', { id: 'gen-error' })
        navigate('/pricing')
      } else {
        customToast.error(error?.response?.data?.message || 'Generation failed. Please try again.', { id: 'gen-error' })
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
          {loading ? (
            <HeaderAuthSkeleton />
          ) : isLoggedIn ? (
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
                  <span className="hidden md:inline">Type topics one by one, or paste your full syllabus — AI will organise it.</span>
                </p>

                {(!isLoggedIn || (!isLoadingHistory && creditBalance === 0 && historyItems.length === 0)) && (
                   <div className="mt-4 rounded-xl border border-[#e2dbd2] bg-white px-3 py-2 md:px-4 md:py-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                       <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="flex h-5 w-5 md:h-6 md:w-6 shrink-0 items-center justify-center text-[#b47a26]">
                             <svg width="14" height="14" className="md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
                               <path d="M5 3v4"></path>
                               <path d="M3 5h4"></path>
                             </svg>
                             <svg width="18" height="18" className="hidden md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
                               <path d="M5 3v4"></path>
                               <path d="M3 5h4"></path>
                             </svg>
                          </div>
                          <div className="min-w-0">
                             {/* Mobile: short title only */}
                             <h3 className="md:hidden text-xs font-bold text-[#1f1f1f] leading-snug">Try with 2 credits</h3>
                             {/* Desktop: full title + subtitle */}
                             <h3 className="hidden md:block text-sm font-bold text-[#1f1f1f]">Starter trial — 2 credits for ₹19</h3>
                             <p className="hidden md:block text-xs text-[#8a847c] mt-0.5">Add up to 2 topics, then complete payment</p>
                          </div>
                       </div>
                       <div className="flex flex-row gap-1.5 md:gap-2 shrink-0">
                          <Link to="/pricing" className="flex items-center justify-center rounded-lg border border-[#e2dbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:bg-[#fcfbf9] transition-colors shadow-sm whitespace-nowrap">
                             Other packs
                          </Link>
                          <button 
                            onClick={() => handlePayClick('try')}
                            disabled={processingPack === 'try'}
                            className="flex items-center justify-center rounded-lg bg-[#1f1f1f] px-3 py-1.5 md:px-4 text-xs font-semibold text-white hover:bg-black transition-colors shadow-sm disabled:opacity-70 whitespace-nowrap"
                          >
                             {processingPack === 'try' ? 'Processing...' : 'Try ₹19'}
                          </button>
                       </div>
                    </div>
                 </div>
                )}
                <div className="hidden md:flex mt-3 items-start gap-2 rounded-xl border border-[#dde8c3] bg-[#f4f9eb] px-3 py-2.5 text-xs text-[#4a6e30]">
                  <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                  </svg>
                  <span>We recommend <strong>1 topic per page</strong> for detailed notes. Up to 2 concise topics can fit comfortably on a single page.</span>
                </div>
              </div>

          <div className="px-1 py-4 md:px-6 md:py-5">
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-5">
              <button
                onClick={() => setMode('manual')}
                className={`rounded-xl md:rounded-full border px-4 py-3 md:py-2 text-sm md:text-xs font-medium md:font-semibold transition-colors ${
                  mode === 'manual'
                    ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white'
                    : 'border-[#d9d1c7] bg-white text-[#5f5a54] hover:bg-[#f5f2ec]'
                }`}
              >
                Build manually
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
              <div className="flex flex-col gap-4">
                {pages.map((page, pi) => (
                  <div key={pi} className="rounded-xl border border-[#e2dbd2] bg-white overflow-hidden shadow-sm">
                    {/* Page header */}
                    <div className="flex items-center justify-between border-b border-[#eee6dc] bg-[#faf8f4] px-4 py-2.5">
                      <span className="text-xs font-bold text-[#7b756d] uppercase tracking-wider">Page {pi + 1}</span>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePage(pi)}
                          className="text-[#a39b92] hover:text-[#dc2626] transition-colors text-xs flex items-center gap-1"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                          </svg>
                          Remove page
                        </button>
                      )}
                    </div>

                    {/* Topics */}
                    <div className="divide-y divide-[#f0ece5]">
                      {page.topics.map((topic, ti) => (
                        <div key={ti} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0ece5] text-[10px] font-semibold text-[#7b756d]">{ti + 1}</span>
                            <input
                              className={`flex-1 rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-colors ${
                                invalidTopics.includes(topic.name.trim())
                                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                                  : 'border-[#e0d9ce] bg-white focus:border-[#9b93e7] focus:ring-1 focus:ring-[#9b93e7]/20'
                              }`}
                              placeholder={ti === 0 ? 'Topic name...' : 'Another topic...'}
                              value={topic.name}
                              onChange={e => updateTopicField(pi, ti, 'name', e.target.value)}
                            />
                            {page.topics.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTopicFromPage(pi, ti)}
                                className="text-[#c0b8b0] hover:text-[#dc2626] transition-colors"
                                aria-label="Remove topic"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="mt-1.5 ml-7">
                            <input
                              className="w-full rounded-lg border border-[#e2dbd2] bg-white px-2.5 py-1.5 text-xs text-[#5f5a54] outline-none placeholder:text-[#a39b92] focus:border-[#9b93e7] focus:ring-1 focus:ring-[#9b93e7]/20 transition-all shadow-sm"
                              placeholder="Optional instruction (e.g. Examples only, Definitions only...)"
                              value={topic.instruction}
                              onChange={e => updateTopicField(pi, ti, 'instruction', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add topic to page */}
                    <div className="px-4 py-2.5 border-t border-[#f0ece5] bg-[#fdfcfa] flex justify-end">
                      {page.topics.length < MAX_TOPICS_PER_PAGE ? (
                        <button
                          type="button"
                          onClick={() => addTopicToPage(pi)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#d9d1c7] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5a54] hover:border-[#9b93e7] hover:text-[#5a52a0] hover:bg-[#f7f5ff] transition-all shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add topic
                          <span className="text-[#b0a9a0] font-normal">({page.topics.length}/{MAX_TOPICS_PER_PAGE})</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-[#b47a26] font-medium">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          Max 2 topics per page
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add page button */}
                {pages.length < MAX_PAGES ? (
                  <button
                    type="button"
                    onClick={addPage}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#d9d1c7] px-4 py-3 text-sm text-[#7b756d] hover:border-[#9b93e7] hover:text-[#5a52a0] hover:bg-[#f7f5ff] transition-all font-medium w-full justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add page
                    <span className="text-xs text-[#b0a9a0]">({pages.length}/{MAX_PAGES})</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-xl border border-[#f3d9a9] bg-[#fdf9f0] px-4 py-3 text-xs text-[#b47a26] font-medium">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Max 8 pages per generation. Generate this batch first.
                    </div>
                    
                    {remainingTopics.length > 0 && (
                      <div className="rounded-xl border border-[#e6e2db] bg-[#f9f7f2] p-4 mt-2 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-semibold tracking-wide text-[#5f5a54] uppercase">
                            Remaining Excluded Topics ({remainingTopics.length})
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(remainingTopics.join('\n'))
                              customToast.success('Copied to clipboard!')
                            }}
                            className="text-[11px] font-medium text-[#7a746d] hover:text-[#1f1f1f] flex items-center gap-1.5 transition-colors bg-white px-2.5 py-1.5 rounded border border-[#e6e2db] shadow-sm"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy for next batch
                          </button>
                        </div>
                        <p className="text-xs text-[#807a73] leading-relaxed max-h-32 overflow-y-auto">
                          {remainingTopics.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {aiGeneratedWarning && (
                  <p className="text-xs text-[#8a847c] text-center">AI organized these — review and edit before generating.</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#ded6cc] bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-[#5f5a54] tracking-wide">
                  Paste your syllabus topics — one per line or comma separated
                </p>
                <textarea
                  className="min-h-[120px] w-full resize-none border-none bg-transparent text-sm outline-none"
                  placeholder="e.g. Explicit Intents, Implicit Intents, Activity Lifecycle, Fragments..."
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setInvalidTopics([]) }}
                />
                {pasteText && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleOrganizeTopics}
                      disabled={isOrganizing}
                      className="rounded-full bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isOrganizing && (
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      )}
                      {isOrganizing ? 'Organizing...' : '✦ Organize with AI'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 hidden md:flex items-center gap-3 text-xs text-[#6f6a63]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#6db05d]" />
                Output: <span className="font-semibold text-[#1f1f1f]">PDF — {validPages.length} page{validPages.length !== 1 ? 's' : ''}</span>
              </span>
              {validPages.length > 0 && (
                <span className="text-[#a39b92]">·</span>
              )}
              <span>{validPages.length} credit{validPages.length !== 1 ? 's' : ''} required</span>
            </div>

          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col md:static md:flex-row md:flex-wrap md:items-center justify-between gap-2 md:gap-4 border-t border-[#e2dbd2] md:border-[#eee6dc] bg-white md:bg-[#f7f4ee] px-5 py-3 md:py-4 md:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-none">
              {mode !== 'paste' && (
                <div className="flex items-center justify-between md:hidden w-full mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#059669]" />
                    <span className="text-sm font-medium text-[#5f5a54]">PDF · <span className="font-bold text-[#1f1f1f]">{validPages.length} pages</span></span>
                  </div>
                  <span className="rounded-full bg-[#fdf2df] border border-[#f3d9a9] px-3 py-1 text-[11px] font-semibold text-[#b47a26]">
                    {validPages.length} credits
                  </span>
                </div>
              )}

              <div className="hidden md:block">
                {mode !== 'paste' ? (
                  <>
                    <p className="text-sm font-semibold">
                      {validPages.length} credit{validPages.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-[#7b756d]">
                      {isLoggedIn ? (
                        <>
                          {creditBalance} credits remaining{' '}
                          <span className="ml-2 rounded-full bg-[#f2e6c9] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a26]">
                            {Math.max(creditBalance - validPages.length, 0)} after
                          </span>
                        </>
                      ) : (
                        <span className="text-[#a74c4c] font-medium">Sign up to start generating!</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[#7b756d]">
                    {isLoggedIn ? `${creditBalance} credits available` : <span className="text-[#a74c4c] font-medium">Sign up to start generating!</span>}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <button
                  onClick={
                    !isLoggedIn
                      ? handleAuthClick
                      : (creditBalance < Math.max(1, validPages.length))
                        ? () => navigate('/pricing?next=/generate')
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
                        : (creditBalance < Math.max(1, validPages.length))
                          ? 'Add credits to generate'
                          : 'Generate PDF'}
                </button>

                <p className="mt-0.5 text-center text-[11px] text-[#a39b92] md:hidden">
                  {mode !== 'paste'
                    ? (isLoggedIn ? `${Math.max(creditBalance - validPages.length, 0)} credits remaining after` : 'Sign up to generate notes')
                    : (isLoggedIn ? `${creditBalance} credits available` : 'Sign up to generate notes')}
                </p>
              </div>
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
                        <div className="flex flex-col items-end gap-1.5 px-2 min-w-[120px]">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7b756d]">
                            {item.status === 'pending' ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a39b92]">
                                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                Queued...
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[#6366f1]">
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Generating...
                              </>
                            )}
                          </span>

                          {/* Progress bar — shows per-image progress once pages_done is available */}
                          {(() => {
                            const done = item._pagesDone ?? 0
                            const total = item.total_pages ?? item._estimatedPages ?? 0
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0
                            return (
                              <div className="w-full">
                                <div className="flex justify-between text-[10px] text-[#a39b92] mb-0.5">
                                  <span>{done}/{total} pages</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-[#e8e2d9] overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#6366f1] transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })()}

                          {item._remainingSeconds != null && item._remainingSeconds > 0 ? (
                            <span className="text-[10px] text-[#a39b92]">
                              ~{Math.ceil(item._remainingSeconds / 60)} min remaining
                            </span>
                          ) : item._elapsedSeconds != null ? (
                            <span className="text-[10px] text-[#a39b92]">
                              {Math.floor(item._elapsedSeconds / 60)}m {item._elapsedSeconds % 60}s elapsed
                            </span>
                          ) : null}
                        </div>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#e2dbd2] bg-white p-6 shadow-xl relative text-center">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-[#a39b92] hover:text-[#1f1f1f] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Scrib</p>
            <h3 className="mt-3 text-xl font-semibold text-[#1f1f1f]">Sign up to Generate</h3>
            <p className="mt-1 text-sm text-[#7b756d]">Create an account to save your generated notes and get free credits.</p>
            
            <div className="mt-6 w-full flex justify-center">
              <div id="google-login-modal-btn"></div>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-[#9a9289]">
              <span className="h-px flex-1 bg-[#eee6dc]" /> or <span className="h-px flex-1 bg-[#eee6dc]" />
            </div>

            <button
              onClick={() => navigate('/login?next=/generate')}
              className="w-full rounded-xl border border-[#e0d9ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors"
            >
              Continue with Email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratePage
