import { useEffect, useState } from 'react'
import { createShareLink, getShareMeta } from '../services/shareService'
import customToast from '../utils/customToast'

/**
 * ShareAndEarnModal
 *
 * Opens when the user clicks "Share & Earn" on any ready StudyPack in History,
 * Dashboard, or inside the PDF Viewer (whether opened directly or via share link).
 * Fetches (or creates) the user's unique share link, then presents
 * Copy Link, WhatsApp, and a toggleable Preview Message view for pristine UI/UX.
 *
 * Props:
 *   packId        {number}   - StudyPack id (optional if shareToken provided)
 *   shareToken    {string}   - Share link code/token (optional if packId provided)
 *   onClose       {function} - called when modal is dismissed
 */
export default function ShareAndEarnModal({ packId, shareToken, onClose }) {
  const [shareData, setShareData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeTab, setActiveTab] = useState('actions') // 'actions' or 'message'

  useEffect(() => {
    let cancelled = false
    const fetchLink = async () => {
      try {
        let targetPackId = packId
        if (!targetPackId && shareToken) {
          try {
            const meta = await getShareMeta(shareToken)
            targetPackId = meta?.pack_id
          } catch {
            // Ignore meta error, will fallback below
          }
        }

        if (targetPackId) {
          const data = await createShareLink({ packId: targetPackId })
          if (!cancelled) setShareData(data)
        } else if (shareToken) {
          // Fallback if targetPackId not found but we have shareToken
          const origin = window.location.origin
          const url = `${origin}/share/${shareToken}`
          if (!cancelled) {
            setShareData({
              share_code: shareToken,
              share_url: url,
              share_message: `Check out these study notes on Scrib: ${url}`
            })
          }
        }
      } catch (err) {
        if (!cancelled) customToast.error('Could not create share link. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLink()
    return () => { cancelled = true }
  }, [packId, shareToken])

  const handleCopyMessage = async () => {
    if (!shareData?.share_message) return
    try {
      await navigator.clipboard.writeText(shareData.share_message)
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    } catch {
      customToast.error('Could not copy message. Please copy manually.')
    }
  }

  const handleCopyLink = async () => {
    if (!shareData?.share_url) return
    try {
      await navigator.clipboard.writeText(shareData.share_url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      customToast.error('Could not copy link. Please copy manually.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden p-6 text-center border border-[#eee6dc] max-h-[90vh] flex flex-col justify-between">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-[#9a9289] hover:bg-[#f5f2ec] hover:text-[#1f1f1f] transition-colors z-20"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div>
          {/* Top Icon */}
          <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#eef7df] text-[#557a3f] mb-3.5 shadow-sm border border-[#d6edb9]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>

          {/* Header Text */}
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-1.5">Share & Earn Credits ✨</h2>
          <p className="text-xs text-[#7b756d] mb-3.5 max-w-[280px] mx-auto leading-relaxed">
            Share notes with friends. Earn credits every time they purchase.
          </p>

          {/* Reward info chips */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2dbd2] bg-[#faf8f3] px-3.5 py-1 text-xs font-semibold text-[#5a554f] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#557a3f] animate-pulse" />
              Earn 0.5 credits / page
            </span>
          </div>
        </div>

        <div className="space-y-4 text-left flex-1 overflow-y-auto pr-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f3a5f] border-t-transparent" />
              <span className="ml-3 text-sm text-[#7b756d] font-medium">Creating your share link…</span>
            </div>
          ) : shareData ? (
            <>
              {/* Segmented Toggle Tabs */}
              <div className="flex rounded-xl bg-[#f5f2ec] p-1 mb-4 border border-[#e2dbd2]">
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                    activeTab === 'actions'
                      ? 'bg-white text-[#1f1f1f] shadow-sm'
                      : 'text-[#7b756d] hover:text-[#1f1f1f]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Quick Share
                </button>
                <button
                  onClick={() => setActiveTab('message')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                    activeTab === 'message'
                      ? 'bg-white text-[#1f1f1f] shadow-sm'
                      : 'text-[#7b756d] hover:text-[#1f1f1f]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                  </svg>
                  Preview Message
                </button>
              </div>

              {activeTab === 'actions' ? (
                <div className="space-y-3 animate-fadeIn">
                  <button
                    onClick={handleCopyMessage}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#1f1f1f] px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#333] active:scale-[0.99] transition-all"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    {copiedMsg ? '✓ Copied Message!' : 'Copy Share Message'}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareData.share_message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#128C7E] active:scale-[0.99] transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    Share on WhatsApp
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e2dbd2] bg-white px-4 py-3 text-sm font-semibold text-[#5a554f] hover:bg-[#faf8f3] active:scale-[0.99] transition-all shadow-2xs"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {copiedLink ? '✓ Copied Link!' : 'Copy Link Only'}
                  </button>

                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setActiveTab('message')}
                      className="text-xs font-semibold text-[#7b756d] hover:text-[#1f1f1f] underline decoration-[#d8d1c7] underline-offset-4 transition-colors"
                    >
                      Want to view what will be sent? Preview text →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Styled Message Box with Copy Icon on Top Right */}
                  <div className="rounded-xl border border-[#e2dbd2] bg-[#faf8f3] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#e2dbd2] bg-[#f2ede4]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6f6a63] flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        AI Message Text
                      </span>
                      <button
                        onClick={handleCopyMessage}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#1f1f1f] shadow-2xs hover:bg-[#eaf4d3] border border-[#d8d1c7] transition-all"
                        title="Copy text"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        {copiedMsg ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-3.5 text-xs text-[#3b3833] whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto font-sans select-all text-left">
                      {shareData.share_message}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('actions')}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#e2dbd2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5a554f] hover:bg-[#faf8f3] transition-colors shadow-2xs"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                      </svg>
                      Back to Share Options
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareData.share_message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#128C7E] transition-colors shrink-0"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-center text-[#9a9289] py-4">
              Failed to create share link. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
