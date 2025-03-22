import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FaBook, FaUsers, FaLock, FaPlus } from 'react-icons/fa';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdminAuth();
  }, []);

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
      icon: FaBook, 
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
  ];

  if (!isAuthenticated) {
    return (
      <>
        <AdminNav isLoginPage={true} />
        <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminNav onLogout={handleLogout} isLoginPage={false} />
      
      <div className="flex pt-16">
        <AdminSidebar 
          menuItems={menuItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          className="fixed left-0 h-[calc(100vh-4rem)] w-64"
        />
        
        <main className="flex-1 ml-64 p-6 bg-gray-50">
          <Routes>
            <Route index element={<Navigate to="/admin-p/courses" />} />
            <Route path="courses/*" element={<CourseManagement />} />
            <Route path="add-course" element={<CourseForm onCancel={() => navigate('/admin-p/courses')} />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;