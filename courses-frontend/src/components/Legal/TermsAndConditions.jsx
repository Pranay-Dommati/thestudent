import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFileContract, FaShieldAlt, FaUsers, FaGavel, FaChevronUp } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide the scroll top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleBack = () => {
    // Ensure navigation works by checking if returnTo exists
    console.log("Navigating back to:", returnTo);
    navigate(returnTo);
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">      {/* Fixed Header for Mobile */}      <div className="bg-white shadow-sm sticky top-0 z-50 pointer-events-auto">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-2 md:mb-3 relative z-50 px-3 py-2 -ml-2 rounded-md hover:bg-blue-50 active:bg-blue-100"
            aria-label="Go back"
          >
            <FaArrowLeft className="mr-1 md:mr-2 flex-shrink-0" />
            <span className="text-sm md:text-base font-medium">Back</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-y-2">
            <FaFileContract className="text-blue-600 text-2xl md:text-3xl mr-3 sm:mr-4 self-start sm:self-center" />            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Terms and Conditions</h1>
              <p className="text-xs md:text-sm text-gray-600">Last updated: June 14, 2025</p>
            </div>
          </div>
        </div>
      </div>{/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8"
        >
          {/* Key Points Summary */}
          <section className="mb-6 md:mb-8 bg-blue-50 p-3 md:p-5 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3 flex items-center">
              <FaShieldAlt className="text-blue-600 mr-2 md:mr-3 flex-shrink-0" />
              <span>Key Points</span>
            </h2>
            <ul className="list-disc pl-5 text-sm md:text-base text-gray-700 space-y-1 md:space-y-2">
              <li><strong>Account:</strong> Keep your login details secure and accurate</li>
              <li><strong>Content:</strong> Our materials are for personal, educational use only</li>
              <li><strong>Behavior:</strong> Be respectful and follow community guidelines</li>
              <li><strong>Privacy:</strong> We protect your data as outlined in our Privacy Policy</li>
              <li><strong>Changes:</strong> We'll notify you of any significant updates to these terms</li>
            </ul>
          </section>          {/* Interactive Collapsible Sections */}
          <div className="space-y-3 md:space-y-4">            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaUsers className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">User Account Responsibilities</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base text-gray-700">
                <p className="mb-2">As a EasyLearnova user, you are responsible for:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Providing accurate and current account information</li>
                  <li>Keeping your password secure and confidential</li>
                  <li>Notifying us of any unauthorized account access</li>
                  <li>Using an appropriate username that doesn't infringe on others' rights</li>
                </ul>
              </div>
            </details>            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaFileContract className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Educational Content Usage</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base text-gray-700">
                <p className="mb-2">Our educational content:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Is for personal, non-commercial use only</li>
                  <li>Cannot be reproduced or distributed without permission</li>
                  <li>Is provided "as is" without guarantees of accuracy</li>
                  <li>Remains the intellectual property of EasyLearnova</li>
                </ul>
              </div>
            </details>            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mr-2 md:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span className="text-sm md:text-base truncate">Community Guidelines</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base text-gray-700">
                <p className="mb-2">When using our service, you agree not to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Post harmful, threatening, or objectionable content</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                  <li>Disrupt our service or attempt unauthorized access</li>
                  <li>Use the platform for commercial purposes without permission</li>
                </ul>
              </div>
            </details>            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <FaGavel className="text-blue-600 text-base md:text-lg mr-2 md:mr-3 flex-shrink-0" />
                  <span className="text-sm md:text-base truncate">Account Termination</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base text-gray-700">
                <p>We may suspend or terminate accounts that violate our terms. If you wish to delete your account, you may contact our support team or discontinue using the service.</p>
              </div>
            </details>            <details className="bg-white border rounded-lg group">
              <summary className="px-3 md:px-4 py-2.5 md:py-3 cursor-pointer font-medium flex items-center justify-between">                <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600 mr-2 md:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm md:text-base truncate">Limitations & Disclaimers</span>
                </div>
                <div className="w-5 h-5 flex-shrink-0 transform group-open:rotate-180 transition-transform ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              <div className="px-3 md:px-4 py-2.5 md:py-3 border-t text-sm md:text-base text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Our service is provided "as is" without warranties</li>
                  <li>We're not liable for indirect or consequential damages</li>
                  <li>These terms are governed by the laws of India</li>
                  <li>We may update these terms with prior notice for significant changes</li>
                </ul>
              </div>
            </details>
          </div>          {/* Contact Section */}
          <section className="mt-6 md:mt-8 bg-gray-50 p-4 md:p-5 rounded-lg text-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Questions About These Terms?</h2>
            <p className="text-gray-700 mb-2 md:mb-3">
              Contact us at <strong>easylearnova@gmail.com</strong>
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Address: Hyderabad, Telangana, India
            </p>
          </section>

          {/* Acceptance */}
          <div className="mt-6 md:mt-8 bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-r-lg">
            <h4 className="text-base md:text-lg font-semibold text-blue-900 mb-1 md:mb-2">Acceptance</h4>
            <p className="text-blue-800 text-xs md:text-sm">
              By using EasyLearnova, you agree to these Terms and Conditions. If you don't agree, please don't use our service.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating scroll to top button - only visible on mobile when scrolled down */}      <motion.button 
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

export default TermsAndConditions;
