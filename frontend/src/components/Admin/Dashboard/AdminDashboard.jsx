import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FaThLarge, FaPlus, FaUsers, FaLock, FaBars, FaCommentDots, FaEnvelope } from 'react-icons/fa';
import AdminNav from '../layout/AdminNav';
import AdminSidebar from '../layout/AdminSidebar';
import AdminCourses from '../Courses/AdminCourses';
import AdminUsers from '../Users/AdminUsers';
import AdminSettings from '../Settings/AdminSettings';
import AdminFeedbacks from '../Feedbacks/AdminFeedbacks';
import AdminNewsletter from '../Newsletter/AdminNewsletter';
import CourseManagement from '../Courses/CourseManagement';
import CourseForm from '../Courses/CourseForm';
import EditCourse from '../Courses/EditCourse';
import AdminLogin from '../AdminLogin';
import authService from '../../../services/authService';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('courses');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Load sidebar state from localStorage, default to true
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const checkAdminAuth = async () => {
    try {
      // First check local authentication status
      if (!authService.isAuthenticated()) {
        setIsAuthenticated(false);
        return;
      }

      // Verify with server that the user is still a valid superuser
      await authService.verifyAdminAccess();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Admin auth verification failed:', error);
      setIsAuthenticated(false);
      authService.logout();
    }
  };

  const handleLogout = () => {
    authService.logout();
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
      id: 'feedbacks',
      label: 'Feedbacks', 
      icon: FaCommentDots, 
      path: '/admin-p/feedbacks' 
    },
    { 
      id: 'newsletter',
      label: 'Newsletter', 
      icon: FaEnvelope, 
      path: '/admin-p/newsletter' 
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
  ) : (    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <AdminNav 
        onLogout={handleLogout} 
        isLoginPage={false}
        isDarkMode={isDarkMode}
      />
      
      <div className="pt-16">
        <div className="min-h-screen">
          <AdminSidebar 
            menuItems={menuItems}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDarkMode={isDarkMode}
          />
          
          <main className={`transition-all duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <div className="p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-end items-center">
                  <div>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)} 
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border'}`}
                    >
                      {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                  </div>
                </div>
            <Routes>
              <Route index element={<Navigate to="/admin-p/courses" />} />
              <Route path="courses/*" element={<CourseManagement isDarkMode={isDarkMode} />} />
              <Route path="add-course" element={<CourseForm onCancel={() => navigate('/admin-p/courses')} isDarkMode={isDarkMode} />} />
              <Route path="edit-course/:courseId" element={<EditCourse isDarkMode={isDarkMode} />} />
              <Route path="users" element={<AdminUsers isDarkMode={isDarkMode} />} />
              <Route path="feedbacks" element={<AdminFeedbacks isDarkMode={isDarkMode} />} />
              <Route path="newsletter" element={<AdminNewsletter isDarkMode={isDarkMode} />} />
              <Route path="settings" element={<AdminSettings isDarkMode={isDarkMode} />} />
            </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;