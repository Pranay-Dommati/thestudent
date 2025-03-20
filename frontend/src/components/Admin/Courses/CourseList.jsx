import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';

const CourseList = ({ onAddNew, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    board: '',
    subject: '',
    status: 'all'
  });
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${
      isDarkMode ? 'bg-gray-800 text-white' : ''
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={onAddNew}
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
              <th className="pb-3">Title</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Subject</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Add table rows here */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseList;