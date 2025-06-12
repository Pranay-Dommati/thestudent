import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllCourses } from '../../../services/courseApi';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const CourseList = ({ onAddNew, isDarkMode, onEdit, onDelete }) => {
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
  }, [filters.category]);

  const handleEdit = (courseId, courseType) => {
    if (onEdit) onEdit(courseId, courseType);
  };

  const handleDelete = (courseId, courseType) => {
    if (onDelete) onDelete(courseId, courseType);
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
    <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 ${
      isDarkMode ? 'bg-gray-800 text-white' : ''
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Courses</h1>
        <button
          onClick={() => navigate('/admin-p/add-course')}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Add New Course
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
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
        
        <div className="flex gap-2 flex-col sm:flex-row">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className={`px-4 py-2 border rounded-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
            }`}
          >
            <option value="all">All Courses</option>
            <option value="engineering">Engineering</option>
            <option value="school">School</option>
          </select>
          
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="mr-2" /> Filters
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredCourses.map((course) => (
                  <div 
                    key={course.id} 
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-center space-x-4">
                      {course.thumbnail && (
                        <img 
                          src={course.thumbnail.startsWith('http') 
                            ? course.thumbnail 
                            : `${API_URL}${course.thumbnail}`} 
                          alt={course.title}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {course.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {course.class || "N/A"} • Last updated: {course.last_updated ? new Date(course.last_updated).toLocaleDateString() : "Not specified"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(course.id, course.course_type)}
                          className={`p-2 rounded-md ${
                            isDarkMode 
                              ? 'text-blue-400 hover:bg-gray-600' 
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          aria-label={`Edit ${course.course_type} course`}
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id, course.course_type)}
                          className={`p-2 rounded-md ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-gray-600' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
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
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No courses found. Create your first course by clicking "Add New Course".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;