import React from 'react';
import { motion } from 'framer-motion';
import CourseCategories from '../../CourseCategories/CourseCategories';
import CourseFilters from '../../CourseFilters/CourseFilters';
import CourseListings from '../../CourseListings/CourseListings';

const Undergraduate = ({ 
  selectedCategory, 
  onCategoryChange, 
  filters, 
  onFilterChange, 
  onBackClick 
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar with filters */}
      <div className="md:w-1/4">
        <div className="sticky top-4">
          <div className="mb-6">
            <button 
              onClick={onBackClick}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Levels
            </button>
          </div>
          <CourseCategories 
            selectedCategory={selectedCategory} 
            onCategoryChange={onCategoryChange}
          />
          <CourseFilters 
            filters={filters} 
            onFilterChange={onFilterChange}
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
  );
};

export default Undergraduate;