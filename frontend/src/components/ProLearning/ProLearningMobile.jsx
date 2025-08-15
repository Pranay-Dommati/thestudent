import React, { useState, useEffect } from "react";
import { 
  IoArrowBack, IoBook, IoPlayCircle, IoDocumentText, 
  IoHelpCircle, IoLibrary, IoCheckmarkCircle, IoClose,
  IoChevronDown, IoSchoolOutline, IoHeart, IoHeartOutline,
  IoCheckmark, IoEllipsisHorizontal
} from "react-icons/io5";
import { FaBookmark, FaCheck, FaTrophy } from "react-icons/fa";
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
  // Sync currentSection with activeTab prop
  useEffect(() => {
    if (activeTab) {
      setCurrentSection(activeTab);
    }
  }, [activeTab]);

  const [currentSection, setCurrentSection] = useState(activeTab || 'reading');
  const [showTopicsSheet, setShowTopicsSheet] = useState(false);
  const [showLearningGuide, setShowLearningGuide] = useState(false);

  // Calculate progress
  const progressPercentage = topicsList && topicsList.length > 0 
    ? Math.round((completedTopics.length / topicsList.length) * 100) 
    : 0;

  // Use the actual tabs passed from parent, but map to our icons
  const getIconForTab = (tabId) => {
    const iconMap = {
      'reading': IoBook,
      'summary': IoDocumentText,
      'videos': IoPlayCircle,
      'quiz': IoHelpCircle,
      'resources': IoLibrary
    };
    return iconMap[tabId] || IoBook;
  };

  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
    if (setActiveTab) {
      setActiveTab(sectionId);
    }
  };

  // Get current tab content
  const getCurrentTabContent = () => {
    const currentTab = tabs?.find(tab => tab.id === currentSection);
    
    if (currentTab && renderTabContent) {
      return renderTabContent(currentTab);
    }

    // Fallback content if no tabs provided
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Loading...</h3>
        <p className="text-gray-600">Please wait while content loads.</p>
      </div>
    );
  };

  return (
    <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar - Simplified */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <Link 
            to="/chat" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <IoArrowBack className="text-lg" />
          </Link>
          
          <h1 className="text-lg font-semibold text-gray-900">AI Pro</h1>
          
          {/* Simple Save Button - Only essential action in header */}
          <button
            onClick={handleSaveToLearningHub}
            disabled={isSavingToHub || savedToHub}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              savedToHub
                ? "bg-green-100 text-green-700"
                : isSavingToHub
                ? "bg-gray-100 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSavingToHub ? (
              <>
                <BiLoaderAlt className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : savedToHub ? (
              <>
                <FaCheck size={14} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <FaBookmark size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="p-3 space-y-4">
          {/* Course Title */}
          {courseTitle && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{courseTitle}</h2>
              <p className="text-gray-600 text-sm">Master the fundamentals step by step</p>
            </div>
          )}

          {/* Unified Topic Selector - Single clear pattern */}
          {topicsList && topicsList.length > 1 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              {/* Current Topic Display */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Topic</h3>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {topicsList.find(topic => topic.isActive)?.name || topicsList[0]?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowLearningGuide(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <IoBook className="mr-2" size={16} />
                  Switch Topic
                </button>
              </div>
              
              {/* Simple Progress Indicator */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{completedTopics.length} of {topicsList.length} completed</span>
                <div className="flex space-x-1">
                  {topicsList.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index < completedTopics.length ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Area - Clean and focused */}
          <div className="space-y-6">
            {getCurrentTabContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-3">
          {tabs && tabs.length > 0 ? tabs.map((tab) => {
            const Icon = getIconForTab(tab.id);
            const isActive = currentSection === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleSectionChange(tab.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`text-xl mb-1 ${isActive ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }) : (
            // Fallback navigation if tabs are not loaded
            <>
              <button
                onClick={() => handleSectionChange('reading')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  currentSection === 'reading' 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoBook className={`text-xl mb-1 ${currentSection === 'reading' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${currentSection === 'reading' ? 'text-teal-600' : 'text-gray-500'}`}>
                  Reading
                </span>
              </button>
              <button
                onClick={() => handleSectionChange('summary')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  currentSection === 'summary' 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoDocumentText className={`text-xl mb-1 ${currentSection === 'summary' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${currentSection === 'summary' ? 'text-teal-600' : 'text-gray-500'}`}>
                  Summary
                </span>
              </button>
              <button
                onClick={() => handleSectionChange('videos')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  currentSection === 'videos' 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoPlayCircle className={`text-xl mb-1 ${currentSection === 'videos' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${currentSection === 'videos' ? 'text-teal-600' : 'text-gray-500'}`}>
                  Videos
                </span>
              </button>
              <button
                onClick={() => handleSectionChange('quiz')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  currentSection === 'quiz' 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoHelpCircle className={`text-xl mb-1 ${currentSection === 'quiz' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${currentSection === 'quiz' ? 'text-teal-600' : 'text-gray-500'}`}>
                  Quiz
                </span>
              </button>
              <button
                onClick={() => handleSectionChange('resources')}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  currentSection === 'resources' 
                    ? 'text-teal-600 bg-teal-50 shadow-sm transform -translate-y-0.5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoLibrary className={`text-xl mb-1 ${currentSection === 'resources' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${currentSection === 'resources' ? 'text-teal-600' : 'text-gray-500'}`}>
                  Resources
                </span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Floating Topic Selector - Simple and clean */}
      {topicsList && topicsList.length > 1 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowLearningGuide(true)}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
          >
            <IoBook size={20} />
          </button>
        </div>
      )}
      {/* Topics Sheet - Slide up modal */}
      {showTopicsSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Sheet Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Course Topics</h2>
                <button
                  onClick={() => setShowTopicsSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <IoClose size={20} />
                </button>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <IoSchoolOutline className="mr-2" />
                <span>{completedTopics.length} of {topicsList.length} completed</span>
              </div>
            </div>

            {/* Topics List */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-3">
                {topicsList.map((topic, index) => {
                  const isCompleted = completedTopics.includes(topic.name);
                  const isActive = topic.isActive;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200 shadow-sm"
                          : isCompleted
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-600 text-white"
                            : isActive
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          {isCompleted ? (
                            <IoCheckmark size={16} />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            isActive ? "text-teal-900" : isCompleted ? "text-green-900" : "text-gray-700"
                          }`}>
                            {topic.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {isCompleted ? "Completed" : isActive ? "In Progress" : "Not Started"}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex items-center">
                            <div className="text-xs bg-gradient-to-r from-teal-500 to-blue-600 text-white px-3 py-1 rounded-full font-medium">
                              Current
                            </div>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="flex items-center">
                            <FaTrophy className="text-yellow-500" size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full mr-2"></div>
                  <span>Keep going! You're doing great</span>
                </div>
                <button
                  onClick={() => setShowTopicsSheet(false)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-teal-700 hover:to-blue-700 transition-all"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Guide Modal */}
      {showLearningGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Learning Guide</h2>
                <button
                  onClick={() => setShowLearningGuide(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <IoClose size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Learning Topics Section */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <IoBook className="text-purple-600" size={16} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Learning Topics</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">Select a topic to focus on:</p>
                
                {/* Topics List */}
                <div className="space-y-3">
                  {topicsList && topicsList.map((topic, index) => {
                    const isSelected = topic.isActive;
                    const isCompleted = completedTopics.includes(topic.name);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleTopicSelect && handleTopicSelect(topic)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          }`}>
                            {isSelected && <IoCheckmark className="text-white" size={12} />}
                          </div>
                          <span className={`font-medium ${
                            isSelected ? "text-purple-900" : "text-gray-700"
                          }`}>
                            {topic.name}
                          </span>
                          {isCompleted && (
                            <div className="ml-auto">
                              <IoCheckmarkCircle className="text-green-500" size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-purple-600">
                    {completedTopics.length} / {topicsList ? topicsList.length : 0} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setShowLearningGuide(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProLearningMobile;
