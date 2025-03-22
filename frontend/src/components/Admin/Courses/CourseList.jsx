import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CourseList = ({ courses = [], onAddNew, isDarkMode, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    board: '',
    subject: '',
    status: 'all'
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();

  const handleEdit = (courseId) => {
    if (onEdit) onEdit(courseId);
    // Alternatively navigate to edit page
    // navigate(`/admin-p/edit-course/${courseId}`);
  };

  const handleDelete = (courseId) => {
    if (onDelete) onDelete(courseId);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${
      isDarkMode ? 'bg-gray-800 text-white' : ''
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => navigate('/admin-p/add-course')}
          className="flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Add New Course
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center px-4 py-2 border rounded-lg ${
            isDarkMode 
              ? 'border-gray-600 hover:bg-gray-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FaFilter className="mr-2" /> Filters
        </button>
      </div>

      {/* Course Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`text-left ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <tr>
              <th className="pb-3 px-4 w-1/4">Title</th>
              <th className="pb-3 px-4 w-1/4 text-center">Class</th>
              <th className="pb-3 px-4 w-1/4 text-center">Last Updated</th>
              <th className="pb-3 px-4 w-1/4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {course.thumbnail && (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-10 h-10 mr-3 rounded-md object-cover"
                        />
                      )}
                      <span className="font-medium">{course.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {course.classLevel || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {course.lastUpdated ? new Date(course.lastUpdated).toLocaleDateString() : "Not specified"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleEdit(course.id)}
                      className={`p-1.5 rounded-md mr-2 ${
                        isDarkMode 
                          ? 'text-blue-400 hover:bg-gray-700' 
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Edit course"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className={`p-1.5 rounded-md ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-gray-700' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title="Delete course"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-6 text-center text-gray-500">
                  No courses found. Create your first course by clicking "Add New Course".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseList;