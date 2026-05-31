import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Helmet } from 'react-helmet-async'
import { getInitials } from './utils/user'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import BuyCreditsModal from './components/BuyCreditsModal'
import { fetchPaymentHistory, startPaymentFlow } from './services/paymentService'
import customToast from './utils/customToast'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'plan', label: 'Plan and billing' },
]

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [processingPack, setProcessingPack] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const { user, logout, isLoggedIn, refreshUser } = useAuth()

  useEffect(() => {
    if (user?.full_name) {
      setEditFullName(user.full_name)
    }
  }, [user?.full_name])

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      customToast.error('Name cannot be empty')
      return
    }
    setIsSavingProfile(true)
    try {
      const axiosInstance = (await import('./utils/axios')).default
      await axiosInstance.patch('/auth/profile/', { full_name: editFullName.trim() })
      await refreshUser?.()
      customToast.success('Profile updated successfully')
      setIsEditingProfile(false)
    } catch (error) {
      customToast.error('Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleBuyClick = async (packId) => {
    if (processingPack) return
    setProcessingPack(packId)

    await startPaymentFlow({
      pack: packId,
      user,
      onSuccess: async ({ credit_balance, credits_added }) => {
        setProcessingPack(null)
        await refreshUser?.()
        
        // Refresh payment history if loaded
        if (historyLoaded) {
          setHistoryLoaded(false) // This will trigger loadPaymentHistory again
        }

        customToast.success(
          `🎉 ${credits_added} credits added! New balance: ${credit_balance} credits`,
          { duration: 4000 }
        )
      },
      onFailure: (message) => {
        setProcessingPack(null)
        customToast.error(message || 'Payment failed. Please try again.')
      },
      onDismiss: () => {
        setProcessingPack(null)
      },
    })
  }

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
    <div className="min-h-screen bg-[#fcf9f4] text-[#1f1f1f]">
      <Helmet>
        <title>Profile - Scrib</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <header className="border-b border-[#e2dbd2] bg-white/90">
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
            <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
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
              <Link to="/login" className="hidden sm:inline-flex rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold text-white">
                Get started free
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
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
                <div className="flex gap-2">
                  {isEditingProfile && (
                    <button
                      onClick={() => {
                        setIsEditingProfile(false)
                        setEditFullName(user?.full_name ?? '')
                      }}
                      className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1f]"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isEditingProfile) {
                        handleSaveProfile()
                      } else {
                        setIsEditingProfile(true)
                      }
                    }}
                    disabled={isSavingProfile}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      isEditingProfile 
                        ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white disabled:opacity-70' 
                        : 'border-[#d9d1c7] bg-white text-[#1f1f1f]'
                    }`}
                  >
                    {isSavingProfile ? 'Saving...' : isEditingProfile ? 'Save changes' : 'Edit profile'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Profile tab */}
          {activeSection === 'profile' ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Profile</h2>
                <p className="mt-1 text-xs text-[#7b756d]">Update your name.</p>
                <div className="mt-4 max-w-md">
                  <div>
                    <p className="text-xs text-[#7b756d]">Full name</p>
                    <input
                      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                        isEditingProfile
                          ? 'border border-[#e0d9ce] bg-white text-[#1f1f1f] focus:border-[#1f1f1f]'
                          : 'border border-transparent bg-[#faf8f3] text-[#7b756d]'
                      }`}
                      value={isEditingProfile ? editFullName : (user?.full_name ?? '')}
                      onChange={(e) => setEditFullName(e.target.value)}
                      readOnly={!isEditingProfile}
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-[#7b756d]">Email address (cannot be changed)</p>
                    <div className="mt-2 w-full rounded-lg px-3 py-2 text-sm border border-transparent bg-[#faf8f3] text-[#7b756d]">
                      {user?.email ?? ''}
                    </div>
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
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {[
                    { pack: 'starter', label: '10 cr', price: '₹59' },
                    { pack: 'popular', label: '20 cr', price: '₹99', highlight: true },
                    { pack: 'pro', label: '40 cr', price: '₹199' },
                  ].map((item) => (
                    <div
                      key={item.pack}
                      id={`profile-quick-buy-${item.pack}`}
                      onClick={() => handleBuyClick(item.pack)}
                      className={`relative flex cursor-pointer flex-row sm:flex-col items-center justify-between sm:justify-start rounded-xl border px-5 sm:px-0 py-4 transition-all hover:scale-[1.02] hover:shadow-sm ${
                        item.highlight ? 'border-[1.5px] border-[#1f1f1f] bg-[#faf8f3] shadow-sm' : 'border-[#e2dbd2] bg-white'
                      }`}
                    >
                      {item.highlight && (
                        <span className="absolute sm:-top-2 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto top-2 right-2 rounded-full bg-[#1f1f1f] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#f0c06a] ring-2 ring-white shadow-sm z-10">
                          BEST VALUE
                        </span>
                      )}
                      
                      <div className="flex flex-col items-start sm:items-center sm:mb-3 mt-1 sm:mt-0">
                        <span className="text-xl font-bold text-[#1f1f1f] leading-none mb-1 sm:mb-0">{item.price}</span>
                        <span className="text-sm font-medium text-[#7b756d]">{item.label}</span>
                      </div>

                      <button 
                        disabled={processingPack === item.pack}
                        className={`w-auto sm:w-3/4 rounded-lg px-6 sm:px-0 py-2 sm:py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                        item.highlight 
                          ? 'bg-[#1f1f1f] text-white hover:bg-black' 
                          : 'bg-[#f4f0ea] text-[#1f1f1f] hover:bg-[#e8e2d9]'
                      }`}>
                        {processingPack === item.pack ? '...' : 'Buy now'}
                      </button>
                    </div>
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


    </div>
  )
}

export default ProfilePage
