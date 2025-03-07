import React from 'react';
import { FaPlay, FaBookmark, FaClock, FaChartLine } from 'react-icons/fa';

const LearningProgress = ({ isDarkMode }) => {
  const ongoingCourses = [
    {
      id: 1,
      title: "Advanced Machine Learning",
      progress: 65,
      lastAccessed: "2 days ago",
      thumbnail: "https://source.unsplash.com/300x200/?machine-learning",
      totalLessons: 24,
      completedLessons: 16
    },
    {
      id: 2,
      title: "React & Next.js Masterclass",
      progress: 35,
      lastAccessed: "5 days ago",
      thumbnail: "https://source.unsplash.com/300x200/?programming",
      totalLessons: 32,
      completedLessons: 11
    }
  ];

  const savedPlaylists = [
    {
      id: 1,
      title: "DevOps Fundamentals",
      author: "Tech Academy",
      duration: "8h 30m",
      thumbnail: "https://source.unsplash.com/300x200/?developer"
    },
    {
      id: 2,
      title: "Cloud Architecture",
      author: "Cloud Experts",
      duration: "12h 15m",
      thumbnail: "https://source.unsplash.com/300x200/?cloud-computing"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Hours Learned
            </h4>
            <FaClock className="text-blue-500 w-5 h-5" />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            45.5
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This month
          </p>
        </div>

        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Courses Completed
            </h4>
            <FaBookmark className="text-green-500 w-5 h-5" />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            12
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total completed
          </p>
        </div>

        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Current Streak
            </h4>
            <FaChartLine className="text-purple-500 w-5 h-5" />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            15 days
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Keep it up!
          </p>
        </div>
      </div>

      {/* Ongoing Courses */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Continue Learning
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ongoingCourses.map(course => (
            <div 
              key={course.id}
              className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg`}
            >
              <div className="relative h-48">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button className="p-3 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors">
                    <FaPlay className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {course.title}
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Progress
                    </span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {course.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Last accessed {course.lastAccessed}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Playlists */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Saved for Later
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedPlaylists.map(playlist => (
            <div 
              key={playlist.id}
              className={`flex rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow`}
            >
              <div className="w-1/3">
                <img 
                  src={playlist.thumbnail} 
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-2/3 p-4">
                <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {playlist.title}
                </h4>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  by {playlist.author}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Duration: {playlist.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningProgress;