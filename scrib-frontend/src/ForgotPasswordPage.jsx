import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './utils/axios'
import universalToast from './utils/universalToast'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      setFormError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setFormError('')

    try {
      await axiosInstance.post('/auth/forgot-password/', { email: email.trim().toLowerCase() })
      setEmailSent(true)
      universalToast.success('Instructions sent to your email!')
    } catch (err) {
      console.error('Forgot password error:', err)
      const msg = err?.response?.data?.error || 'An error occurred. Please try again.'
      setFormError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-[#e2dbd2] bg-white px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Scrib</p>

          {!emailSent ? (
            <>
              <h1 className="mt-3 text-2xl font-semibold">Forgot Password?</h1>
              <p className="mt-1 text-sm text-[#7b756d]">
                Enter your email address to receive a password reset link.
              </p>

              <div className="mt-6 space-y-3 text-left">
                <input
                  className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setFormError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                  }}
                  disabled={isLoading}
                />
                {formError ? <p className="text-xs text-[#c05c5c]">{formError}</p> : null}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="mt-6 w-full rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
              >
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3faeb] text-2xl text-[#6db05d]">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-semibold">Email Sent!</h1>
              <p className="mt-2 text-sm text-[#7b756d]">
                If an account with <span className="font-semibold text-[#1f1f1f]">{email}</span> exists, we've sent a password reset link to your inbox.
              </p>
              
              <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-[#f7f4ee] p-4 text-left">
                <p className="text-xs text-[#7b756d]">
                  <strong className="text-[#1f1f1f]">Check your email</strong> — the link expires in 1 hour.
                </p>
                <p className="mt-2 text-xs text-[#7b756d]">
                  <strong className="text-[#1f1f1f]">Check spam</strong> — sometimes it lands there.
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="mt-6 w-full rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] hover:bg-[#faf8f3]"
              >
                Use a different email
              </button>
            </>
          )}

          <p className="mt-6 text-xs text-[#7b756d]">
            <Link to="/login" className="font-semibold text-[#1f1f1f] hover:underline">
              &larr; Back to Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default ForgotPasswordPage
