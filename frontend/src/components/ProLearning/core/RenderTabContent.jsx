/**
 * Render Tab Content
 * 
 * Handles the rendering logic for tab content including loading states,
 * progressive generation states, and content availability checks.
 */

import React from 'react';
import { FaRobot, FaBookOpen, FaBrain, FaVideo, FaQuestionCircle, FaLink, FaClock } from 'react-icons/fa';
import TabContentRenderer from './TabContentRenderer.jsx';

/**
 * Render tab content with all loading and generation states
 */
export const renderTabContent = (dependencies) => {
  const {
    selectedTopic,
    getCurrentTopicFromParam,
    topicParam,
    contentTopicName,
    content,
    activeTab,
    sanitizedReadingTopicName,
    sanitizedReading,
    isTopicBlocked,
    LoadingComponent,
    useProgressiveGeneration,
    availableTabsForTopics,
    isBatchGenerating,
    batchGenerationProgress,
    batchGenerationStatus,
    isGeneratingCourse,
    isLoading,
    loadingStep,
    isProgressiveGenerating,
    progressiveGenerationProgress,
    allTopicsGenerated,
    topicsList,
    handleProLearningStart,
    getCurrentTopic,
    courseTitle,
    tabs,
    copySuccessMap,
    handleCopyCode,
    openVideoModal,
    quizSubmitted,
    setQuizSubmitted,
    setContent,
    loadScenario,
    setActiveTab
  } = dependencies;

  // Derive current topic name robustly (fallback to URL param if selectedTopic not yet set)
  const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
  
  // Client-side reading readiness: prefer sanitized content; fallback to raw content presence for current topic
  const hasRawReadingForCurrent = (
    contentTopicName === currentTopicName &&
    typeof content?.reading === 'string' && content.reading.trim().length > 0
  );
  
  const readingClientReadyForCurrentTopic = (
    activeTab === 'reading' && (
      (sanitizedReadingTopicName === currentTopicName && typeof sanitizedReading === 'string' && sanitizedReading.trim().length > 0) ||
      hasRawReadingForCurrent
    )
  );
  
  // CRITICAL: Check if current topic is blocked (2nd topic onwards until course completion)
  if (currentTopicName && isTopicBlocked(currentTopicName)) {
    // For blocked topics, show the existing loading component instead of content
    return (
      <LoadingComponent 
        isBatchGenerating={isBatchGenerating}
        batchGenerationProgress={batchGenerationProgress}
        batchGenerationStatus={batchGenerationStatus}
        loadingStep={loadingStep}
      />
    );
  }
  
  // Show loading thoughtfully: in progressive mode, enforce reading-first for non-first topics
  if (useProgressiveGeneration) {
    const readyTabs = (currentTopicName && availableTabsForTopics[currentTopicName]) || [];
    const hasAnyContent = (
      // Reading content presence should be determined by sanitized association, not contentTopicName
      readingClientReadyForCurrentTopic ||
      // Other tabs still require content to belong to this topic
      (!!content && contentTopicName === currentTopicName && (
      // For reading, treat as content only if client-sanitized is ready
      (content.summary && content.summary.trim()) ||
      ((content.videos?.length || 0) > 0) ||
      ((Array.isArray(content.quiz) ? content.quiz.length : (content.quiz?.questions?.length || 0)) > 0) ||
      ((content.resources?.length || 0) > 0)
      ))
    );
    if (isBatchGenerating) return (
      <LoadingComponent 
        isBatchGenerating={isBatchGenerating}
        batchGenerationProgress={batchGenerationProgress}
        batchGenerationStatus={batchGenerationStatus}
        loadingStep={loadingStep}
      />
    );
    // Only treat active tab as ready if its content belongs to this topic
    const activeHasContent = (
      // Reading tab uses sanitized association, independent of contentTopicName resets
      (activeTab === 'reading' && readingClientReadyForCurrentTopic) ||
      // Other tabs require the content to belong to current topic
      ((contentTopicName === currentTopicName) && (
        (activeTab === 'summary' && !!content?.summary) ||
        (activeTab === 'videos' && (content?.videos?.length || 0) > 0) ||
        (activeTab === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
        (activeTab === 'resources' && (content?.resources?.length || 0) > 0)
      ))
    );
    // Allow non-reading tabs (e.g., Summary) to render as soon as they are ready,
    // even if Reading for later topics hasn't finished yet.

    if ((isGeneratingCourse || isLoading) && !readyTabs.includes(activeTab) && !activeHasContent) {
      return (
        <LoadingComponent 
          isBatchGenerating={isBatchGenerating}
          batchGenerationProgress={batchGenerationProgress}
          batchGenerationStatus={batchGenerationStatus}
          loadingStep={loadingStep}
        />
      );
    }
  } else {
    // Legacy/batch mode: keep original blocking loader behavior
    if (isGeneratingCourse || isLoading || isBatchGenerating) {
      return (
        <LoadingComponent 
          isBatchGenerating={isBatchGenerating}
          batchGenerationProgress={batchGenerationProgress}
          batchGenerationStatus={batchGenerationStatus}
          loadingStep={loadingStep}
        />
      );
    }
  }
  
  // Decide whether to show the progressive generation card or the actual content
  // Show the status card only when the active tab is not ready and has no data yet
  if (isProgressiveGenerating) {
    const currentTopicName = selectedTopic?.name || getCurrentTopicFromParam(topicParam);
    const readyTabs = (currentTopicName && availableTabsForTopics[currentTopicName]) || [];
    // Consider a tab ready if we already have content for it
    const activeHasContent = (contentTopicName === currentTopicName) && (
      (activeTab === 'reading' && readingClientReadyForCurrentTopic) ||
      (activeTab === 'summary' && !!content?.summary) ||
      (activeTab === 'videos' && (content?.videos?.length || 0) > 0) ||
      (activeTab === 'quiz' && ((Array.isArray(content?.quiz) && content.quiz.length > 0) || (content?.quiz?.questions?.length > 0))) ||
      (activeTab === 'resources' && (content?.resources?.length || 0) > 0)
    );
    const activeReady = (activeTab === 'reading')
      ? (readingClientReadyForCurrentTopic)
      : (readyTabs.includes(activeTab) || activeHasContent);

    if (!activeReady) {
      return (
        <LoadingComponent 
          isBatchGenerating={isBatchGenerating}
          batchGenerationProgress={batchGenerationProgress}
          batchGenerationStatus={batchGenerationStatus}
          loadingStep={loadingStep}
        />
      );
    }
  }

  // Global gate for Reading tab: keep loader until sanitization completes for current topic
  if (activeTab === 'reading' && !readingClientReadyForCurrentTopic) {
    return (
      <LoadingComponent 
        isBatchGenerating={isBatchGenerating}
        batchGenerationProgress={batchGenerationProgress}
        batchGenerationStatus={batchGenerationStatus}
        loadingStep={loadingStep}
      />
    );
  }

  // If no content and course not generated, show Pro Learning Experience button
  // ONLY if we truly have no course data at all
  const hasActiveTopic = topicsList.some(t => t.isActive);
  const isTopicFromDatabase = topicsList.some(t => t.dbTopic); // Check if any topic has database data
  const contentAlreadyLoaded = !!content;
  
  // Only show the "get started" screen if we have absolutely no course data
  if (!content && !allTopicsGenerated && !hasActiveTopic && !isTopicFromDatabase && !contentAlreadyLoaded && topicsList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
            
            <div className="relative z-10">
              {/* Hero Icon */}
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                <FaRobot className="text-3xl text-white" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🚀 Pro Learning Experience
              </h1>
              
              <p className="text-lg text-gray-600 mb-2">
                Complete study materials for: <span className="font-bold text-blue-600">{getCurrentTopic()}</span>
              </p>

              <div className="flex justify-center space-x-6 my-8 text-sm text-gray-700">
                <div className="flex items-center">
                  <FaBookOpen className="text-blue-500 mr-2" />
                  <span>📘 Reading</span>
                </div>
                <div className="flex items-center">
                  <FaBrain className="text-purple-500 mr-2" />
                  <span>🧠 Summary</span>
                </div>
                <div className="flex items-center">
                  <FaVideo className="text-red-500 mr-2" />
                  <span>🎥 Videos</span>
                </div>
                <div className="flex items-center">
                  <FaQuestionCircle className="text-green-500 mr-2" />
                  <span>✅ Quiz</span>
                </div>
                <div className="flex items-center">
                  <FaLink className="text-indigo-500 mr-2" />
                  <span>📚 Resources</span>
                </div>
              </div>

              <button
                onClick={handleProLearningStart}
                disabled={topicsList.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {topicsList.length === 0 ? 
                  'Loading Topics...' : 
                  `🚀 Start Pro Learning Experience`
                }
              </button>

              <p className="text-xs text-gray-500 mt-4">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no content but course is generated, show message
  if (!content) {
    console.log('🔍 No content found - debugging values:', {
      content: !!content,
      allTopicsGenerated,
      hasActiveTopic,
      isTopicFromDatabase,
      contentAlreadyLoaded,
      courseTitle,
      selectedTopic: selectedTopic?.name,
      topicsListLength: topicsList.length
    });
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-lg">
          {!courseTitle && topicsList.length === 0 ? (
            <div>
              <p className="text-gray-600 mb-4">Enter a course title to get started</p>
              <div className="text-gray-500 text-sm space-y-2">
                <p>Try clicking the Pro Learning title above and entering a course like:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Web Development with React</li>
                  <li>Python Programming Basics</li>
                  <li>Machine Learning Fundamentals</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-600 ml-3">Loading content for "{selectedTopic?.name || 'selected topic'}"...</p>
              </div>
              <p className="text-gray-500 text-sm">Content will appear automatically once loaded</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if current tab content is available in progressive generation
  const isCurrentTabAvailable = useProgressiveGeneration && selectedTopic?.name
    ? (availableTabsForTopics[selectedTopic.name]?.includes(activeTab))
    : true;

  // Show "content being generated" message for progressive generation ONLY if no content exists
  if (useProgressiveGeneration && !isCurrentTabAvailable && !content) {
    return (
      <div className="max-w-none pt-6">
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border border-yellow-200 rounded-xl p-8 mb-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <FaClock className="text-xl animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Content Being Generated</h3>
          <p className="text-gray-600 mb-4">
            {tabs.find(t => t.id === activeTab)?.label} content for <strong>{selectedTopic?.name}</strong> is currently being generated.
          </p>
          {isProgressiveGenerating && progressiveGenerationProgress.topic === selectedTopic?.name && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="text-sm text-gray-700 mb-2">
                Currently generating: <strong>{progressiveGenerationProgress.tabName}</strong>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressiveGenerationProgress.overallProgress || 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progressiveGenerationProgress.overallProgress || 0}% Complete
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Content will appear here automatically once it's ready. You can switch to other topics or check available tabs.
          </p>
        </div>
      </div>
    );
  }

  // Render tab content using TabContentRenderer component
  return (
    <TabContentRenderer
      activeTab={activeTab}
      content={content}
      currentTopicName={currentTopicName}
      isTopicBlocked={isTopicBlocked}
      LoadingComponent={LoadingComponent}
      selectedTopic={selectedTopic}
      getCurrentTopicFromParam={getCurrentTopicFromParam}
      topicParam={topicParam}
      sanitizedReading={sanitizedReading}
      sanitizedReadingTopicName={sanitizedReadingTopicName}
      contentTopicName={contentTopicName}
      copySuccessMap={copySuccessMap}
      handleCopyCode={handleCopyCode}
      openVideoModal={openVideoModal}
      quizSubmitted={quizSubmitted}
      setQuizSubmitted={setQuizSubmitted}
      setContent={setContent}
      loadScenario={loadScenario}
      getCurrentTopic={getCurrentTopic}
      setActiveTab={setActiveTab}
    />
  );
};
