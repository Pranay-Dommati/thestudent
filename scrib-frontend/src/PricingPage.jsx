import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'

const tiers = [
  {
    id: 'starter',
    price: 'Rs 49',
    credits: '10 credits',
    helper: '10 PDF pages',
    highlight: false,
  },
  {
    id: 'standard',
    price: 'Rs 99',
    credits: '20 credits',
    helper: '20 PDF pages',
    tag: 'Best value - Rs 4.95/page',
    highlight: true,
  },
  {
    id: 'power',
    price: 'Rs 199',
    credits: '40 credits',
    helper: '40 PDF pages',
    highlight: false,
  },
]

const faqs = [
  {
    id: 'expire',
    question: 'Do credits expire?',
    answer: 'Never. Buy once, use whenever - even months later.',
  },
  {
    id: 'count',
    question: 'What counts as 1 credit?',
    answer: 'One page inside a PDF. A 3-page PDF costs 3 credits.',
  },
  {
    id: 'redownload',
    question: 'Can I re-download a note I already generated?',
    answer: 'Yes - from your dashboard, at no extra cost. You only pay once per generation.',
  },
]

const PricingPage = () => {
  const { user, logout, isLoggedIn } = useAuth()

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold">Scrib</Link>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/pricing" className="hover:text-[#1f1f1f]">Pricing</Link>
          </nav>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3]">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-[#d9d1c7] bg-white px-3 py-1 text-xs font-semibold hover:bg-[#faf8f3]"
              >
                Log out
              </button>
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
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold">
                Log in
              </Link>
              <Link to="/signup" className="rounded-full border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white">
                Get started free
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-semibold md:text-4xl">Simple, pay-as-you-go pricing</h1>
          <p className="mt-3 text-sm text-[#7b756d]">
            No subscriptions. Buy credits once, use whenever. Credits never expire.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border bg-white p-6 ${
                tier.highlight ? 'border-[#1f1f1f]' : 'border-[#e2dbd2]'
              }`}
            >
              {tier.highlight ? (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f1f1f] px-3 py-1 text-[10px] font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <div className="text-2xl font-semibold">{tier.price}</div>
              <p className="text-xs text-[#7b756d]">/ pack</p>
              <p className="mt-4 text-sm font-semibold">{tier.credits}</p>
              {tier.tag ? (
                <span className="mt-2 inline-flex rounded-full bg-[#e9f1dc] px-3 py-1 text-[11px] font-semibold text-[#56733a]">
                  {tier.tag}
                </span>
              ) : null}
              <p className="mt-3 text-xs text-[#7b756d]">{tier.helper}</p>
              <button className="mt-6 w-full rounded-lg border border-[#d9d1c7] bg-white px-4 py-2 text-sm font-semibold">
                Buy pack
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#7b756d]">
          New here? Explore free previews and see exactly what your notes will look like.
        </p>

        <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-4 py-3 text-xs text-[#6f6a63]">
          Payments via UPI / Razorpay - Secure - Credits added instantly after payment - No auto-renewal, ever
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold">Common questions</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id}>
                <p className="text-sm font-semibold">{faq.question}</p>
                <p className="mt-1 text-sm text-[#7b756d]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PricingPage
