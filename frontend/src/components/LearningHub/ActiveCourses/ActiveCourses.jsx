import React from 'react';
import { Link } from 'react-router-dom';

const ActiveCourses = () => {
  // Mock data - would come from API in real app
  const activeCourses = [
    {
      id: "course-123",
      title: "Advanced React Patterns",
      instructor: "Sarah Johnson",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
      progress: 45,
      timeLeft: "3 hours",
      lastAccessed: "2 days ago"
    },
    {
      id: "course-456",
      title: "Data Science Fundamentals",
      instructor: "Michael Chen",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
      progress: 72,
      timeLeft: "1.5 hours",
      lastAccessed: "Yesterday"
    },
    {
      id: "course-789",
      title: "UI/UX Design Principles",
      instructor: "Emma Peterson",
      thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop",
      progress: 18,
      timeLeft: "5 hours",
      lastAccessed: "4 days ago"
    }
  ];

  return (    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Active Courses</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative group">
            <button className="font-medium text-gray-500 hover:text-indigo-600 flex items-center">
              <span>Sort by: Recent</span>
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button className="font-medium text-gray-500 hover:text-indigo-600">
            View all
          </button>
        </div>
      </div>
        {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeCourses.map((course) => (
            <div key={course.id} className="group border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row">
                <Link to={`/courses/${course.id}`} className="block sm:w-1/3 relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="h-48 sm:h-full w-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                </Link>
                <div className="flex-1 flex flex-col p-4 sm:p-5">
                  <div>
                    <Link to={`/courses/${course.id}`} className="group-hover:text-indigo-600 transition-colors">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-2 mb-1">{course.title}</h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-3">By {course.instructor}</p>
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`rounded-full h-2 transition-all duration-300 ${
                            course.progress < 30 ? 'bg-blue-500' : 
                            course.progress < 70 ? 'bg-indigo-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                        <span>{course.timeLeft} left</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Accessed {course.lastAccessed}</span>
                      </div>
                      <Link 
                        to={`/courses/${course.id}/learning`}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 
                        transition-colors flex items-center justify-center sm:justify-start group-hover:shadow-md"
                      >
                        Resume Course
                      </Link>                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>      ) : (
        <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-xl">
          <div className="max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4 transform transition-transform hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Active Courses Yet</h3>
            <p className="text-base text-gray-600 mb-6">Ready to start your learning journey? Explore our courses and find the perfect one for you.</p>
            <Link 
              to="/courses" 
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 
              transition-all duration-200 hover:shadow-lg active:transform active:scale-95"
            >
              <span>Start Learning Today</span>
              <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default ActiveCourses;