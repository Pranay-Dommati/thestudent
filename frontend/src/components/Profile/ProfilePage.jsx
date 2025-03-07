import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaLock, FaBookOpen, FaUsers, FaBrain, 
  FaGoogle, FaGithub, FaMoon, FaSun, FaBell
} from 'react-icons/fa';
import BasicProfile from './tabs/BasicProfile';
import SecuritySettings from './tabs/SecuritySettings';
import LearningProgress from './tabs/LearningProgress';
import CommunitySection from './tabs/CommunitySection';
import AISettings from './tabs/AISettings';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'learning', label: 'My Learning', icon: FaBookOpen },
    { id: 'community', label: 'Community', icon: FaUsers },
    { id: 'ai', label: 'AI & Settings', icon: FaBrain },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <BasicProfile isDarkMode={isDarkMode} />;
      case 'security':
        return <SecuritySettings isDarkMode={isDarkMode} />;
      case 'learning':
        return <LearningProgress isDarkMode={isDarkMode} />;
      case 'community':
        return <CommunitySection isDarkMode={isDarkMode} />;
      case 'ai':
        return <AISettings isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className={`relative rounded-xl p-6 mb-8 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                <img 
                  src="https://avatars.githubusercontent.com/u/12345678" 
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 transition-colors">
                <FaUser className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                John Doe
              </h1>
              <p className={`text-lg mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                @johndoe
              </p>
              <p className={`text-sm mb-4 max-w-2xl ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Passionate learner | Full Stack Developer | AI Enthusiast
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                  🎓 Advanced Learner
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                  👨‍🏫 Mentor
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                  🏆 Top Contributor
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
              </button>
              <button className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
              }`}>
                <FaBell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-2 mb-8 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                  : `${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} 
                     ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;