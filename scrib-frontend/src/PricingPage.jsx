import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './context/AuthContext'
import { getInitials } from './utils/user'
import Breadcrumb from './components/Breadcrumb'
import MobileMenu from './components/MobileMenu'
import BuyCreditsModal from './components/BuyCreditsModal'
import { startPaymentFlow } from './services/paymentService'
import customToast from './utils/customToast'

// Pack IDs must match the backend CREDIT_PACKS keys exactly
const tiers = [
  {
    id: 'starter',
    price: '₹89',
    credits: '10 credits',
    helper: '10 PDF pages',
    highlight: false,
  },
  {
    id: 'popular',
    price: '₹169',
    credits: '20 credits',
    helper: '20 PDF pages',
    tag: 'Best value — ₹8.45/page',
    highlight: true,
  },
  {
    id: 'pro',
    price: '₹319',
    credits: '40 credits',
    helper: '40 PDF pages',
    highlight: false,
  },
]

const faqs = [
  {
    id: 'expire',
    question: 'Do credits expire?',
    answer: 'Never. Buy once, use whenever — even months later.',
  },
  {
    id: 'count',
    question: 'What counts as 1 credit?',
    answer: 'One page inside a PDF. A 3-page PDF costs 3 credits.',
  },
  {
    id: 'redownload',
    question: 'Can I re-download a note I already generated?',
    answer: 'Yes — from your dashboard, at no extra cost. You only pay once per generation.',
  },
]

const PricingPage = () => {
  const { user, refreshUser, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [processingPack, setProcessingPack] = useState(null)

  const handleBuyClick = async (packId) => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (processingPack) return
    setProcessingPack(packId)

    await startPaymentFlow({
      pack: packId,
      user,
      onSuccess: async ({ credit_balance, credits_added }) => {
        setProcessingPack(null)
        await refreshUser?.()
        customToast.success(
          `🎉 ${credits_added} credits added! New balance: ${credit_balance} credits`,
          { duration: 4000 },
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

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f]">
      <Helmet>
        <title>Pricing - Scrib by EasyLearnova</title>
        <meta name="description" content="Affordable pay-as-you-go pricing for AI-generated handwritten exam notes. Start for free and buy credits as you need them." />
        <link rel="canonical" href="https://scrib.easylearnova.com/pricing" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Handwritten Notes Credits",
              "offers": {
                "@type": "Offer",
                "price": "169",
                "priceCurrency": "INR"
              }
            }
          `}
        </script>
      </Helmet>
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <img src="/scrib_favicon.svg" alt="Scrib" className="h-8 w-8 rounded-lg border border-[#e2dbd2] shadow-sm object-cover" />
            </Link>
            <Breadcrumb crumbs={[
              { label: 'Home', to: '/' },
              { label: 'Pricing' },
            ]} />
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#7b756d] md:flex">
            <Link to="/previews" className="hover:text-[#1f1f1f]">Previews</Link>
            <Link to="/generate" className="hover:text-[#1f1f1f]">Generate</Link>
            <Link to="/generate?tab=history" className="hover:text-[#1f1f1f]">My Scribs</Link>
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

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center px-4">
          <h1 className="text-2xl font-semibold md:text-3xl lg:text-4xl">Simple, pay-as-you-go pricing</h1>
          <p className="mt-3 text-sm text-[#7b756d]">
            No subscriptions. Buy credits once, use whenever. Credits never expire. Built to remain affordable while supporting AI generation and cloud processing.
          </p>
        </div>

        {/* Trust banner — see before you buy */}
        {/* Mobile: compact single row */}
        <div className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-[#e2dbd2] bg-[#fdfcf9] px-3 py-2.5 sm:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4e8c3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <p className="text-[11px] text-[#5f5a54] truncate">New here? See the notes before buying</p>
          </div>
          <Link
            to="/previews"
            className="flex-shrink-0 rounded-full border border-[#1f1f1f] px-3 py-1 text-[11px] font-semibold text-[#1f1f1f] hover:bg-[#1f1f1f] hover:text-white transition-colors"
          >
            Preview →
          </Link>
        </div>
        {/* Desktop: full card */}
        <div className="mt-6 hidden sm:flex flex-row items-center justify-between gap-3 rounded-2xl border border-[#e2dbd2] bg-[#fdfcf9] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#f0f9eb] border border-[#cce8ba]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4e8c3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1f1f1f]">New here? See exactly what you're paying for</p>
              <p className="mt-0.5 text-xs text-[#7b756d]">Browse 50+ free handwritten note previews — no account needed. Verify the quality before spending a single rupee.</p>
            </div>
          </div>
          <Link
            to="/previews"
            className="flex-shrink-0 rounded-full border border-[#1f1f1f] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1f] hover:bg-[#1f1f1f] hover:text-white transition-colors whitespace-nowrap"
          >
            Browse free previews →
          </Link>
        </div>

        <div className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-3 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                tier.highlight ? 'border-[1.5px] border-black shadow-sm' : 'border-[#e2dbd2]'
              }`}
            >
              {tier.highlight ? (
                <span className="absolute -top-[10px] left-1/2 -translate-x-1/2 rounded-full bg-[#1a1a1a] ring-4 ring-white px-3 py-0.5 text-[11px] font-semibold text-[#f0c06a]">
                  Best value
                </span>
              ) : null}

              <div className="flex flex-col">
                <span className="text-4xl font-medium tracking-tight text-[#1f1f1f]">
                  {tier.price}
                </span>
                <span className="mt-1 text-sm text-[#5f5a54]">/ pack</span>
              </div>

              <div className="mt-6 flex flex-col">
                <span className="text-lg font-semibold text-[#1f1f1f]">{tier.credits}</span>
                {tier.tag ? (
                  <div className="mt-1">
                    <span className="inline-flex rounded-md bg-[#eef7df] px-1.5 py-0.5 text-[10px] font-semibold text-[#557a3f]">
                      {tier.tag}
                    </span>
                  </div>
                ) : null}
                <span className="mt-1 text-[13px] leading-snug text-[#5f5a54]">
                  {tier.helper}
                </span>
              </div>

              <div className="mt-auto pt-8">
                <button
                  id={`pricing-buy-${tier.id}`}
                  onClick={() => handleBuyClick(tier.id)}
                  disabled={processingPack === tier.id}
                  className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    tier.highlight
                      ? 'bg-[#1a1a1a] text-white hover:bg-[#333333]'
                      : 'border border-[#e2dbd2] bg-white text-[#1f1f1f] hover:bg-[#f7f4ee]'
                  } disabled:opacity-50`}
                >
                  {processingPack === tier.id ? 'Processing...' : isLoggedIn ? 'Buy pack' : 'Sign in to buy'}
                </button>
              </div>
            </div>
          ))}
        </div>



        <div className="mt-6 rounded-xl border border-[#e2dbd2] bg-[#faf8f3] px-4 py-3 text-xs text-[#6f6a63]">
          Payments via UPI / Razorpay · Secure · Credits added instantly after payment · No auto-renewal, ever
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

      <footer className="border-t border-[#e4ddd4] bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#7b756d]">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-[#1f1f1f] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}

export default PricingPage
