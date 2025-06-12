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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 lg:top-16 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDarkMode ? 'bg-gray-800' : ''}`}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute right-4 top-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Menu items */}
        <nav className="h-full py-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileOpen(false); // Close sidebar on mobile after clicking
                  }}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActiveItem(item)
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-indigo-50 text-indigo-600'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${
                    isActiveItem(item)
                      ? 'text-indigo-600'
                      : isDarkMode 
                        ? 'text-gray-300' 
                        : 'text-gray-500'
                  }`} />
                  <span className="ml-3 font-medium">{item.label}</span>
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