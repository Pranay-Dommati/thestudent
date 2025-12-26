/**
 * TopicsInitializationEffect.jsx
 * 
 * Factory function for the course topics initialization useEffect.
 * Handles reload scenario detection, load scenario detection, and course data initialization.
 * 
 * This effect manages:
 * - Detecting whether this is a first-time load or reload scenario
 * - Loading existing course content quickly in reload mode
 * - Populating available tabs for all topics
 * - Initializing course data through the factory function
 * 
 * Extracted from ProLearningPage.jsx to improve maintainability.
 */

/**
 * Creates the topics initialization effect function
 * @param {Object} deps - All dependencies needed by the effect
 * @returns {Function} Effect function to be used with useEffect
 */
export const createTopicsInitializationEffect = (deps) => {
  const {
    setIsLoading,
    setLoadingStep,
    proContentManager,
    setAvailableTabsForTopics,
    createInitializeCourseData,
    getCourseId,
    topicParam,
    courseTitle,
    setTopicsList,
    setSelectedTopic,
    getCurrentTopicFromParam,
    navigate,
    setActiveTab,
    loadScenario,
    loadContentForReloadMode,
    loadTopicContent,
    parseTopicsFromParam,
    setLoadScenario,
    fetchCourseFromDB
  } = deps;

  return () => {
    // Removed IndexedDB waits; Pro Learning no longer relies on IDB
    // Note: using component-scoped loadContentForReloadMode declared above
    
    // Handle reload scenario - content already exists, load quickly
    const handleReloadScenario = async (courseId, handleTopicSelection) => {
      console.log('⚡ Reload scenario: Loading existing content quickly');
      setIsLoading(true);
      setLoadingStep('Loading course content...');
      
      try {
        // Get all stored topics
        const storedTopics = await proContentManager.getStoredTopics(courseId);
        
        if (storedTopics.length > 0) {
          console.log('✅ Found stored topics for reload:', storedTopics.map(t => t.name));
          
          // Populate available tabs for all topics at once
          const tabsMap = {};
          for (const topic of storedTopics) {
            try {
              const content = await proContentManager.getStoredTopicContent(courseId, topic.name);
              if (content) {
                const availableTabs = [];
                if (content.reading) availableTabs.push('reading');
                if (content.summary) availableTabs.push('summary');
                if (content.videos?.length > 0) availableTabs.push('videos');
                if (content.quiz?.length > 0 || (content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
                if (content.resources?.length > 0) availableTabs.push('resources');
                
                if (availableTabs.length > 0) {
                  tabsMap[topic.name] = availableTabs;
                }
              }
            } catch (error) {
              console.warn(`Failed to load content for topic: ${topic.name}`, error);
            }
          }
          
          // Set all available tabs at once
          if (Object.keys(tabsMap).length > 0) {
            setAvailableTabsForTopics(tabsMap);
            console.log('🎯 Set available tabs for reload:', Object.keys(tabsMap));
          }
          
          // Handle topic selection (this will load the specific topic content)
          handleTopicSelection(storedTopics);
          
          setIsLoading(false);
          setLoadingStep('');
          console.log('✅ Reload scenario completed successfully');
        } else {
          console.warn('⚠️ No stored topics found in reload scenario, falling back to generation');
          setIsLoading(false);
          return false; // Indicate fallback needed
        }
        return true;
      } catch (error) {
        console.error('❌ Error in reload scenario:', error);
        setIsLoading(false);
        return false; // Indicate fallback needed
      }
    };
    
    // Helper function to detect if this is first-time generation vs subsequent reload
    const detectLoadScenario = async (courseId) => {
      try {
        // Check if we have topics stored with content in ProContentManager
        const storedTopics = await proContentManager.getStoredTopics(courseId);
        
        if (storedTopics.length === 0) {
          return 'first-time'; // No topics stored at all
        }
        
        // Check if any topics have generated content
        let hasGeneratedContent = false;
        for (const topic of storedTopics) {
          const content = await proContentManager.getStoredTopicContent(courseId, topic.name);
          if (content && content.reading) {
            hasGeneratedContent = true;
            break;
          }
        }
        
        return hasGeneratedContent ? 'reload' : 'first-time';
      } catch (error) {
        console.error('Error detecting load scenario:', error);
        return 'first-time'; // Default to first-time on error
      }
    };
    
    // Create initializeCourseData function using factory with all required dependencies
    const initializeCourseData = createInitializeCourseData({
      getCourseId,
      topicParam,
      courseTitle,
      setTopicsList,
      setSelectedTopic,
      setAvailableTabsForTopics,
      proContentManager,
      getCurrentTopicFromParam,
      navigate,
      setActiveTab,
      loadScenario,
      loadContentForReloadMode,
      loadTopicContent,
      parseTopicsFromParam,
      detectLoadScenario,
      setLoadScenario,
      handleReloadScenario,
      fetchCourseFromDB
    });

    // Properly await the async initialization
    initializeCourseData().catch(error => {
      console.error('❌ Failed to initialize course data:', error);
    });
  };
};
