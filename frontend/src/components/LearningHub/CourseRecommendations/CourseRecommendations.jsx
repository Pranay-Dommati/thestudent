import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Mock data for recommended courses
const recommendedCourses = {
  interests: [
    {
      id: 'c1',
      title: 'Advanced JavaScript Patterns',
      instructor: 'Sarah Johnson',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewCount: 1254,
      level: 'Advanced',
      platform: 'Udemy',
      tags: ['JavaScript', 'Programming', 'Web Development']
    },
    {
      id: 'c2',
      title: 'React Native for Mobile Development',
      instructor: 'Michael Chen',
      thumbnail: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewCount: 879,
      level: 'Intermediate',
      platform: 'Coursera',
      tags: ['React', 'Mobile', 'App Development']
    },
    {
      id: 'c3',
      title: 'Responsive Web Design Masterclass',
      instructor: 'Emily Davis',
      thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewCount: 725,
      level: 'Beginner',
      platform: 'FreeCodeCamp',
      tags: ['CSS', 'Responsive', 'Web Design']
    }
  ],
  history: [
    {
      id: 'c4',
      title: 'Data Structures & Algorithms in Python',
      instructor: 'Dr. Robert Miller',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 2145,
      level: 'Intermediate',
      platform: 'edX',
      tags: ['Python', 'Algorithms', 'Computer Science']
    },
    {
      id: 'c5',
      title: 'Full-Stack Web Development with Node.js',
      instructor: 'Jessica Thompson',
      thumbnail: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      reviewCount: 1632,
      level: 'Advanced',
      platform: 'Udemy',
      tags: ['Node.js', 'Express', 'MongoDB']
    },
    {
      id: 'c6',
      title: 'TypeScript for React Developers',
      instructor: 'David Wilson',
      thumbnail: 'https://images.unsplash.com/photo-1610986603166-f78428624e76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewCount: 947,
      level: 'Intermediate',
      platform: 'Pluralsight',
      tags: ['TypeScript', 'React', 'Web Development']
    }
  ],
  trending: [
    {
      id: 'c7',
      title: 'AI & Machine Learning Fundamentals',
      instructor: 'Prof. James Anderson',
      thumbnail: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      reviewCount: 3254,
      level: 'Beginner',
      platform: 'Coursera',
      tags: ['AI', 'Machine Learning', 'Python']
    },
    {
      id: 'c8',
      title: 'Full-Stack React with GraphQL',
      instructor: 'Alexandra Rivera',
      thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      reviewCount: 1879,
      level: 'Intermediate',
      platform: 'Udemy',
      tags: ['React', 'GraphQL', 'Apollo']
    },
    {
      id: 'c9',
      title: 'Web 3.0 & Blockchain Development',
      instructor: 'Eric Johnson',
      thumbnail: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      reviewCount: 1543,
      level: 'Advanced',
      platform: 'edX',
      tags: ['Blockchain', 'Web3', 'Ethereum']
    }
  ]
};

const CourseRecommendations = () => {
  const [activeTab, setActiveTab] = useState('interests');
  
  const tabs = [
    { id: 'interests', label: 'Based on Your Interests', icon: '🎯' },
    { id: 'history', label: 'Similar to Your History', icon: '🔄' },
    { id: 'trending', label: 'Trending Now', icon: '🔥' }
  ];

  // Platform badges styling
  const platformBadges = {
    'YouTube': 'bg-red-600',
    'Udemy': 'bg-purple-600',
    'Coursera': 'bg-blue-600',
    'edX': 'bg-indigo-600',
    'FreeCodeCamp': 'bg-green-600',
    'Pluralsight': 'bg-pink-600',
    'default': 'bg-gray-800'
  };
  
  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Recommended for You</h2>
        <p className="text-gray-500 text-sm mb-4">
          Personalized course recommendations based on your learning journey
        </p>
        
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors mr-2 -mb-px ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 border-l border-r border-t border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        
        {/* Course cards - horizontal scrollable */}
        <div className="relative">
          <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-4">
            {recommendedCourses[activeTab].map(course => (
              <div
                key={course.id}
                className="min-w-[280px] max-w-[280px] rounded-lg border border-gray-100 hover:border-gray-200 bg-white hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Course thumbnail */}
                <div className="relative h-36">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Platform badge */}
                  <div className={`absolute top-3 right-3 ${platformBadges[course.platform] || platformBadges.default} text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm`}>
                    {course.platform}
                  </div>
                </div>
                
                {/* Course info */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Title and rating */}
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-indigo-600">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">{course.instructor}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= Math.floor(course.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs ml-1">({course.reviewCount})</span>
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {course.level}
                    </span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* View course button */}
                  <Link 
                    to={`/courses/${course.id}`}
                    className="mt-auto text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded transition-colors"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation arrows - can be implemented with scrolling logic */}
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 bg-white rounded-full p-2 shadow-md border border-gray-100 hover:shadow-lg group opacity-80 hover:opacity-100 disabled:opacity-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 bg-white rounded-full p-2 shadow-md border border-gray-100 hover:shadow-lg group opacity-80 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* View all link */}
        <div className="mt-4 text-center">
          <Link to="/courses" className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
            View all recommendations
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold mb-1">Get Personalized Learning Path</h3>
          <p className="text-white/80 text-sm">
            Our AI assistant can create a custom learning path based on your goals
          </p>
        </div>
        <Link 
          to="/chat" 
          className="whitespace-nowrap px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-sm"
        >
          Try AI Assistant
        </Link>
      </div>
    </section>
  );
};

export default CourseRecommendations;