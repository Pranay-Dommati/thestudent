import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaLock, FaRegUser, FaRegEnvelope, FaEye, FaEyeSlash,
  FaEdit, FaCheck, FaTimes, FaSpinner, FaSignOutAlt, FaHome,
  FaGoogle, FaUnlink, FaCamera, FaGraduationCap,
  FaBookOpen, FaCertificate 
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer/Footer';
import './ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('https://via.placeholder.com/150');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    classLevel: '',
    boardOfEducation: '',
    country: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // Social accounts state - dynamically set based on user's auth method
  const [socialAccounts, setSocialAccounts] = useState({});

  const [errors, setErrors] = useState({});

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
        classLevel: user.class_level || '',
        boardOfEducation: user.board_of_education || '',
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
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    return newErrors;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (activeTab === 'security') {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSaving(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  const handlePasswordSave = async () => {
    setIsSaving(true);
    
    const passwordErrors = validatePasswordForm();
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      setIsSaving(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      toast.loading('Sending password reset email...');
      
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to send password reset email');
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.full_name || '',
        email: user.email || '',
        classLevel: user.class_level || '',
        boardOfEducation: user.board_of_education || '',
        country: user.country || ''
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  // Social account handlers
  const handleConnectSocialAccount = async (provider) => {
    try {
      toast.loading(`Connecting to ${provider}...`);
      
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
      
      toast.dismiss();
      toast.success(`Successfully connected to ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to connect to ${provider}`);
    }
  };

  const handleDisconnectSocialAccount = async (provider) => {
    try {
      toast.loading(`Disconnecting from ${provider}...`);
      
      // Check if user authenticated via this provider
      if (user && user.auth_method === provider) {
        // If user authenticated via this social provider, disconnecting means logging out
        toast.dismiss();
        toast.success(`Disconnected from ${provider.charAt(0).toUpperCase() + provider.slice(1)}. Logging out...`);
        
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
        toast.dismiss();
      toast.success(`Successfully disconnected from ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to disconnect from ${provider}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: FaUser },
    { id: 'security', label: 'Security & Password', icon: FaLock }
  ];

  // Handle profile image change
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or GIF file');
        return;
      }

      setProfileImage(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileImageUrl(imageUrl);
      toast.success('Profile picture updated!');
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
    },
    {
      id: 'classLevel',
      label: 'Class Level',
      type: 'select',
      options: [
        { value: '', label: 'Select Class' },
        { value: '10', label: 'Class 10' },
        { value: '11', label: 'Class 11' },
        { value: '12', label: 'Class 12' }
      ]
    },
    {
      id: 'boardOfEducation',
      label: 'Board of Education',
      type: 'select',
      options: [
        { value: '', label: 'Select Board' },
        { value: 'cbse', label: 'CBSE' },
        { value: 'icse', label: 'ICSE' },
        { value: 'state', label: 'State Board' },
        { value: 'ib', label: 'International Baccalaureate' }
      ]
    }
  ];

  const renderFormField = (field) => {
    const value = formData[field.id];
    const error = errors[field.id];

    if (!isEditing) {
      return (
        <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-gray-900 text-sm sm:text-base">
          {field.type === 'select'
            ? field.options.find(opt => opt.value === value)?.label || 'Not provided'
            : value || 'Not provided'
          }
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div className="relative">
          <select
            name={field.id}
            value={value}
            onChange={handleInputChange}
            className={`profile-input ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
          >
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="profile-error"
            >
              <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
              {error}
            </motion.p>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        {field.icon && (
          <div className="profile-input-icon">
            <field.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
        <input
          type={field.type}
          name={field.id}
          value={value}
          onChange={handleInputChange}
          className={`profile-input ${field.icon ? 'profile-input-with-icon' : ''} ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          }`}
          placeholder={field.placeholder}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-error"
          >
            <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
            {error}
          </motion.p>
        )}
      </div>
    );
  };

  return (
    <div className="profile-container">
      {/* Mobile-First Navbar */}
      <nav className="profile-navbar">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl transform transition-all group-hover:scale-105 group-hover:rotate-3">
                S
              </div>
              <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Students Hub
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

      <div className="profile-content">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-card"
          >
            {/* Mobile-responsive header */}
            <div className="profile-header">
              <div className="flex-1">
                <h2 className="profile-title">Personal Information</h2>
                <p className="profile-subtitle">Update your personal details and preferences</p>
              </div>
              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      className="profile-button profile-button-secondary touch-button"
                    >
                      <FaTimes className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      className="profile-button profile-button-primary touch-button disabled:opacity-70"
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <FaCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">Save</span>
                        </>
                      )}
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="profile-button profile-button-primary touch-button"
                  >
                    <FaEdit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </motion.button>
                )}
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
          
          {/* Social Connections Card - Mobile optimized */}
          {Object.keys(socialAccounts).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
      
      {/* Mobile-optimized footer */}
      <div className="mt-4 sm:mt-8 lg:mt-12">
        <Footer />
      </div>
    </div>
  );
};

export default ProfilePage;
