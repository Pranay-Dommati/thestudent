import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import universalToast from './utils/universalToast'
import GoogleButtonSkeleton from './components/GoogleButtonSkeleton'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, googleLogin, isLoggedIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState({})
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
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email format'
    }
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    return errors
  }

  const handleLogin = async () => {
    const errors = validateForm()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    const result = await login(email.trim(), password)
    setIsSubmitting(false)
    if (result?.success) {
      navigate(nextUrl)
    } else if (result?.suggestSignup) {
      universalToast.error('No account found with this email. Please sign up to continue.')
      navigate(`/signup${location.search}`)
    }
  }

  const { renderGoogleButton, isReady } = useGoogleAuth(
    async (credential) => {
      const success = await googleLogin(credential)
      if (success) {
        navigate(nextUrl)
      }
    },
  )

  useEffect(() => {
    if (isReady) {
      renderGoogleButton('google-login-btn')
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
          <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-[#7b756d]">Log in to access your notes and credits.</p>

          <div className="mt-6 flex w-full justify-center">
            <div id="google-login-btn" className={`w-full max-w-[400px] flex justify-center ${!isReady ? 'hidden' : ''}`}></div>
            {!isReady && <GoogleButtonSkeleton />}
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-[#9a9289]">
            <span className="h-px flex-1 bg-[#eee6dc]" /> or <span className="h-px flex-1 bg-[#eee6dc]" />
          </div>

          <div className="space-y-3 text-left">
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
          </div>

          <div className="mt-3 text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-[#7b756d] hover:text-[#1f1f1f]">
              Forgot password?
            </Link>
          </div>

          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white"
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>

          <p className="mt-4 text-xs text-[#7b756d]">
            Don't have an account?{' '}
            <Link to={`/signup${location.search}`} className="font-semibold text-[#1f1f1f]">
              Sign up free
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
