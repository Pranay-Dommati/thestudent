import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShieldAlt, FaUserShield, FaLock, FaServer, FaUsers, FaGavel, FaChevronUp } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide the scroll top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleBack = () => {
    // Check if there's a returnTo in location state, otherwise go back in history
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      console.log("Navigating back to:", returnTo);
      navigate(returnTo);
    } else {
      // Use browser history to go back to previous page
      console.log("Navigating back in history");
      navigate(-1);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">      {/* Fixed Header for Mobile */}      <div className="bg-white shadow-sm sticky top-0 z-50 pointer-events-auto">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between mb-2 md:mb-4">            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors relative z-50 px-3 py-2 -ml-2 rounded-md hover:bg-blue-50 active:bg-blue-100"
              aria-label="Go back"
            >
              <FaArrowLeft className="mr-1 md:mr-2 flex-shrink-0" /> 
              <span className="text-sm md:text-base font-medium">Back</span>
            </button>
            <FaShieldAlt className="text-blue-600 text-2xl md:text-4xl" />
          </div>          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mr-4 truncate">Privacy Policy</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1 sm:mt-0 whitespace-nowrap flex-shrink-0">Last updated: June 14, 2025</p>
          </div>
        </div>
      </div>{/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-md rounded-lg p-4 sm:p-6 md:p-8"
        >
          {/* Summary Section */}
          <section className="mb-6 md:mb-8 bg-blue-50 p-3 md:p-5 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">Key Points Summary</h2>
            <ul className="list-disc pl-5 text-sm md:text-base text-gray-700 space-y-1 md:space-y-2">
              <li><strong>Data Collection:</strong> We collect basic account info, educational preferences, and usage data</li>
              <li><strong>Data Usage:</strong> To personalize learning, improve our services, and communicate with you</li>
              <li><strong>Data Protection:</strong> We implement industry-standard security measures</li>
              <li><strong>Your Control:</strong> You can access, update, or delete your data anytime</li>
            </ul>
          </section>          {/* Collapsible Sections */}
          <div className="space-y-3 md:space-y-4">            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaUserShield className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Information We Collect</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base">
                <ul className="list-disc pl-5 text-gray-700 space-y-1 md:space-y-2">
                  <li>Account information (name, email, password)</li>
                  <li>Educational information (class level, subjects of interest)</li>
                  <li>Usage data (courses viewed, lessons completed, quiz scores)</li>
                  <li>Technical data (device type, browser, IP address)</li>
                </ul>
              </div>
            </details>            <details className="bg-white border rounded-lg group">              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaLock className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">How We Use Your Information</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base">
                <ul className="list-disc pl-5 text-gray-700 space-y-1 md:space-y-2">
                  <li>Provide personalized learning experiences</li>
                  <li>Process transactions and send notifications</li>
                  <li>Improve our platform and services</li>
                  <li>Send updates on new courses and features</li>
                </ul>
              </div>
            </details>            <details className="bg-white border rounded-lg group">              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaShieldAlt className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Data Security</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base">
                <p className="text-gray-700">
                  We use encryption, secure servers, and regular security audits to protect your personal information. 
                  While no online service is 100% secure, we follow industry best practices to safeguard your data.
                </p>
              </div>
            </details>

            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaUsers className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Third-Party Sharing</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base">
                <p className="text-gray-700">
                  We don't sell your personal data. We only share information with service providers who help us 
                  operate our platform, and they're contractually obligated to protect your data.
                </p>
              </div>
            </details>

            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaGavel className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Your Rights</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base">
                <p className="text-gray-700 mb-2">
                  You have the right to:
                </p>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </div>
            </details>
          </div>          {/* Contact Section */}
          <section className="mt-6 md:mt-8 bg-gray-50 p-4 md:p-5 rounded-lg text-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Questions About Your Privacy?</h2>
            <p className="text-gray-700 mb-2 md:mb-3">
              Contact us at <strong>easylearnova@gmail.com</strong>
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Student Hub Inc. Hyderabad, Telangana, India
            </p>
          </section>
        </motion.div>
      </div>      {/* Floating scroll to top button - only visible on mobile when scrolled down */}
      <motion.button 
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50"
        onClick={scrollToTop}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0,
          scale: showScrollTop ? 1 : 0.8,
          pointerEvents: showScrollTop ? 'auto' : 'none'
        }}
        transition={{ duration: 0.2 }}
        aria-label="Scroll to top"
      >
        <FaChevronUp size={20} />
      </motion.button>
    </div>
  );
};

export default PrivacyPolicy;
