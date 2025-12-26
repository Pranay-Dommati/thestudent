import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaRegUser, FaRegEnvelope,
  FaSignOutAlt, FaHome,
  FaGoogle, FaUnlink, FaCamera, FaGraduationCap
} from 'react-icons/fa';
// removed book icon from profile header
import { Link, useNavigate } from 'react-router-dom';
import universalToast from '../../utils/universalToast';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer/Footer';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('https://via.placeholder.com/150');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: ''
  });
  // Social accounts state - dynamically set based on user's auth method
  const [socialAccounts, setSocialAccounts] = useState({});

  // Add stats state
  const [stats] = useState({
    coursesEnrolled: 12,
    coursesCompleted: 8,
    certificatesEarned: 5
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.full_name || '',
        email: user.email || '',
        country: user.country || ''
      });
      setProfileImageUrl(user.profile_image_url || 'https://via.placeholder.com/150');
      
      // Set social accounts based on user's authentication method
      const accounts = {};
      if (user.auth_method === 'google') {
        accounts.google = {
          connected: true,
          email: user.email
        };
      }
      // You can add more auth methods here (facebook, etc.)
      
      setSocialAccounts(accounts);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Social account handlers
  const handleConnectSocialAccount = async (provider) => {
    try {
  universalToast.loading(`Connecting to ${provider}...`);
      
      // Simulate API call for social authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update social accounts state
      setSocialAccounts(prev => ({
        ...prev,
        [provider]: {
          connected: true,
          email: `user@${provider}.com`,
          connectedAt: new Date().toISOString().split('T')[0]
        }
      }));
      
  universalToast.dismiss();
  universalToast.success(`Successfully connected to ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    } catch (error) {
  universalToast.dismiss();
  universalToast.error(`Failed to connect to ${provider}`);
    }
  };

  const handleDisconnectSocialAccount = async (provider) => {
    try {
  universalToast.loading(`Disconnecting from ${provider}...`);
      
      // Check if user authenticated via this provider
      if (user && user.auth_method === provider) {
        // If user authenticated via this social provider, disconnecting means logging out
  universalToast.dismiss();
  universalToast.success(`Disconnected from ${provider.charAt(0).toUpperCase() + provider.slice(1)}. Logging out...`);
        
        // Add a small delay to show the message before logout
        setTimeout(() => {
          logout();
          navigate('/');
        }, 1500);
        return;
      }
      
      // For other cases (secondary social accounts), just disconnect the link
      // Simulate API call for disconnection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update social accounts state
      setSocialAccounts(prev => ({
        ...prev,
        [provider]: {
          connected: false,
          email: null,
          connectedAt: null
        }
      }));
  universalToast.dismiss();
  universalToast.success(`Successfully disconnected from ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    } catch (error) {
  universalToast.dismiss();
  universalToast.error(`Failed to disconnect from ${provider}`);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: FaUser }
  ];

  // Handle profile image change
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
  universalToast.error('Image size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
  universalToast.error('Please upload a JPG, PNG, or GIF file');
        return;
      }

      setProfileImage(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileImageUrl(imageUrl);
  universalToast.success('Profile picture updated!');
    }
  };

  const formFields = [
    {
      id: 'name',
      label: 'Full Name',
      type: 'text',
      icon: FaRegUser,
      placeholder: 'Enter your full name'
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      icon: FaRegEnvelope,
      placeholder: 'Enter your email'
    }
  ];

  const renderFormField = (field) => {
    const value = formData[field.id];

    return (
      <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 text-sm sm:text-base">
        {field.type === 'select'
          ? field.options.find(opt => opt.value === value)?.label || 'Not provided'
          : value || 'Not provided'
        }
      </div>
    );
  };

  return (
    <div className="profile-container">
      {/* Mobile-First Navbar */}
      <nav className="profile-navbar">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <Link to="/" className="flex items-center group">
              <span className="font-bold text-lg sm:text-xl text-[#0A1A3F]">
                EasyLearnova
              </span>
            </Link>
            
            <div className="flex items-center space-x-2 sm:space-x-6">
              <Link 
                to="/" 
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-50">
                  <FaHome className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium text-sm sm:text-base">Home</span>
                </span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <span className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-red-50">
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium text-sm sm:text-base">Logout</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="profile-card"
            >
              {/* Mobile-responsive header */}
              <div className="profile-header">
                <div className="flex-1">
                  <h2 className="profile-title">Personal Information</h2>
                  <p className="profile-subtitle">Your personal details and preferences</p>
                </div>
              </div>

              {/* Mobile-responsive form grid */}
              <div className="profile-form-grid">
                {formFields.map((field) => (
                  <div key={field.id} className="profile-field">
                    <label className="profile-label">
                      {field.label}
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Social Connections Card - Mobile optimized - Only show in profile tab */}
          {activeTab === 'profile' && Object.keys(socialAccounts).length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="profile-card"
            >
              <div className="profile-header">
                <div>
                  <h3 className="profile-title">Connected Accounts</h3>
                  <p className="profile-subtitle">Manage your connected social accounts</p>
                </div>
              </div>
              <div className="px-4 pb-4 sm:px-6 lg:px-8 sm:pb-6 lg:pb-8 space-y-3 sm:space-y-4">
                {Object.entries(socialAccounts).map(([provider, accountData]) => {
                  const providerConfig = {
                    google: { icon: FaGoogle, color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-100', hoverBg: 'hover:bg-red-50' }
                  };
                  
                  const { icon: Icon, color, bgColor, borderColor, hoverBg } = providerConfig[provider];
                  
                  return (
                    <motion.div
                      key={provider}
                      whileHover={{ scale: 1.01 }}
                      className="social-account-card"
                    >
                      <div className="social-account-content">
                        <div className="social-account-info">
                          <div className={`social-account-icon ${bgColor}`}>
                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-500`} />
                          </div>
                          <div className="social-account-details flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base">{provider}</h3>
                            <p className="text-xs sm:text-sm truncate">
                              {accountData.connected ? (
                                <span>{accountData.email}</span>
                              ) : (
                                'Not connected'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                          {accountData.connected ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleDisconnectSocialAccount(provider)}
                              className={`w-full sm:w-auto profile-button text-${color}-600 border border-${color}-200 bg-white hover:bg-${color}-50 text-sm`}
                              title={user?.auth_method === provider ? `Disconnecting will log you out` : `Disconnect from ${provider}`}
                            >
                              <FaUnlink className="w-4 h-4" />
                              <span className="sm:hidden">{user?.auth_method === provider ? 'Disconnect & Logout' : 'Disconnect'}</span>
                              <span className="hidden sm:inline">{user?.auth_method === provider ? 'Disconnect & Logout' : 'Disconnect'}</span>
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleConnectSocialAccount(provider)}
                              className={`w-full sm:w-auto profile-button bg-${color}-500 hover:bg-${color}-600 text-white text-sm`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>Connect</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
      
      {/* Mobile-optimized footer */}
      <div className="mt-4 sm:mt-8 lg:mt-12">
        <Footer />
      </div>
    </div>
  );
};

export default ProfilePage;
