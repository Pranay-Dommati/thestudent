import React, { useState, useEffect } from "react";
import { 
  IoChevronDown, IoClose, IoCheckmarkCircle, IoBookmark 
} from "react-icons/io5";
import { 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, 
  FaCheck, FaTrophy, FaRobot, FaBookmark
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../../styles/mobile-courses.css";

const ProLearningMobile = ({
  activeTab,
  setActiveTab,
  content,
  topicsList,
  completedTopics,
  toggleTopicCompletion,
  handleTopicSelect,
  handleSaveToLearningHub,
  isSavingToHub,
  savedToHub,
  tabs,
  renderTabContent,
  courseTitle,
  isLoading
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle mobile tab selection
  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="lg:hidden pro-learning-mobile">
      {/* Mobile Tab Selector */}
      <div className="mb-4">
        <div className="mobile-tab-selector bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-full flex items-center justify-between touch-target"
          >
            <div className="flex items-center">
              {React.createElement(currentTab?.icon, { 
                className: "mr-3 text-xl text-blue-600" 
              })}
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">
                  {currentTab?.label}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTab?.description}
                </div>
              </div>
            </div>
            <IoChevronDown className="text-gray-400 text-xl" />
          </button>
        </div>
      </div>

      {/* Save to Learning Hub Banner - Compact Mobile */}
      {content && topicsList.length > 0 && !topicsList.some(t => t.dbTopic) && savedToHub !== 'hidden' && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <FaBookmark className="text-sm" />
                </div>
                <h3 className="font-semibold text-gray-900">Course Ready!</h3>
              </div>
              <button
                onClick={handleSaveToLearningHub}
                disabled={isSavingToHub || savedToHub === true}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-1 text-sm ${
                  savedToHub === true
                    ? 'bg-green-500 text-white cursor-default'
                    : isSavingToHub
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 shadow-md'
                }`}
              >
                {savedToHub === true ? (
                  <>
                    <FaCheck className="text-xs" />
                    <span>Saved!</span>
                  </>
                ) : isSavingToHub ? (
                  <>
                    <BiLoaderAlt className="text-xs animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaBookmark className="text-xs" />
                    <span>Save to Hub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area - Mobile Optimized */}
      <div className="mobile-content-area bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 content-scroll">
          {renderTabContent()}
        </div>
      </div>

      {/* Mobile Tab Selection Modal */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 z-50">
            <div className="mobile-modal bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Select Content Type</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>
              
              {/* Tab Options */}
              <div className="p-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = tab.id === activeTab;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 mb-2 touch-target ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <div className={`p-3 rounded-lg mr-4 ${
                        isActive ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        <IconComponent className="text-xl" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-lg">{tab.label}</div>
                        <div className={`text-sm ${
                          isActive ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                      {isActive && (
                        <IoCheckmarkCircle className="text-2xl text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Topics Progress - Mobile Optimized */}
      {topicsList.length > 0 && (
        <div className="mt-6">
          <div className="mobile-topic-progress bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Learning Progress</h3>
              <span className="text-sm font-semibold text-blue-600">
                {completedTopics.length} / {topicsList.length} completed
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${topicsList.length > 0 ? (completedTopics.length / topicsList.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            {/* Topics Grid - Mobile Optimized */}
            <div className="space-y-2">
              {topicsList.map((topicItem) => (
                <button
                  key={topicItem.id}
                  onClick={() => handleTopicSelect(topicItem.id)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 touch-target ${
                    topicItem.isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : completedTopics.includes(topicItem.id)
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {/* Completion Status */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                      completedTopics.includes(topicItem.id)
                        ? 'bg-green-500 border-green-500'
                        : topicItem.isActive
                          ? 'border-white/40'
                          : 'border-gray-300'
                    }`}
                    onClick={(e) => toggleTopicCompletion(topicItem.id, e)}
                  >
                    {completedTopics.includes(topicItem.id) && (
                      <IoCheckmarkCircle className="text-white text-sm" />
                    )}
                  </div>
                  
                  {/* Topic Info */}
                  <div className="flex-1 text-left">
                    <span className="font-medium">{topicItem.name}</span>
                    {completedTopics.includes(topicItem.id) && (
                      <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Completion Celebration */}
            {completedTopics.length === topicsList.length && topicsList.length > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-center text-yellow-700">
                  <FaTrophy className="text-2xl mr-2" />
                  <span className="font-semibold">
                    🎉 {topicsList.length === 1 ? 'Topic completed!' : 'Course completed!'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProLearningMobile;
