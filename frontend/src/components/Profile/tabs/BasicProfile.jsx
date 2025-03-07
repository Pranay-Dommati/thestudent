import React from 'react';
import { FaEdit, FaMapMarkerAlt, FaGlobe, FaGithub, FaLinkedin } from 'react-icons/fa';

const BasicProfile = ({ isDarkMode }) => {
  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Personal Information
          </h3>
          <button className="text-blue-500 hover:text-blue-600">
            <FaEdit className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Full Name
            </label>
            <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>John Doe</p>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Username
            </label>
            <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>@johndoe</p>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Email
            </label>
            <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>john.doe@example.com</p>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Location
            </label>
            <p className={`flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaMapMarkerAlt className="w-4 h-4 mr-1 text-gray-400" />
              San Francisco, CA
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Bio
        </h3>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Full Stack Developer with 5 years of experience. Passionate about learning new technologies
          and sharing knowledge with others. Currently focused on AI and Machine Learning.
        </p>
      </div>

      {/* Areas of Interest */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Areas of Interest
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Web Development', 'Machine Learning', 'AI', 'Cloud Computing', 'DevOps', 'Mobile Development']
            .map(interest => (
              <span 
                key={interest}
                className={`px-3 py-1 rounded-full text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {interest}
              </span>
            ))}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Social Links
        </h3>
        <div className="space-y-3">
          <a 
            href="#" 
            className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaGlobe className="w-5 h-5" />
            <span>portfolio.johndoe.dev</span>
          </a>
          <a 
            href="#" 
            className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaGithub className="w-5 h-5" />
            <span>github.com/johndoe</span>
          </a>
          <a 
            href="#" 
            className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaLinkedin className="w-5 h-5" />
            <span>linkedin.com/in/johndoe</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BasicProfile;