import React from 'react';
import { motion } from 'framer-motion';

const EleventhStandard = ({ board }) => {
  const streams = [
    {
      id: 'science',
      name: 'Science (PCM)',
      icon: '🔬',
      subjects: [
        'Physics',
        'Chemistry',
        'Mathematics',
        'English',
        'Computer Science/Physical Education'
      ],
      description: 'Perfect for future engineers and tech enthusiasts'
    },
    {
      id: 'biology',
      name: 'Science (PCB)',
      icon: '🧬',
      subjects: [
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Physical Education'
      ],
      description: 'Ideal for aspiring medical professionals'
    },
    {
      id: 'commerce',
      name: 'Commerce',
      icon: '📊',
      subjects: [
        'Accountancy',
        'Business Studies',
        'Economics',
        'Mathematics/Applied Mathematics',
        'English'
      ],
      description: 'Foundation for business, finance, and CA aspirants'
    },
    {
      id: 'humanities',
      name: 'Humanities',
      icon: '📚',
      subjects: [
        'History',
        'Political Science',
        'Geography/Psychology',
        'Economics',
        'English'
      ],
      description: 'For future social scientists, lawyers, and writers'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Class 11 - {board.toUpperCase()}
        </h1>
        <p className="text-gray-600">
          Choose your stream and begin your specialized academic journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {streams.map((stream) => (
          <motion.div
            key={stream.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100"
          >
            <div className="text-4xl mb-4">{stream.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{stream.name}</h3>
            <p className="text-gray-600 mb-4">{stream.description}</p>
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Core Subjects:</h4>
              <ul className="space-y-2">
                {stream.subjects.map((subject, idx) => (
                  <li key={idx} className="text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    {subject}
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
              Explore {stream.name} Stream
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EleventhStandard;