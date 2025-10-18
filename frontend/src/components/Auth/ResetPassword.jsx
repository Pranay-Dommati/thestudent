import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaLock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import universalToast from '../../utils/universalToast';
import AuthNav from './AuthNav';
import AuthFooter from './AuthFooter';
import api from '../../utils/axios';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    validateToken();
  }, [uid, token]);

  const validateToken = async () => {
    try {
      const { data } = await api.get(`/auth/validate-reset-token/${uid}/${token}/`);
      if (data?.valid) {
        setTokenValid(true);
        setUserEmail(data.email);
      } else {
        setTokenValid(false);
  universalToast.error(data?.error || 'Invalid reset link');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
  universalToast.error('Failed to validate reset link');
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.newPassword) {
      errors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.newPassword)) {
      errors.newPassword = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password/', {
        uid,
        token,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });
      if (data) {
        setResetSuccess(true);
  universalToast.success('Password reset successfully!');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const msg = error?.response?.data?.error || 'Failed to reset password';
      if (String(msg).includes('Invalid or expired')) {
        setTokenValid(false);
      }
  universalToast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthNav />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthNav />
        <div className="flex items-center justify-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center"
          >
            <FaExclamationTriangle className="mx-auto text-red-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block"
              >
                Request New Reset Link
              </Link>
              
              <Link
                to="/auth?mode=login"
                className="w-full text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200 inline-block"
              >
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthNav />
        <div className="flex items-center justify-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center"
          >
            <FaCheckCircle className="mx-auto text-green-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            
            <Link
              to="/auth?mode=login"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block"
            >
              Continue to Login
            </Link>
          </motion.div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AuthNav />
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Reset Password</h1>
            <p className="text-gray-600">
              Create a new password for <span className="font-semibold text-blue-600">{userEmail}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full p-4 pl-12 border-2 rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                  formErrors.newPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {formErrors.newPassword && <p className="text-red-500 text-sm mt-2">{formErrors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-4 pl-12 border-2 rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                  formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-2">{formErrors.confirmPassword}</p>}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-2">Password Requirements:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${formData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.newPassword.length >= 8 ? '✓' : '○'}
                  </span>
                  At least 8 characters
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  One uppercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[a-z]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/[a-z]/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  One lowercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/\d/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/\d/.test(formData.newPassword) ? '✓' : '○'}
                  </span>
                  One number
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              <strong>Security Tip:</strong> Choose a strong password that you haven't used before.
            </p>
          </div>
        </motion.div>
      </div>
      <AuthFooter />
    </div>
  );
}
