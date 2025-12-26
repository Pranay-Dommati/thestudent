import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShieldAlt, FaGoogle, FaGithub, FaBell, FaLock, 
  FaEye, FaEyeSlash, FaTimes, FaCheckCircle, FaSpinner 
} from 'react-icons/fa';

const SecuritySettings = ({ isDarkMode }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const handlePasswordChange = (success) => {
    setIsPasswordModalOpen(false);
    if (success) {
      // Show success message or update last changed date
    }
  };

  return (
    <div className="space-y-8">
      {/* Password Section */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Password & Authentication
        </h3>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
          >
            <span className="flex items-center">
              <FaLock className="w-5 h-5 mr-2" />
              Change Password
            </span>
            <span>Last changed 2 months ago</span>
          </motion.button>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="space-y-3">
        {/* Google Account */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <FaGoogle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Google</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>john.doe@gmail.com</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            Disconnect
          </motion.button>
        </div>

        {/* GitHub Account */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <FaGithub className="w-5 h-5 mr-3" />
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>GitHub</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not connected</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            Connect
          </motion.button>
        </div>

        {/* 2FA Section */}
        <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="w-5 h-5 text-green-500" />
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>2FA is enabled</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Using Authenticator app</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            Manage 2FA
          </motion.button>
        </div>
      </div>

      {/* Email Preferences */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Email Preferences
        </h3>
        <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>Course updates and announcements</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>New course recommendations</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" />
            <span>Community mentions and replies</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>Security alerts</span>
          </label>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordChange}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

const PasswordChangeModal = ({ isOpen, onClose, isDarkMode }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (password) => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    
    setRequirements(newRequirements);
    const strength = Object.values(newRequirements).filter(Boolean).length;
    setPasswordStrength(strength);
    return newRequirements;
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      newPassword: value
    }));
    validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    const criteria = validatePassword(passwordData.newPassword);
    if (!Object.values(criteria).every(Boolean)) {
      newErrors.newPassword = 'Password does not meet requirements';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      onClose(true); // Success
    } catch (error) {
      setErrors({ submit: 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative w-full max-w-md p-6 rounded-xl shadow-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <button
              onClick={() => onClose(false)}
              className={`absolute top-4 right-4 p-1 rounded-full ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Change Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Requirements */}
              {passwordData.newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Password Strength
                    </span>
                    <motion.span
                      animate={{
                        color: passwordStrength < 3 ? '#EF4444' : 
                               passwordStrength < 5 ? '#F59E0B' : '#10B981'
                      }}
                      className="text-sm font-medium"
                    >
                      {passwordStrength < 3 ? 'Weak' :
                       passwordStrength < 5 ? 'Medium' : 'Strong'}
                    </motion.span>
                  </div>

                  {/* Password Requirements List */}
                  <div className="space-y-2">
                    {Object.entries({
                      length: '8+ characters',
                      uppercase: 'One uppercase letter',
                      lowercase: 'One lowercase letter',
                      number: 'One number',
                      special: 'One special character'
                    }).map(([key, text]) => (
                      <motion.div
                        key={key}
                        initial={false}
                        animate={{
                          color: requirements[key] ? '#10B981' : 
                                 isDarkMode ? '#9CA3AF' : '#6B7280'
                        }}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <FaCheckCircle
                          className={`w-4 h-4 ${
                            requirements[key] ? 'text-green-500' : 
                            isDarkMode ? 'text-gray-600' : 'text-gray-400'
                          }`}
                        />
                        <span>{text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Password Input Fields */}
              {['current', 'new', 'confirm'].map((type) => (
                <div key={type} className="space-y-1">
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPasswords[type] ? 'text' : 'password'}
                      value={passwordData[`${type}Password`]}
                      onChange={type === 'new' ? handlePasswordChange : (e) => 
                        setPasswordData(prev => ({
                          ...prev,
                          [`${type}Password`]: e.target.value
                        }))
                      }
                      className={`w-full px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      } border focus:ring-2 focus:ring-blue-500 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({
                        ...prev,
                        [type]: !prev[type]
                      }))}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-70 
                        hover:opacity-100 transition-opacity ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {showPasswords[type] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors[`${type}Password`] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors[`${type}Password`]}
                    </motion.p>
                  )}
                </div>
              ))}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full py-3 rounded-lg font-medium ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-all`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FaSpinner className="w-5 h-5" />
                    </motion.div>
                    <span>Changing Password...</span>
                  </div>
                ) : 'Change Password'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SecuritySettings;