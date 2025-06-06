import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ menuItems, currentView, setCurrentView, isDarkMode }) => {
  const location = useLocation();

  // Update isActiveItem logic to handle paths more precisely
  const isActiveItem = (item) => {
    // Check for exact path match
    if (location.pathname === item.path) {
      return true;
    }
    
    // Special case for courses section
    if (item.id === 'courses') {
      return location.pathname === '/admin-p' || location.pathname === '/admin-p/courses';
    }
    
    return currentView === item.id;
  };

  return (
    <aside className={`w-64 fixed left-0 h-screen pt-16 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
    } shadow-lg z-10`}>
      <nav className="p-4 overflow-y-auto h-full">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;