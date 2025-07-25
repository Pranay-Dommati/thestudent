import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const AdminSidebar = ({ menuItems, currentView, setCurrentView, isDarkMode, isMobileOpen, setIsMobileOpen, isSidebarOpen }) => {
  const location = useLocation();

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
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:relative 
          top-16 lg:top-0 
          left-0 lg:left-auto
          h-[calc(100vh-4rem)] lg:h-screen 
          w-64
          bg-white shadow-xl z-50 
          transform transition-all duration-300 ease-in-out
          ${isDarkMode ? 'bg-gray-800 text-white shadow-gray-900/20' : 'shadow-black/10'} 
          overflow-y-auto
          ${
            // Mobile: Always use translate for mobile, show/hide based on isMobileOpen
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }
          ${
            // Desktop: Show/hide based on isSidebarOpen, but only on lg and above
            isSidebarOpen !== undefined 
              ? (isSidebarOpen ? 'lg:translate-x-0 lg:block lg:flex-shrink-0' : 'lg:-translate-x-full lg:hidden')
              : 'lg:translate-x-0 lg:block lg:flex-shrink-0'
          }
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute right-4 top-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            aria-label="Close sidebar"
          >
            <FaTimes className={`h-5 w-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Menu items */}
        <nav className="h-full py-6 px-4">
          <div className="mb-6 px-2">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
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
                    setIsMobileOpen(false); // Close sidebar on mobile after clicking
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActiveItem(item)
                      ? isDarkMode 
                        ? 'bg-blue-600 bg-opacity-20 text-blue-400 font-medium' 
                        : 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <div className={`p-2 rounded-md transition-colors ${
                    isActiveItem(item)
                      ? isDarkMode ? 'bg-blue-500 bg-opacity-30' : 'bg-blue-100'
                      : isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <item.icon className={`h-4 w-4 ${
                      isActiveItem(item)
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-600'
                        : isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-600'
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