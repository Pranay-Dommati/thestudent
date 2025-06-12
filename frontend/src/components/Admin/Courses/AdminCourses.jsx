import React from 'react';
import CourseList from './CourseList';

const AdminCourses = ({ onAddNew, isDarkMode }) => {
  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Course Management</h1>
          <p className="text-sm text-gray-500">Manage and organize your courses</p>
        </div>
        <button
          onClick={onAddNew}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <span>Add New Course</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">25</div>
          <div className="text-xs sm:text-sm text-gray-500">Total Courses</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xl sm:text-2xl font-bold text-green-600">18</div>
          <div className="text-xs sm:text-sm text-gray-500">Active Courses</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">5</div>
          <div className="text-xs sm:text-sm text-gray-500">Draft Courses</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">2</div>
          <div className="text-xs sm:text-sm text-gray-500">Archived Courses</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <CourseList isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default AdminCourses;