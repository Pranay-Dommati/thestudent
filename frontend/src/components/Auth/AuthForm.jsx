import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebook, FaGraduationCap, FaRegUser, FaRegEnvelope, FaLock } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AuthNav from './AuthNav';
import AuthFooter from './AuthFooter';

export default function AuthForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const modeParam = queryParams.get('mode');
  
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
    classLevel: '',
    boardOfEducation: '',
    country: '',
    agreedToTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleForm = () => {
    const newMode = !isSignUp;
    setIsSignUp(newMode);
    setFormErrors({});
    // Use navigate instead of window.history
    navigate(`/auth?mode=${newMode ? 'signup' : 'login'}`);
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

    // Validate class level (for signup)
    if (isSignUp && !formData.classLevel) {
      errors.classLevel = "Class level is required";
    }

    // Validate board of education (for signup and specific class levels)
    if (isSignUp && ['10th', '11th', '12th'].includes(formData.classLevel) && !formData.boardOfEducation) {
      errors.boardOfEducation = "Board of education is required";
    }

    // Validate country (for signup)
    if (isSignUp && !formData.country) {
      errors.country = "Country is required";
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
      if (!isSignUp) {
        // Login request
        const response = await login(formData.email, formData.password);
        if (response) {
          navigate('/'); // Redirect to the homepage on successful login
        }      } else {
        // Registration logic
        const registrationData = {
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          class_level: formData.classLevel,
          board_of_education: formData.boardOfEducation,
          country: formData.country,
          agreed_to_terms: formData.agreedToTerms
        };
        
        const success = await register(registrationData);
        if (success) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Invalid email or password");
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
          <div className="flex flex-col md:flex-row">
            <AnimatePresence initial={false} mode="wait">
              {/* Welcome Panel - Always on top for mobile */}
              <motion.div
                key={isSignUp ? "welcome-signup" : "welcome-login"}
                className={`flex flex-col items-center justify-center p-6 sm:p-10 text-white 
                  bg-gradient-to-br ${isSignUp ? 'from-blue-600 to-indigo-700' : 'from-indigo-600 to-blue-700'}
                  w-full md:w-5/12 order-1 ${isSignUp ? 'md:order-2' : 'md:order-1'}`}
                initial={{ 
                  x: isSignUp ? '100%' : '-100%',
                  opacity: 0
                }}
                animate={{ 
                  x: 0,
                  opacity: 1
                }}
                exit={{ 
                  x: isSignUp ? '-100%' : '100%',
                  opacity: 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="mb-6 p-4 bg-white/20 rounded-full">
                  <FaGraduationCap className="text-4xl sm:text-5xl" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-center">
                  {isSignUp ? 'Welcome to Students Hub!' : 'Welcome Back!'}
                </h2>
                
                <p className="text-sm text-center mb-6 max-w-xs text-white/90">
                  {isSignUp 
                    ? 'Join our community to access free courses, learning paths, and educational resources.' 
                    : 'Sign in to continue your learning journey and access your saved courses.'}
                </p>
                
                <motion.button 
                  onClick={toggleForm}
                  className="mt-2 px-6 py-2.5 border-2 border-white/80 text-white rounded-full transition-colors hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSignUp ? 'Already have an account' : 'Create an account'}
                </motion.button>
                
                {/* Decorative elements */}
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              </motion.div>
              
              {/* Form Panel - Always on bottom for mobile */}
              <motion.div 
                key={isSignUp ? "form-signup" : "form-login"}
                className={`flex w-full md:w-7/12 flex-col items-center justify-center px-6 sm:px-10 py-8 sm:py-12
                  order-2 ${isSignUp ? 'md:order-1' : 'md:order-2'}`}
                initial={{ 
                  x: isSignUp ? '-100%' : '100%',
                  opacity: 0
                }}
                animate={{ 
                  x: 0,
                  opacity: 1
                }}
                exit={{ 
                  x: isSignUp ? '100%' : '-100%',
                  opacity: 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
                  {isSignUp ? 'Create Account' : 'Login'}
                </h2>
                  <form className="w-full max-w-sm space-y-4" onSubmit={handleSubmit}>
                  <AnimatePresence>                    {isSignUp && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
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
                          />
                          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>
                      </motion.div>
                    )}                  </AnimatePresence>
                  
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
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  
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
                    />
                    {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                  </div>

                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
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

                        {/* Class Level */}
                        <div>
                          <select 
                            name="classLevel"
                            value={formData.classLevel}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                              formErrors.classLevel ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Class Level</option>
                            <option value="10th">10th Grade</option>
                            <option value="11th">11th Grade</option>
                            <option value="12th">12th Grade</option>
                            <option value="other">Other</option>
                          </select>
                          {formErrors.classLevel && <p className="text-red-500 text-xs mt-1">{formErrors.classLevel}</p>}
                        </div>

                        {/* Board of Education - Only show for 10th, 11th, 12th */}
                        {['10th', '11th', '12th'].includes(formData.classLevel) && (
                          <div>
                            <select 
                              name="boardOfEducation"
                              value={formData.boardOfEducation}
                              onChange={handleChange}
                              className={`w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                                formErrors.boardOfEducation ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                              }`}
                            >
                              <option value="">Select Board of Education</option>
                              <option value="cbse">CBSE</option>
                              <option value="state_board">State Board</option>
                            </select>
                            {formErrors.boardOfEducation && <p className="text-red-500 text-xs mt-1">{formErrors.boardOfEducation}</p>}
                          </div>
                        )}

                        {/* Country */}
                        <div>
                          <select 
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:outline-none transition-all ${
                              formErrors.country ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Country</option>
                            <option value="india">India</option>
                            <option value="usa">United States</option>
                            <option value="uk">United Kingdom</option>
                            <option value="canada">Canada</option>
                            <option value="australia">Australia</option>
                            <option value="other">Other</option>
                          </select>
                          {formErrors.country && <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            name="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={handleChange}
                            className="mt-1 form-checkbox text-blue-600 rounded"
                          />                          <label className="text-sm text-gray-600">
                            I agree to the <Link to="/terms-and-conditions" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>
                          </label>
                        </div>                        {formErrors.agreedToTerms && <p className="text-red-500 text-xs mt-1">{formErrors.agreedToTerms}</p>}
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
                </form>

                <div className="w-full max-w-sm">
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">OR CONTINUE WITH</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <motion.button 
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg flex items-center justify-center"
                      whileHover={{ backgroundColor: "#f9fafb" }}
                    >
                      <FaGoogle className="text-red-500 mr-2" />
                      <span className="text-sm font-medium">Google</span>
                    </motion.button>
                    <motion.button 
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg flex items-center justify-center"
                      whileHover={{ backgroundColor: "#f9fafb" }}
                    >
                      <FaFacebook className="text-blue-700 mr-2" />
                      <span className="text-sm font-medium">Facebook</span>
                    </motion.button>
                  </div>
                </div>

                <div className="mt-8 text-sm text-gray-600 text-center">
                  <span>By continuing, you agree to our </span>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">Terms of Service</a>
                  <span> & </span>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">Privacy Policy</a>
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