import { useEffect, useState } from 'react'
import { otpResend, otpVerify } from '../../services/otpAuth'
import universalToast from '../../utils/universalToast'
import { usePostHog } from '@posthog/react'

const OtpModal = ({ open, email, onClose, onVerified }) => {
  const posthog = usePostHog()
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((value) => (value > 0 ? value - 1 : 0)), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (!open) {
      setCode('')
      setIsSubmitting(false)
      setResendCooldown(0)
    } else {
      setResendCooldown(60)
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && open) {
        onClose?.()
      }
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
    return undefined
  }, [open, onClose])

  const handleVerify = async (event) => {
    event.preventDefault()
    if (!code || code.trim().length !== 6) {
      universalToast.error('Enter the 6-digit code')
      return
    }
    setIsSubmitting(true)
    try {
      const data = await otpVerify({ email, code: code.trim() })
      posthog?.identify(data?.user?.email || email, {
        email: data?.user?.email || email,
        name: data?.user?.full_name,
      })
      posthog?.capture('user_signed_up', { method: 'email' })
      universalToast.success('Email verified!')
      onVerified?.(data)
      onClose?.()
    } catch (err) {
      const status = err?.response?.status
      const serverMsg = err?.response?.data?.error || err?.response?.data?.detail
      const msg = serverMsg || (status === 400 ? 'Invalid or expired code' : 'Verification failed')
      universalToast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResending(true)
    try {
      await otpResend({ email })
      universalToast.success('Code resent! Check your email.')
      setResendCooldown(60)
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.error || 'Unable to resend now'
      if (status === 429) {
        msg = err?.response?.data?.error || 'Too many requests. Please wait before trying again.'
        setResendCooldown(60)
      }
      universalToast.error(msg)
    } finally {
      setResending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Verify your email</h3>
            <p className="mt-1 text-sm text-[#7b756d]">
              We sent a 6-digit code to <span className="font-semibold">{email}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#7b756d] hover:bg-[#f4f1ea]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form className="mt-4" onSubmit={handleVerify}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-[#e0d9ce] bg-[#faf8f3] px-4 py-3 text-center text-2xl tracking-widest"
            placeholder="••••••"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full rounded-xl bg-[#1f1f1f] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-[#7b756d]">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending || isSubmitting}
            className="text-[#1f1f1f] disabled:cursor-not-allowed disabled:text-[#b1aaa0]"
          >
            {resending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend in ${resendCooldown >= 60 ? '1 minute' : `${resendCooldown}s`}`
                : 'Resend code'}
          </button>
          <button onClick={onClose} className="text-[#7b756d] hover:text-[#1f1f1f]">
            Change email
          </button>
        </div>
      </div>
    </div>
  )
}

export default OtpModal
