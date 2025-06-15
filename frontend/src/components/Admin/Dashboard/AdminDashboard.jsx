import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FaThLarge, FaPlus, FaUsers, FaLock } from 'react-icons/fa';
import AdminNav from '../layout/AdminNav';
import AdminSidebar from '../layout/AdminSidebar';
import AdminCourses from '../Courses/AdminCourses';
import AdminUsers from '../Users/AdminUsers';
import AdminSettings from '../Settings/AdminSettings';
import CourseManagement from '../Courses/CourseManagement';
import CourseForm from '../Courses/CourseForm';
import AdminLogin from '../AdminLogin';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('courses');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const checkAdminAuth = () => {
    try {
      const authData = JSON.parse(localStorage.getItem('adminAuth'));
      if (authData && authData.isAuthenticated) {
        // Optional: Check if the authentication hasn't expired
        const currentTime = new Date().getTime();
        const authTime = authData.timestamp;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (currentTime - authTime < TWENTY_FOUR_HOURS) {
          setIsAuthenticated(true);
          return;
        }
      }
      setIsAuthenticated(false);
      localStorage.removeItem('adminAuth');
    } catch (error) {
      setIsAuthenticated(false);
      localStorage.removeItem('adminAuth');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    navigate('/admin-p');
  };

  const menuItems = [
    { 
      id: 'courses',
      label: 'Courses', 
      icon: FaThLarge, 
      path: '/admin-p/courses' 
    },
    { 
      id: 'addCourse',
      label: 'Add Course', 
      icon: FaPlus, 
      path: '/admin-p/add-course' 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: FaUsers, 
      path: '/admin-p/users' 
    },
    { 
      id: 'security',
      label: 'Security',
      icon: FaLock,
      path: '/admin-p/settings'
    }
  ];  return !isAuthenticated ? (
    <>
      <AdminNav isLoginPage={true} />
      <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
    </>
  ) : (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <AdminNav 
        onLogout={handleLogout} 
        isLoginPage={false}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDarkMode={isDarkMode}
      />
      
      <div className="flex pt-16">
        <AdminSidebar 
          menuItems={menuItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          isDarkMode={isDarkMode}
        />
        
        <main className={`flex-1 p-4 sm:p-6 lg:ml-64 transition-all duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-end">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
              >
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
            <Routes>
              <Route index element={<Navigate to="/admin-p/courses" />} />
              <Route path="courses/*" element={<CourseManagement isDarkMode={isDarkMode} />} />
              <Route path="add-course" element={<CourseForm onCancel={() => navigate('/admin-p/courses')} isDarkMode={isDarkMode} />} />
              <Route path="users" element={<AdminUsers isDarkMode={isDarkMode} />} />
              <Route path="settings" element={<AdminSettings isDarkMode={isDarkMode} />} />
            </Routes>
          </div>        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;