import { useEffect, useState } from 'react'
import { createShareLink } from '../services/shareService'
import customToast from '../utils/customToast'

/**
 * ShareAndEarnModal
 *
 * Opens when the user clicks "Share & Earn" on any ready StudyPack in History
 * or Dashboard. Fetches (or creates) the user's unique share link, then presents
 * Copy Link, WhatsApp, Telegram, and a native "More" share option.
 *
 * Props:
 *   packId        {number}   - StudyPack id
 *   onClose       {function} - called when modal is dismissed
 */
export default function ShareAndEarnModal({ packId, onClose }) {
  const [shareData, setShareData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [msgExpanded, setMsgExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchLink = async () => {
      try {
        const data = await createShareLink({ packId })
        if (!cancelled) setShareData(data)
      } catch (err) {
        if (!cancelled) customToast.error('Could not create share link. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLink()
    return () => { cancelled = true }
  }, [packId])

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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden p-6 text-center">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-[#9a9289] hover:bg-[#f5f2ec] hover:text-[#1f1f1f] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef7df] text-[#557a3f] mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
        </div>

        {/* Header Text */}
        <h2 className="text-xl font-bold text-[#1f1f1f] mb-2">Share & Earn Credits</h2>
        <p className="text-sm text-[#7b756d] mb-4 max-w-[280px] mx-auto leading-relaxed">
          Share notes with friends. Earn credits every time they purchase.
        </p>

        {/* Reward info chips */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2dbd2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a554f]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#557a3f]" />
            Earn 0.5 credits / page
          </span>
        </div>

        <div className="space-y-4 text-left">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f3a5f] border-t-transparent" />
              <span className="ml-3 text-sm text-[#7b756d]">Creating your share link…</span>
            </div>
          ) : shareData ? (
            <>
              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleCopyMessage}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#333] transition-colors"
                >
                  {copiedMsg ? '✓ Copied Message!' : '📋 Copy Share Message'}
                </button>
                
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareData.share_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#128C7E] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  Share on WhatsApp
                </a>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e2dbd2] bg-white px-4 py-3 text-sm font-semibold text-[#5a554f] hover:bg-[#faf8f3] transition-colors"
                >
                  {copiedLink ? '✓ Copied Link!' : '🔗 Copy Link'}
                </button>
              </div>


              {/* Share message preview (collapsible) */}
              <div className="rounded-xl border border-[#e2dbd2] overflow-hidden">
                <button
                  onClick={() => setMsgExpanded(!msgExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#6f6a63] bg-[#faf8f3] hover:bg-[#f5f0e8] transition-colors"
                >
                  <span>📋 Preview share message</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`transition-transform ${msgExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {msgExpanded && (
                  <div className="px-4 py-3 bg-white text-xs text-[#5a554f] whitespace-pre-wrap leading-relaxed border-t border-[#e2dbd2]">
                    {shareData.share_message}
                  </div>
                )}
              </div>
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
