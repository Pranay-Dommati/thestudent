import { useState } from 'react'
import { Link } from 'react-router-dom'

const MobileMenu = ({ isLoggedIn, user, logout }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Hamburger Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="ml-1 p-1.5 text-[#5f5a54] transition-colors hover:text-[#1f1f1f]"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="17" x2="20" y2="17"></line>
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[60px] w-full border-b border-[#e4ddd4] bg-white shadow-lg z-50">
          <nav className="flex flex-col px-6 py-4">
            <Link 
              to="/previews" 
              className="py-3 text-sm font-semibold text-[#1f1f1f] border-b border-[#f5f2ec]"
              onClick={() => setIsOpen(false)}
            >
              Previews
            </Link>
            <Link 
              to="/pricing" 
              className="py-3 text-sm font-semibold text-[#1f1f1f] border-b border-[#f5f2ec]"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="py-3 text-sm font-semibold text-[#1f1f1f] border-b border-[#f5f2ec]"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/generate?tab=history" 
                  className="py-3 text-sm font-semibold text-[#1f1f1f] border-b border-[#f5f2ec]"
                  onClick={() => setIsOpen(false)}
                >
                  My Scribs
                </Link>
                <Link 
                  to="/profile" 
                  className="py-3 text-sm font-semibold text-[#1f1f1f] border-b border-[#f5f2ec]"
                  onClick={() => setIsOpen(false)}
                >
                  Profile ({user?.credit_balance ?? 0} cr)
                </Link>
                <button 
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="py-3 text-left text-sm font-semibold text-[#d9534f]"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <Link 
                  to="/login" 
                  className="w-full rounded-lg border border-[#d9d1c7] bg-white py-2 text-center text-sm font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="w-full rounded-lg bg-[#1f1f1f] py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Get started free
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}

export default MobileMenu
