import React, { useState, useEffect, useRef } from "react";
import {
  IoBook, IoPlayCircle, IoDocumentText,
  IoHelpCircle, IoLibrary, IoCheckmarkCircle, IoClose,
  IoSchoolOutline, IoCheckmark, IoMenu, IoChevronBack, IoArrowBack
} from "react-icons/io5";
import { FaTrophy } from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

const ProLearningMobile = ({
  activeTab,
  setActiveTab,
  content,
  topicsList,
  completedTopics,
  toggleTopicCompletion,
  handleTopicSelect,
  tabs,
  renderTabContent,
  courseTitle,
  isLoading,
  // Progressive gating
  useProgressiveGeneration,
  availableTabsForTopics,
  selectedTopic,
  isProgressiveGenerating,
  progressiveGenerationProgress,
  currentTopicBlocked
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
  const [isSelectingTopic, setIsSelectingTopic] = useState(false);
  const [showTopicsSidebar, setShowTopicsSidebar] = useState(false);
  
  // Track if user has scrolled past the header for sticky nav behavior
  const [isNavSticky, setIsNavSticky] = useState(false);
  const navRef = useRef(null);
  const headerRef = useRef(null);
  
  // Ref for the scrollable main area so we can control scroll position on tab change
  const mainRef = useRef(null);

  // Handle scroll to toggle sticky nav
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setIsNavSticky(headerBottom <= 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollMainToTop = (smooth = true) => {
    if (mainRef.current) {
      try {
        mainRef.current.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
      } catch {
        // Fallback for older browsers
        mainRef.current.scrollTop = 0;
      }
    }
  };
  
  const navigate = useNavigate();

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
    // Reset scroll to top when switching tabs
    scrollMainToTop();
    setCurrentSection(sectionId);
    if (setActiveTab) {
      setActiveTab(sectionId);
    }
  };

  // Also ensure we scroll to top whenever the section changes externally
  useEffect(() => {
    scrollMainToTop(false);
  }, [currentSection]);

  // Handle topic selection and close modal
  const handleTopicSelection = async (topicId) => {
    if (handleTopicSelect) {
      setIsSelectingTopic(true);
      try {
        await handleTopicSelect(topicId);
        setShowLearningGuide(false); // Close the Learning Guide modal
        setShowTopicsSheet(false); // Close the Topics Sheet modal if open
        setShowTopicsSidebar(false); // Close the new Topics Sidebar
      } catch (error) {
        console.error('Error selecting topic:', error);
      } finally {
        setIsSelectingTopic(false);
      }
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
    <div className="lg:hidden min-h-screen bg-gray-50 relative">
      {/* Enhanced Styles and Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scale-98 {
          transform: scale(0.98);
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}} />
      
      

      {/* Enhanced Main Content Area */}
  <main ref={mainRef} className="bg-gradient-to-b from-gray-50 to-white">
        {/* Header scrolls with content (not sticky) */}
        <header ref={headerRef} className="bg-white/98 backdrop-blur-xl shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Integrated Back Button */}
            <button
              onClick={() => {
                // Check if we have referrer info or came from chat
                const referrer = document.referrer;
                const cameFromChat = referrer.includes('/chat') || 
                                   sessionStorage.getItem('cameFromChat') === 'true';
                
                if (cameFromChat || window.history.length > 2) {
                  // Clear the session flag and go back
                  sessionStorage.removeItem('cameFromChat');
                  navigate(-1);
                } else {
                  // Direct access or no history - go to chat
                  navigate('/chat');
                }
              }}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all duration-200 touch-manipulation"
              aria-label="Go back"
            >
              <IoArrowBack className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Unified Content Area */}
            <div className="flex-1 min-w-0">
              {/* Course Context */}
              {courseTitle && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                    {courseTitle}
                  </span>
                </div>
              )}
              
              {/* Topic Switcher - Icon on Right */}
              {topicsList && topicsList.length > 0 && (
                <button
                  onClick={() => setShowTopicsSidebar(true)}
                  className="flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation group w-full"
                  aria-label="Switch learning topic"
                >
                  {/* Topic Information */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate leading-tight">
                      {topicsList.find(topic => topic.isActive)?.name || topicsList[0]?.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                        Switch Topics
                      </span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <span className="text-xs text-gray-500">
                        {completedTopics.length}/{topicsList?.length || 0} completed
                      </span>
                    </div>
                  </div>
                  
                  {/* Menu Icon - Positioned on Right */}
                  <div className="flex items-center justify-center w-10 h-10">
                    <IoMenu className="w-6 h-6 text-blue-600" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </header>
        
        {/* Tab Navigation - Sticky when scrolled past header */}
        <nav 
          ref={navRef}
          className={`bg-white border-b border-gray-200 px-1 py-2 z-40 shadow-sm lg:hidden transition-all duration-200 ${
            isNavSticky 
              ? 'fixed top-0 left-0 right-0' 
              : ''
          }`}
        >
          <div className="grid grid-cols-5 gap-0.5">
            {tabs && tabs.length > 0 ? tabs.map((tab, index) => {
              const isActive = currentSection === tab.id;
              const isTabAvailable = useProgressiveGeneration 
                ? (selectedTopic?.name && availableTabsForTopics?.[selectedTopic.name]?.includes(tab.id)) 
                : true;
              const isDisabledByTopic = !!currentTopicBlocked;
              const isDisabled = (useProgressiveGeneration && !isTabAvailable && !isLoading) || isDisabledByTopic;
              const isTabLoading = isDisabled && !isDisabledByTopic && isProgressiveGenerating && 
                              progressiveGenerationProgress?.topic === selectedTopic?.name && 
                              progressiveGenerationProgress?.tabType === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isDisabled) handleSectionChange(tab.id);
                  }}
                  disabled={isTabLoading || isDisabled}
                  className={`relative px-1 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : isDisabled
                        ? 'text-gray-400 opacity-60'
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                  } ${isTabLoading ? 'animate-pulse' : ''}`}
                >
                  <span className={`text-xs font-medium capitalize block leading-tight ${
                    isActive ? 'font-semibold' : ''
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Loading Spinner for Progressive Generation */}
                  {isTabLoading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  )}
                </button>
              );
            }) : (
              // Responsive Fallback tabs
              ['reading', 'summary', 'videos', 'quiz', 'resources'].map((tabId) => {
                const isActive = currentSection === tabId;
                return (
                  <button
                    key={tabId}
                    onClick={() => handleSectionChange(tabId)}
                    className={`relative px-1 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <span className={`text-xs font-medium capitalize block leading-tight ${
                      isActive ? 'font-semibold' : ''
                    }`}>
                      {tabId}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </nav>
        
        {/* Spacer to prevent content jump when nav becomes fixed */}
        {isNavSticky && <div className="h-14 lg:hidden" />}
        
        {/* Content Area */}
        <div className="p-4 pb-8">
          {/* Loading State for Content Transitions */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {getCurrentTabContent()}
            </div>
          )}
        </div>
      </main>      {/* Ultra Minimal Professional Sidebar - Slides from Right */}
      <div className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white/95 backdrop-blur-xl border-l border-gray-200/50 transform transition-all duration-300 ease-out ${
        showTopicsSidebar ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Clean Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-wide">LEARNING PATH</h2>
          </div>
          <button
            onClick={() => setShowTopicsSidebar(false)}
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <IoClose className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Clean Topics List */}
        <div className="flex-1 overflow-y-auto px-2">
          {topicsList && topicsList.length > 0 ? topicsList.map((topic, index) => {
            const isCompleted = completedTopics.includes(topic.id || topic.name);
            const isActive = topic.isActive;
            
            return (
              <div
                key={index}
                className={`group relative mb-1 rounded-lg overflow-hidden ${
                  isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100/50' : ''
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                )}

                <div className="flex items-center px-3 py-3 gap-3">
                  {/* Modern Number Badge */}
                  <div className={`flex-shrink-0 relative flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : isCompleted
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isSelectingTopic && isActive ? (
                      <BiLoaderAlt className="animate-spin w-3 h-3" />
                    ) : isCompleted ? (
                      <IoCheckmark className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Topic Button - Takes available space */}
                  <button
                    onClick={() => {
                      if (!isActive && !isSelectingTopic) {
                        handleTopicSelection(topic.id || topic.name);
                      }
                    }}
                    disabled={isSelectingTopic}
                    className={`flex-1 min-w-0 text-left group-hover:opacity-90 transition-opacity ${
                      isSelectingTopic ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Topic Title - Properly constrained */}
                    <h4 className={`font-medium text-sm leading-tight truncate pr-2 ${
                      isActive ? 'text-blue-900' : 'text-gray-800'
                    }`}>
                      {topic.name}
                    </h4>
                    {isActive && (
                      <span className="text-xs text-blue-600/70 font-medium">Current</span>
                    )}
                  </button>

                  {/* Circular, compact checkbox with larger hit area - Fixed position */}
                  <button
                    onClick={(e) => {
                      const topicId = topic.id || topic.name;
                      if (toggleTopicCompletion) {
                        toggleTopicCompletion(topicId, e);
                      }
                    }}
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-blue-50/40 transition-colors"
                    aria-label={`${isCompleted ? 'Unmark' : 'Mark'} as complete`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {isCompleted && <IoCheckmark className="w-3 h-3" />}
                    </span>
                  </button>
                </div>
              </div>
            );
          }) : (
            // Clean skeleton
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center px-3 py-3 animate-pulse">
                  <div className="w-7 h-7 bg-gray-200 rounded-md mr-3"></div>
                  <div className="flex-1">
                    <div className="h-3.5 bg-gray-200 rounded-md w-3/4"></div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded-md ml-2"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modern Progress Footer */}
        {topicsList && topicsList.length > 0 && (
          <div className="border-t border-gray-100/80 px-4 py-4 bg-gray-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Progress</span>
              <span className="text-sm font-semibold text-gray-800">
                {completedTopics.length}/{topicsList.length}
              </span>
            </div>
            
            {/* Modern Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                    completedTopics.length === topicsList.length 
                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                      : 'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ 
                    width: `${topicsList.length > 0 ? (completedTopics.length / topicsList.length) * 100 : 0}%` 
                  }}
                />
              </div>
              
              {/* Completion Badge */}
              {completedTopics.length === topicsList.length && topicsList.length > 0 && (
                <div className="mt-2 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <FaTrophy className="w-3 h-3" />
                    Complete
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Sidebar Backdrop */}
      {showTopicsSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-out"
          onClick={() => setShowTopicsSidebar(false)}
          style={{ 
            animation: 'fadeIn 0.3s ease-out forwards'
          }}
        />
      )}
    </div>
  );
};

export default ProLearningMobile;
