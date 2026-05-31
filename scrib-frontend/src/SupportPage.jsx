import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import customToast from './utils/customToast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const SupportPage = () => {
  const { user, isLoggedIn, logout } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      customToast.error('Please fill in all required fields.')
      return
    }
    
    if (!isLoggedIn && !formData.email.trim()) {
      customToast.error('Please provide an email address so we can reply.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (isLoggedIn) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`
      }
      
      const res = await fetch(`${API_BASE}/scrib/support/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (data.success) {
        customToast.success(data.message || 'Message sent successfully!')
        setFormData(prev => ({ ...prev, subject: '', message: '' }))
      } else {
        customToast.error(data.message || 'Failed to send message.')
      }
    } catch (err) {
      customToast.error('Network error. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f] flex flex-col">
      <Helmet>
        <title>Help & Support - Scrib</title>
      </Helmet>
      
      {/* Header */}
      <header className="border-b border-[#e4ddd4] bg-white/90 sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Support' },
            ]} />
          </div>
          
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
          </nav>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex">
                Dashboard
              </Link>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} credits
              </span>
              <Link
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold transition-colors hover:bg-[#f5f2ec]"
                title="Profile"
              >
                {getInitials(user?.full_name)}
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold md:inline-block">
                Log in
              </Link>
              <Link to="/signup" className="hidden rounded-full border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white md:inline-block">
                Get started free
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-6">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-[#e2dbd2] shadow-sm p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">How can we help?</h1>
            <p className="mt-2 text-sm text-[#7b756d]">
              Have a question, feedback, or need help with a payment? Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoggedIn && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold mb-1">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-3 py-2 text-sm focus:border-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f] transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-3 py-2 text-sm focus:border-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f] transition-all"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="subject" className="block text-xs font-semibold mb-1">Subject <span className="text-red-500">*</span></label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-3 py-2 text-sm focus:border-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f] transition-all"
              >
                <option value="" disabled>Select a topic...</option>
                <option value="General Question">General Question</option>
                <option value="Payment / Credits Issue">Payment / Credits Issue</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold mb-1">Message <span className="text-red-500">*</span></label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-3 py-2 text-sm focus:border-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f] transition-all resize-y"
                placeholder="How can we help you today?"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-xl bg-[#1f1f1f] py-3 text-sm font-semibold text-white transition-all hover:bg-[#333] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4ddd4] bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-[#7b756d]">
          <div className="mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SupportPage
