import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const AdminSidebar = ({ menuItems, currentView, setCurrentView, isDarkMode, isMobileOpen, setIsMobileOpen }) => {
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
        className={`fixed lg:sticky top-0 lg:top-16 h-screen w-72 md:w-64 bg-white shadow-xl z-50 transform transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDarkMode ? 'bg-gray-800 text-white' : ''} overflow-y-auto`}
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
        </div>        {/* Menu items */}
        <nav className="h-full py-8 px-4">
          <div className="mb-6 px-4">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Admin Panel
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your website
            </p>
          </div>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>                <Link
                  to={item.path}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileOpen(false); // Close sidebar on mobile after clicking
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActiveItem(item)
                      ? isDarkMode 
                        ? 'bg-blue-600 bg-opacity-20 text-blue-400 font-medium' 
                        : 'bg-blue-50 text-blue-700 font-medium'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${
                    isActiveItem(item)
                      ? isDarkMode ? 'bg-blue-500 bg-opacity-20' : 'bg-blue-100'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <item.icon className={`h-4 w-4 ${
                      isActiveItem(item)
                        ? isDarkMode ? 'text-blue-300' : 'text-blue-600'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className="ml-3">{item.label}</span>
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