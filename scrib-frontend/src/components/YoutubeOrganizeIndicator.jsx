import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axiosInstance from '../utils/axios'
import { ytJob } from '../utils/youtubeJob'

// Global progress card for a "From YouTube" organise. The job runs on the server
// no matter where the user goes, so this component owns the polling and shows a
// small bottom-right card everywhere except /generate (which renders its own
// inline progress and consumes the result directly).

const POLL_MS = 3000
const MAX_MS = 13 * 60 * 1000   // matches the server's total budget + a margin

const YouTubeGlyph = () => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecec]">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#e0342b" aria-hidden="true">
      <path d="M23 12s0-3.5-.5-5.2a3 3 0 0 0-2.1-2.1C18.7 4 12 4 12 4s-6.7 0-8.4.5a3 3 0 0 0-2.1 2.1C1 8.5 1 12 1 12s0 3.5.5 5.2a3 3 0 0 0 2.1 2.1C5.3 20 12 20 12 20s6.7 0 8.4-.5a3 3 0 0 0 2.1-2.1C23 15.5 23 12 23 12ZM10 15V9l5 3-5 3Z" />
    </svg>
  </span>
)

const CloseButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="-mr-1.5 -mt-1.5 shrink-0 rounded-md p-1 text-[#a39c92] transition-colors hover:bg-[#f4f1ec] hover:text-[#1f1f1f]"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  </button>
)

const YoutubeOrganizeIndicator = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pollTimer = useRef(null)

  const [state, setState] = useState(() => ({
    active: ytJob.getActive(),
    result: ytJob.getResult(),
    error: ytJob.getError(),
  }))

  useEffect(() => {
    const sync = () => setState({
      active: ytJob.getActive(),
      result: ytJob.getResult(),
      error: ytJob.getError(),
    })
    return ytJob.subscribe(sync)
  }, [])

  const jobId = state.active?.jobId
  const startedAt = state.active?.startedAt

  // Poll the running job — a single loop keyed on the job id.
  useEffect(() => {
    if (!jobId) return
    let stopped = false
    const began = startedAt || Date.now()

    const tick = async () => {
      if (stopped) return
      if (Date.now() - began > MAX_MS) {
        ytJob.setError('This video took too long to process. Try a shorter one.')
        ytJob.clearActive()
        return
      }
      try {
        const res = await axiosInstance.get(`/scrib/youtube/organize/status/${jobId}/`)
        if (stopped) return
        const data = res.data || {}
        if (data.status === 'ready') {
          ytJob.setResult({
            jobId,
            groups: data.groups || [],
            remaining_topics: data.remaining_topics || [],
          })
          ytJob.clearActive()
          return
        }
        if (data.status === 'failed') {
          if (data.code !== 'cancelled') {
            ytJob.setError(data.message || 'Could not process this video.')
          }
          ytJob.clearActive()
          return
        }
        if (data.message) ytJob.patchActive({ message: data.message })
        pollTimer.current = setTimeout(tick, POLL_MS)
      } catch (err) {
        if (stopped) return
        if (err?.response?.status === 404) {
          ytJob.clearActive()   // expired server-side — nothing left to wait for
          return
        }
        pollTimer.current = setTimeout(tick, POLL_MS)   // transient network blip
      }
    }

    tick()
    return () => { stopped = true; clearTimeout(pollTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const handleCancel = async () => {
    const id = state.active?.jobId
    ytJob.clearActive()
    if (id) {
      try { await axiosInstance.post(`/scrib/youtube/organize/cancel/${id}/`) }
      catch { /* the lock's own TTL is the backstop */ }
    }
  }

  const { active, result, error } = state

  // The generate page has its own inline progress + result handling.
  if (location.pathname === '/generate') return null
  if (!active && !result && !error) return null

  const pageCount = result?.groups?.length || 0

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[20rem] max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_44px_-10px_rgba(0,0,0,0.28)]">
        {!result && !error && (
          <div className="yt-progress-track h-1 w-full" />
        )}

        <div className="p-3.5">
          {result ? (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f4ea] text-[#2e7d32]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1f1f1f]">Topics organized</p>
                  <p className="text-[11px] leading-snug text-[#7b756d]">
                    {pageCount} page{pageCount !== 1 ? 's' : ''} drafted from the video — review and edit, then generate.
                  </p>
                </div>
                <CloseButton onClick={() => ytJob.clearResult()} label="Dismiss" />
              </div>
              <button
                type="button"
                onClick={() => navigate('/generate')}
                className="mt-3 w-full rounded-xl bg-[#1f1f1f] px-3 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                Review topics
              </button>
            </>
          ) : error ? (
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdecec] font-bold text-[#c0392b]">!</span>
              <p className="min-w-0 flex-1 text-[12px] leading-snug text-[#1f1f1f]">{error.message}</p>
              <CloseButton onClick={() => ytJob.clearError()} label="Dismiss" />
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <YouTubeGlyph />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1f1f1f]">Organizing from video…</p>
                <p className="truncate text-[11px] text-[#7b756d]">{active?.message || 'Watching the video…'}</p>
              </div>
              <CloseButton onClick={handleCancel} label="Cancel" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default YoutubeOrganizeIndicator
