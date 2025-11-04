import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaGraduationCap, FaRegUser, FaRegEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import universalToast from '../../utils/universalToast';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from '../../hooks/useGoogleAuth.jsx';
import OtpModal from './OtpModal';
import { otpSignup } from '../../services/otpAuth';
import AuthNav from './AuthNav';
import AuthFooter from './AuthFooter';

export default function AuthForm() {
  const location = useLocation();
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
  const [otpOpen, setOtpOpen] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    
    // Use replace to avoid adding to history
    navigate(`/auth?mode=${newMode ? 'signup' : 'login'}${returnToParam}`, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Mark field as touched on first change
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    // Live validate the changed field
    runLiveValidation(name, value);
  };

  const { register, login, googleLogin, validateAuth } = useAuth();
  
  // Enhanced Google Sign-In with proper error handling
  const handleGoogleSuccess = async (credential) => {
    try {
      setIsLoading(true);
      console.log('Google credential received, attempting login...');
      
      const success = await googleLogin(credential);
      if (success) {
        // Toast is already shown in AuthContext with id 'auth-login', no duplicate
        navigate(returnToPath || '/', { replace: true });
      } else {
        // Only show error if googleLogin returns false without throwing
  universalToast.error('Google sign-in failed. Please try again.', { id: 'auth-login' });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      // AuthContext already shows error toast with id 'auth-login', no duplicate needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google auth error:', error);
    // Only show error toast for actual errors, not for user dismissals
    if (error && error !== 'Google Sign-In dismissed' && error !== 'Google Sign-In cancelled') {
      universalToast.error(`Google sign-in failed: ${error}`, { id: 'auth-login' });
    }
    setIsLoading(false);
  };
  
  const validateForm = () => {
    const errors = {};

    // Validate name (for signup)
    if (isSignUp && !formData.name) {
      errors.name = "Full name is required";
    } else if (isSignUp && formData.name.length < 2) {
      errors.name = "Please provide your full name";
    }

    // Validate email
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    // Validate password - Enhanced validation for signup
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (isSignUp) {
      // Stricter validation for signup
      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.password = "Password must contain at least one lowercase letter";
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = "Password must contain at least one uppercase letter";
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = "Password must contain at least one number";
      }
    } else {
      // Login only requires minimum length
      if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
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

  // Live validation for individual fields
  const runLiveValidation = (field, value) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      const v = value;

      const setOrClear = (key, message) => {
        if (message) next[key] = message; else delete next[key];
      };

      if (field === 'name' && isSignUp && touched.name) {
        setOrClear('name', !v ? 'Full name is required' : v.length < 2 ? 'Please provide your full name' : '');
      }

      if (field === 'email' && touched.email) {
        const emailErr = !v
          ? 'Email is required'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? ''
          : 'Invalid email format';
        setOrClear('email', emailErr);
      }

      if (field === 'password' && touched.password) {
        let msg = '';
        if (!v) msg = 'Password is required';
        else if (isSignUp) {
          if (v.length < 8) msg = 'Password must be at least 8 characters';
          else if (!/(?=.*[a-z])/.test(v)) msg = 'Password must contain at least one lowercase letter';
          else if (!/(?=.*[A-Z])/.test(v)) msg = 'Password must contain at least one uppercase letter';
          else if (!/(?=.*\d)/.test(v)) msg = 'Password must contain at least one number';
        } else if (v.length < 6) {
          msg = 'Password must be at least 6 characters';
        }
        setOrClear('password', msg);
        // Also update confirm password match if user already typed it
        if (touched.confirmPassword) {
          const cpMsg = isSignUp && formData.confirmPassword && v !== formData.confirmPassword ? 'Passwords do not match' : '';
          setOrClear('confirmPassword', cpMsg);
        }
      }

      if (field === 'confirmPassword' && isSignUp && touched.confirmPassword) {
        const cpMsg = !v ? 'Please confirm your password' : v !== formData.password ? 'Passwords do not match' : '';
        setOrClear('confirmPassword', cpMsg);
      }

      return next;
    });
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
      if (!isSignUp) {
        // Login request - AuthContext already shows success/error toasts with id 'auth-login'
        const response = await login(formData.email, formData.password);
        setIsLoading(false); // Stop loading immediately after response
        
        if (response?.success) {
          // Redirect to the returnTo path if it exists, otherwise to the homepage
          navigate(returnToPath || '/', { replace: true });
        } else if (response?.suggestSignup) {
          // Dismiss the toast before navigating to prevent duplication
          universalToast.dismiss('auth-login');
          
          // Preserve the returnTo parameter if it exists
          const returnToParam = returnToPath ? `&returnTo=${encodeURIComponent(returnToPath)}` : '';
          
          // Immediately switch to signup without delay - smooth transition
          setIsSignUp(true);
          navigate(`/auth?mode=signup${returnToParam}`, { replace: true });
          
          // Show toast AFTER navigation completes
          setTimeout(() => {
            universalToast.error('No account found with this email. Please sign up to continue.', {
              id: 'suggest-signup',
              duration: 3000,
              icon: '📝'
            });
          }, 100); // Small delay to ensure navigation completes
        }
      } else {
        // OTP-based signup: do NOT change page UI. Trigger modal on success.
        const payload = {
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          agreed_to_terms: formData.agreedToTerms
        };
        await otpSignup(payload);
        setOtpOpen(true);
      }
    } catch (error) {
      console.error("Error during signup/login:", error);
      
      // Handle backend validation errors (400 status with field-specific errors)
      if (error.response?.status === 400 && error.response?.data) {
        const backendErrors = error.response.data;
        const newFormErrors = {};
        
        // Check for field-specific validation errors
        if (backendErrors.password) {
          // Password validation errors can be an array or string
          const passwordError = Array.isArray(backendErrors.password) 
            ? backendErrors.password[0] 
            : backendErrors.password;
          newFormErrors.password = passwordError;
        }
        if (backendErrors.email) {
          newFormErrors.email = Array.isArray(backendErrors.email) 
            ? backendErrors.email[0] 
            : backendErrors.email;
        }
        if (backendErrors.full_name) {
          newFormErrors.name = Array.isArray(backendErrors.full_name) 
            ? backendErrors.full_name[0] 
            : backendErrors.full_name;
        }
        
        // If we have field errors, set them and return
        if (Object.keys(newFormErrors).length > 0) {
          setFormErrors(newFormErrors);
          setIsLoading(false);
          return;
        }
      }
      
      // Determine error message based on error type
      let errorMessage = "An error occurred. Please try again.";
      
      // Check for timeout/abort
      if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.name === 'AbortError') {
        errorMessage = "Request timed out. The server is taking too long to respond. If you receive an OTP email, you can enter it below.";
        // If signup timed out, it's possible the server still sent the OTP.
        // Proactively open the OTP modal so the user can verify if they received it.
        if (isSignUp) {
          setOtpOpen(true);
        }
      }
      // Check for network error
      else if (error.message === 'Network Error' || !error.response) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      // Check for CORS or backend error
      else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later or contact support.";
      }
      // Use backend error message if available
      else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      // AuthContext handles login errors, only show toast for signup or other errors
      if (isSignUp || error.response?.status !== 401) {
  universalToast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Professional Loading Modal */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden"
            >
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl" />
              
              {/* Content */}
              <div className="relative text-center">
                {/* Modern spinner with rocket icon */}
                <div className="relative mb-6">
                  <motion.div
                    className="w-20 h-20 mx-auto relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                  >
                    {/* Outer ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                    
                    {/* Animated progress ring */}
                    <div
                      className="absolute inset-0 rounded-full border-4 border-gray-200"
                    />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
                    />
                    
                    {/* Center rocket icon */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg
                        className="w-8 h-8 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2M7 19H17V21H7V19M8.5 19C8.5 20.38 9.62 21.5 11 21.5S13.5 20.38 13.5 19H8.5Z"/>
                      </svg>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Professional loading text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    {isSignUp ? "Creating Your Account" : "Signing You In"}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {isSignUp 
                      ? "Setting up your personalized learning experience..." 
                      : "Verifying your credentials and preparing your dashboard..."
                    }
                  </p>

                  {/* Elegant progress dots */}
                  <div className="flex items-center justify-center gap-2 pt-4">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthNav />

      <OtpModal
        open={otpOpen}
        email={formData.email}
        fullName={formData.name}
        onClose={() => setOtpOpen(false)}
        onVerified={async () => {
          await validateAuth();
          navigate(returnToPath || '/', { replace: true });
        }}
      />
      {/* Mobile-first design with full screen layout */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        {/* Background elements - hidden on mobile for cleaner look */}
        <div className="absolute inset-0 overflow-hidden hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0 w-full">
              <path fill="#3b82f6" fillOpacity="0.1" d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,144C672,128,768,96,864,106.7C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#3b82f6" fillOpacity="0.2" d="M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,181.3C672,171,768,181,864,197.3C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div 
              key={isSignUp ? "mobile-signup" : "mobile-login"}
              className="min-h-screen flex flex-col"
              initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -50 : 50 }}
              transition={{ 
                type: "tween",
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1]
              }}
            >
              {/* Hero Section - Better proportions */}
              <div className={`flex flex-col items-center justify-center px-6 py-8 text-white 
                bg-gradient-to-br ${isSignUp ? 'from-blue-600 to-indigo-700' : 'from-indigo-600 to-blue-700'}`}>
                <motion.div 
                  className="mb-5 p-4 bg-white/20 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <FaGraduationCap className="text-4xl" />
                </motion.div>
                
                <motion.h1 
                  className="text-2xl font-bold mb-4 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {isSignUp ? 'Join EasyLearnova' : 'Welcome Back!'}
                </motion.h1>
                
                <motion.p 
                  className="text-center text-white/90 text-sm max-w-sm leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {isSignUp 
                    ? 'Create your account to access free courses and learning resources.' 
                    : 'Sign in to continue your learning journey.'}
                </motion.p>
              </div>

              {/* Form Section - Takes remaining space */}
              <div className="bg-white px-6 py-4 flex-1 min-h-0 overflow-y-auto">
                <motion.h2 
                  className="text-xl font-bold mb-4 text-gray-800 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </motion.h2>

                {/* Google Sign In Button - Prominent position */}
                <motion.div
                  className="mb-4 w-full max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    onStart={() => setIsLoading(true)}
                    onShown={() => setIsLoading(false)}
                    disabled={isLoading}
                  />
                </motion.div>

                {/* Divider */}
                <motion.div 
                  className="mb-4 w-full max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.form 
                  className="space-y-4 w-full max-w-sm mx-auto" 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  {/* Name field for signup */}
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1] }}
                      >
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <FaRegUser />
                          </div>
                          <input 
                            className={`w-full p-4 pl-12 border-2 rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                              formErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                            }`}
                            type="text" 
                            name="name"
                            placeholder="Full Name" 
                            value={formData.name}
                            onChange={handleChange}
                          />
                          {formErrors.name && <p className="text-red-500 text-sm mt-2">{formErrors.name}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Email Field */}
                  <div className="relative min-h-[3.25rem] md:min-h-[3.5rem]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-4 pointer-events-none text-gray-400">
                      <FaRegEnvelope className="w-5 h-5" />
                    </div>
                    <input 
                      className={`w-full h-[3.25rem] md:h-14 p-3 md:p-4 pl-10 md:pl-12 border-2 rounded-lg md:rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                        formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                      }`} 
                      type="email" 
                      name="email"
                      placeholder="Email Address" 
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm mt-2">{formErrors.email}</p>}
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                        <FaLock />
                      </div>
                      <input 
                        className={`w-full p-4 pl-12 pr-12 border-2 rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                          formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                        }`} 
                        type={showPassword ? 'text' : 'password'} 
                        name="password"
                        placeholder="Password" 
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Password Requirements Indicator - Only show for signup when user starts typing */}
                    {isSignUp && formData.password && (
                      <div className="bg-gray-50 px-4 py-3 rounded-lg text-xs space-y-1.5">
                        <div className="font-medium text-gray-700 mb-2">Password must contain:</div>
                        <div className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="font-bold">{formData.password.length >= 8 ? '✓' : '○'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="font-bold">{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                          <span>One uppercase letter (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="font-bold">{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                          <span>One lowercase letter (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="font-bold">{/\d/.test(formData.password) ? '✓' : '○'}</span>
                          <span>One number (0-9)</span>
                        </div>
                      </div>
                    )}
                    
                    {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                  </div>

                  {/* Forgot Password - Only for login */}
                  {!isSignUp && (
                    <div className="text-right -mt-2 mb-1">
                      <Link
                        to="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 hover:underline font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {/* Confirm Password and Terms for signup */}
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div 
                        className="space-y-5"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1] }}
                      >
                        <div className="relative min-h-[3.25rem] md:min-h-[3.5rem]">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-4 pointer-events-none text-gray-400">
                            <FaLock className="w-5 h-5 min-w-[1.25rem]" />
                          </div>
                          <input 
                            className={`w-full h-[3.25rem] md:h-14 p-3 md:p-4 pl-10 md:pl-12 pr-10 md:pr-12 border-2 rounded-lg md:rounded-xl bg-gray-50 focus:ring-2 focus:outline-none transition-all text-base ${
                              formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                            }`} 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            name="confirmPassword"
                            placeholder="Confirm Password" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                            autoComplete={isSignUp ? 'new-password' : 'off'}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 md:pr-4">
                            <button
                              type="button"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-2">{formErrors.confirmPassword}</p>}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            name="agreedToTerms"
                            id="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                            className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                          />
                          <label htmlFor="agreedToTerms" className="ml-3 text-sm text-gray-700 leading-5">
                            I agree to the{' '}
                            <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-500 underline">
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-500 underline">
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
                        {formErrors.agreedToTerms && (
                          <p className="text-red-500 text-sm">{formErrors.agreedToTerms}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Submit Button */}
                  <motion.button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-xl font-semibold text-base hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 shadow-lg relative overflow-hidden"
                    whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ y: 2 }}
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {isSignUp ? "Create Account" : "Sign In"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>

                {/* Toggle Form Link */}
                <motion.div 
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={toggleForm}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-center min-h-screen px-4 pb-20">
          <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.div 
                key={isSignUp ? "desktop-signup" : "desktop-login"}
                className="flex flex-row"
                initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignUp ? -50 : 50 }}
                transition={{ 
                  type: "tween",
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
              >
                {/* Welcome Panel */}
                <div
                  className={`flex flex-col items-center justify-center p-10 text-white 
                    bg-gradient-to-br ${isSignUp ? 'from-blue-600 to-indigo-700' : 'from-indigo-600 to-blue-700'}
                    w-5/12 ${isSignUp ? 'order-2' : 'order-1'}`}
                >
                  <motion.div 
                    className="mb-6 p-4 bg-white/20 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <FaGraduationCap className="text-5xl" />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-3xl font-bold mb-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {isSignUp ? 'Welcome to EasyLearnova!' : 'Welcome Back!'}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-center mb-6 max-w-xs text-white/90 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
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
                    transition={{ delay: 0.4, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSignUp ? 'Already have an account' : 'Create an account'}
                  </motion.button>
                  
                  {/* Decorative elements */}
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                </div>
                
                {/* Form Panel */}
                <div className={`flex w-7/12 flex-col items-center justify-center px-10 py-12 ${isSignUp ? 'order-1' : 'order-2'}`}>
                  <motion.h2 
                    className="text-3xl font-bold mb-6 text-gray-800"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {isSignUp ? 'Create Account' : 'Login'}
                  </motion.h2>
                  
                  {/* Desktop form content */}
                  <motion.form 
                    className="w-full max-w-sm space-y-4" 
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <AnimatePresence mode="wait">
                      {isSignUp && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
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
                            />
                            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
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
                      {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 pointer-events-none text-gray-400">
                        <FaLock />
                      </div>
                      <input 
                        className={`w-full p-3 pl-10 pr-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                          formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                        }`} 
                        type={showPassword ? 'text' : 'password'} 
                        name="password"
                        placeholder="Password" 
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                    </div>

                    {!isSignUp && (
                      <div className="text-right mt-2 mb-1">
                        <Link
                          to="/forgot-password"
                          className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 hover:underline font-medium"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {isSignUp && (
                        <motion.div 
                          className="space-y-4 mt-2"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 pointer-events-none text-gray-400">
                              <FaLock />
                            </div>
                            <input 
                              className={`w-full p-3 pl-10 pr-10 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                              }`} 
                              type={showConfirmPassword ? 'text' : 'password'} 
                              name="confirmPassword"
                              placeholder="Confirm Password" 
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                              autoComplete={isSignUp ? 'new-password' : 'off'}
                            />
                            <button
                              type="button"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
                          </div>

                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              name="agreedToTerms"
                              id="agreedToTermsDesktop"
                              checked={formData.agreedToTerms}
                              onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                              className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                            />
                            <label htmlFor="agreedToTermsDesktop" className="ml-2 text-sm text-gray-700 flex-1">
                              I agree to the{' '}
                              <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-500 inline-block">
                                Terms of Service
                              </Link>
                              {' '}and{' '}
                              <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-500 inline-block">
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

                  {/* Desktop Social Login */}
                  <motion.div 
                    className="mt-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <GoogleSignInButton
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        onStart={() => setIsLoading(true)}
                        onShown={() => setIsLoading(false)}
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>

                  {/* Desktop Toggle Form Link */}
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
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
      </div>
      <AuthFooter />
    </>
  );
}
