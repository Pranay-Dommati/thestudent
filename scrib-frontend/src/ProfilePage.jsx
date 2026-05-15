import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'plan', label: 'Plan and billing' },
  { id: 'security', label: 'Security' },
  { id: 'notes', label: 'My notes' },
  { id: 'preview', label: 'Note preview' },
  { id: 'verify', label: 'Verify email' },
  { id: 'payment-failed', label: 'Payment failed' },
  { id: 'terms', label: 'Terms of service' },
]

const historyRows = [
  { id: 'h1', date: 'May 01, 2026', credits: '10', amount: 'Rs 49', status: 'Paid' },
  { id: 'h2', date: 'Apr 18, 2026', credits: '20', amount: 'Rs 99', status: 'Paid' },
  { id: 'h3', date: 'Mar 05, 2026', credits: '40', amount: 'Rs 199', status: 'Paid' },
]

const notes = [
  { id: 'n1', title: "Dijkstra's Algorithm", label: 'Note', tone: 'blue' },
  { id: 'n2', title: 'Cloud Computing', label: 'PDF', tone: 'mint' },
  { id: 'n3', title: 'Krebs Cycle', label: 'Note', tone: 'rose' },
  { id: 'n4', title: 'SQL Joins', label: 'PDF', tone: 'sand' },
  { id: 'n5', title: 'Thermodynamics', label: 'Note', tone: 'gold' },
]

const toneColors = {
  blue: 'bg-[#7ba7ff]',
  mint: 'bg-[#86c4b5]',
  rose: 'bg-[#c48e9a]',
  sand: 'bg-[#d1b98a]',
  gold: 'bg-[#cbb58e]',
}

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const { user, logout, isLoggedIn } = useAuth()

  const activeLabel = useMemo(
    () => sections.find((section) => section.id === activeSection)?.label || 'Profile',
    [activeSection],
  )

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold"
              >
                Log out
              </button>
              <span className="rounded-full border border-[#dbe8c3] bg-[#eef7df] px-3 py-1 text-xs font-semibold text-[#557a3f]">
                {user?.credit_balance ?? 0} credits
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2dbd2] bg-white text-xs font-semibold">
                {getInitials(user?.full_name)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row">
        <aside className="w-full md:w-56">
          <div className="rounded-2xl border border-[#e2dbd2] bg-white p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Account</p>
            <div className="mt-2 flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
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
                  <div>
                    <p className="text-xs text-[#7b756d]">Phone</p>
                    <input
                      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditingProfile
                          ? 'border border-[#e0d9ce] bg-white text-[#1f1f1f]'
                          : 'border-transparent bg-[#faf8f3] text-[#7b756d] hover:bg-[#f3f0e8]'
                      }`}
                      defaultValue="+91 98765 43210"
                      readOnly={!isEditingProfile}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-[#7b756d]">Timezone</p>
                    <input
                      className={`mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none ${
                        isEditingProfile
                          ? 'border border-[#e0d9ce] bg-white text-[#1f1f1f]'
                          : 'border-transparent bg-[#faf8f3] text-[#7b756d] hover:bg-[#f3f0e8]'
                      }`}
                      defaultValue="Asia/Kolkata"
                      readOnly={!isEditingProfile}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f2d8d8] bg-[#fff7f7] px-6 py-5">
                <h2 className="text-sm font-semibold">Close account</h2>
                <p className="mt-1 text-xs text-[#a06f6f]">
                  This will delete your credits, notes, and billing history.
                </p>
                <button className="mt-4 rounded-full border border-[#e6b7b7] bg-white px-4 py-2 text-xs font-semibold text-[#a06f6f]">
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
                  <button className="rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
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

          {activeSection === 'security' ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e2dbd2] bg-[#faf8f3] text-lg">
                  1
                </div>
                <h2 className="mt-4 text-sm font-semibold">Reset password</h2>
                <p className="mt-1 text-xs text-[#7b756d]">Use your email to reset your password.</p>
                <button className="mt-4 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Send reset link
                </button>
              </div>
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e2dbd2] bg-[#faf8f3] text-lg">
                  1
                </div>
                <h2 className="mt-4 text-sm font-semibold">Check your inbox</h2>
                <p className="mt-1 text-xs text-[#7b756d]">We sent a reset link to your email.</p>
                <button className="mt-4 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Open email app
                </button>
              </div>
              <div className="rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e2dbd2] bg-[#faf8f3] text-lg">
                  1
                </div>
                <h2 className="mt-4 text-sm font-semibold">Password changed</h2>
                <p className="mt-1 text-xs text-[#7b756d]">You can now log in with your new password.</p>
                <button className="mt-4 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Back to login
                </button>
              </div>
            </div>
          ) : null}

          {activeSection === 'notes' ? (
            <div className="mt-6 rounded-2xl border border-[#e2dbd2] bg-white px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">My notes</h2>
                <button className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold">
                  View all
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-[#e2dbd2] bg-[#fbfaf7] p-3">
                    <div className="rounded-lg border border-[#e7dfd4] bg-white p-3">
                      <div className={`h-1.5 w-4/5 rounded-full ${toneColors[note.tone]}`} />
                      <div className={`mt-2 h-1.5 w-3/4 rounded-full ${toneColors[note.tone]}`} />
                      <div className={`mt-2 h-1.5 w-2/3 rounded-full ${toneColors[note.tone]}`} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{note.title}</p>
                        <p className="text-xs text-[#7b756d]">Just now</p>
                      </div>
                      <span className="rounded-full border border-[#e2dbd2] bg-white px-2 py-1 text-[10px] font-semibold text-[#6b655d]">
                        {note.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeSection === 'preview' ? (
            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white p-6">
                <h2 className="text-sm font-semibold">Note preview</h2>
                <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-[#e0d9ce] bg-[#fbfaf7] py-10">
                  <div className="w-40 rounded-lg border border-[#e7dfd4] bg-white p-4">
                    <div className="h-2 w-4/5 rounded-full bg-[#d1b98a]" />
                    <div className="mt-2 h-2 w-3/4 rounded-full bg-[#d1b98a]" />
                    <div className="mt-2 h-2 w-2/3 rounded-full bg-[#d1b98a]" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e2dbd2] bg-white p-6">
                <p className="text-sm font-semibold">Dijkstra's Algorithm</p>
                <p className="mt-1 text-xs text-[#7b756d]">Check preview library</p>
                <div className="mt-4 space-y-3 text-xs text-[#7b756d]">
                  <div className="flex items-center justify-between">
                    <span>Format</span>
                    <span className="font-semibold text-[#1f1f1f]">PNG</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Credits</span>
                    <span className="font-semibold text-[#1f1f1f]">1 credit</span>
                  </div>
                </div>
                <button className="mt-6 w-full rounded-xl bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white">
                  Generate now
                </button>
              </div>
            </div>
          ) : null}

          {activeSection === 'verify' ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e2dbd2] bg-white p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#e2dbd2] bg-[#faf8f3]">
                  1
                </div>
                <h2 className="mt-4 text-sm font-semibold">Verify your email</h2>
                <p className="mt-1 text-xs text-[#7b756d]">We sent a verification link to your email.</p>
                <button className="mt-4 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Resend email
                </button>
              </div>
              <div className="rounded-2xl border border-[#dbe8c3] bg-[#f4faef] p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#dbe8c3] bg-white">
                  1
                </div>
                <h2 className="mt-4 text-sm font-semibold">Email verified!</h2>
                <p className="mt-1 text-xs text-[#7b756d]">Your account is ready to go.</p>
                <button className="mt-4 rounded-full border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white">
                  Start generating notes
                </button>
              </div>
            </div>
          ) : null}

          {activeSection === 'payment-failed' ? (
            <div className="mt-6 rounded-2xl border border-[#f2d8d8] bg-[#fff7f7] p-6">
              <h2 className="text-sm font-semibold">Payment failed</h2>
              <p className="mt-1 text-xs text-[#a06f6f]">Your payment could not be completed. Please try again.</p>
              <div className="mt-4 rounded-xl border border-[#f0caca] bg-white p-4">
                <p className="text-xs text-[#7b756d]">Reason</p>
                <p className="mt-1 text-sm font-semibold text-[#a06f6f]">Insufficient balance</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Try again
                </button>
                <button className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                  Use UPI instead
                </button>
              </div>
            </div>
          ) : null}

          {activeSection === 'terms' ? (
            <div className="mt-6 rounded-2xl border border-[#e2dbd2] bg-white p-6">
              <h2 className="text-sm font-semibold">Terms of service</h2>
              <div className="mt-3 space-y-3 text-sm text-[#6f6a63]">
                <p>1. Credits are non-transferable and are used only for generating notes.</p>
                <p>2. Payments are processed securely via UPI / Razorpay.</p>
                <p>3. Generated notes are personal-use only for educational purposes.</p>
                <p>4. We may update these terms from time to time with notice.</p>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default ProfilePage
