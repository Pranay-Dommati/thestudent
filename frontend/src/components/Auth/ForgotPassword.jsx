import { useState } from "react";
import { motion } from "framer-motion";
import { FaRegEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from 'react-hot-toast';
import AuthNav from './AuthNav';
import AuthFooter from './AuthFooter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setFormError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('Instructions sent to your email!');
      } else {
        setFormError(data.error || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthNav />
        {/* Spacer to offset fixed navbar on mobile */}
        <div className="md:hidden h-16" aria-hidden="true"></div>

        {/* Mobile (no card) */}
        <div className="block md:hidden">
          <div className="min-h-screen px-4 pt-8 pb-20 max-w-sm mx-auto flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h2>
              <p className="text-gray-600 leading-relaxed">
                If an account with email <span className="font-semibold text-blue-600">{email}</span> exists, we've sent a password reset link to your inbox.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="p-4 rounded-xl bg-blue-50">
                <p className="text-sm text-blue-800">
                  <strong>Check your email</strong> — the link expires in 1 hour.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  <strong>Check spam</strong> — sometimes it lands there.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/auth?mode=login"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-block text-center"
              >
                Continue to Login
              </Link>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>

        {/* Desktop (unchanged card) */}
        <div className="hidden md:flex items-center justify-center min-h-screen px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center"
          >
            <div className="mb-6">
              <FaCheckCircle className="mx-auto text-green-500 text-6xl mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Email Sent!</h2>
              <p className="text-gray-600 leading-relaxed">
                If an account with email <span className="font-semibold text-blue-600">{email}</span> exists, we've sent a password reset link to your inbox.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>📧 Check your email</strong><br />The reset link will expire in 1 hour for security.
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>📂 Check spam folder</strong><br />Sometimes emails end up in spam or promotions.
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Link
                to="/auth?mode=login"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block"
              >
                Back to Login
              </Link>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200"
              >
                Try Different Email
              </button>
            </div>
          </motion.div>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  <AuthNav />
  {/* Spacer to offset fixed navbar on mobile */}
  <div className="md:hidden h-16" aria-hidden="true"></div>

      {/* Mobile (no card) */}
      <div className="block md:hidden">
        <div className="min-h-screen px-4 pt-8 pb-20 max-w-sm mx-auto flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <FaRegEnvelope />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                className={`w-full p-4 pl-12 border-2 rounded-xl bg-white focus:ring-2 focus:outline-none transition-all text-base ${
                  formError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/auth?mode=login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Login
            </Link>
          </div>

          {/* Help Text removed on mobile as requested */}
        </div>
      </div>

      {/* Desktop (unchanged card) */}
      <div className="hidden md:flex items-center justify-center min-h-screen px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Forgot Password?</h1>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <FaRegEnvelope />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                className={`w-full p-4 pl-12 border-2 rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                  formError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
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
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/auth?mode=login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Login
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 text-center">
              <strong>Need help?</strong> Contact our support team if you're having trouble accessing your account.
            </p>
          </div>
        </motion.div>
      </div>
      <AuthFooter />
    </div>
  );
}
