import { useState } from 'react'
import axiosInstance from '../utils/axios'
import customToast from '../utils/customToast'

/**
 * RedeemCouponCard
 * Self-contained component that lets authenticated Scrib users redeem a promo code.
 * On success it calls onSuccess({ credits_added, new_balance }) so the parent
 * can refresh the user credit balance.
 */
const RedeemCouponCard = ({ onSuccess }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      customToast.error('Please enter a coupon code.')
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/scrib/redeem-coupon/', { code: trimmed })
      const { credits_added, new_balance, campaign_name } = res.data

      customToast.success(
        `🎉 ${campaign_name || 'Coupon'} redeemed successfully. ${credits_added} complimentary credit${credits_added !== 1 ? 's' : ''} added.`,
        { duration: 5000 }
      )

      setCode('')
      if (onSuccess) onSuccess({ credits_added, new_balance })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Failed to redeem coupon. Please try again.'
      customToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRedeem()
  }

  return (
    <div className="mt-4 rounded-xl border border-[#e2dbd2] bg-white px-4 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1f1f1f]">Redeem Coupon</p>
          <p className="mt-0.5 text-xs text-[#7b756d]">
            Have a faculty or promo code? Enter it below to add free credits.
          </p>
        </div>

        <div className="flex items-center gap-2 min-w-0 sm:w-auto w-full">
          <input
            id="redeem-coupon-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="SCRIB-XXXXXX"
            maxLength={32}
            disabled={loading}
            className="flex-1 sm:w-44 rounded-lg border border-[#d9d1c7] bg-[#faf8f3] px-3 py-2 text-sm font-mono tracking-widest text-[#1f1f1f] placeholder-[#bbb5ac] outline-none transition-colors focus:border-[#1f1f1f] disabled:opacity-60"
          />
          <button
            id="redeem-coupon-btn"
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="flex-shrink-0 rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redeeming…
              </span>
            ) : (
              'Redeem'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RedeemCouponCard
