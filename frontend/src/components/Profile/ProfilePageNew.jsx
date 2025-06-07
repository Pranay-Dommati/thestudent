import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaLock, FaRegUser, FaRegEnvelope, FaEye, FaEyeSlash,
  FaEdit, FaCheck, FaTimes, FaSpinner, FaSignOutAlt, FaHome,
  FaGoogle, FaFacebook, FaUnlink
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer/Footer';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
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
  // Social accounts state
  const [socialAccounts, setSocialAccounts] = useState({
    google: {
      connected: true,
      email: 'john.doe@gmail.com',
      connectedAt: '2024-01-15'
    },
    facebook: {
      connected: false,
      email: null,
      connectedAt: null
    }
  });

  const [errors, setErrors] = useState({});

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="font-bold text-xl text-gray-800">Students Hub</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaHome className="w-4 h-4 mr-2" />
                Home
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header - Similar to Auth Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
          >
            {/* Header with gradient similar to auth form */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <FaUser className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {user?.full_name || 'Your Profile'}
                  </h1>
                  <p className="text-blue-100">
                    {user?.email || 'Manage your account settings'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b">
              <div className="flex">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                      <div className="flex space-x-2">
                        {isEditing ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCancel}
                              disabled={isSaving}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <FaTimes className="w-4 h-4 mr-2 inline" />
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleSave}
                              disabled={isSaving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              {isSaving ? (
                                <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FaCheck className="w-4 h-4 mr-2" />
                              )}
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <FaEdit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                              <FaRegUser />
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                              }`}
                              placeholder="Enter your full name"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                            {formData.name || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                              <FaRegEnvelope />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                              }`}
                              placeholder="Enter your email"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                            {formData.email || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Class Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Level
                        </label>
                        {isEditing ? (
                          <select
                            name="classLevel"
                            value={formData.classLevel}
                            onChange={handleInputChange}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all border-gray-300 focus:ring-blue-100 focus:border-blue-500"
                          >
                            <option value="">Select Class Level</option>
                            <option value="10th">10th Standard</option>
                            <option value="11th">11th Standard</option>
                            <option value="12th">12th Standard</option>
                            <option value="undergraduate">Undergraduate</option>
                          </select>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                            {formData.classLevel || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Board of Education */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Board of Education
                        </label>
                        {isEditing ? (
                          <select
                            name="boardOfEducation"
                            value={formData.boardOfEducation}
                            onChange={handleInputChange}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all border-gray-300 focus:ring-blue-100 focus:border-blue-500"
                          >
                            <option value="">Select Board</option>
                            <option value="cbse">CBSE</option>
                            <option value="icse">ICSE</option>
                            <option value="state">State Board</option>
                            <option value="ib">International Baccalaureate</option>
                          </select>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                            {formData.boardOfEducation ? formData.boardOfEducation.toUpperCase() : 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Country */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        {isEditing ? (
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all border-gray-300 focus:ring-blue-100 focus:border-blue-500"
                          >
                            <option value="">Select Country</option>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                            {formData.country || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Password Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">Password & Security</h2>
                          <p className="text-sm text-gray-600 mt-1">Manage your password and account security</p>
                        </div>
                      </div>                      <AnimatePresence mode="wait">
                        {!showPasswordForm ? (
                          // Initial Password Change Button
                          <motion.div
                            key="password-button"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-6"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FaLock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-800">Password</h3>
                                  <p className="text-sm text-gray-500">Last updated 2 months ago</p>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowPasswordForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <FaEdit className="w-4 h-4" />
                                <span>Change Password</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        ) : (
                          // Password Change Form
                          <motion.div
                            key="password-form"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="bg-white border border-gray-200 rounded-lg p-6 space-y-6"
                          >
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancelPasswordChange}
                                disabled={isSaving}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <FaTimes className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePasswordSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                {isSaving ? (
                                  <FaSpinner className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FaCheck className="w-4 h-4" />
                                )}
                                <span>{isSaving ? 'Saving...' : 'Save'}</span>
                              </motion.button>
                            </div>
                          </div>                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="space-y-4"
                          >
                            {/* Current Password */}
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Current Password
                                </label>
                                <button
                                  type="button"
                                  onClick={handleForgotPassword}
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  Forgot Password?
                                </button>
                              </div>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                  <FaLock />
                                </div>
                                <input
                                  type={showPasswords.current ? 'text' : 'password'}
                                  name="currentPassword"
                                  value={passwordData.currentPassword}
                                  onChange={handlePasswordChange}
                                  className={`w-full p-3 pl-10 pr-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                    errors.currentPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                                  }`}
                                  placeholder="Enter your current password"
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility('current')}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                >
                                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                </button>                              </div>
                              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
                            </motion.div>                            {/* New Password */}
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3, duration: 0.3 }}
                            >
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                  <FaLock />
                                </div>
                                <input
                                  type={showPasswords.new ? 'text' : 'password'}
                                  name="newPassword"
                                  value={passwordData.newPassword}
                                  onChange={handlePasswordChange}
                                  className={`w-full p-3 pl-10 pr-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                    errors.newPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                                  }`}
                                  placeholder="Enter your new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility('new')}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                >
                                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                            </motion.div>                            {/* Confirm Password */}
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                  <FaLock />
                                </div>
                                <input
                                  type={showPasswords.confirm ? 'text' : 'password'}
                                  name="confirmPassword"
                                  value={passwordData.confirmPassword}
                                  onChange={handlePasswordChange}
                                  className={`w-full p-3 pl-10 pr-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                    errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                                  }`}
                                  placeholder="Confirm your new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility('confirm')}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                >
                                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </motion.div>                            {/* Password Requirements */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5, duration: 0.3 }}
                              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                            >
                              <h4 className="font-medium text-blue-800 mb-2">Password Requirements:</h4>
                              <ul className="text-sm text-blue-700 space-y-1">
                                <li>• At least 8 characters long</li>
                                <li>• Mix of uppercase and lowercase letters</li>
                                <li>• At least one number</li>
                                <li>• At least one special character</li>
                              </ul>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Social Accounts Management Section */}
                    <div className="mt-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Connected Accounts</h2>
                      </div>                      <div className="space-y-4">
                        {/* Google Account */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <FaGoogle className="w-5 h-5 text-red-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Google</p>
                                <p className="text-sm text-gray-500">
                                  {socialAccounts.google.connected 
                                    ? socialAccounts.google.email 
                                    : 'Not connected'
                                  }
                                </p>
                                {socialAccounts.google.connected && socialAccounts.google.connectedAt && (
                                  <p className="text-xs text-gray-400">
                                    Connected on {new Date(socialAccounts.google.connectedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {socialAccounts.google.connected ? (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDisconnectSocialAccount('google')}
                                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                              >
                                <FaUnlink className="w-4 h-4" />
                                <span>Disconnect</span>
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleConnectSocialAccount('google')}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                              >
                                <FaGoogle className="w-4 h-4" />
                                <span>Connect</span>
                              </motion.button>
                            )}
                          </div>
                        </motion.div>

                        {/* Facebook Account */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <FaFacebook className="w-5 h-5 text-blue-700" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Facebook</p>
                                <p className="text-sm text-gray-500">
                                  {socialAccounts.facebook.connected 
                                    ? socialAccounts.facebook.email 
                                    : 'Not connected'
                                  }
                                </p>
                                {socialAccounts.facebook.connected && socialAccounts.facebook.connectedAt && (
                                  <p className="text-xs text-gray-400">
                                    Connected on {new Date(socialAccounts.facebook.connectedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {socialAccounts.facebook.connected ? (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDisconnectSocialAccount('facebook')}
                                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
                              >
                                <FaUnlink className="w-4 h-4" />
                                <span>Disconnect</span>
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleConnectSocialAccount('facebook')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <FaFacebook className="w-4 h-4" />
                                <span>Connect</span>
                              </motion.button>
                            )}                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
