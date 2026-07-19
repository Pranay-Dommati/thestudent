import { useEffect, useState } from 'react'
import customToast from '../utils/customToast'

export default function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      customToast.success('✓ Connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .net-indicator { animation: fadeInDown 0.3s ease-out; }
      `}</style>
      <div className="net-indicator fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none p-2">
        <div className="bg-[#1f1f1f] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto border border-white/10">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="#f59e0b" d="M12 20h.01"/>
            <path stroke="#f59e0b" d="M8.5 16.429a5 5 0 0 1 7 0"/>
            <path stroke="#f59e0b" d="M5 12.859a10 10 0 0 1 14 0"/>
            <path stroke="#f59e0b" d="M1.5 9.289a15 15 0 0 1 21 0"/>
            <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2.5" />
          </svg>
          You are offline. Please check your connection.
        </div>
      </div>
    </>
  )
}
