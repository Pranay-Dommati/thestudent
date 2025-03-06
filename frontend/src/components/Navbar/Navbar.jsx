import React, { useState, useEffect } from 'react';

const Navbar = ({ initialStyle = "transparent" }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add this effect to reset scroll position when component mounts
  useEffect(() => {
    // Force scroll to top on initial load
    window.scrollTo(0, 0);
    
    // Force update isScrolled state 
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    // Call once immediately to set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate the background class based on scroll state and initialStyle
  let backgroundClass = '';
  if (isScrolled) {
    backgroundClass = 'bg-white shadow-md';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
  } else {
    backgroundClass = 'bg-transparent';
  }

  // Text color based on background
  const textColor = (isScrolled || initialStyle === 'light') 
    ? 'text-gray-700 hover:text-blue-600' 
    : 'text-white hover:text-blue-200';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${backgroundClass} ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className={`font-bold text-xl ${isScrolled || initialStyle === 'light' ? 'text-gray-800' : 'text-white'}`}>Students Hub</span>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className={`font-medium transition-colors ${textColor}`}>Home</a>
            <a href="/courses" className={`font-medium transition-colors ${textColor}`}>Courses</a>
            <a href="/chat" className={`font-medium transition-colors ${textColor}`}>AI Chatbot</a>
            <a href="#learning-hub" className={`font-medium transition-colors ${textColor}`}>Learning Hub</a>
            <div className="relative group">
              <a href="#more" className={`font-medium transition-colors flex items-center ${textColor}`}>
                More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                <div className="py-1">
                  <a href="#search" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Search</a>
                  <a href="#about" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">About Us</a>
                  <a href="#faq" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">FAQ</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className={`hidden md:block px-4 py-2 rounded-full font-medium transition-colors ${isScrolled || initialStyle === 'light' ? 'text-blue-600 border border-blue-600 hover:bg-blue-50' : 'text-white border border-white hover:bg-white hover:bg-opacity-10'}`}>Log In</button>
            <button className="hidden md:block px-4 py-2 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-shadow">Sign Up</button>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isScrolled || initialStyle === 'light' ? 'text-gray-800' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-xl">
            <a href="#home" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Home</a>
            <a href="courses" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Courses</a>
            <a href="/chat" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">AI Chatbot</a>
            <a href="#learning-hub" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Learning Hub</a>
            <a href="#search" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Search</a>
            <div className="mt-4 flex flex-col space-y-2 px-4">
              <button className="px-4 py-2 rounded-full text-blue-600 border border-blue-600 font-medium">Log In</button>
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium">Sign Up</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;