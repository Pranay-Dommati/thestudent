import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import Breadcrumb from './components/Breadcrumb'
import BuyCreditsModal from './components/BuyCreditsModal'
import { fetchPaymentHistory } from './services/paymentService'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'plan', label: 'Plan and billing' },
]

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [isClosingAccount, setIsClosingAccount] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const { user, logout, isLoggedIn, refreshUser } = useAuth()

  // Load payment history when the "Plan and billing" tab is opened
  const loadPaymentHistory = useCallback(async () => {
    if (historyLoaded) return
    setHistoryLoading(true)
    try {
      const data = await fetchPaymentHistory()
      setPaymentHistory(data)
      setHistoryLoaded(true)
    } catch {
      // Silently fail — table will show empty state
    } finally {
      setHistoryLoading(false)
    }
  }, [historyLoaded])

  useEffect(() => {
    if (activeSection === 'plan') {
      loadPaymentHistory()
    }
  }, [activeSection, loadPaymentHistory])

  const handleCloseAccount = async () => {
    setIsClosingAccount(true)
    try {
      const axiosInstance = (await import('./utils/axios')).default
      const customToast = (await import('./utils/customToast')).default
      await axiosInstance.delete('/auth/profile/')
      customToast.success('Account closed successfully.')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to close account', error)
      const customToast = (await import('./utils/customToast')).default
      customToast.error('Failed to close account. Please try again.')
      setIsClosingAccount(false)
      setShowCloseModal(false)
    }
  }

  const handlePaymentSuccess = async ({ credits_added, credit_balance }) => {
    // Refresh payment history list
    setHistoryLoaded(false)
    loadPaymentHistory()
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatAmount = (paise) => {
    const rupees = Math.round(paise / 100)
    return `₹${rupees}`
  }

  const activeLabel = useMemo(
    () => sections.find((s) => s.id === activeSection)?.label || 'Profile',
    [activeSection],
  )

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Profile' },
            ]} />
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex">
                Dashboard
              </Link>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} cr
              </span>
              <Link
                to="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold transition-colors hover:bg-[#f5f2ec]"
                title="Profile"
              >
                {getInitials(user?.full_name)}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                Get started free
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 md:py-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56">
          <div className="rounded-2xl border border-[#e2dbd2] bg-white p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Account</p>
            <div className="mt-1 flex flex-row gap-1 md:mt-2 md:flex-col">
              {sections.map((section) => (
                <button
                  key={section.id}
                  id={`profile-tab-${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold md:text-left ${
                    activeSection === section.id
                      ? 'bg-[#1f1f1f] text-white'
                      : 'text-[#6f6a63] hover:bg-[#f7f4ee]'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Section header */}
          <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Profile</p>
                <h1 className="mt-2 text-xl font-semibold">{activeLabel}</h1>
              </div>
              {activeSection === 'profile' ? (
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`rounded-full border border-[#d9d1c7] px-4 py-2 text-xs font-semibold ${
                    isEditingProfile ? 'bg-[#1f1f1f] text-white border-[#1f1f1f]' : 'bg-white'
                  }`}
                >
                  {isEditingProfile ? 'Save changes' : 'Edit profile'}
                </button>
              ) : null}
            </div>
          </div>

          {/* Profile tab */}
          {activeSection === 'profile' ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Profile</h2>
                <p className="mt-1 text-xs text-[#7b756d]">Update your name and contact details.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#7b756d]">Full name</p>
                    <input
                      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditingProfile
                          ? 'border border-[#e0d9ce] bg-white text-[#1f1f1f]'
                          : 'border-transparent bg-[#faf8f3] text-[#7b756d] hover:bg-[#f3f0e8]'
                      }`}
                      defaultValue={user?.full_name ?? ''}
                      readOnly={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-[#7b756d]">Email address</p>
                    <input
                      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditingProfile
                          ? 'border border-[#e0d9ce] bg-white text-[#1f1f1f]'
                          : 'border-transparent bg-[#faf8f3] text-[#7b756d] hover:bg-[#f3f0e8]'
                      }`}
                      defaultValue={user?.email ?? ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Account access</h2>
                <p className="mt-1 text-xs text-[#7b756d]">Sign out of your account on this device.</p>
                <button
                  onClick={logout}
                  className="mt-4 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#faf8f3] transition-colors"
                >
                  Log out
                </button>
              </div>

              <div className="rounded-2xl border border-[#f2d8d8] bg-[#fff7f7] px-6 py-5">
                <h2 className="text-sm font-semibold text-[#a74c4c]">Close account</h2>
                <p className="mt-1 text-xs text-[#a06f6f]">
                  This will delete your credits, notes, and billing history permanently.
                </p>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="mt-4 rounded-full border border-[#e6b7b7] bg-white px-4 py-2 text-xs font-semibold text-[#a06f6f] hover:bg-[#fff0f0] transition-colors"
                >
                  Close account
                </button>
              </div>
            </div>
          ) : null}

          {/* Plan & Billing tab */}
          {activeSection === 'plan' ? (
            <div className="mt-6 space-y-4">
              {/* Credits card */}
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Credits</h2>
                    <p className="text-xs text-[#7b756d] mt-1">
                      Current balance:{' '}
                      <span className="font-semibold text-[#1f1f1f] text-base">{user?.credit_balance ?? 0}</span>{' '}
                      credits
                    </p>
                    <p className="text-xs text-[#9a9289] mt-1">1 credit = 1 PDF page generated</p>
                  </div>
                  <button
                    id="profile-buy-credits-btn"
                    onClick={() => setShowBuyModal(true)}
                    className="rounded-lg bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    + Buy credits
                  </button>
                </div>

                {/* Quick buy packs */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { pack: 'starter', label: '10 cr', price: '₹49' },
                    { pack: 'popular', label: '20 cr', price: '₹99', highlight: true },
                    { pack: 'pro', label: '40 cr', price: '₹199' },
                  ].map((item) => (
                    <button
                      key={item.pack}
                      id={`profile-quick-buy-${item.pack}`}
                      onClick={() => setShowBuyModal(true)}
                      className={`relative flex flex-col items-center rounded-xl border py-3 text-center transition-colors hover:bg-[#faf8f3] ${
                        item.highlight ? 'border-[1.5px] border-[#1f1f1f] bg-[#faf8f3]' : 'border-[#e2dbd2] bg-white'
                      }`}
                    >
                      {item.highlight && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#1f1f1f] px-1.5 py-0.5 text-[9px] font-semibold text-[#f0c06a] ring-2 ring-white">
                          Popular
                        </span>
                      )}
                      <span className="text-base font-semibold">{item.price}</span>
                      <span className="text-xs text-[#7b756d]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment history */}
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Payment history</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-[#eee6dc]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf8f3] text-[#7b756d]">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Credits</th>
                        <th className="px-3 py-2.5">Amount</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-[#9a9289]">
                            <span className="inline-flex items-center gap-2">
                              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Loading...
                            </span>
                          </td>
                        </tr>
                      ) : paymentHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-[#9a9289]">
                            No payments yet. Buy your first credit pack above!
                          </td>
                        </tr>
                      ) : (
                        paymentHistory.map((row) => (
                          <tr key={row.id} className="border-t border-[#eee6dc]">
                            <td className="px-3 py-2.5">{formatDate(row.created_at)}</td>
                            <td className="px-3 py-2.5 font-medium">{row.credits_added} cr</td>
                            <td className="px-3 py-2.5">{formatAmount(row.amount)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                row.status === 'paid'
                                  ? 'bg-[#eef7df] text-[#557a3f]'
                                  : row.status === 'failed'
                                  ? 'bg-[#fff0f0] text-[#a74c4c]'
                                  : 'bg-[#f0ece5] text-[#7b756d]'
                              }`}>
                                {row.status === 'paid' ? 'Paid' : row.status === 'failed' ? 'Failed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-4 py-3 text-xs text-[#6f6a63]">
                Payments via UPI / Razorpay · Secure · Credits added instantly after payment · No auto-renewal, ever
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Close Account Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#e2dbd2] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#c05c5c]">Close Account</h3>
            <div className="mt-3 rounded-lg border border-[#f2d8d8] bg-[#fff7f7] p-3">
              <p className="text-sm font-semibold text-[#a06f6f]">Warning: This action is irreversible.</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-[#a06f6f]">
                <li>You will lose access to all generated PDF notes.</li>
                <li>Your remaining credits ({user?.credit_balance ?? 0}) will be permanently deleted.</li>
                <li>There are no refunds for unused credits.</li>
              </ul>
            </div>
            <p className="mt-4 text-sm text-[#1f1f1f] font-medium">Are you absolutely sure you want to proceed?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={isClosingAccount}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseAccount}
                disabled={isClosingAccount}
                className="rounded-lg bg-[#c05c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a74c4c] transition-colors"
              >
                {isClosingAccount ? 'Closing...' : 'Yes, close my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
