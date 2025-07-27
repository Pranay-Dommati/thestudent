import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebook, FaGraduationCap, FaRegUser, FaRegEnvelope, FaLock } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AuthNav from './AuthNav';
import AuthFooter from './AuthFooter';

export default function AuthForm() {  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const modeParam = queryParams.get('mode');
  const returnToPath = queryParams.get('returnTo');
  
  // Set initial mode based on URL parameter (default to login if no parameter)
  const [isSignUp, setIsSignUp] = useState(() => {
    return modeParam === 'signup';
  });
  
  // Update mode if URL parameter changes
  useEffect(() => {
    if (modeParam === 'signup') {
      setIsSignUp(true);
    } else if (modeParam === 'login') {
      setIsSignUp(false);
    }
  }, [modeParam]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const toggleForm = () => {
    const newMode = !isSignUp;
    
    // Clear form errors and data immediately for smooth transition
    setFormErrors({});
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false,
    });
    
    // Preserve the returnTo parameter if it exists
    const returnToParam = returnToPath ? `&returnTo=${encodeURIComponent(returnToPath)}` : '';
    
    // Use replace to avoid adding to history and set state after navigation
    navigate(`/auth?mode=${newMode ? 'signup' : 'login'}${returnToParam}`, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const { register, login } = useAuth();
  const validateForm = () => {
    const errors = {};

    // Validate name (for signup)
    if (isSignUp && !formData.name) {
      errors.name = "Full name is required";
    }

    // Validate email
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Validate password
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Validate confirm password (for signup)
    if (isSignUp && !formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (isSignUp && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Validate terms agreement (for signup)
    if (isSignUp && !formData.agreedToTerms) {
      errors.agreedToTerms = "You must agree to the terms and conditions";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      if (!isSignUp) {        // Login request
        const response = await login(formData.email, formData.password);
        if (response) {
          // Redirect to the returnTo path if it exists, otherwise to the homepage
          navigate(returnToPath || '/');
        }
      } else {
        // Registration logic
        const registrationData = {
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          agreed_to_terms: formData.agreedToTerms
        };
          const success = await register(registrationData);
        if (success) {
          // Redirect to the returnTo path if it exists, otherwise to the homepage
          navigate(returnToPath || '/');
        }
      }    } catch (error) {
      console.error("Error during login:", error);
      toast("Invalid email or password", {
        icon: '❌',
        style: {
          backgroundColor: '#EF4444',
          color: 'white',
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthNav />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 px-4 pt-16 pb-20">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0 w-full">
              <path fill="#3b82f6" fillOpacity="0.1" d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,144C672,128,768,96,864,106.7C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#3b82f6" fillOpacity="0.2" d="M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,181.3C672,171,768,181,864,197.3C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Main card */}
        <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div 
              key={isSignUp ? "signup-layout" : "login-layout"}
              className="flex flex-col md:flex-row"
              initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -50 : 50 }}
              transition={{ 
                type: "tween",
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1]
              }}
            >
              {/* Welcome Panel - Always on top for mobile */}
              <div
                className={`flex flex-col items-center justify-center p-6 sm:p-10 text-white 
                  bg-gradient-to-br ${isSignUp ? 'from-blue-600 to-indigo-700' : 'from-indigo-600 to-blue-700'}
                  w-full md:w-5/12 order-1 ${isSignUp ? 'md:order-2' : 'md:order-1'}`}
              >
                <motion.div 
                  className="mb-6 p-4 bg-white/20 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.1,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  <FaGraduationCap className="text-4xl sm:text-5xl" />
                </motion.div>
                
                <motion.h2 
                  className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.2,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  {isSignUp ? 'Welcome to Students Hub!' : 'Welcome Back!'}
                </motion.h2>
                
                <motion.p 
                  className="text-sm text-center mb-6 max-w-xs text-white/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  {isSignUp 
                    ? 'Join our community to access free courses, learning paths, and educational resources.' 
                    : 'Sign in to continue your learning journey and access your saved courses.'}
                </motion.p>
                
                <motion.button 
                  onClick={toggleForm}
                  className="mt-2 px-6 py-2.5 border-2 border-white/80 text-white rounded-full transition-colors hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSignUp ? 'Already have an account' : 'Create an account'}
                </motion.button>
                
                {/* Decorative elements */}
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              </div>
              
              {/* Form Panel - Always on bottom for mobile */}
              <div 
                className={`flex w-full md:w-7/12 flex-col items-center justify-center px-6 sm:px-10 py-8 sm:py-12
                  order-2 ${isSignUp ? 'md:order-1' : 'md:order-2'}`}
              >                <motion.h2 
                  className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.2,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  {isSignUp ? 'Create Account' : 'Login'}
                </motion.h2>
                <motion.form 
                  className="w-full max-w-sm space-y-4" 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                          duration: 0.25,
                          ease: [0.4, 0.0, 0.2, 1]
                        }}
                      >
                        {/* Full Name */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            <FaRegUser />
                          </div>
                          <input 
                            className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                              formErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                            }`}
                            type="text" 
                            name="name"
                            placeholder="Full Name" 
                            value={formData.name}
                            onChange={handleChange}
                          />                          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Email Field - Common for both login and signup */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <FaRegEnvelope />
                    </div>
                    <input 
                      className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                        formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                      }`} 
                      type="email" 
                      name="email"
                      placeholder="Email Address" 
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}                  </div>
                  
                  {/* Password Field - Common for both login and signup */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <FaLock />
                    </div>
                    <input 
                      className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                        formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                      }`} 
                      type="password" 
                      name="password"
                      placeholder="Password" 
                      value={formData.password}
                      onChange={handleChange}
                    />                    {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                  </div>
                    {!isSignUp && (
                    <div className="text-right mt-2 mb-1">                      <button
                        type="button"
                        onClick={() => toast("Password reset feature will be added soon.", { 
                          icon: '📧',
                          style: {
                            backgroundColor: '#3b82f6',
                            color: 'white',
                          }
                        })}
                        className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 inline-block cursor-pointer hover:underline font-medium hover:bg-blue-50 rounded transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>                  )}

                  {/* Ensure there's clear separation between sections */}
                  <div className="w-full h-px mt-1"></div>
                  
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div 
                        className="space-y-4 mt-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                          duration: 0.25,
                          ease: [0.4, 0.0, 0.2, 1]
                        }}
                      >
                        {/* Confirm Password */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            <FaLock />
                          </div>
                          <input 
                            className={`w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                              formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                            }`} 
                            type="password" 
                            name="confirmPassword"
                            placeholder="Confirm Password" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />
                          {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
                        </div>

                        {/* Terms and Conditions */}                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            name="agreedToTerms"
                            id="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                            className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                          />
                          <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-700 flex-1">
                            I agree to the{' '}
                            <Link 
                              to="/terms-and-conditions" 
                              state={{ returnTo: '/auth?mode=' + (isSignUp ? 'signup' : 'login') + (returnToPath ? `&returnTo=${encodeURIComponent(returnToPath)}` : '') }}
                              className="text-blue-600 hover:text-blue-500 inline-block"
                            >
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link 
                              to="/privacy-policy" 
                              state={{ returnTo: '/auth?mode=' + (isSignUp ? 'signup' : 'login') + (returnToPath ? `&returnTo=${encodeURIComponent(returnToPath)}` : '') }}
                              className="text-blue-600 hover:text-blue-500 inline-block"
                            >
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
                        {formErrors.agreedToTerms && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.agreedToTerms}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-800"
                    whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ y: 2 }}
                  >
                    {isLoading ? "Processing..." : (isSignUp ? "Create Account" : "Login")}
                  </motion.button>
                </motion.form>

                {/* Social Login Section */}
                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"                      onClick={() => toast("Social login will be implemented in the next update.", { 
                        icon: '🔗',
                        style: {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                        }
                      })}
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <FaGoogle className="h-5 w-5 text-red-500" />
                      <span className="ml-2">Google</span>
                    </button>
                    <button
                      type="button"                      onClick={() => toast("Social login will be implemented in the next update.", { 
                        icon: '🔗',
                        style: {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                        }
                      })}
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <FaFacebook className="h-5 w-5 text-blue-600" />
                      <span className="ml-2">Facebook</span>
                    </button>
                  </div>
                </motion.div>

                {/* Toggle Form Link */}
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    delay: 0.5,
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleForm}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}
