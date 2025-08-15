import React, { useState, useEffect } from "react";
import { 
  IoChevronDown, IoClose, IoCheckmarkCircle, IoArrowBack, 
  IoCheckmark, IoTime, IoChevronForward, IoHeart, IoMenu,
  IoBook, IoPlayCircle, IoDocumentText, IoHelpCircle,
  IoChevronUp, IoEllipsisHorizontal
} from "react-icons/io5";
import { 
  FaCheck, FaTrophy, FaBookmark, FaPlay, FaBook, FaQuestionCircle
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { Link } from "react-router-dom";

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
  const [showTopicsSheet, setShowTopicsSheet] = useState(false);
  const [showTabsSheet, setShowTabsSheet] = useState(false);

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const progressPercentage = topicsList.length > 0 ? Math.round((completedTopics.length / topicsList.length) * 100) : 0;

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setShowTabsSheet(false);
  };

  return (
    <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link 
              to="/chat" 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <IoArrowBack className="text-lg" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {courseTitle || 'Pro Learning'}
              </h1>
              <p className="text-sm text-gray-500">AI-Generated Course</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {completedTopics.length}/{topicsList.length}
            </div>
            <div className="text-xs text-gray-500">Topics</div>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      {topicsList.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 mx-4 mt-4 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Your Progress</h3>
              <p className="text-sm text-gray-600">Keep up the great work!</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
          <div className="w-full bg-white/70 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{completedTopics.length} completed</span>
            <span>{topicsList.length - completedTopics.length} remaining</span>
          </div>
        </div>
      )}

      {/* Content Type Selector */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => setShowTabsSheet(true)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {React.createElement(currentTab?.icon || IoBook, { 
              className: "text-xl text-blue-600" 
            })}
            <div className="text-left">
              <div className="font-semibold text-gray-900">{currentTab?.label || 'Reading'}</div>
              <div className="text-sm text-gray-500">{currentTab?.description || 'Comprehensive study content'}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Tap to switch</span>
            <IoChevronDown className="text-gray-400" />
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 mx-4 mt-4 mb-4">
        <div className="bg-white rounded-2xl border border-gray-200 h-full">
          <div className="p-6 h-full overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading content...</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-800">
                {renderTabContent()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Save to Hub */}
        {content && !savedToHub && (
          <button
            onClick={handleSaveToLearningHub}
            disabled={isSavingToHub}
            className={`w-full py-3 px-4 rounded-xl font-medium text-base transition-colors flex items-center justify-center space-x-2 ${
              isSavingToHub
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSavingToHub ? (
              <>
                <BiLoaderAlt className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaBookmark />
                <span>Save to Learning Hub</span>
              </>
            )}
          </button>
        )}

        {savedToHub && (
          <div className="w-full py-3 px-4 rounded-xl bg-green-50 text-green-700 font-medium text-base flex items-center justify-center space-x-2">
            <FaCheck />
            <span>Saved to Learning Hub</span>
          </div>
        )}
      </div>

      {/* Topics Bottom Sheet */}
      {showTopicsSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowTopicsSheet(false)}
          />
          
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[75vh] overflow-hidden">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Course Topics</h3>
                <button
                  onClick={() => setShowTopicsSheet(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
                >
                  <IoClose />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3">
              {topicsList.map((topic, index) => (
                <button
                  key={topic.id || index}
                  onClick={() => {
                    handleTopicSelect(topic.id || index);
                    setShowTopicsSheet(false);
                  }}
                  className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      completedTopics.includes(topic.id || index)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {completedTopics.includes(topic.id || index) ? (
                        <IoCheckmark className="text-xs" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {topic.name || `Topic ${index + 1}`}
                      </div>
                      {completedTopics.includes(topic.id || index) && (
                        <div className="text-xs text-green-600 mt-1">Completed</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicCompletion(topic.id || index);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        completedTopics.includes(topic.id || index)
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {completedTopics.includes(topic.id || index) && (
                        <IoCheckmark className="text-white text-xs" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Content Type Bottom Sheet */}
      {showTabsSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowTabsSheet(false)}
          />
          
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[60vh] overflow-hidden">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Learning Mode</h3>
            </div>
            
            <div className="p-4 space-y-3">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = tab.id === activeTab;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id)}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {tab.label}
                        </div>
                        <div className={`text-sm ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                          {tab.description}
                        </div>
                      </div>
                      {isActive && (
                        <IoCheckmarkCircle className="text-blue-600 text-xl" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProLearningMobile;
