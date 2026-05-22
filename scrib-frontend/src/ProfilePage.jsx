import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import Breadcrumb from './components/Breadcrumb'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'plan', label: 'Plan and billing' },
]

const historyRows = [
  { id: 'h1', date: 'May 01, 2026', credits: '10', amount: 'Rs 49', status: 'Paid' },
  { id: 'h2', date: 'Apr 18, 2026', credits: '20', amount: 'Rs 99', status: 'Paid' },
  { id: 'h3', date: 'Mar 05, 2026', credits: '40', amount: 'Rs 199', status: 'Paid' },
]



const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [isClosingAccount, setIsClosingAccount] = useState(false)
  const { user, logout, isLoggedIn } = useAuth()
  
  const handleCloseAccount = async () => {
    setIsClosingAccount(true)
    try {
      const axiosInstance = (await import('./utils/axios')).default
      const customToast = (await import('./utils/customToast')).default
      
      await axiosInstance.delete('/auth/profile/')
      customToast.success('Account closed successfully.')
      
      // Force logout without confirmation modal
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

  const buyPack = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/payments/create-order/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pack: "popular"
          })
        }
      )

      const data = await response.json()

      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        name: "Scrib",
        description: "20 Credits",
        order_id: data.order_id,
        handler: async function (response) {
          console.log("SUCCESS")
          console.log(response)
          alert("Payment successful")
        }
      }

      const razor = new window.Razorpay(options)
      razor.open()
    } catch (err) {
      console.error("Payment initiation failed", err)
      alert("Payment failed to start")
    }
  }

  const activeLabel = useMemo(
    () => sections.find((section) => section.id === activeSection)?.label || 'Profile',
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
              <button
                onClick={logout}
                className="hidden rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3] sm:inline-flex"
              >
                Log out
              </button>
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
        <aside className="w-full md:w-56">
          <div className="rounded-2xl border border-[#e2dbd2] bg-white p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Account</p>
            <div className="mt-1 flex flex-row gap-1 md:mt-2 md:flex-col">
              {sections.map((section) => (
                <button
                  key={section.id}
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

        <section className="flex-1">
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
                      defaultValue={user?.full_name ?? 'Arjun Sharma'}
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
                      defaultValue={user?.email ?? 'arjun@college.edu'}
                      readOnly={!isEditingProfile}
                    />
                  </div>

                </div>
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

          {activeSection === 'plan' ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Credits</h2>
                    <p className="text-xs text-[#7b756d]">Current balance: {user?.credit_balance ?? 0} credits</p>
                  </div>
                  <button onClick={buyPack} className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#faf8f3]">
                    Buy credits
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Billing history</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-[#eee6dc]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#faf8f3] text-[#7b756d]">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Credits</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row) => (
                        <tr key={row.id} className="border-t border-[#eee6dc]">
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2">{row.credits}</td>
                          <td className="px-3 py-2">{row.amount}</td>
                          <td className="px-3 py-2 text-[#2b7a4b]">{row.status}</td>
                          <td className="px-3 py-2">
                            <button className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-[11px] font-semibold">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
                <h2 className="text-sm font-semibold">Payment method</h2>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eee6dc] px-4 py-3">
                  <div>
                    <p className="text-xs text-[#7b756d]">UPI</p>
                    <p className="text-sm font-semibold">arjun@upi</p>
                  </div>
                  <button className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-[11px] font-semibold">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : null}

        </section>
      </main>

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
