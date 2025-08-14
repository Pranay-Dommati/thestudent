import React, { useState, useEffect } from "react";
import { 
  IoChevronDown, IoClose, IoCheckmarkCircle, IoBookmark, IoArrowBack, IoMenu,
  IoHome, IoShare, IoBookmarkOutline, IoEllipsisVertical, IoListOutline
} from "react-icons/io5";
import { 
  FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, 
  FaCheck, FaTrophy, FaRobot, FaBookmark, FaTimes
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { Link } from "react-router-dom";
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
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [showTopicsList, setShowTopicsList] = useState(true);
  const [showTopicsDrawer, setShowTopicsDrawer] = useState(false);

  // Handle mobile tab selection
  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // Handle topic selection
  const handleMobileTopicSelect = (topicId) => {
    setActiveTopicId(topicId);
    handleTopicSelect(topicId);
    setShowTopicsList(false);
    setShowTopicsDrawer(false);
  };

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab);
  const activeTopic = topicsList.find(topic => topic.id === activeTopicId || topic.isActive);

  return (
    <div className="lg:hidden min-h-screen bg-gray-50">
      {/* Compact Mobile Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link to="/chat" className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors">
              <IoArrowBack className="text-xl text-gray-700" />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-gray-900 line-clamp-1">
                {courseTitle || 'Pro Learning'}
              </h1>
              <p className="text-xs text-gray-500">Interactive Course</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <IoBookmarkOutline className="text-xl text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <IoShare className="text-xl text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar - Full Width */}
      {topicsList.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Course Progress</span>
            <span className="text-sm font-bold text-indigo-600">
              {completedTopics.length} / {topicsList.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${topicsList.length > 0 ? (completedTopics.length / topicsList.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Tab Selector - Completely Edge-to-Edge */}
      <div className="sticky top-[73px] z-30 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl touch-target"
          >
            <div className="flex items-center">
              {React.createElement(currentTab?.icon, { 
                className: "mr-3 text-xl text-indigo-600" 
              })}
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  {currentTab?.label}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTab?.description}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-1 rounded-full">
                Tap to change
              </div>
              <IoChevronDown className="text-gray-400 text-lg" />
            </div>
          </button>
        </div>
      </div>

      <div className="px-0 pb-6">{/* Remove horizontal padding for edge-to-edge design */}
        {/* Save to Hub - Edge-to-Edge Design */}
        {content && topicsList.length > 0 && !topicsList.some(t => t.dbTopic) && savedToHub !== 'hidden' && (
          <div className="mb-0">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1">🎉 Course Ready!</h3>
                    <p className="text-emerald-100 text-sm">Save to your Learning Hub for easy access</p>
                  </div>
                  <button
                    onClick={handleSaveToLearningHub}
                    disabled={isSavingToHub || savedToHub === true}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
                      savedToHub === true
                        ? 'bg-white/20 text-white cursor-default backdrop-blur-sm'
                        : isSavingToHub
                        ? 'bg-white/20 text-white cursor-not-allowed backdrop-blur-sm'
                        : 'bg-white/90 text-emerald-600 hover:bg-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {savedToHub === true ? (
                      <>
                        <FaCheck className="text-sm" />
                        <span>Saved!</span>
                      </>
                    ) : isSavingToHub ? (
                      <>
                        <BiLoaderAlt className="text-sm animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaBookmark className="text-sm" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Content Display - Edge-to-Edge */}
        <div className="space-y-0 mb-0">
          {isLoading ? (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center">
              <BiLoaderAlt className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading content...</h3>
              <p className="text-sm text-gray-600">Please wait while we prepare your materials</p>
            </div>
          ) : (
            /* Clean Content Display - Edge-to-Edge */
            <div className="space-y-0">
              {/* Content in full-width white section */}
              <div className="bg-white p-6 border-b border-gray-100">
                <div className="mobile-content-display prose prose-sm max-w-none mobile-hide-duplicate-headers">
                  {renderTabContent()}
                </div>
              </div>

              {/* Interactive Elements - Full Width */}
              <div className="bg-gray-50 p-4 flex flex-wrap gap-2">
                <button className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                  <FaBookmark className="mr-2" />
                  Bookmark
                </button>
                <button className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                  <IoShare className="mr-2" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Topics Grid - Edge-to-Edge */}
        {topicsList.length > 0 && (
          <div className="bg-white border-t border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Learning Topics</h3>
                {completedTopics.length === topicsList.length && topicsList.length > 0 && (
                  <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <FaTrophy className="mr-1" />
                    Complete!
                  </div>
                )}
              </div>
              
              <div className="grid gap-3">
                {topicsList.map((topicItem, index) => (
                  <button
                    key={topicItem.id}
                    onClick={() => handleTopicSelect(topicItem.id)}
                    className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 touch-target transform hover:scale-[1.02] ${
                      topicItem.isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                        : completedTopics.includes(topicItem.id)
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-2 border-emerald-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-indigo-700 border-2 border-transparent hover:border-indigo-200'
                    }`}
                  >
                    {/* Topic Number & Status */}
                    <div className="flex items-center mr-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                          completedTopics.includes(topicItem.id)
                            ? 'bg-emerald-500 text-white'
                            : topicItem.isActive
                              ? 'bg-white/20 text-white border-2 border-white/30'
                              : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {completedTopics.includes(topicItem.id) ? (
                          <IoCheckmarkCircle className="text-lg" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>
                    
                    {/* Topic Info */}
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-base">{topicItem.name}</span>
                      {completedTopics.includes(topicItem.id) && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                            ✓ Completed
                          </span>
                        </div>
                      )}
                      {topicItem.isActive && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                            Currently studying
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Completion Toggle */}
                    <div
                      className="ml-3 p-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicCompletion(topicItem.id, e);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTopicCompletion(topicItem.id, e);
                        }
                      }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          completedTopics.includes(topicItem.id)
                            ? 'bg-emerald-500 border-emerald-500 scale-110'
                            : topicItem.isActive
                              ? 'border-white/60 hover:border-white'
                              : 'border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {completedTopics.includes(topicItem.id) && (
                          <IoCheckmarkCircle className="text-white text-sm" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Mobile Tab Selection Modal */}
      {isMobileMenuOpen && (
        <>
          {/* Enhanced Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Modern Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 max-h-[80vh] overflow-hidden">
              {/* Modal Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Content Type</h3>
                  <p className="text-sm text-gray-500 mt-1">Select what you want to study</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>
              
              {/* Tab Options - Grid Layout */}
              <div className="p-6 pb-safe">
                <div className="grid gap-4">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = tab.id === activeTab;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabSelect(tab.id)}
                        className={`flex items-center p-4 rounded-2xl transition-all duration-300 touch-target transform hover:scale-[1.02] ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl scale-[1.02]'
                            : 'bg-gray-50 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-indigo-700 border-2 border-transparent hover:border-indigo-200'
                        }`}
                      >
                        <div className={`p-3 rounded-xl mr-4 ${
                          isActive ? 'bg-white/20' : 'bg-white shadow-sm'
                        }`}>
                          <IconComponent className={`text-2xl ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-bold text-lg">{tab.label}</div>
                          <div className={`text-sm mt-1 ${
                            isActive ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            {tab.description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="ml-3">
                            <IoCheckmarkCircle className="text-2xl text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProLearningMobile;
