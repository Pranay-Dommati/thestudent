import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaLock, FaBookOpen, FaUsers, FaBrain, FaBell, 
  FaGoogle, FaGithub
} from 'react-icons/fa';
import BasicProfile from './tabs/BasicProfile';
import SecuritySettings from './tabs/SecuritySettings';
import LearningProgress from './tabs/LearningProgress';
import CommunitySection from './tabs/CommunitySection';
import AISettings from './tabs/AISettings';
import Notifications from './tabs/Notifications';
import ProfileNavbar from './layout/ProfileNavbar';
import Footer from '../Footer/Footer';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    username: 'johndoe',
    bio: 'Passionate learner | Full Stack Developer | AI Enthusiast',
    avatar: 'https://avatars.githubusercontent.com/u/12345678',
    badges: [] // Removed badges array
  });

  const handleProfileUpdate = (updatedData) => {
    // Update the profile data in the parent component
    setProfileData(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'learning', label: 'My Learning', icon: FaBookOpen },
    { id: 'community', label: 'Community', icon: FaUsers },
    { id: 'ai', label: "AI'Settings", icon: FaBrain },
    { id: 'notifications', label: 'Notifications', icon: FaBell }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <BasicProfile isDarkMode={isDarkMode} onUpdateProfile={handleProfileUpdate} />;
      case 'security':
        return <SecuritySettings isDarkMode={isDarkMode} />;
      case 'learning':
        return <LearningProgress isDarkMode={isDarkMode} />;
      case 'community':
        return <CommunitySection isDarkMode={isDarkMode} />;
      case 'ai':
        return <AISettings isDarkMode={isDarkMode} />;
      case 'notifications':
        return <Notifications isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  return (
    <>
      <ProfileNavbar isDarkMode={isDarkMode} profileData={profileData} setActiveTab={setActiveTab} />
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className={`relative rounded-xl p-6 mb-8 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Image - Removed the user icon button */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                  <img 
                    src={profileData.avatar} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left pt-2">
                <h1 className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {profileData.name}
                </h1>
                <p className={`text-lg mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  @{profileData.username}
                </p>
                <p className={`text-sm mb-4 max-w-2xl ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {profileData.bio}
                </p>
                {/* Removed badges section */}
              </div>

              {/* Quick Actions - Notifications with onClick handler */}
              <div className="flex items-center">
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className="p-2 rounded-lg bg-gray-100 text-blue-600 hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  <FaBell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* New Layout Structure */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Vertical Navigation Sidebar */}
            <motion.div 
              className={`w-full md:w-64 flex-shrink-0 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-xl shadow-lg p-4`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 transition-all ${
                    activeTab === tab.id
                      ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                      : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} 
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="ml-3 font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Content Section */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`rounded-xl p-6 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}>
                  {renderTabContent()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer  />
    </>
  );
};

export default ProfilePage;