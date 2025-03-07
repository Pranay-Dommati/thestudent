import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaBook, FaFileAlt, FaChalkboardTeacher } from 'react-icons/fa';

const TenthStandard = ({ board }) => {
  const subjects = [
    {
      id: 'english',
      name: 'English',
      icon: '📚',
      courses: [
        { title: 'Language & Literature', type: 'Course A' },
        { title: 'English Communicative', type: 'Course B' }
      ],
      resources: [
        { title: 'Grammar Masterclass', duration: '20 lessons', type: 'Video Course' },
        { title: 'Writing Skills Workshop', duration: '15 lessons', type: 'Interactive' },
        { title: 'Literature Deep Dive', duration: '25 lessons', type: 'Video Course' }
      ]
    },
    {
      id: 'hindi',
      name: 'Hindi',
      icon: '📖',
      courses: [
        { title: 'Hindi Course A', type: 'Standard' },
        { title: 'Hindi Course B', type: 'Basic' }
      ],
      resources: [
        { title: 'व्याकरण की समझ', duration: '18 lessons', type: 'Video Course' },
        { title: 'लेखन कौशल', duration: '12 lessons', type: 'Interactive' }
      ]
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: '📐',
      courses: [
        { title: 'Mathematics Standard', type: 'Advanced' },
        { title: 'Mathematics Basic', type: 'Foundation' }
      ],
      resources: [
        { title: 'Algebra Complete Course', duration: '30 lessons', type: 'Video Course' },
        { title: 'Geometry Mastery', duration: '25 lessons', type: 'Video Course' },
        { title: 'Trigonometry Basics', duration: '15 lessons', type: 'Interactive' }
      ]
    },
    {
      id: 'science',
      name: 'Science',
      icon: '🔬',
      courses: [
        { title: 'Physics', type: 'Core' },
        { title: 'Chemistry', type: 'Core' },
        { title: 'Biology', type: 'Core' }
      ],
      resources: [
        { title: 'Physics Fundamentals', duration: '35 lessons', type: 'Video Course' },
        { title: 'Chemistry Lab Virtual', duration: '20 lessons', type: 'Interactive' },
        { title: 'Biology Comprehensive', duration: '28 lessons', type: 'Video Course' }
      ]
    },
    {
      id: 'social',
      name: 'Social Science',
      icon: '🌍',
      courses: [
        { title: 'History', type: 'Core' },
        { title: 'Geography', type: 'Core' },
        { title: 'Political Science', type: 'Core' },
        { title: 'Economics', type: 'Core' }
      ],
      resources: [
        { title: 'History Through Ages', duration: '30 lessons', type: 'Video Course' },
        { title: 'Geography & Maps', duration: '25 lessons', type: 'Interactive' },
        { title: 'Civics & Economics', duration: '22 lessons', type: 'Video Course' }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class 10 - CBSE</h1>
        <p className="text-gray-600">Complete syllabus coverage with video lectures, study materials, and practice tests</p>
      </div>

      {subjects.map((subject) => (
        <div key={subject.id} className="mb-12">
          <div className="flex items-center mb-6">
            <span className="text-3xl mr-3">{subject.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subject.resources.map((resource, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-t-xl"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-lg font-semibold">{resource.type}</span>
                      <FaPlay className="text-white" />
                    </div>
                    <p className="text-white/80 text-sm mt-1">{resource.duration}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaChalkboardTeacher className="text-indigo-600" />
                      <span className="text-sm text-gray-600">Expert Faculty</span>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Start Learning →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
              <FaFileAlt className="mr-2" />
              Study Notes
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
              <FaBook className="mr-2" />
              Practice Questions
            </button>
          </div>
        </div>
      ))}

      {/* Study Resources Section - Keeping the existing one */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Sample Papers</h3>
            <p className="text-gray-600 mb-4">CBSE sample papers and previous year questions</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Access Now →</button>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Live Classes</h3>
            <p className="text-gray-600 mb-4">Join daily live classes by expert teachers</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Schedule →</button>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Doubt Solving</h3>
            <p className="text-gray-600 mb-4">Get your doubts cleared instantly</p>
            <button className="text-indigo-600 font-medium hover:text-indigo-800">Ask Now →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenthStandard;