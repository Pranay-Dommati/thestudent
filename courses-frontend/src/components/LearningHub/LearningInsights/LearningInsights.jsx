import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBrain, FaClock, FaChartLine, FaLightbulb, FaRocket, FaBook } from 'react-icons/fa';

const LearningInsights = () => {
  const [activeTab, setActiveTab] = useState('tips');
  
  const tabs = [
    { id: 'tips', label: 'Study Tips', icon: <FaLightbulb /> },
    { id: 'strategies', label: 'Learning Strategies', icon: <FaBrain /> },
    { id: 'motivation', label: 'Stay Motivated', icon: <FaRocket /> }
  ];

  const studyTips = [
    {
      title: "Active Recall Technique",
      description: "Test yourself frequently instead of just re-reading notes. This strengthens memory retention.",
      icon: <FaBrain className="text-indigo-600" />,
      tip: "Close your books and try to explain concepts aloud"
    },
    {
      title: "Pomodoro Technique",
      description: "Study in 25-minute focused sessions with 5-minute breaks to maintain concentration.",
      icon: <FaClock className="text-green-600" />,
      tip: "Use a timer and take breaks seriously"
    },
    {
      title: "Spaced Repetition",
      description: "Review material at increasing intervals to move information into long-term memory.",
      icon: <FaChartLine className="text-purple-600" />,
      tip: "Review after 1 day, 3 days, 1 week, then 1 month"
    }
  ];

  const learningStrategies = [
    {
      title: "The Feynman Technique",
      description: "Explain complex concepts in simple terms as if teaching a child.",
      icon: <FaBook className="text-blue-600" />,
      tip: "If you can't explain it simply, you don't understand it well enough"
    },
    {
      title: "Mind Mapping",
      description: "Create visual connections between different concepts and topics.",
      icon: <FaBrain className="text-pink-600" />,
      tip: "Use colors and symbols to make connections memorable"
    },
    {
      title: "Practice Testing",
      description: "Regular practice with past papers and mock tests improves performance.",
      icon: <FaChartLine className="text-orange-600" />,
      tip: "Simulate exam conditions for better preparation"
    }
  ];

  const motivationTips = [
    {
      title: "Set SMART Goals",
      description: "Specific, Measurable, Achievable, Relevant, Time-bound goals keep you focused.",
      icon: <FaRocket className="text-red-600" />,
      tip: "Break big goals into smaller, daily actionable tasks"
    },
    {
      title: "Track Your Progress",
      description: "Celebrate small wins and monitor your learning journey regularly.",
      icon: <FaChartLine className="text-teal-600" />,
      tip: "Keep a learning journal or use progress tracking apps"
    },
    {
      title: "Find Your Why",
      description: "Connect your studies to your future goals and aspirations.",
      icon: <FaLightbulb className="text-yellow-600" />,
      tip: "Visualize your success and the impact of your education"
    }
  ];

  const getCurrentContent = () => {
    switch(activeTab) {
      case 'strategies': return learningStrategies;
      case 'motivation': return motivationTips;
      default: return studyTips;
    }
  };
  
  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Learning Insights</h2>
        <p className="text-gray-500 text-sm mb-4">
          Evidence-based techniques to enhance your learning experience
        </p>
        
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors mr-2 -mb-px ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 border-l border-r border-t border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          {getCurrentContent().map((item, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                    <p className="text-blue-800 text-sm font-medium">💡 Pro Tip: {item.tip}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View More Link */}
        <div className="mt-6 text-center">
          <Link 
            to="/study-resources"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
          >
            <span>Explore More Study Resources</span>
            <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* AI Study Assistant Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold mb-1 flex items-center">
              <FaBrain className="mr-2" />
              Get Personalized Study Plan
            </h3>
            <p className="text-white/80 text-sm">
              Our AI can create a custom study schedule based on your courses and goals
            </p>
          </div>
          <Link 
            to="/chat" 
            className="whitespace-nowrap px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm flex items-center"
          >
            <FaRocket className="mr-2" />
            Try AI Assistant
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LearningInsights;
