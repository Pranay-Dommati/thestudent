import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SavedPlaylists = () => {
  const [activeTab, setActiveTab] = useState('playlists');
  // Mock data - would come from API in real app
  const playlists = [
    {
      id: 'playlist-1',
      name: 'Web Development Track',
      courses: [
        {
          id: 'course-101',
          title: 'HTML & CSS Fundamentals',
          completed: true,
          thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&auto=format&fit=crop'
        },
        {
          id: 'course-102',
          title: 'JavaScript Basics',
          completed: true,
          thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop'
        },
        {
          id: 'course-103',
          title: 'React Fundamentals',
          completed: false,
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop'
        }
      ]
    },
    {
      id: 'playlist-2',
      name: 'Machine Learning Path',
      courses: [
        {
          id: 'course-201',
          title: 'Python for Data Science',
          completed: true,
          thumbnail: 'https://images.unsplash.com/photo-1526379879527-8559ecfcb970?w=800&auto=format&fit=crop'
        },
        {
          id: 'course-202',
          title: 'Intro to Machine Learning',
          completed: false,
          thumbnail: 'https://images.unsplash.com/photo-1535551951406-a19828b0a76b?w=800&auto=format&fit=crop'
        }
      ]
    }
  ];

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
            onClick={() => setActiveTab('playlists')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'playlists'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Learning Playlists
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'favorites'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Favorite Courses
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'playlists' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Your Learning Playlists</h2>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                + Create New Playlist
              </button>
            </div>

            <div className="space-y-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <h3 className="font-semibold">{playlist.name}</h3>
                    <div className="flex items-center gap-2">
                      <button className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        {playlist.courses.length} courses
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {playlist.courses.map((course) => (
                      <div key={course.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                        <div className="flex-shrink-0">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow">
                          <Link to={`/courses/${course.id}`} className="font-medium hover:text-indigo-600">
                            {course.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.completed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : (
                            <Link
                              to={`/courses/${course.id}/learning`}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              Continue
                            </Link>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
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