import React from 'react';

const BasicProfile = ({ isDarkMode, onUpdateProfile }) => {
  return (
    <div className="space-y-8">
      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Personal Information
      </h3>
      <p>This is a test BasicProfile component</p>
    </div>
  );
};

export default BasicProfile;
