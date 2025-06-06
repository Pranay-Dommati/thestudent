import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import CourseCategories from './CourseCategories/CourseCategories';
import CourseFilters from './CourseFilters/CourseFilters';
import CourseListings from './CourseListings/CourseListings';

const Engineering = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    skillLevel: 'all',
    duration: 'all',
    sortBy: 'popular'
  });

  const [allCategories, setAllCategories] = useState([
    { id: 'all', name: 'All Categories' },
    { id: 'webdev', name: 'Web Development', icon: '💻' },
    { id: 'datascience', name: 'Data Science & AI', icon: '🤖' },
    { id: 'uiux', name: 'UI/UX & Graphic Design', icon: '🎨' },
    { id: 'marketing', name: 'Marketing & Business', icon: '📊' },
    { id: 'personal', name: 'Personal Development', icon: '🚀' }
  ]);

  useEffect(() => {
    // Load custom categories from localStorage
    const storedCategories = JSON.parse(localStorage.getItem('courseCategories') || '[]');
    if (storedCategories.length > 0) {
      // Add any new categories not already in allCategories
      const newCategories = storedCategories.filter(
        newCat => !allCategories.some(existingCat => existingCat.id === newCat.id)
      );
      
      if (newCategories.length > 0) {
        setAllCategories([...allCategories, ...newCategories]);
      }
    }
  }, []);

  const handleCategoryChange = (category) => setSelectedCategory(category);
  const handleFilterChange = (newFilters) => setFilters({ ...filters, ...newFilters });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton 
        title="Engineering Courses" 
        subtitle="Explore professional development courses" 
      />
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar with filters */}
        <div className="md:w-1/4">
          <div className="sticky top-4">
            <CourseCategories 
              selectedCategory={selectedCategory} 
              onCategoryChange={handleCategoryChange}
              categories={allCategories}
            />
            <CourseFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* Course listings */}
        <div className="md:w-3/4">
          <CourseListings 
            category={selectedCategory}
            filters={filters}
            educationLevel="engineering"
          />
        </div>
      </div>
    </div>
  );
};

export default Engineering;