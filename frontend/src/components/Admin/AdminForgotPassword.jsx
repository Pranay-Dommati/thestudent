import React, { useState } from 'react';
import { FaEnvelope, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import AdminNav from './layout/AdminNav';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/admin-forgot-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('Password reset link sent to your email');
      } else {
        toast.error(data.error || 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      console.error('Admin forgot password error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AdminNav isLoginPage={true} />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {emailSent ? 'Check Your Email' : 'Reset Password'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {emailSent 
                ? 'We\'ve sent password reset instructions to your email'
                : 'Enter your email address to receive a password reset link'}
            </p>
          </div>
          
          {emailSent ? (
            <motion.div 
              className="mt-8 bg-white p-8 rounded-lg shadow-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-700 mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email, please check your spam folder or request another reset link.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-2 px-4 border border-blue-600 rounded-md text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                >
                  Try a different email
                </button>
                <Link
                  to="/admin-p"
                  className="w-full py-2 px-4 bg-gray-100 rounded-md text-gray-700 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to login
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your admin email"
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white font-medium ${
                    isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
                
                <Link
                  to="/admin-p"
                  className="w-full py-2 px-4 bg-gray-100 rounded-md text-gray-700 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to login
                </Link>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminForgotPassword;