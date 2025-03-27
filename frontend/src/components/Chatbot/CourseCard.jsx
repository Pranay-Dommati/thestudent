import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaGraduationCap, FaPlus } from 'react-icons/fa';

const CourseCard = ({ courseData }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
          alt="Web Development Course"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Course Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Complete Web Development Course
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center">
            <FaClock className="mr-1" />
            25 hours
          </span>
          <span className="flex items-center">
            <FaGraduationCap className="mr-1" />
            Beginner
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['HTML', 'CSS', 'JavaScript'].map(tag => (
            <span 
              key={tag}
              className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => console.log('Add to dashboard')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <FaPlus size={16} />
          Add to Learning Dashboard
        </button>
      </div>
    </div>
  );
};

export default CourseCard;