import React, { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import axiosInstance from './utils/axios'
import customToast from './utils/customToast'

const InfluencerDashboardPage = () => {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get(`/scrib/influencers/dashboard/${token}/`)
        if (response.data.success) {
          setData(response.data.data)
        } else {
          setError(response.data.message || 'Failed to load dashboard')
        }
      } catch (err) {
        setError('Failed to load dashboard. Invalid token or server error.')
      } finally {
        setLoading(false)
      }
    }
    
    if (token) {
      fetchDashboard()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">{error || 'Dashboard not found'}</p>
        </div>
      </div>
    )
  }

  const { stats, recent_referrals, recent_commissions } = data

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <Helmet>
        <title>Partner Dashboard | Scrib</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 px-6 sm:px-10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="font-semibold text-gray-700">{data.name}</span></p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
            <span className="text-sm font-medium">Your Link:</span>
            <code className="text-sm bg-white px-2 py-1 rounded font-mono border border-blue-200">
              https://scrib.easylearnova.com/invite/{data.referral_code}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`https://scrib.easylearnova.com/invite/${data.referral_code}`)
                customToast.success('Link copied!')
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors ml-1"
            >
              Copy
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 mt-8 space-y-8">
        {/* Status Warning */}
        {data.status !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl font-medium">
            Your partner account is currently {data.status}. Link tracking and commissions are paused.
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Total Link Clicks</p>
            <p className="text-3xl font-black text-gray-900">{stats.clicks}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Total Registered Users</p>
            <p className="text-3xl font-black text-gray-900">{stats.registered_users}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Paid Users (Converted)</p>
            <p className="text-3xl font-black text-gray-900">{stats.paid_users}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Revenue Generated (1st & 2nd payments)</p>
            <p className="text-3xl font-black text-gray-900">₹{stats.revenue_generated.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 bg-gradient-to-br from-white to-green-50">
            <p className="text-green-800 text-sm font-medium mb-1">Pending Commission</p>
            <p className="text-3xl font-black text-green-600">₹{stats.pending_commission.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Total Paid Out</p>
            <p className="text-3xl font-black text-gray-900">₹{stats.paid_commission.toFixed(2)}</p>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Recent Referrals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Recent Referrals</h3>
            </div>
            <div className="p-0 overflow-auto flex-1">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_referrals.length === 0 ? (
                    <tr><td colSpan="2" className="px-6 py-8 text-center text-gray-400">No referrals yet</td></tr>
                  ) : (
                    recent_referrals.map(ref => (
                      <tr key={ref.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{ref.user_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(ref.registered_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Commission History</h3>
            </div>
            <div className="p-0 overflow-auto flex-1">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_commissions.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No commissions yet</td></tr>
                  ) : (
                    recent_commissions.map(comm => (
                      <tr key={comm.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-900">₹{comm.commission_amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            comm.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(comm.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default InfluencerDashboardPage
