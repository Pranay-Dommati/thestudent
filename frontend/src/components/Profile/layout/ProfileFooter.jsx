import React from 'react';
import { FaGraduationCap, FaGithub, FaTwitter, FaDiscord } from 'react-icons/fa';

const ProfileFooter = ({ isDarkMode }) => {
  return (
    <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-t ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Socials */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FaGraduationCap className={`w-6 h-6 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                StudentHub
              </span>
            </div>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Join our community of learners and achieve your goals.
            </p>
            <div className="flex space-x-4">
              {[FaTwitter, FaGithub, FaDiscord].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8">
            {['Help & Support', 'Terms of Service', 'Privacy Policy', 'Contact Us'].map((link) => (
              <a
                key={link}
                href="#"
                className={`text-sm ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Stay Updated
            </h3>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className={`flex-1 px-4 py-2 rounded-l-lg ${
                  isDarkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className={`mt-8 pt-8 border-t ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        } text-center`}>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            © 2024 StudentHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ProfileFooter;