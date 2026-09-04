import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import OtpModal from './components/Auth/OtpModal'
import { otpSignup } from './services/otpAuth'
import universalToast from './utils/universalToast'
import GoogleButtonSkeleton from './components/GoogleButtonSkeleton'
import { getReferralCode, clearReferralCode } from './utils/referral'

const SignupPage = () => {
  const navigate = useNavigate()
  const { googleLogin, isLoggedIn, setAuthSession } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [otpOpen, setOtpOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = useLocation()
  const nextUrl = new URLSearchParams(location.search).get('next') || '/'

  useEffect(() => {
    if (isLoggedIn) {
      navigate(nextUrl, { replace: true })
    }
  }, [isLoggedIn, navigate, nextUrl])

  const validateForm = () => {
    const errors = {}

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Please provide your full name'
    }

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email format'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one number'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!agreedToTerms) {
      errors.agreedToTerms = 'You must agree to the Terms and Conditions'
    }

    return errors
  }

  const handleSignup = async () => {
    const errors = validateForm()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        agreed_to_terms: agreedToTerms,
      }
      const refCode = getReferralCode()
      if (refCode) {
        payload.influencer_code = refCode
      }
      await otpSignup(payload)
      setOtpOpen(true)
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.full_name) {
        setFormErrors((prev) => ({ ...prev, fullName: errorData.full_name[0] }))
      } else if (errorData?.email) {
        setFormErrors((prev) => ({ ...prev, email: errorData.email[0] }))
      } else if (errorData?.password) {
        setFormErrors((prev) => ({ ...prev, password: errorData.password[0] }))
      } else if (error.code === 'TIMEOUT') {
        universalToast.error("Looks like it's taking too long. Please try again.")
        setOtpOpen(true)
      } else {
        universalToast.error(error.message || 'Signup failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const { renderGoogleButton, isReady } = useGoogleAuth(
    async (credential) => {
      const success = await googleLogin(credential, { influencerCode: getReferralCode() })
      if (success) {
        clearReferralCode()
        navigate(nextUrl)
      }
    },
  )

  useEffect(() => {
    if (isReady) {
      renderGoogleButton('google-signup-btn')
    }
  }, [isReady])

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-[#e2dbd2] bg-white px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Scrib</p>
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>


          <div className="mt-6 flex w-full flex-col items-center">
            <div id="google-signup-btn" className={`w-full max-w-[400px] flex justify-center ${!isReady ? 'hidden' : ''}`}></div>
            {!isReady && <GoogleButtonSkeleton />}
            <p className="mt-3 text-[11px] text-[#9a9289]">
              By signing up, you agree to our <Link to="/terms" className="underline hover:text-[#1f1f1f]">Terms</Link> and <Link to="/privacy" className="underline hover:text-[#1f1f1f]">Privacy Policy</Link>.
            </p>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-[#9a9289]">
            <span className="h-px flex-1 bg-[#eee6dc]" /> or <span className="h-px flex-1 bg-[#eee6dc]" />
          </div>

          <div className="space-y-3 text-left">
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            {formErrors.fullName ? (
              <p className="text-xs text-[#c05c5c]">{formErrors.fullName}</p>
            ) : null}
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {formErrors.email ? (
              <p className="text-xs text-[#c05c5c]">{formErrors.email}</p>
            ) : null}
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {formErrors.password ? (
              <p className="text-xs text-[#c05c5c]">{formErrors.password}</p>
            ) : null}
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {formErrors.confirmPassword ? (
              <p className="text-xs text-[#c05c5c]">{formErrors.confirmPassword}</p>
            ) : null}
            <label className="flex items-center gap-2 text-xs text-[#7b756d]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-[#d9d1c7]"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
              />
              <span>
                I agree to the <Link to="/terms" className="underline hover:text-[#1f1f1f]">Terms</Link> and <Link to="/privacy" className="underline hover:text-[#1f1f1f]">Privacy Policy</Link>
              </span>
            </label>
            {formErrors.agreedToTerms ? (
              <p className="text-xs text-[#c05c5c]">{formErrors.agreedToTerms}</p>
            ) : null}
          </div>

          <button
            onClick={handleSignup}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create account'}
          </button>

          <p className="mt-4 text-xs text-[#7b756d]">
            Already have an account?{' '}
            <Link to={`/login${location.search}`} className="font-semibold text-[#1f1f1f]">
              Log in
            </Link>
          </p>

          <p className="mt-4 text-[11px] text-[#9a9289]">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>

      <OtpModal
        open={otpOpen}
        email={email.trim()}
        onClose={() => setOtpOpen(false)}
        onVerified={(data) => {
          if (data?.access && data?.refresh) {
            clearReferralCode()
            setAuthSession({
              user: data.user,
              access: data.access,
              refresh: data.refresh,
            })
            navigate(nextUrl)
          }
        }}
      />
    </div>
  )
}

export default SignupPage
