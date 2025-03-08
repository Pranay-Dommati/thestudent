import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaMapMarkerAlt, FaGlobe, FaGithub, FaLinkedin, FaSave, FaTimes, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const EditableField = ({ label, value, onChange, type = "text", isDarkMode }) => (
  <div>
    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows="4"
        className={`w-full p-2 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 text-white border-gray-600' 
            : 'bg-white text-gray-800 border-gray-300'
        } focus:ring-2 focus:ring-blue-500`}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 text-white border-gray-600' 
            : 'bg-white text-gray-800 border-gray-300'
        } focus:ring-2 focus:ring-blue-500`}
      />
    )}
  </div>
);

const SocialLinkField = ({ platform, icon: Icon, value, onChange, isDarkMode }) => {
  const [isValid, setIsValid] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const validateUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return !url || urlRegex.test(url);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setIsValid(validateUrl(newValue));
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${isValid ? 'text-gray-500' : 'text-red-500'}`} />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => setShowPreview(true)}
            onBlur={() => setTimeout(() => setShowPreview(false), 200)}
            placeholder={`Enter your ${platform} URL`}
            className={`w-full p-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-300'
            } focus:ring-2 ${
              isValid 
                ? 'focus:ring-blue-500 focus:border-blue-500' 
                : 'border-red-500 focus:ring-red-200'
            }`}
          />
          {!isValid && (
            <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
          )}
        </div>
      </div>

      {showPreview && value && isValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          } border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            } group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${
                platform === 'Website' ? 'text-blue-500' :
                platform === 'GitHub' ? 'text-gray-900' :
                platform === 'LinkedIn' ? 'text-blue-600' : 'text-gray-500'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {platform}
              </p>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {value}
              </p>
            </div>
            <FaExternalLinkAlt className={`w-4 h-4 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            } group-hover:text-blue-500`} />
          </a>
        </motion.div>
      )}
    </div>
  );
};

const BasicProfile = ({ isDarkMode, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localProfileData, setLocalProfileData] = useState({
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    bio: 'Passionate learner | Full Stack Developer | AI Enthusiast',
    location: 'San Francisco, CA',
    interests: ['Web Development', 'Machine Learning', 'AI', 'Cloud Computing', 'DevOps', 'Mobile Development'],
    socialLinks: {
      website: 'portfolio.johndoe.dev',
      github: 'github.com/johndoe',
      linkedin: 'linkedin.com/in/johndoe'
    }
  });

  const [newInterest, setNewInterest] = useState('');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate URLs
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const socialLinksValid = Object.values(localProfileData.socialLinks).every(url => 
        !url || urlRegex.test(url)
      );

      if (!socialLinksValid) {
        toast.error('Please enter valid URLs for social links');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update parent component with all data including social links
      onUpdateProfile({
        name: localProfileData.fullName,
        username: localProfileData.username,
        bio: localProfileData.bio,
        location: localProfileData.location,
        interests: localProfileData.interests,
        socialLinks: localProfileData.socialLinks
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Personal Information
        </h3>
        <motion.button
          whileHover={{ scale: isSaving ? 1 : 1.05 }}
          whileTap={{ scale: isSaving ? 1 : 0.95 }}
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isEditing 
              ? `bg-blue-500 text-white ${isSaving ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-600'}`
              : 'text-blue-500 hover:text-blue-600'
          }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5"
              >
                <FaSpinner className="w-5 h-5" />
              </motion.div>
              <span>Saving...</span>
            </>
          ) : isEditing ? (
            <>
              <FaSave className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <FaEdit className="w-5 h-5" />
              <span>Edit Profile</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <EditableField
              label="Full Name"
              value={localProfileData.fullName}
              onChange={(value) => setLocalProfileData({...localProfileData, fullName: value})}
              isDarkMode={isDarkMode}
            />
            <EditableField
              label="Username"
              value={localProfileData.username}
              onChange={(value) => setLocalProfileData({...localProfileData, username: value})}
              isDarkMode={isDarkMode}
            />
            <EditableField
              label="Email"
              type="email"
              value={localProfileData.email}
              onChange={(value) => setLocalProfileData({...localProfileData, email: value})}
              isDarkMode={isDarkMode}
            />
            <EditableField
              label="Location"
              value={localProfileData.location}
              onChange={(value) => setLocalProfileData({...localProfileData, location: value})}
              isDarkMode={isDarkMode}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bio */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Bio
        </h3>
        {isEditing ? (
          <EditableField
            label=""
            value={localProfileData.bio}
            onChange={(value) => setLocalProfileData({...localProfileData, bio: value})}
            type="textarea"
            isDarkMode={isDarkMode}
          />
        ) : (
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {localProfileData.bio}
          </p>
        )}
      </div>

      {/* Areas of Interest */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Areas of Interest
        </h3>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {localProfileData.interests.map((interest, index) => (
                <motion.div
                  key={interest}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{interest}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const newInterests = [...localProfileData.interests];
                      newInterests.splice(index, 1);
                      setLocalProfileData({...localProfileData, interests: newInterests});
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add new interest..."
                className={`flex-1 p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-800 border-gray-300'
                } focus:ring-2 focus:ring-blue-500`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newInterest.trim()) {
                    setLocalProfileData({
                      ...localProfileData,
                      interests: [...localProfileData.interests, newInterest.trim()]
                    });
                    setNewInterest('');
                  }
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (newInterest.trim()) {
                    setLocalProfileData({
                      ...localProfileData,
                      interests: [...localProfileData.interests, newInterest.trim()]
                    });
                    setNewInterest('');
                  }
                }}
                disabled={!newInterest.trim()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  newInterest.trim()
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Add
              </motion.button>
            </div>
            
            {localProfileData.interests.length > 0 && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Click on an interest to remove it
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {localProfileData.interests.map(interest => (
              <motion.span 
                key={interest}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1 rounded-full text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {interest}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div>
        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Social Links
        </h3>
        <div className="space-y-4">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <SocialLinkField
                platform="Website"
                icon={FaGlobe}
                value={localProfileData.socialLinks.website}
                onChange={(value) => setLocalProfileData({
                  ...localProfileData,
                  socialLinks: { ...localProfileData.socialLinks, website: value }
                })}
                isDarkMode={isDarkMode}
              />
              <SocialLinkField
                platform="GitHub"
                icon={FaGithub}
                value={localProfileData.socialLinks.github}
                onChange={(value) => setLocalProfileData({
                  ...localProfileData,
                  socialLinks: { ...localProfileData.socialLinks, github: value }
                })}
                isDarkMode={isDarkMode}
              />
              <SocialLinkField
                platform="LinkedIn"
                icon={FaLinkedin}
                value={localProfileData.socialLinks.linkedin}
                onChange={(value) => setLocalProfileData({
                  ...localProfileData,
                  socialLinks: { ...localProfileData.socialLinks, linkedin: value }
                })}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {Object.entries(localProfileData.socialLinks).map(([platform, url]) => (
                <motion.a
                  key={platform}
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 ${
                    isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  {platform === 'website' && <FaGlobe className="w-5 h-5" />}
                  {platform === 'github' && <FaGithub className="w-5 h-5" />}
                  {platform === 'linkedin' && <FaLinkedin className="w-5 h-5" />}
                  <span>{url}</span>
                </motion.a>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicProfile;