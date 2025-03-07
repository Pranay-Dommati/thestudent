import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBookReader } from 'react-icons/fa';  // Changed icon import
import { Link } from 'react-router-dom';

const TenthStandard = ({ board }) => {
  const subjects = [
    {
      id: 'english',
      name: 'English',
      icon: '📚',
      courseId: '1',
      description: 'Master language & literature with comprehensive coverage of CBSE syllabus',
      duration: '40+ hours of content'
    },
    {
      id: 'hindi',
      name: 'Hindi',
      icon: '📖',
      courseId: '1',
      description: 'Strengthen your Hindi language skills with expert guidance',
      duration: '35+ hours of content'
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: '📐',
      courseId: '1',
      description: 'Build strong foundations in algebra, geometry, and trigonometry',
      duration: '45+ hours of content'
    },
    {
      id: 'science',
      name: 'Science',
      icon: '🔬',
      courseId: '1',
      description: 'Comprehensive coverage of Physics, Chemistry, and Biology',
      duration: '50+ hours of content'
    },
    {
      id: 'social',
      name: 'Social Science',
      icon: '🌍',
      courseId: '1',
      description: 'In-depth exploration of History, Geography, and Civics',
      duration: '40+ hours of content'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class 10 - CBSE</h1>
        <p className="text-gray-600">Complete syllabus coverage with curated video lectures</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link to={`/courses/${subject.courseId}`} key={subject.id}>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-xl"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-2xl">{subject.icon}</span>
                    <FaPlay className="text-white opacity-75" />
                  </div>
                  <h3 className="text-white text-xl font-bold mt-2">{subject.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{subject.duration}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaBookReader className="text-indigo-600" />
                    <span className="text-sm text-gray-600">Structured Learning</span>
                  </div>
                  <span className="text-indigo-600 text-sm font-medium">
                    Preview Course →
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Sample Papers Section */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3">Sample Papers</h3>
          <p className="text-gray-600 mb-4">CBSE sample papers and previous year questions</p>
          <button className="text-indigo-600 font-medium hover:text-indigo-800">Access Now →</button>
        </div>
      </div>
    </div>
  );
};

export default TenthStandard;