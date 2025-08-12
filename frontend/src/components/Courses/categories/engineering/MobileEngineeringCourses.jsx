import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CourseListings from './CourseListings/CourseListings';

const MobileEngineeringCourses = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    skillLevel: 'all',
    duration: 'all',
    sortBy: 'popular'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [allCategories] = useState([
    { id: 'all', name: 'All Categories' },
    { id: 'webdev', name: 'Web Development', icon: '💻' },
    { id: 'datascience', name: 'Data Science & AI', icon: '🤖' },
    { id: 'uiux', name: 'UI/UX & Graphic Design', icon: '🎨' },
    { id: 'marketing', name: 'Marketing & Business', icon: '📊' },
    { id: 'personal', name: 'Personal Development', icon: '🚀' }
  ]);

  const skillLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const durations = [
    { value: 'all', label: 'Any Duration' },
    { value: 'short', label: 'Short (<10h)' },
    { value: 'medium', label: 'Medium (10-50h)' },
    { value: 'long', label: 'Long (>50h)' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'duration', label: 'Duration (Shortest First)' }
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const getSelectedCategoryName = () => {
    const category = allCategories.find(cat => cat.id === selectedCategory);
    return category ? category.name : 'All Categories';
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const hasActiveFilters = () => {
    return filters.skillLevel !== 'all' || filters.duration !== 'all' || filters.sortBy !== 'popular';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <motion.button
              onClick={() => navigate('/courses')}
              className="mr-3 p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="w-4 h-4" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {`Engineering Courses`}
              </h1>
              <p className="text-sm text-gray-600">Explore professional development courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Categories</h3>
          
          {/* Category Dropdown - Space efficient */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span>{getSelectedCategoryName()}</span>
              <FaChevronDown className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {allCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full p-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        {category.icon && <span className="mr-3">{category.icon}</span>}
                        {category.name}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showCategoryDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCategoryDropdown(false)}
        />
      )}

      {/* Filters Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasActiveFilters() 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FaFilter className="mr-2" />
              {hasActiveFilters() ? 'Active' : 'Filter'}
              {hasActiveFilters() && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {[filters.skillLevel !== 'all', filters.duration !== 'all', filters.sortBy !== 'popular'].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Skill Level Pills */}
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-2">
              {skillLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleFilterChange({ skillLevel: level.value })}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    filters.skillLevel === level.value
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {level.label}
                  {filters.skillLevel === level.value && level.value !== 'all' && (
                    <FaTimes className="ml-2 inline-block" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Duration Filter */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {durations.map(duration => (
                      <button
                        key={duration.value}
                        onClick={() => handleFilterChange({ duration: duration.value })}
                        className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                          filters.duration === duration.value
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {duration.label}
                        {filters.duration === duration.value && duration.value !== 'all' && (
                          <FaTimes className="ml-2 inline-block" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Sort By</p>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters() && (
                  <button
                    onClick={() => setFilters({ skillLevel: 'all', duration: 'all', sortBy: 'popular' })}
                    className="w-full mt-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Course Listings */}
      <div className="px-4 py-6">
        <CourseListings 
          category={selectedCategory}
          filters={filters}
          educationLevel="engineering"
        />
      </div>
    </div>
  );
};

export default MobileEngineeringCourses;
