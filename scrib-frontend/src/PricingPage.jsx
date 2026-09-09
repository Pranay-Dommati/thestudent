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
    id: 'try',
    price: '₹19',
    credits: '2 credits',
    helper: '2 PDF pages',
    highlight: false,
  },
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
    tag: 'Most popular',
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
      navigate('/login?next=/pricing')
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
        const params = new URLSearchParams(window.location.search)
        const nextUrl = params.get('next')
        if (nextUrl) {
          navigate(nextUrl)
        }
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
              "@type": "SoftwareApplication",
              "name": "Scrib by EasyLearnova",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "WebBrowser",
              "description": "AI-powered tool that converts your typed study topics into handwritten exam notes.",
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
            <Link to="/library" className="hover:text-[#1f1f1f]">Library</Link>
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
              <Link to="/login?next=/pricing" className="hidden rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-xs font-semibold md:inline-block">
                Log in
              </Link>
              <Link to="/signup?next=/pricing" className="hidden rounded-full border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-xs font-semibold text-white md:inline-block">
                Get started free
              </Link>
              <MobileMenu isLoggedIn={isLoggedIn} user={user} logout={logout} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple, pay-as-you-go pricing</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#7b756d]">
            Buy credits when you need them. They never expire, and there's no subscription.
          </p>
          <p className="mt-4 text-sm text-[#7b756d]">
            New here?{' '}
            <Link to="/library" className="font-semibold text-[#1f1f1f] underline underline-offset-4 hover:text-[#4e8c3a] transition-colors">
              Browse 50+ free note previews →
            </Link>
          </p>
        </div>

        <div className="mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                tier.highlight ? 'border-black shadow-sm' : 'border-[#e2dbd2]'
              }`}
            >
              {tier.tag ? (
                <span className="absolute -top-2.5 left-6 rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f0c06a] ring-4 ring-white">
                  {tier.tag}
                </span>
              ) : null}

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-[#1f1f1f]">{tier.price}</span>
                <span className="text-sm text-[#9a9289]">/ pack</span>
              </div>

              <div className="mt-5">
                <p className="text-base font-semibold text-[#1f1f1f]">{tier.credits}</p>
                <p className="mt-0.5 text-[13px] text-[#8a847c]">{tier.helper}</p>
              </div>

              <button
                id={`pricing-buy-${tier.id}`}
                onClick={() => handleBuyClick(tier.id)}
                disabled={processingPack === tier.id}
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  tier.highlight
                    ? 'bg-[#1a1a1a] text-white hover:bg-[#333333]'
                    : 'border border-[#e2dbd2] bg-white text-[#1f1f1f] hover:bg-[#f7f4ee]'
                }`}
              >
                {processingPack === tier.id
                  ? 'Processing…'
                  : isLoggedIn
                    ? 'Buy pack'
                    : 'Sign in to buy'}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#9a9289]">
          Secure UPI / Razorpay checkout · Credits added instantly · No auto-renewal
        </p>

        {/* Enterprise — bulk / whole-batch needs are handled over email, not checkout */}
        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-[#1f1f1f] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1f1f1f]">Need notes at scale?</p>
            <p className="mt-0.5 text-xs text-[#7b756d]">
              Bulk credits, flexible invoicing, and dedicated support for your institution or organization.
            </p>
          </div>
          <Link
            to="/enterprise"
            className="flex-shrink-0 rounded-full border border-[#1f1f1f] bg-white px-4 py-2 text-xs font-semibold text-[#1f1f1f] transition-colors hover:bg-[#1f1f1f] hover:text-white whitespace-nowrap"
          >
            Contact us →
          </Link>
        </div>

        <div className="mt-14 mx-auto max-w-2xl">
          <h2 className="text-center text-lg font-semibold text-[#1f1f1f]">Common questions</h2>
          <dl className="mt-6 divide-y divide-[#eee7dd] border-y border-[#eee7dd]">
            {faqs.map((faq) => (
              <div key={faq.id} className="py-4">
                <dt className="text-sm font-semibold text-[#1f1f1f]">{faq.question}</dt>
                <dd className="mt-1 text-sm text-[#7b756d]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>

      <footer className="border-t border-[#e4ddd4] bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#7b756d]">
          <p>&copy; {new Date().getFullYear()} EasyLearnova. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/support" className="hover:text-[#1f1f1f] transition-colors">Support</Link>
            <Link to="/enterprise" className="hover:text-[#1f1f1f] transition-colors">Enterprise</Link>
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
