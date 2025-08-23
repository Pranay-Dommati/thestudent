import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllCourses } from '../../../services/courseApi';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const CourseList = ({ onAddNew, isDarkMode, onEdit, onDelete, refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    type: 'all',
    status: 'all'
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const courseData = await getAllCourses(filters.category);
        console.log('All courses fetched:', courseData);
        setCourses(courseData || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [filters.category, refreshTrigger]); // Add refreshTrigger as dependency

  const handleEdit = (courseId, courseType) => {
    if (onEdit) onEdit(courseId, courseType);
  };

  const handleDelete = (course) => {
    if (onDelete) onDelete(course.id, course.course_type, course.title);
  };

  // Apply course type filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Filter and search courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filters.type === 'all' || course.course_type === filters.type;
    return matchesSearch && matchesType;
  });
  return (
    <div>
      {/* Header */}
      <div className={`px-4 py-5 sm:px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Course Management
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage all your courses from this dashboard
            </p>
          </div>          <button
            onClick={() => navigate('/admin-p/add-course')}
            className={`w-full sm:w-auto flex items-center justify-center px-4 py-2.5 rounded-lg ${
              isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors shadow-sm font-medium`}
          >
            <FaPlus className="mr-2 text-sm" /> Add New Course
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search courses by title, category or type..."
              className={`block w-full pl-10 pr-4 py-3 rounded-lg text-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-600 focus:border-blue-500'
              } border shadow-sm transition-colors`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 flex-col sm:flex-row">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className={`px-4 py-3 text-sm rounded-lg border shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Course Types</option>
              <option value="engineering">Engineering</option>
              <option value="school">School</option>
            </select>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center justify-center px-4 py-3 border text-sm rounded-lg ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              } transition-colors`}
            >
              <FaFilter className="mr-2" /> Advanced Filters
            </button>
          </div>
        </div>
        
        {/* Filter tags could go here */}
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.type !== 'all' && (
            <div className={`px-3 py-1.5 text-xs rounded-full flex items-center ${
              isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'            }`}>
              Type: {filters.type}
              <button className="ml-2 focus:outline-none" onClick={() => setFilters({...filters, type: 'all'})}>×</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Course List */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className={`p-4 sm:p-6 ${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/80'} transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail.startsWith('http') ? course.thumbnail : `${API_URL}${course.thumbnail}`} 
                        alt={course.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {course.title?.charAt(0) || 'C'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 text-xs rounded-full ${
                        course.course_type === 'engineering' 
                          ? isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800' 
                          : isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        {course.course_type === 'engineering' ? 'Engineering' : 'School'}
                      </span>
                      
                      {course.category && (
                        <span className={`px-2.5 py-0.5 text-xs rounded-full ${
                          isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {course.category}
                        </span>
                      )}
                      
                      {course.is_published ? (
                        <span className={`px-2.5 py-0.5 text-xs rounded-full ${
                          isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                        }`}>
                          Published
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 text-xs rounded-full ${
                          isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-medium text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {course.title}
                    </h3>
                    
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span>{course.class || "General"}</span>
                      <span>•</span>
                      <span>Last updated: {course.last_updated ? new Date(course.last_updated).toLocaleDateString() : "Not specified"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleEdit(course.id, course.course_type)}
                      className={`p-2.5 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      } transition-colors`}
                      aria-label={`Edit ${course.course_type} course`}
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className={`p-2.5 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 text-red-400 hover:bg-gray-600' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      } transition-colors`}
                      aria-label={`Delete ${course.course_type} course`}
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`inline-flex p-4 rounded-full mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {searchQuery ?                <FaSearch className={`h-8 w-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} /> : 
                <FaPlus className={`h-8 w-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              }</div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
              {searchQuery ? 'No matching courses found' : 'No courses yet'}
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto`}>
              {searchQuery 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.' 
                : 'Create your first course by clicking "Add New Course" to get started.'
              }
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredCourses.length > 0 && (
          <div className={`px-4 py-5 sm:px-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center flex-wrap gap-4`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing <span className="font-medium">{filteredCourses.length}</span> courses
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className={`px-3 py-1 rounded-md text-sm ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors disabled:opacity-50`}
                disabled
              >
                Previous
              </button>
              <span className={`px-3 py-1 rounded-md text-sm ${isDarkMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-600 text-white'}`}>
                1
              </span>
              <button 
                className={`px-3 py-1 rounded-md text-sm ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors disabled:opacity-50`}
                disabled
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;