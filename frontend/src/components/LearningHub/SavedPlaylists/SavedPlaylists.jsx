import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';

const SavedPlaylists = () => {
  const [activeTab, setActiveTab] = useState('courses');
  
  // Updated courses data with progress percentage
  const courses = [
    {
      id: 'course-101',
      title: 'HTML & CSS Fundamentals',
      instructor: 'Sarah Johnson',
      progress: 100,
      thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&auto=format&fit=crop'
    },
    {
      id: 'course-102',
      title: 'JavaScript Basics',
      instructor: 'John Doe',
      progress: 100,
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop'
    },
    {
      id: 'course-103',
      title: 'React Fundamentals',
      instructor: 'Mike Wilson',
      progress: 45,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop'
    }
    // ... keep other courses
  ];

  // Progress Circle Component
  const ProgressCircle = ({ progress }) => {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative w-10 h-10">
        <svg className="transform -rotate-90 w-10 h-10">
          <circle
            className="text-gray-200"
            strokeWidth="2"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
          <circle
            className="text-blue-600"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
        </svg>
        {progress === 100 ? (
          <FaCheck className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-blue-600">
            {progress}%
          </span>
        )}
      </div>
    );
  };

  const favorites = [
    {
      id: 'course-301',
      title: 'Advanced CSS Layouts',
      instructor: 'Lisa Chen',
      thumbnail: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&auto=format&fit=crop',
      rating: 4.8,
      addedOn: '3 weeks ago'
    },
    {
      id: 'course-302',
      title: 'AWS Cloud Practitioner',
      instructor: 'Mark Williams',
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop',
      rating: 4.9,
      addedOn: '1 month ago'
    }
  ];

  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'courses'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'favorites'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Favorite Courses
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'courses' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">My Courses</h2>
              <Link 
                to="/courses" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Start New Course
              </Link>
            </div>

            <div className="space-y-3">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="flex bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow h-20"
                >
                  <div className="w-32">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 px-4 py-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-base mb-0.5">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.instructor}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <ProgressCircle progress={course.progress} />
                      <Link 
                        to={`/courses/${course.id}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        {course.progress === 100 ? 'Review' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Favorite Courses</h2>
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option>Recently Added</option>
                  <option>Highest Rated</option>
                  <option>A-Z</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <Link to={`/courses/${course.id}`} className="sm:w-1/3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-32 sm:h-full w-full object-cover"
                      />
                    </Link>
                    <div className="p-4 flex-1 flex flex-col">
                      <Link to={`/courses/${course.id}`} className="hover:text-indigo-600">
                        <h3 className="font-bold mb-1">{course.title}</h3>
                      </Link>
                      <p className="text-gray-600 text-sm">{course.instructor}</p>
                      
                      <div className="flex items-center mt-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor(course.rating) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-1">{course.rating}</span>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-500">Added {course.addedOn}</span>
                        <button className="text-gray-400 hover:text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SavedPlaylists;