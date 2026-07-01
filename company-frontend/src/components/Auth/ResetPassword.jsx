import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaKey, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import universalToast from '../../utils/universalToast';
import api from '../../utils/axios';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

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
      const msg = error?.response?.data?.error || 'Failed to validate reset link';
      universalToast.error(msg);
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
      errors.newPassword = "Must contain at least one uppercase letter, one lowercase letter, and one number";
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
      if (String(msg).toLowerCase().includes('invalid') || String(msg).toLowerCase().includes('expired')) {
        setTokenValid(false);
      }
      universalToast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const HeaderNav = () => (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            EasyLearnova
          </span>
        </Link>
        <a 
          href="https://scrib.easylearnova.com/login" 
          className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
        >
          Scrib Login &rarr;
        </a>
      </div>
    </header>
  );

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <HeaderNav />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying your secure link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <HeaderNav />
        <div className="sm:mx-auto sm:w-full sm:max-w-md mt-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100 text-center"
          >
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FaExclamationTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Link Expired</h2>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              This password reset link has either expired or already been used. Please request a new link from your login screen.
            </p>
            
            <div className="space-y-3">
              <a
                href="https://scrib.easylearnova.com/forgot-password"
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <span>Request New Reset Link</span>
                <FaArrowRight className="text-xs" />
              </a>
              <Link
                to="/"
                className="block w-full text-center text-sm font-semibold text-gray-600 hover:text-gray-900 py-2.5 transition-colors"
              >
                Back to EasyLearnova Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <HeaderNav />
        <div className="sm:mx-auto sm:w-full sm:max-w-md mt-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100 text-center"
          >
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Your password has been reset successfully. You can now access your account across Scrib AI, Courses, and all EasyLearnova tools.
            </p>
            
            <div className="space-y-3">
              <a
                href="https://scrib.easylearnova.com/login"
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <span>Log in to Scrib AI</span>
                <FaArrowRight className="text-xs" />
              </a>
              <a
                href="https://courses.easylearnova.com"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors text-sm"
              >
                Go to Courses
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <HeaderNav />
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FaKey className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create New Password</h2>
            {userEmail && (
              <p className="text-xs font-medium text-gray-500 bg-gray-50 py-1.5 px-3 rounded-full inline-block mt-2">
                Account: {userEmail}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaLock className="text-sm" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 py-3 block w-full border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.newPassword ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                  }`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaLock className="text-sm" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 py-3 block w-full border rounded-xl text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                  }`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Save New Password</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
