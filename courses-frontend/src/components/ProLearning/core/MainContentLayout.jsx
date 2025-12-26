import React from 'react';
import { IoChevronBack, IoMenu, IoClose, IoCheckmarkCircle } from 'react-icons/io5';
import { FaRobot, FaTrophy } from 'react-icons/fa';
import ProLearningMobile from '../ProLearningMobile';

/**
 * MainContentLayout Component
 * 
 * Renders the main content area with sidebar layout for ProLearning page.
 * Includes:
 * - Desktop tab navigation with progressive generation support
 * - Mobile responsive layout via ProLearningMobile
 * - Collapsible sidebar with topic list and progress tracking
 * - Sidebar toggle functionality
 * 
 * @param {Object} props - Component props
 */
const MainContentLayout = ({
  // Sidebar state
  sidebarVisible,
  handleSidebarToggle,
  
  // Tab configuration
  tabs,
  activeTab,
  updateActiveTab,
  updateActiveTabDesktop,
  
  // Content state
  content,
  contentTopicName,
  renderTabContent,
  
  // Topic management
  topicsList,
  selectedTopic,
  topicParam,
  getCurrentTopicFromParam,
  isTopicBlocked,
  handleTopicSelect,
  
  // Topic completion
  completedTopics,
  toggleTopicCompletion,
  
  // Progressive generation
  useProgressiveGeneration,
  availableTabsForTopics,
  isProgressiveGenerating,
  progressiveGenerationProgress,
  loadProgressiveTopicContent,
  
  // Loading states
  isLoading,
  loadScenario,
  setShowSkeletons,
  setLoadingStep,
  
  // Course info
  courseTitle
}) => {
  return (
    <div className="relative">
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
          sidebarVisible 
            ? 'lg:mr-[400px]' // Add right margin on large screens when sidebar is visible
            : ''
        }`}>
          <div className="w-full px-0 lg:px-6 py-0 lg:pt-20 lg:pb-4 max-w-full overflow-x-hidden">{/* Remove mobile padding for edge-to-edge design, add enough top padding for desktop to clear navbar */}
              {/* Enhanced Tab Navigation - Desktop Only */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border mb-6 hidden lg:block overflow-hidden">
                <div className="p-2">
                  <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      
                      // Derive current topic name (fallback to URL param for single-topic flows)
                      const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
                      
                      // Check if current topic is blocked (2nd topic onwards)
                      const currentTopicBlocked = currentTopicName ? isTopicBlocked(currentTopicName) : false;
                      
                      // Check if tab has content already (treat as available even if tabs map isn't filled yet)
                      const hasTabContent = !!content && contentTopicName === currentTopicName && (
                        (tab.id === 'reading' && !!content?.reading && String(content.reading).trim().length > 0) ||
                        (tab.id === 'summary' && !!content?.summary && String(content.summary).trim().length > 0) ||
                        (tab.id === 'videos' && Array.isArray(content?.videos) && content.videos.length > 0) ||
                        (tab.id === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
                        // Treat resources as ready if array has items OR metadata indicates completion
                        (tab.id === 'resources' && (
                          (Array.isArray(content?.resources) && content.resources.length > 0) ||
                          !!content?.resourcesMetadata?.generatedAt ||
                          // Reload/DB mode fallback: if other tabs exist, allow clicking to show empty state
                          (loadScenario === 'reload' && (
                            (!!content?.reading && String(content.reading).trim().length > 0) ||
                            (!!content?.summary && String(content.summary).trim().length > 0) ||
                            (Array.isArray(content?.videos) && content.videos.length > 0) ||
                            (Array.isArray(content?.quiz) && content.quiz.length > 0) ||
                            (!!content?.quiz?.questions && Array.isArray(content?.quiz?.questions) && content.quiz.questions.length > 0)
                          ))
                        ))
                      );

                      // Check if tab content is available for progressive generation
                      let isTabAvailable = true;
                      if (useProgressiveGeneration) {
                        // Progressive gating per topic: if the topic is blocked (no tabs ready yet), keep hidden; otherwise allow ready tabs.
                        // Reading-first rule: require reading to be ready before exposing other tabs while generating
                        const readingReady = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes('reading')) ||
                          (content && contentTopicName === currentTopicName && typeof content.reading === 'string' && content.reading.trim().length > 0));
                        // In reload/DB mode, if other tabs exist, let users click Resources to see the empty-state UI
                        const otherTabsPresent = (
                          (!!content?.reading && String(content.reading).trim().length > 0) ||
                          (!!content?.summary && String(content.summary).trim().length > 0) ||
                          (Array.isArray(content?.videos) && content.videos.length > 0) ||
                          (Array.isArray(content?.quiz) && content.quiz.length > 0) ||
                          (!!content?.quiz?.questions && Array.isArray(content?.quiz?.questions) && content.quiz.questions.length > 0)
                        );

                        if (currentTopicBlocked) {
                          isTabAvailable = false;
                        } else {
                          isTabAvailable = ((currentTopicName && availableTabsForTopics[currentTopicName]?.includes(tab.id)) || hasTabContent);
                          // Relax gating for Resources in reload mode so users can see the empty state
                          if (!isTabAvailable && loadScenario === 'reload' && tab.id === 'resources' && otherTabsPresent) {
                            isTabAvailable = true;
                          }
                          if ((isProgressiveGenerating) && tab.id !== 'reading' && !readingReady) {
                            isTabAvailable = false;
                          }
                        }
                      }
                      
                      // Tab is disabled if topic is blocked OR if progressive tab is not available
                      const isTabDisabled = currentTopicBlocked || (useProgressiveGeneration && !isTabAvailable);
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            // DIAGNOSTIC LOGGING FOR TAB CLICK
                            console.log(`🖱️ [TAB CLICK] User clicked ${tab.label} tab`, {
                              tabId: tab.id,
                              timestamp: new Date().toISOString(),
                              currentTopicName,
                              currentTopicBlocked,
                              isTabDisabled,
                              isTabAvailable,
                              hasTabContent,
                              willUpdateTab: !currentTopicBlocked && !isTabDisabled
                            });
                            
                            if (tab.id === 'resources') {
                              console.log(`🖱️ [RESOURCES TAB CLICK] Detailed resources state:`, {
                                hasContent: !!content,
                                resourcesInContent: 'resources' in (content || {}),
                                resourcesType: typeof content?.resources,
                                resourcesIsArray: Array.isArray(content?.resources),
                                resourcesCount: content?.resources?.length || 0,
                                hasResourcesMetadata: !!content?.resourcesMetadata,
                                generatedAt: content?.resourcesMetadata?.generatedAt || 'MISSING',
                                availableTabsForCurrentTopic: availableTabsForTopics[currentTopicName] || [],
                                resourcesIsInAvailableTabs: (availableTabsForTopics[currentTopicName] || []).includes('resources')
                              });
                            }
                            
                            if (!currentTopicBlocked && !isTabDisabled) {
                              console.log(`✅ [TAB CLICK] Tab ${tab.label} is clickable, updating active tab`);
                              updateActiveTabDesktop(tab.id); // Use debounced version for desktop
                              // Only reload content if progressive generation is enabled AND content is not already available
                              if (useProgressiveGeneration && currentTopicName && isTabAvailable && !content?.[tab.id]) {
                                console.log(`🔄 [TAB CLICK] Will reload content for ${tab.label}`);
                                // Only refresh if this specific tab content doesn't exist yet
                                loadProgressiveTopicContent(currentTopicName, { showLoader: false });
                              } else {
                                console.log(`✓ [TAB CLICK] Content already available for ${tab.label}, no reload needed`);
                              }
                            } else if (!currentTopicBlocked && useProgressiveGeneration && !isTabAvailable) {
                              console.log(`⏳ [TAB CLICK] Tab ${tab.label} not ready yet, showing loading skeleton`);
                              // If disabled due to not ready, show skeletons briefly to convey loading
                              setShowSkeletons(true);
                              setLoadingStep(`Preparing ${tab.label}...`);
                            } else {
                              console.log(`🚫 [TAB CLICK] Tab ${tab.label} is blocked or disabled:`, {
                                currentTopicBlocked,
                                isTabDisabled,
                                reason: currentTopicBlocked ? 'Topic is blocked' : 'Tab is disabled'
                              });
                            }
                          }}
                          disabled={isLoading || isTabDisabled}
                          className={`group flex-1 min-w-[120px] p-4 rounded-xl font-medium transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                              : isTabDisabled
                                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          } ${(isLoading || isTabDisabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={
                            currentTopicBlocked && loadScenario !== 'first-time'
                              ? `${tab.label} will be available after course generation completes`
                              : isTabDisabled 
                                ? `${tab.label} is being generated...` 
                                : tab.description
                          }
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`relative p-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-white/20' 
                                : isTabDisabled
                                  ? 'bg-gray-200'
                                  : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <IconComponent className="text-lg" />
                              {/* Progressive generation status indicator - only show while generating */}
                              {useProgressiveGeneration && (
                                (() => {
                                  const isGenerating = isProgressiveGenerating &&
                                    progressiveGenerationProgress.topic === selectedTopic?.name &&
                                    progressiveGenerationProgress.tabType === tab.id;
                                  return isGenerating ? (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Generating..." />
                                    </div>
                                  ) : null;
                                })()
                              )}
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
                            {/* Tiny status label: show only when generating */}
                            {useProgressiveGeneration && isProgressiveGenerating &&
                              progressiveGenerationProgress.topic === selectedTopic?.name &&
                              progressiveGenerationProgress.tabType === tab.id && (
                                <span className="text-[10px] leading-none text-blue-600" aria-live="polite">Loading…</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Mobile Version */}
              <ProLearningMobile
                activeTab={activeTab}
                setActiveTab={updateActiveTab}
                content={content}
                topicsList={topicsList}
                completedTopics={completedTopics}
                toggleTopicCompletion={toggleTopicCompletion}
                handleTopicSelect={handleTopicSelect}
                tabs={tabs}
                renderTabContent={renderTabContent}
                courseTitle={courseTitle}
                isLoading={isLoading}
                useProgressiveGeneration={useProgressiveGeneration}
                availableTabsForTopics={availableTabsForTopics}
                selectedTopic={selectedTopic}
                isProgressiveGenerating={isProgressiveGenerating}
                progressiveGenerationProgress={progressiveGenerationProgress}
                currentTopicName={selectedTopic?.name || getCurrentTopicFromParam(topicParam)}
                currentTopicBlocked={selectedTopic?.name ? isTopicBlocked(selectedTopic.name) : false}
              />

              {/* Desktop Tab Content */}
              <div className="hidden lg:block bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden">
                <div className="p-4 lg:p-6 max-w-full overflow-x-hidden">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => handleSidebarToggle(!sidebarVisible)}
          className={`fixed transition-all duration-300 z-40 hover:bg-gray-50 ${
            sidebarVisible 
              ? 'top-20 right-[400px] lg:right-[400px] xl:right-[400px] transform bg-white p-3 shadow-md rounded-l-lg' 
              : 'top-20 right-4 bg-white p-3 shadow-lg rounded-lg'
          } hidden lg:flex items-center justify-center`}
          aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarVisible ? 
            <IoChevronBack className="w-5 h-5 text-gray-600" /> : 
            <IoMenu className="w-5 h-5 text-gray-600" />
          }
        </button>

        {/* Mobile Sidebar Backdrop */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-[25] lg:hidden"
            onClick={() => handleSidebarToggle(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed top-0 right-0 h-screen bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col ${
            sidebarVisible ? 'translate-x-0' : 'translate-x-full'
          } ${
            // Responsive width
            'w-full sm:w-[380px] md:w-[400px] lg:w-[400px] xl:w-[400px]'
          } ${
            // Hide on mobile by default, show only when explicitly opened
            'lg:block'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 pt-20 px-4 pb-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Learning Guide</h2>
              <button
                onClick={() => handleSidebarToggle(false)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <IoClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Topic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FaRobot className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {topicsList.length > 1 ? 'Learning Topics' : 'Current Topic'}
                  </h3>
                  {topicsList.length === 1 && (
                    <p className="text-sm text-gray-700 mt-0.5 truncate max-w-[260px]">
                      {topicsList[0]?.name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Display topics (both single and multiple) */}
              <div className="space-y-2">
                {topicsList.length > 1 && (
                  <p className="text-blue-700 font-medium text-sm mb-3">
                    Select a topic to focus on:
                  </p>
                )}
                {topicsList.length === 0 ? (
                  // Loading skeleton for topics
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-full p-3 rounded-lg bg-gray-100 animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-300 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg animate-pulse">
                      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-2 bg-gray-300 rounded w-full"></div>
                    </div>
                  </>
                ) : topicsList.map((topicItem) => (
                  <button
                    key={topicItem.id}
                    onClick={() => handleTopicSelect(topicItem.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 relative group ${
                      topicItem.isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : completedTopics.includes(topicItem.id)
                          ? 'bg-white text-gray-700 border border-gray-200 shadow-sm opacity-75'
                          : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Completion checkbox - moved to left */}
                      <div
                        className={`relative flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                          completedTopics.includes(topicItem.id)
                            ? 'bg-green-500 border-green-500 shadow-sm'
                            : topicItem.isActive
                              ? 'border-white/40 hover:border-white/60'
                              : 'border-gray-300 hover:border-green-400 group-hover:border-green-400'
                        }`}
                        onClick={(e) => toggleTopicCompletion(topicItem.id, e)}
                        title={
                          topicItem.isActive 
                            ? 'Complete this topic'
                            : completedTopics.includes(topicItem.id) 
                              ? 'Mark as incomplete' 
                              : 'Mark as complete'
                        }
                      >
                        {completedTopics.includes(topicItem.id) && (
                          <IoCheckmarkCircle className="text-white text-sm" />
                        )}
                      </div>
                      
                      {/* Topic content */}
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {topicItem.name}
                          </span>
                          {/* Completion status indicator */}
                          {completedTopics.includes(topicItem.id) && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Progress indicator - show for both single and multiple topics */}
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {completedTopics.length} / {topicsList.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${topicsList.length > 0 ? (completedTopics.length / topicsList.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  {completedTopics.length === topicsList.length && topicsList.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-green-600">
                      <FaTrophy className="text-sm" />
                      <span className="text-xs font-medium">
                        {topicsList.length === 1 ? 'Topic completed! 🎉' : 'Course completed! 🎉'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Removed Learning Progress and Learning Tips sections from sidebar */}
          </div>
          
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="space-y-4">
              {/* Reading material now displays as a single, unified content block */}
              {/* Removed Reading Sections navigation - content is no longer split into sections */}
            </div>
          </div>
        </div>
      </div>
   
  );
};

export default MainContentLayout;
