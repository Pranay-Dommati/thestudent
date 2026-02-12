import React from 'react';
import { FaRobot, FaBrain, FaLightbulb, FaCog } from 'react-icons/fa';

const AISettings = ({ isDarkMode }) => {
  return (
    <div className="space-y-8">
      {/* AI Personalization */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Learning Preferences
        </h3>
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaBrain className="w-5 h-5 text-purple-500" />
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    AI Learning Path Generation
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Let AI suggest personalized learning paths
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaLightbulb className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Smart Recommendations
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Course suggestions based on your interests
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Preferences */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          AI Assistant Settings
        </h3>
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} space-y-6`}>
          <div>
            <label className={`block font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Learning Style
            </label>
            <select 
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option>Visual Learning</option>
              <option>Practical Examples</option>
              <option>Detailed Explanations</option>
              <option>Project-Based</option>
            </select>
          </div>

          <div>
            <label className={`block font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Difficulty Level
            </label>
            <select 
              className={`w-full p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Theme Preferences
        </h3>
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaCog className="w-5 h-5 text-blue-500" />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Dark Mode
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle dark/light theme
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isDarkMode}
                onChange={() => {}} // Handle in parent component
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;