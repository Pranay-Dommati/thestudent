import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getShareStats } from '../services/shareService'

export default function ShareStatsBanner({ isLoggedIn, className = "mt-6" }) {
  const [sharingStats, setSharingStats] = useState(null)
  const [loadingSharingStats, setLoadingSharingStats] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn) {
      setLoadingSharingStats(false)
      return
    }

    const loadSharingStats = async () => {
      setLoadingSharingStats(true)
      try {
        const data = await getShareStats()
        setSharingStats(data)
      } catch {
        // Non-critical — silently ignore
      } finally {
        setLoadingSharingStats(false)
      }
    }
    loadSharingStats()
  }, [isLoggedIn])

  if (!isLoggedIn) return null

  // Don't show the "Share notes ->" link if we're already on the history tab
  const isHistoryTab = location.pathname === '/generate' && location.search.includes('tab=history')

  return (
    <div className={`${className} rounded-xl border border-[#e8eefb] bg-[#f0f5fd] overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d8e6f8]">
        <p className="text-sm font-bold text-[#4a6aa6]">Share & Earn Credits ✨</p>
        {!isHistoryTab && (
          <Link to="/generate?tab=history" className="text-xs font-semibold text-[#4a6aa6] hover:text-[#1f3a5f]">
            Share notes →
          </Link>
        )}
      </div>
      {loadingSharingStats ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4a6aa6] border-t-transparent" />
        </div>
      ) : sharingStats && sharingStats.notes_shared > 0 ? (
        <div className="grid grid-cols-3 divide-x divide-[#d8e6f8]">
          {[
            { label: 'Notes Shared', value: sharingStats.notes_shared },
            { label: 'Successful Purchases', value: sharingStats.successful_purchases },
            { label: 'Rewards Earned', value: `${parseFloat(sharingStats.rewards_earned || 0).toFixed(1)} ${sharingStats.reward_type}` },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-4 text-center">
              <p className="text-xl font-bold text-[#1f3a5f]">{value}</p>
              <p className="mt-0.5 text-[10px] text-[#5a7aae] uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-[#5a7aae]">
            Share your notes and earn credits when friends purchase through your link.
          </p>
        </div>
      )}
    </div>
  )
}
