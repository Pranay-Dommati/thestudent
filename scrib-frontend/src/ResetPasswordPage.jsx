import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './utils/axios'
import universalToast from './utils/universalToast'

const ResetPasswordPage = () => {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    validateToken()
  }, [uid, token])

  const validateToken = async () => {
    try {
      const { data } = await axiosInstance.get(`/auth/validate-reset-token/${uid}/${token}/`)
      if (data?.valid) {
        setTokenValid(true)
        setUserEmail(data.email)
      } else {
        setTokenValid(false)
        universalToast.error(data?.error || 'Invalid reset link')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setTokenValid(false)
      universalToast.error('Failed to validate reset link')
    } finally {
      setIsValidating(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.newPassword) {
      errors.newPassword = "Password is required"
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long"
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const { data } = await axiosInstance.post('/auth/reset-password/', {
        uid,
        token,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      })
      if (data) {
        setResetSuccess(true)
        universalToast.success('Password reset successfully!')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      const msg = error?.response?.data?.error || 'Failed to reset password'
      if (String(msg).includes('Invalid or expired')) {
        setTokenValid(false)
      }
      universalToast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#f7f4ee] flex items-center justify-center text-[#1f1f1f]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f1f1f] mr-3"></div>
        <p className="text-sm font-semibold">Validating reset link...</p>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
        <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12">
          <div className="w-full rounded-2xl border border-[#e2dbd2] bg-white px-8 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf2f2] text-2xl text-[#c05c5c]">
              !
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-[#7b756d]">
              This password reset link is invalid or has expired.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/forgot-password"
                className="w-full rounded-lg bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
              >
                Request New Link
              </Link>
              <Link
                to="/login"
                className="w-full rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1f] hover:bg-[#faf8f3]"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
        <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12">
          <div className="w-full rounded-2xl border border-[#e2dbd2] bg-white px-8 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3faeb] text-2xl text-[#6db05d]">
              ✓
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Password Reset Successful!</h2>
            <p className="mt-2 text-sm text-[#7b756d]">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-6 block w-full rounded-lg bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
            >
              Continue to Login
            </Link>
          </div>
        </main>
      </div>
    )
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
          <h1 className="mt-3 text-2xl font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-[#7b756d]">
            Create a new password for <span className="font-semibold text-[#1f1f1f]">{userEmail}</span>
          </p>

          <div className="mt-6 space-y-3 text-left">
            <input
              type="password"
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, newPassword: e.target.value }))
                setFormErrors(prev => ({ ...prev, newPassword: '' }))
              }}
              disabled={isLoading}
            />
            {formErrors.newPassword ? <p className="text-xs text-[#c05c5c]">{formErrors.newPassword}</p> : null}

            <input
              type="password"
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                setFormErrors(prev => ({ ...prev, confirmPassword: '' }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              disabled={isLoading}
            />
            {formErrors.confirmPassword ? <p className="text-xs text-[#c05c5c]">{formErrors.confirmPassword}</p> : null}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default ResetPasswordPage
