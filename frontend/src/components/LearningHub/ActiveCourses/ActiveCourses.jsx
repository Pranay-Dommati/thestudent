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

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Active Courses</h2>
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            Sort by: Recent
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-sm font-medium text-gray-500 hover:text-indigo-600">
            View all
          </button>
        </div>
      </div>
      
      {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCourses.map((course) => (
            <div key={course.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row">
                <Link to={`/courses/${course.id}`} className="sm:w-1/3">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="h-48 sm:h-full w-full object-cover"
                  />
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <Link to={`/courses/${course.id}`} className="hover:text-indigo-600">
                    <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">By {course.instructor}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`rounded-full h-2 ${
                          course.progress < 30 ? 'bg-blue-400' : 
                          course.progress < 70 ? 'bg-indigo-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500">{course.timeLeft} left • Accessed {course.lastAccessed}</span>
                      <Link 
                        to={`/courses/${course.id}/learning`}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition"
                      >
                        Resume
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Courses Yet</h3>
          <p className="text-gray-500 mb-4">Unlock your potential by enrolling in your first course</p>
          <Link 
            to="/courses" 
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Start Learning Today
          </Link>
        </div>
      )}
    </section>
  );
};

export default ActiveCourses;