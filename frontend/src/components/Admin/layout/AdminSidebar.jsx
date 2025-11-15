import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaBars } from 'react-icons/fa';

const AdminSidebar = ({ menuItems, currentView, setCurrentView, isDarkMode, isMobileOpen, setIsMobileOpen, isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActiveItem = (item) => {
    if (location.pathname === item.path) {
      return true;
    }
    
    if (item.id === 'courses') {
      return location.pathname === '/admin-p' || location.pathname === '/admin-p/courses';
    }
    
    return currentView === item.id;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating toggle button when sidebar is closed */}
      {!isSidebarOpen && !isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed top-20 left-4 z-50 p-3 rounded-full shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 shadow-black/20' 
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-black/10'
          } transition-all duration-200`}
          aria-label="Open sidebar"
        >
          <FaBars className="h-5 w-5" />
        </button>
      )}

      {/* Mobile floating toggle when sidebar is closed */}
      {!isMobileOpen && isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className={`fixed top-20 left-4 z-50 p-3 rounded-full shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 shadow-black/20' 
              : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-black/10'
          } transition-all duration-200`}
          aria-label="Open sidebar"
        >
          <FaBars className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed
          top-16 
          left-0
          h-[calc(100vh-4rem)] 
          w-64
          shadow-xl z-50 
          transform transition-all duration-300 ease-in-out
          ${isDarkMode ? 'bg-gray-900 text-white shadow-gray-900/30 border-r border-gray-700' : 'bg-white shadow-black/10 border-r border-gray-200'} 
          overflow-y-auto
          ${
            // Mobile: Always use translate for mobile, show/hide based on isMobileOpen
            // Desktop: Show/hide based on isSidebarOpen
            isMobile 
              ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full')
              : (isSidebarOpen ? 'translate-x-0' : '-translate-x-full')
          }
        `}
      >
        {/* Toggle button - positioned at top right of sidebar */}
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => {
              if (isMobile) {
                setIsMobileOpen(false);
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 bg-gray-800/50' 
                : 'hover:bg-gray-100 bg-gray-100/50'
            }`}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {(isMobile || isSidebarOpen) ? (
              <FaTimes className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            ) : (
              <FaBars className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            )}
          </button>
        </div>

        {/* Menu items */}
        <nav className="h-full py-6 px-4 pt-14">
          <div className="mb-6 px-2">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Admin Panel
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your website
            </p>
          </div>
          
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (isMobile) {
                      setIsMobileOpen(false); // Close sidebar on mobile after clicking
                    }
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActiveItem(item)
                      ? isDarkMode 
                        ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30' 
                        : 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <div className={`p-2 rounded-md transition-colors ${
                    isActiveItem(item)
                      ? isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'
                      : isDarkMode ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <item.icon className={`h-4 w-4 ${
                      isActiveItem(item)
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-600'
                        : isDarkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-500 group-hover:text-gray-600'
                    }`} />
                  </div>
                  <span className="ml-3 text-base font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;