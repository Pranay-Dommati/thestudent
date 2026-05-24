import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { startPaymentFlow } from '../services/paymentService'
import customToast from '../utils/customToast'

const PACKS = [
  {
    id: 'starter',
    price: '₹59',
    credits: 10,
    pages: 10,
    highlight: false,
    label: 'Starter',
  },
  {
    id: 'popular',
    price: '₹99',
    credits: 20,
    pages: 20,
    highlight: true,
    label: 'Popular',
    tag: 'Best value',
  },
  {
    id: 'pro',
    price: '₹199',
    credits: 40,
    pages: 40,
    highlight: false,
    label: 'Pro',
  },
]

/**
 * BuyCreditsModal
 *
 * A modal that lets the user pick a credit pack and initiate the Razorpay flow.
 * Credits are NEVER added from here — that only happens after backend verification.
 *
 * Props:
 *   onClose()       – called when modal should close
 *   onSuccess(data) – called with {credit_balance, credits_added} after verified purchase
 */
const BuyCreditsModal = ({ onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth()
  const [selectedPack, setSelectedPack] = useState('popular')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPack, setProcessingPack] = useState(null)

  const handleBuy = async (packId) => {
    if (isProcessing) return
    setIsProcessing(true)
    setProcessingPack(packId)

    await startPaymentFlow({
      pack: packId,
      user,
      onSuccess: async ({ credit_balance, credits_added }) => {
        setIsProcessing(false)
        setProcessingPack(null)
        // Refresh the user in context so header credit counter updates immediately
        await refreshUser?.()
        customToast.success(
          `🎉 ${credits_added} credits added! New balance: ${credit_balance} credits`,
          { duration: 4000 },
        )
        onSuccess?.({ credit_balance, credits_added })
        onClose?.()
      },
      onFailure: (message) => {
        setIsProcessing(false)
        setProcessingPack(null)
        customToast.error(message || 'Payment failed. Please try again.')
      },
      onDismiss: () => {
        setIsProcessing(false)
        setProcessingPack(null)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md rounded-2xl border border-[#e2dbd2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eee6dc] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#1f1f1f]">Buy Credits</h2>
            <p className="text-xs text-[#7b756d] mt-0.5">
              Current balance: <span className="font-semibold text-[#1f1f1f]">{user?.credit_balance ?? 0}</span> credits
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e2dbd2] text-[#7b756d] hover:bg-[#f7f4ee] transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Packs */}
        <div className="p-5 space-y-2.5">
          {PACKS.map((pack) => {
            const isSelected = selectedPack === pack.id
            const isThisProcessing = processingPack === pack.id

            return (
              <button
                key={pack.id}
                id={`buy-credits-${pack.id}`}
                onClick={() => {
                  setSelectedPack(pack.id)
                  handleBuy(pack.id)
                }}
                disabled={isProcessing}
                className={`relative w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed
                  ${pack.highlight
                    ? 'border-[1.5px] border-[#1f1f1f] bg-[#faf8f3] shadow-sm'
                    : 'border-[#e2dbd2] bg-white hover:border-[#c8bfb3] hover:bg-[#faf8f3]'}
                  ${isSelected ? 'ring-2 ring-[#1f1f1f] ring-offset-1' : ''}
                `}
              >
                {pack.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1f1f1f] px-2.5 py-0.5 text-[10px] font-semibold text-[#f0c06a] ring-4 ring-white">
                    Best value
                  </span>
                )}

                <div className="flex items-center gap-3">
                  {/* Credit icon */}
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold
                    ${pack.highlight ? 'bg-[#1f1f1f] text-white' : 'bg-[#f0ece5] text-[#5a5248]'}`}>
                    {pack.credits}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f1f1f]">
                      {pack.credits} credits
                      {pack.tag && (
                        <span className="ml-2 rounded-md bg-[#eef7df] px-1.5 py-0.5 text-[10px] font-semibold text-[#557a3f]">
                          {pack.tag}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#7b756d]">{pack.pages} PDF pages</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-semibold text-[#1f1f1f]">{pack.price}</span>
                  {isThisProcessing ? (
                    <svg className="h-4 w-4 animate-spin text-[#1f1f1f]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
                      ${pack.highlight ? 'bg-[#1f1f1f] text-white' : 'bg-[#f0ece5] text-[#1f1f1f]'}`}>
                      Buy
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#eee6dc] px-5 py-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9a9289]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secured by Razorpay · UPI, cards & netbanking · Credits never expire
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyCreditsModal
