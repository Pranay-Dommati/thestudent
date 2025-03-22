import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FaBook, FaUsers, FaCog, FaPlus } from 'react-icons/fa';
import AdminNav from '../layout/AdminNav';
import AdminSidebar from '../layout/AdminSidebar';
import AdminCourses from '../Courses/AdminCourses';
import AdminUsers from '../Users/AdminUsers';
import AdminSettings from '../Settings/AdminSettings';
import CourseManagement from '../Courses/CourseManagement';
import CourseForm from '../Courses/CourseForm';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('courses');
  const navigate = useNavigate();

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
      id: 'settings', 
      label: 'Settings', 
      icon: FaCog, 
      path: '/admin-p/settings' 
    }
  ];

  return (
    <div className="min-h-screen">
      <AdminNav />
      
      <div className="flex pt-16">
        <AdminSidebar 
          menuItems={menuItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          className="fixed left-0 h-[calc(100vh-4rem)] w-64"
        />
        
        <main className="flex-1 ml-64 p-6 bg-gray-50">
          <Routes>
            <Route index element={<CourseManagement />} />
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