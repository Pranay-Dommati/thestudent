import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'

const inr = (n) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const StatCard = ({ label, value, accent }) => (
  <div
    className={`rounded-2xl border p-4 sm:p-5 ${
      accent
        ? 'border-green-200 bg-gradient-to-br from-white to-green-50'
        : 'border-gray-100 bg-white'
    }`}
  >
    <p className="text-[13px] font-medium leading-snug text-gray-500">{label}</p>
    <p className={`mt-1.5 text-xl font-black sm:text-2xl ${accent ? 'text-green-600' : 'text-gray-900'}`}>
      {value}
    </p>
  </div>
)

const InfluencerDashboardPage = () => {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    let active = true
    setLoading(true)
    axiosInstance
      .get(`/scrib/influencers/dashboard/${token}/`)
      .then((res) => {
        if (!active) return
        if (res.data?.success) setData(res.data.data)
        else setError(res.data?.message || 'Failed to load dashboard')
      })
      .catch((err) => {
        if (!active) return
        setError(
          err.response?.status === 404
            ? 'This dashboard link is invalid or has been revoked.'
            : 'Something went wrong loading your dashboard. Please try again.'
        )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">🔒</div>
          <h2 className="mb-1 text-lg font-bold text-gray-900">Can't open this dashboard</h2>
          <p className="text-sm text-gray-500">{error || 'Dashboard not found'}</p>
        </div>
      </div>
    )
  }

  const stats = data.stats || {}
  const referrals = data.recent_referrals || []
  const commissions = data.recent_commissions || []
  const referralLink = `${window.location.origin}/invite/${data.referral_code}`

  const copyLink = () => {
    navigator.clipboard?.writeText(referralLink).then(
      () => customToast.success('Referral link copied'),
      () => customToast.error('Could not copy — long-press to copy manually')
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans text-gray-900">
      <Helmet>
        <title>Partner Dashboard | Scrib</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Scrib Partners</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight sm:text-2xl">Partner Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-700">{data.name}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-5 sm:px-6 sm:pt-8 sm:space-y-8">
        {/* Status warning */}
        {data.status !== 'active' && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
            Your partner account is currently <strong>{data.status}</strong>. Link tracking and new
            commissions are paused.
          </div>
        )}

        {/* Referral link */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Your referral link
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800">
              {referralLink}
            </code>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Copy link
            </button>
          </div>
          <p className="mt-2 text-xs text-blue-700/80">
            {data.commission_eligible_payments === 1
              ? 'Share this link. You earn on the first payment of every user who signs up through it.'
              : `Share this link. You earn on the first ${data.commission_eligible_payments ?? 2} payments of every user who signs up through it.`}
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard label="Link clicks" value={stats.clicks ?? 0} />
          <StatCard label="Registered users" value={stats.registered_users ?? 0} />
          <StatCard label="Paid users" value={stats.paid_users ?? 0} />
          <StatCard label="Revenue generated" value={inr(stats.revenue_generated)} />
          <StatCard label="Pending commission" value={inr(stats.pending_commission)} accent />
          <StatCard label="Paid out" value={inr(stats.paid_commission)} />
        </section>

        <p className="text-xs text-gray-400">
          Commissions are reviewed and paid out manually by the Scrib team. Reach out if you have
          questions about a payout.
        </p>

        {/* Lists */}
        <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Recent referrals */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <h3 className="border-b border-gray-100 px-4 py-3.5 text-sm font-bold text-gray-900 sm:px-5">
              Recent referrals
            </h3>
            {referrals.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">No referrals yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {referrals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <span className="truncate text-sm font-medium text-gray-900">{r.user_name}</span>
                    <span className="shrink-0 text-xs text-gray-500">{fmtDate(r.registered_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Commission history */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <h3 className="border-b border-gray-100 px-4 py-3.5 text-sm font-bold text-gray-900 sm:px-5">
              Commission history
            </h3>
            {commissions.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">No commissions yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {commissions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{inr(c.commission_amount)}</p>
                      <p className="text-xs text-gray-400">{fmtDate(c.created_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                        c.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : c.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default InfluencerDashboardPage
