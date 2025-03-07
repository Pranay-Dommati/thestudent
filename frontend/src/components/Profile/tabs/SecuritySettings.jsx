import React from 'react';
import { FaShieldAlt, FaGoogle, FaGithub, FaBell, FaLock } from 'react-icons/fa';

const SecuritySettings = ({ isDarkMode }) => {
  return (
    <div className="space-y-8">
      {/* Password Section */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Password & Authentication
        </h3>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <span className="flex items-center">
              <FaLock className="w-5 h-5 mr-2" />
              Change Password
            </span>
            <span>Last changed 2 months ago</span>
          </button>
        </div>
      </div>

      {/* Linked Accounts */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Linked Accounts
        </h3>
        <div className="space-y-3">
          <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <FaGoogle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Google</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>john.doe@gmail.com</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              Disconnect
            </button>
          </div>
          
          <div className={`p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center">
              <FaGithub className="w-5 h-5 mr-3" />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>GitHub</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not connected</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Two-Factor Authentication
        </h3>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="w-5 h-5 text-green-500" />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>2FA is enabled</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Using Authenticator app</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
              Manage 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Email Preferences
        </h3>
        <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>Course updates and announcements</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>New course recommendations</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" />
            <span>Community mentions and replies</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="form-checkbox text-blue-500 rounded" defaultChecked />
            <span>Security alerts</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;