import React from 'react';
import CourseList from './CourseList';

const AdminCourses = ({ onAddNew, isDarkMode }) => {
  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <button
          onClick={onAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Course
        </button>
      </div>
      <CourseList isDarkMode={isDarkMode} />
    </div>
  );
};

export default AdminCourses;