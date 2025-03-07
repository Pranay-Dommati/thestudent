import React from 'react';
import { FaUserFriends, FaComments, FaTrophy, FaGraduationCap } from 'react-icons/fa';

const CommunitySection = ({ isDarkMode }) => {
  const achievements = [
    {
      id: 1,
      title: "100 Days Streak",
      icon: "🔥",
      description: "Maintained a learning streak for 100 days",
      date: "Earned 2 weeks ago"
    },
    {
      id: 2,
      title: "Course Creator",
      icon: "👨‍🏫",
      description: "Created first learning playlist",
      date: "Earned 1 month ago"
    },
    {
      id: 3,
      title: "Community Guide",
      icon: "🌟",
      description: "Helped 50+ students in discussions",
      date: "Earned 3 months ago"
    }
  ];

  const discussions = [
    {
      id: 1,
      title: "Best practices for React State Management",
      replies: 23,
      likes: 45,
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      title: "How to implement WebSockets in Node.js",
      replies: 15,
      likes: 32,
      lastActive: "1 day ago"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Community Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <FaUserFriends className="w-8 h-8 text-blue-500 mb-2" />
          <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            1,234
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Followers</p>
        </div>
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
          <FaGraduationCap className="w-8 h-8 text-green-500 mb-2" />
          <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            15
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Mentoring Sessions</p>
        </div>
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
          <FaComments className="w-8 h-8 text-purple-500 mb-2" />
          <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            256
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Discussion Posts</p>
        </div>
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
          <FaTrophy className="w-8 h-8 text-yellow-500 mb-2" />
          <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            12
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Achievements</p>
        </div>
      </div>

      {/* Recent Achievements */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Recent Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl">{achievement.icon}</span>
                <div>
                  <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {achievement.description}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {achievement.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Discussions */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Your Discussions
        </h3>
        <div className="space-y-4">
          {discussions.map(discussion => (
            <div 
              key={discussion.id}
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}
            >
              <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {discussion.title}
              </h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {discussion.replies} replies
                </span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {discussion.likes} likes
                </span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Active {discussion.lastActive}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunitySection;