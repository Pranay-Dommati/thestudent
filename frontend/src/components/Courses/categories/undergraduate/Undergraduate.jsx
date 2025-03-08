import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import CourseCategories from './CourseCategories/CourseCategories';
import CourseFilters from './CourseFilters/CourseFilters';
import CourseListings from './CourseListings/CourseListings';

const Undergraduate = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    skillLevel: 'all',
    duration: 'all',
    sortBy: 'popular'
  });

  const handleCategoryChange = (category) => setSelectedCategory(category);
  const handleFilterChange = (newFilters) => setFilters({ ...filters, ...newFilters });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton 
        title="Undergraduate Courses" 
        subtitle="Explore professional development courses" 
      />
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar with filters */}
        <div className="md:w-1/4">
          <div className="sticky top-4">
            <CourseCategories 
              selectedCategory={selectedCategory} 
              onCategoryChange={handleCategoryChange}
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
            educationLevel="undergraduate"
          />
        </div>
      </div>
    </div>
  );
};

export default Undergraduate;