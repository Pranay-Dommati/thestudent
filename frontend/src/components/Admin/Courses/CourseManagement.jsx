import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaList } from 'react-icons/fa';
import CourseForm from './CourseForm';
import CourseList from './CourseList';

const CourseManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setView(view === 'list' ? 'add' : 'list')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              view === 'add' 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {view === 'list' ? (
              <>
                <FaPlus className="mr-2" /> Add New Course
              </>
            ) : (
              <>
                <FaList className="mr-2" /> View All Courses
              </>
            )}
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <FaFilter className="mr-2" /> Filters
            </button>
          </div>
          <CourseList searchQuery={searchQuery} />
        </>
      ) : (
        <CourseForm onCancel={() => setView('list')} />
      )}
    </div>
  );
};

export default CourseManagement;