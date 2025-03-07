import React from 'react';
import { motion } from 'framer-motion';

const TenthStandard = ({ board }) => {
  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '📐', topics: ['Algebra', 'Geometry', 'Trigonometry'] },
    { id: 'science', name: 'Science', icon: '🔬', topics: ['Physics', 'Chemistry', 'Biology'] },
    { id: 'english', name: 'English', icon: '📚', topics: ['Literature', 'Grammar', 'Writing'] },
    { id: 'social', name: 'Social Studies', icon: '🌍', topics: ['History', 'Geography', 'Civics'] },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">10th Standard - {board.toUpperCase()}</h1>
        <p className="text-gray-600">Comprehensive study materials and courses for 10th grade students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => (
          <motion.div
            key={subject.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100"
          >
            <div className="text-4xl mb-4">{subject.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{subject.name}</h3>
            <ul className="space-y-2">
              {subject.topics.map((topic, idx) => (
                <li key={idx} className="text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  {topic}
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
              Explore {subject.name}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Study Resources Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Study Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Practice Tests</h3>
            <p className="text-gray-600 mb-4">Access board-specific practice tests and sample papers</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Start Practice →</button>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Video Lectures</h3>
            <p className="text-gray-600 mb-4">Watch expert explanations of complex topics</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Watch Now →</button>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Study Notes</h3>
            <p className="text-gray-600 mb-4">Download comprehensive study materials and notes</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Download →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenthStandard;