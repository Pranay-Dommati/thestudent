import React from 'react';
import { motion } from 'framer-motion';

const TwelveStandard = ({ board }) => {
  const streams = [
    {
      id: 'science-pcm',
      name: 'Science (PCM)',
      icon: '🔬',
      subjects: [
        'Physics',
        'Chemistry',
        'Mathematics',
        'English',
        'Computer Science/Physical Education'
      ],
      entranceExams: [
        'JEE Mains & Advanced',
        'BITSAT',
        'State Engineering Entrances'
      ],
      description: 'Prepare for top engineering colleges and technical institutions'
    },
    {
      id: 'science-pcb',
      name: 'Science (PCB)',
      icon: '🧬',
      subjects: [
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Physical Education'
      ],
      entranceExams: [
        'NEET-UG',
        'AIIMS',
        'State Medical Entrances'
      ],
      description: 'Prepare for medical, dental, and allied health sciences'
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
      entranceExams: [
        'CA Foundation',
        'CUET',
        'BBA/BMS Entrances'
      ],
      description: 'Gateway to CA, CS, business studies, and finance'
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
      entranceExams: [
        'CUET',
        'Law Entrances',
        'Mass Communication Entrances'
      ],
      description: 'Prepare for liberal arts, law, and social sciences'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Class 12 - {board.toUpperCase()}
        </h1>
        <p className="text-gray-600">
          Final year preparation with entrance exam focus
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Entrance Exams:</h4>
              <ul className="space-y-2">
                {stream.entranceExams.map((exam, idx) => (
                  <li key={idx} className="text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {exam}
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
              Explore {stream.name}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TwelveStandard;