import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FaBook, FaChartBar, FaUsers, FaCog, FaHome } from 'react-icons/fa';
import AdminNav from '../layout/AdminNav';
import AdminSidebar from '../layout/AdminSidebar';
import AdminHome from './AdminHome';
import AdminCourses from '../Courses/AdminCourses';
import AdminUsers from '../Users/AdminUsers';
import AdminSettings from '../Settings/AdminSettings';
import CourseList from '../Courses/CourseList';
import CourseForm from '../Courses/CourseForm';
import CourseManagement from '../Courses/CourseManagement';
import AdminAnalytics from '../Analytics/AdminAnalytics';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('courses');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { 
      id: '/', 
      label: 'Dashboard', 
      icon: FaHome, 
      path: '/admin' 
    },
    { 
      id: 'courses', 
      label: 'Courses', 
      icon: FaBook, 
      path: '/admin/courses' 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: FaChartBar, 
      path: '/admin/analytics' 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: FaUsers, 
      path: '/admin/users' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: FaCog, 
      path: '/admin/settings' 
    }
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-course':
        setIsAddingCourse(true);
        setCurrentView('courses');
        break;
      case 'manage-users':
        navigate('/admin/users');
        setCurrentView('users');
        break;
      case 'view-reports':
        navigate('/admin/analytics');
        setCurrentView('analytics');
        break;
      case 'settings':
        navigate('/admin/settings');
        setCurrentView('settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen">
      <AdminNav 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        className="fixed top-0 w-full z-50"
      />
      
      <div className="flex pt-16">
        <AdminSidebar 
          menuItems={menuItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isDarkMode={isDarkMode}
          className="fixed left-0 h-[calc(100vh-4rem)] w-64"
          onQuickAction={handleQuickAction}
        />
        
        <main className={`flex-1 ml-64 p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          <Routes>
            <Route index element={<AdminHome onQuickAction={handleQuickAction} stats={{
                    totalCourses: 124,
                    activeStudents: 1234,
                    enrollments: 2456,
                    revenue: '₹123,456'
                  }} />} />
            <Route path="courses/*" element={<CourseManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;