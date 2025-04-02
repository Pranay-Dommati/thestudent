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
    type: 'all', // 'all', 'engineering', or 'school'
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
    // Example edit navigation:
    // navigate(`/admin-p/edit-course/${courseType}/${courseId}`);
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
        
        <div className="flex gap-2">
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
            className={`flex items-center px-4 py-2 border rounded-lg ${
              isDarkMode 
                ? 'border-gray-600 hover:bg-gray-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="mr-2" /> Filters
          </button>
        </div>
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
            {loading ? (
              <tr>
                <td colSpan="4" className="py-6 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {course.thumbnail && (
                        <img 
                          src={course.thumbnail.startsWith('http') 
                            ? course.thumbnail 
                            : `${API_URL}${course.thumbnail}`} 
                          alt={course.title}
                          className="w-10 h-10 mr-3 rounded-md object-cover"
                        />
                      )}
                      <span className="font-medium">{course.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {course.class || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {course.last_updated ? new Date(course.last_updated).toLocaleDateString() : "Not specified"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleEdit(course.id, course.course_type)}
                        className={`p-2 rounded-md ${
                          isDarkMode 
                            ? 'text-blue-400 hover:bg-gray-700' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title={`Edit ${course.course_type} course`}
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id, course.course_type)}
                        className={`p-2 rounded-md ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-gray-700' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={`Delete ${course.course_type} course`}
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
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