import React, { useState } from 'react';
import { FaLock, FaEnvelope, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSettings = () => {
  const [currentEmail, setCurrentEmail] = useState('admin@example.com');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [wantToChangePassword, setWantToChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleVerifyCode = (type) => {
    // Validate verification code (simple frontend validation)
    if (verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    // Mock successful verification
    toast.success('Verification successful');
    setVerificationStep(true);
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      // Here you would make an API call to update the password
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setVerificationStep(false);
      setVerificationCode('');
    } catch (error) {
      toast.error('Failed to update password');
    }
  };
  
  const handleEmailAndPasswordChange = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newEmail) {
      toast.error('New email is required');
      return;
    }

    if (wantToChangePassword) {
      if (!newPassword || !confirmPassword) {
        toast.error('All password fields are required');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
    }

    try {
      // Here you would make an API call to update the email and password
      if (wantToChangePassword) {
        toast.success('Email and password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.success('Email updated successfully');
      }
      
      setCurrentEmail(newEmail);
      setNewEmail('');
      setShowEmailModal(false);
      setVerificationStep(false);
      setVerificationCode('');
      setWantToChangePassword(false);
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {/* Email Settings Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FaEnvelope className="mr-2 text-blue-600" />
              Email Settings
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-700 font-medium">Your email address</p>
                  <p className="text-gray-900 font-bold">{currentEmail}</p>
                </div>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowEmailModal(true)}
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>
          
          {/* Password Section */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FaLock className="mr-2 text-blue-600" />
              Password Settings
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-700 font-medium">Password</p>
                  <p className="text-gray-900">••••••••••••</p>
                </div>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {!verificationStep ? 'Verify Your Identity' : 'Change Email Address'}
                </h3>
                <button 
                  onClick={() => {
                    setShowEmailModal(false);
                    setVerificationStep(false);
                    setVerificationCode('');
                    setNewEmail('');
                    setWantToChangePassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              {!verificationStep ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    For security purposes, we need to verify your identity. Please enter the 6-digit code sent to your email address ({currentEmail}).
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleVerifyCode('email')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailAndPasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Email Address
                    </label>
                    <input
                      type="email"
                      value={currentEmail}
                      disabled
                      className="w-full p-2 border border-gray-300 bg-gray-100 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new email address"
                    />
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="change-password"
                        checked={wantToChangePassword}
                        onChange={() => setWantToChangePassword(!wantToChangePassword)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="change-password" className="ml-2 block text-sm text-gray-700">
                        I also want to change my password
                      </label>
                    </div>
                    
                    {wantToChangePassword && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter new password"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {wantToChangePassword ? "Update Email & Password" : "Update Email"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {!verificationStep ? 'Verify Your Identity' : 'Change Password'}
                </h3>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setVerificationStep(false);
                    setVerificationCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              {!verificationStep ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    For security purposes, we need to verify your identity. Please enter the 6-digit code sent to your email address ({currentEmail}).
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleVerifyCode('password')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;