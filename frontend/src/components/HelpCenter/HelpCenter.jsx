import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaChevronDown, FaChevronUp, FaGraduationCap, FaUserCircle, 
         FaCreditCard, FaBook, FaCertificate, FaEnvelope, FaPhoneAlt, 
         FaComments, FaArrowLeft, FaHome } from 'react-icons/fa';

const HelpCenter = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleQuestion = (id) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [
    { id: 'general', label: 'General', icon: FaGraduationCap },
    { id: 'account', label: 'Account', icon: FaUserCircle },
    { id: 'courses', label: 'Courses', icon: FaBook },
    { id: 'payment', label: 'Payment', icon: FaCreditCard },
    { id: 'certificates', label: 'Certificates', icon: FaCertificate }
  ];

  const faqData = {
    general: [
      { 
        id: 'general-1', 
        question: 'How do I get started with EasyLearnova?', 
        answer: 'To get started, create an account by clicking "Sign Up" on the homepage. Once registered, you can explore courses, set up your profile, and begin your learning journey.' 
      },
      { 
        id: 'general-2', 
        question: 'Is EasyLearnova available on mobile devices?', 
        answer: 'Yes, EasyLearnova is fully responsive and works on all devices. You can access your courses, track your progress, and interact with other students from your smartphone, tablet, or computer.' 
      },
      { 
        id: 'general-3', 
        question: 'How can I contact support?', 
        answer: 'You can reach our support team by emailing support@easylearnova.com or by using the live chat feature available at the bottom right of every page. Our team is available 24/7 to assist you.' 
      }
    ],
    account: [
      { 
        id: 'account-1', 
        question: 'How do I reset my password?', 
        answer: 'To reset your password, click on "Forgot Password" on the login page. Enter the email address associated with your account, and we\'ll send you instructions to create a new password.' 
      },
      { 
        id: 'account-2', 
        question: 'How do I update my profile information?', 
        answer: 'You can update your profile information by going to your Profile page. Click on your profile picture in the top-right corner of the screen, select "Profile", and then click "Edit Profile" to make changes.' 
      },
      { 
        id: 'account-3', 
        question: 'Can I change my username or email address?', 
        answer: 'You can change your username anytime from your profile settings. To change your email address, go to Account Settings > Email, and follow the verification process to confirm your new email address.' 
      }
    ],
    courses: [
      { 
        id: 'courses-1', 
        question: 'How do I enroll in a course?', 
        answer: 'To enroll in a course, navigate to the course page and click the "Enroll Now" button. If it\'s a paid course, you\'ll be prompted to complete the payment process before gaining access.' 
      },
      { 
        id: 'courses-2', 
        question: 'How can I track my progress in a course?', 
        answer: 'Your progress is automatically tracked as you complete lessons and quizzes. You can view your overall progress on the course dashboard or in the "My Learning" section of your profile.' 
      },
      { 
        id: 'courses-3', 
        question: 'Can I access course materials offline?', 
        answer: 'Some course materials are available for offline access through our mobile app. Look for the download icon next to videos and resources to save them for offline viewing.' 
      }
    ],
    payment: [
      { 
        id: 'payment-1', 
        question: 'What payment methods do you accept?', 
        answer: 'We accept major credit and debit cards (Visa, Mastercard, American Express), PayPal, and in some regions, we offer additional local payment methods like UPI, SEPA transfers, and more.' 
      },
      { 
        id: 'payment-2', 
        question: 'How do refunds work?', 
        answer: 'If you\'re not satisfied with a course, you can request a refund within 30 days of purchase. Go to your Purchases page, find the course, and click "Request Refund" to start the process.' 
      },
      { 
        id: 'payment-3', 
        question: 'Is my payment information secure?', 
        answer: 'Yes, all payment information is encrypted and processed securely. We use industry-standard SSL/TLS encryption and do not store your full credit card details on our servers.' 
      }
    ],
    certificates: [
      { 
        id: 'certificates-1', 
        question: 'How do I earn a course certificate?', 
        answer: 'To earn a certificate, you must complete all required components of a course, including videos, readings, assignments, and pass any final assessments with the minimum required score.' 
      },
      { 
        id: 'certificates-2', 
        question: 'Where can I find my certificates?', 
        answer: 'Your certificates are stored in the "Certificates" section of your profile. You can download them as PDFs or share them directly to LinkedIn and other platforms.' 
      },
      { 
        id: 'certificates-3', 
        question: 'Are your certificates recognized by employers?', 
        answer: 'Our certificates verify skill acquisition and course completion. Many employers value these certificates as proof of your continuous learning and dedication to professional development.' 
      }
    ]
  };

  const filteredFaqs = searchQuery
    ? Object.values(faqData).flat().filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData[activeCategory];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Custom Help Center Navbar - Now with a gradient background */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Site Name */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-xl">
                  S
                </div>
                <span className="font-bold text-xl text-white">EasyLearnova</span>
              </Link>
              <div className="h-6 border-r border-blue-400 mx-4"></div>
              <span className="text-lg font-medium text-white">Help Center</span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-blue-100 hover:text-white transition-colors flex items-center space-x-1">
                <FaHome />
                <span>Home</span>
              </Link>
              <Link to="/contact" className="text-blue-100 hover:text-white transition-colors flex items-center space-x-1">
                <FaEnvelope />
                <span>Contact</span>
              </Link>
              <Link to="/" className="px-4 py-2 bg-white text-indigo-600 rounded-md hover:bg-blue-100 transition-colors">
                Back to Platform
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-2 border-t border-blue-400">
              <Link to="/" className="block px-4 py-2 text-blue-100 hover:bg-blue-700">
                Home
              </Link>
              <Link to="/contact" className="block px-4 py-2 text-blue-100 hover:bg-blue-700">
                Contact
              </Link>
              <Link to="/" className="block px-4 py-2 text-blue-100 hover:bg-blue-700">
                Back to Platform
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Search - Now with smoother transition from navbar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">How can we help you?</h1>
          <p className="text-xl mb-8 text-center text-blue-100">Find answers to common questions and learn how to make the most of your learning experience.</p>
          
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pl-12 pr-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800"
            />
          </div>
        </div>
        
        {/* Add a curved edge for a smoother transition */}
            </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-5xl px-4 pb-16">
        {/* Category Navigation */}
        <div className="flex overflow-x-auto pb-3 mb-8 hide-scrollbar -mt-8">
          <div className="flex space-x-2 md:space-x-4 mx-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery('');
                }}
                className={`flex items-center px-4 py-3 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === category.id || (searchQuery && filteredFaqs.some(faq => faq.id.startsWith(category.id)))
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                <category.icon className="mr-2" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {searchQuery ? 'Search Results' : `${categories.find(c => c.id === activeCategory).label} FAQs`}
          </h2>

          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map(faq => (
                <div 
                  key={faq.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleQuestion(faq.id)}
                    className="flex justify-between items-center w-full px-6 py-4 text-left font-medium focus:outline-none hover:bg-gray-50"
                  >
                    <span className="text-gray-800">{faq.question}</span>
                    {expandedQuestions[faq.id] ? 
                      <FaChevronUp className="flex-shrink-0 text-indigo-600" /> : 
                      <FaChevronDown className="flex-shrink-0 text-gray-400" />
                    }
                  </button>
                  
                  {expandedQuestions[faq.id] && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FaEnvelope className="text-indigo-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Email Support</h3>
            </div>
            <p className="text-gray-600 mb-4">Have a complex question? Our support team is ready to help.</p>
            <a 
              href="mailto:support@easylearnova.com" 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Contact Support
            </a>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                <FaComments className="text-indigo-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Live Chat</h3>
            </div>
            <p className="text-gray-600 mb-4">Need immediate assistance? Chat with our support agents in real-time.</p>
            <button 
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Start Chat
            </button>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gray-100 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Additional Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/tutorials" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-medium text-indigo-600 mb-2">Video Tutorials</h4>
              <p className="text-sm text-gray-600">Step-by-step guides to help you navigate the platform</p>
            </Link>
            <Link to="/community" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-medium text-indigo-600 mb-2">Community Forum</h4>
              <p className="text-sm text-gray-600">Connect with other students and share your experiences</p>
            </Link>
            <Link to="/blog" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-medium text-indigo-600 mb-2">Learning Blog</h4>
              <p className="text-sm text-gray-600">Tips and advice to enhance your learning journey</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;