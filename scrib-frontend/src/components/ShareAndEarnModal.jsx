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
  const [copied, setCopied] = useState(false)
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

  const handleCopy = async () => {
    if (!shareData?.share_url) return
    try {
      await navigator.clipboard.writeText(shareData.share_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      customToast.error('Could not copy. Please copy the link manually.')
    }
  }



  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1f3a5f] to-[#2d5fa6] px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Share & Earn Credits ✨</h2>
              <p className="mt-1 text-sm text-blue-100">
                Share notes with friends. Earn every time they purchase.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Reward info chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              💰 You earn 0.5 credits / page
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              🎓 Friend pays ₹5 / page
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1f3a5f] border-t-transparent" />
              <span className="ml-3 text-sm text-[#7b756d]">Creating your share link…</span>
            </div>
          ) : shareData ? (
            <>
              {/* Share URL + Copy button */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9a9289] mb-2">
                  Your unique share link
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-[#e2dbd2] bg-[#faf8f3] p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={shareData.share_url}
                    onClick={(e) => e.target.select()}
                    className="w-full bg-transparent px-3 py-1.5 text-sm text-[#5a554f] outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      copied
                        ? 'bg-[#4caf50] text-white'
                        : 'bg-[#1f1f1f] text-white hover:bg-[#333]'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
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
