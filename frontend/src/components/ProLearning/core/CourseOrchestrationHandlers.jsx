/**
 * Course Orchestration Handlers
 * 
 * Handles course generation orchestration, batch generation, progressive generation,
 * and initial content loading for the Pro Learning experience.
 */

import proContentManager from '../../../services/ProContentManager';
import contentStorageService from '../../../services/ContentStorageService';

/**
 * Initialize batch generation for a course
 */
export const initializeBatchGeneration = async (dependencies) => {
  const {
    topicsList,
    courseTitle,
    getGenerationProgress,
    setAllTopicsGenerated,
    setBatchGenerationProgress,
    setBatchGenerationStatus,
    setIsBatchGenerating,
    batchGenerateAllTopics,
    generateProContent
  } = dependencies;

  if (topicsList.length > 0 && courseTitle) {
    // Get current generation progress using the storage service
    const progress = getGenerationProgress(courseTitle);
    
    // If all topics already have content, set completion state
    if (progress.generated >= progress.total && progress.total > 0) {
      console.log('🎉 Direct URL course already complete, setting completion state');
      setAllTopicsGenerated(true);
      setBatchGenerationProgress(100);
      setBatchGenerationStatus('Course generation completed!');
      setIsBatchGenerating(false);
      return;
    }
    
    // If not all topics have content, start batch generation
    if (progress.generated < progress.total) {
      setIsBatchGenerating(true);
      setBatchGenerationStatus('Starting batch content generation...');
      
      // Generate content for all topics using new storage system
      await batchGenerateAllTopics(
        courseTitle,
        topicsList, 
        generateProContent, 
        setBatchGenerationStatus, 
        setIsBatchGenerating, 
        setBatchGenerationProgress
      );
    }
  }
};

/**
 * Handle initial content loading when page loads with topic parameter
 */
export const loadInitialTopicContent = async (dependencies) => {
  const {
    topicParam,
    isLoading,
    content,
    parseTopicsFromParam,
    getCourseId,
    shouldSkipOldCachedContent,
    isContentFreshlyGenerated,
    setContentWithSanitization,
    setAvailableTabsForTopics
  } = dependencies;

  if (topicParam && !isLoading && !content) {
    // Use robust parser to get the primary topic
    const parsed = parseTopicsFromParam(topicParam);
    const actualTopic = parsed.length > 0 ? parsed[0] : topicParam;
    console.log('🎯 Loading initial content for topic from URL:', actualTopic);
    
    const currentCourseId = getCourseId();
    if (!currentCourseId) {
      console.log('❌ No course ID found, cannot load topic content');
      return;
    }

    console.log('🎯 DEBUG: Initial topic loading for:', actualTopic);
    console.log('🎯 DEBUG: Course ID:', currentCourseId);
    
    // Check if we should skip old cached content
    const shouldSkipOld = shouldSkipOldCachedContent();
    
    if (shouldSkipOld) {
      console.log('🔄 DEBUG: Fresh course creation mode - checking for fresh content for:', actualTopic);
      
      // Check if there's any freshly generated content
      const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, actualTopic);
      console.log('🔍 DEBUG: ProContentManager stored content:', !!storedContent);
      if (storedContent) {
        console.log('🔍 DEBUG: ProContentManager content details:', {
          hasReading: !!storedContent.reading,
          hasSummary: !!storedContent.summary,
          hasMetadata: !!storedContent.metadata,
          metadataKeys: storedContent.metadata ? Object.keys(storedContent.metadata) : []
        });
      }
      
      if (storedContent && isContentFreshlyGenerated(storedContent, true)) { // Enable strict mode
        console.log('✅ DEBUG: Using freshly generated content for topic:', actualTopic);
        // Use the fresh content
        setContentWithSanitization({
          reading: storedContent.reading,
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        }, 'urlLoader:freshOnly');
      } else {
        console.log('❌ DEBUG: No fresh content found - skipping all cached content for:', actualTopic);
        // Don't load any cached content, let the generation process handle it
        return;
      }
    } else {
      console.log('📚 DEBUG: Normal mode - checking for any stored content for:', actualTopic);
      // Normal navigation - check if we have stored content for this topic
      const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, actualTopic);
      console.log('🔍 DEBUG: Found stored content:', !!storedContent);
    
      if (storedContent && storedContent.reading) {
        console.log('✅ DEBUG: Loading existing stored content for topic:', actualTopic);
        
        // Set content directly from storage
        setContentWithSanitization({
          reading: storedContent.reading,
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        }, 'urlLoader:storedAny');
        
        // CRITICAL: Also update available tabs for this topic
        const availableTabs = [];
        if (storedContent.reading) availableTabs.push('reading');
        if (storedContent.summary) availableTabs.push('summary');
        if (storedContent.videos?.length > 0) availableTabs.push('videos');
        if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
        // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
        if ((storedContent.resources?.length > 0) || (storedContent.resourcesMetadata?.generatedAt)) availableTabs.push('resources');
        
        setAvailableTabsForTopics(prev => ({
          ...prev,
          [actualTopic]: availableTabs
        }));
        
        console.log('✅ DEBUG: Content loaded successfully for:', actualTopic);
      } else {
        console.log('🆕 DEBUG: No stored content found - will trigger generation for:', actualTopic);
        // No stored content found for topic
        // The existing logic will handle generating content
      }
    }
  }
};

/**
 * Handle Pro Learning Experience button click - Generate all topics
 */
export const handleProLearningStart = async (dependencies) => {
  const {
    topicsList,
    getCourseId,
    setIsGeneratingCourse,
    setAllTopicsGenerated,
    setCourseGenerationProgress,
    setCourseGenerationStatus,
    useProgressiveGeneration,
    selectedTopic,
    selectedTopicRef,
    setSelectedTopic,
    initializeProgressiveGeneration,
    courseTitle,
    setProgressiveGenerationProgress,
    setAvailableTabsForTopics,
    getProgressiveTopicContent,
    setContent,
    setContentTopicName,
    parseReadingSections,
    setReadingSections,
    setReadingSectionIndex,
    preSanitizeMarkdown,
    setSanitizedReading,
    setReadingRenderReady,
    setSanitizedReadingTopicName,
    setIsLoading,
    setLoadingStep,
    setIsProgressiveGenerating,
    startProgressiveGeneration,
    loadProgressiveTopicContent,
    topicParam,
    proContentManager,
    autoSaveToBackend,
    setLoadScenario,
    setShowSkeletons,
    clearTopicFromBothStorages,
    loadTopicContent,
    // User info for background generation notifications (for logged-in users)
    user,
    isLoggedIn,
    userId
  } = dependencies;

  if (topicsList.length === 0) {
    return;
  }

  // Set batch marker to indicate fresh course creation
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('proLearning_batchMarker', String(Date.now()));
      console.log('🔄 DEBUG: Batch marker set for fresh course generation');
      
      // Clear existing content from both storage systems to ensure fresh generation (only once)
      const topicToClear = (topicParam || topicsList?.[0]?.name || topicsList?.[0]) || '';
      const id = getCourseId();
      if (topicToClear && id) {
        // Only clear if we haven't already cleared this topic in this session
        const clearKey = `cleared_${id}_${topicToClear}`;
        if (!sessionStorage.getItem(clearKey)) {
          clearTopicFromBothStorages(id, topicToClear);
          sessionStorage.setItem(clearKey, 'true');
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ DEBUG: Failed to set batch marker:', error);
  }

  setIsGeneratingCourse(true);
  setAllTopicsGenerated(false);
  setCourseGenerationProgress(0);
  setCourseGenerationStatus("🚀 Initializing Pro Learning Experience...");

  const currentCourseId = getCourseId();
  if (!currentCourseId) {
    setIsGeneratingCourse(false);
    setCourseGenerationStatus("❌ No course ID found");
    return;
  }

  try {
    if (useProgressiveGeneration) {
      // Progressive generation: reveal tabs as they are ready
      // Ensure a selected topic is set so onTabComplete can hydrate immediately
      if (!selectedTopic && topicsList?.length > 0) {
        try {
          setSelectedTopic(topicsList[0]);
        } catch {}
      }
      
      // Initialize with user info for background notification support
      // Generation will continue even when user switches tabs/navigates away
      await initializeProgressiveGeneration(courseTitle, topicsList, {
        onProgress: (progress) => {
          setProgressiveGenerationProgress(progress);
          setCourseGenerationProgress(progress.overallProgress || 0);
          setCourseGenerationStatus(`Generating ${progress.tabName} for ${progress.topic}...`);
        },
        onContentUpdate: (update) => {
          // Use ref to get current selected topic to avoid stale closures
          const currentSelected = selectedTopicRef?.current || selectedTopic;
          const currentName = currentSelected?.name || currentSelected;

          // Stream content updates to UI if this is the selected topic
          if (currentName === update.topic) {
             setContent(prev => ({ ...prev, ...update.content }));
             // Ensure we are showing the right topic context
             try { setContentTopicName(update.topic); } catch {}
             
             // If reading content is streaming in, ensure it's renderable
             if (update.tabType === 'reading' && update.content?.reading) {
                 // We don't sanitize every chunk to avoid perf hit, just set raw
                 // The RenderTabContent handles raw content fallback
                 setReadingRenderReady(true);
                 setSanitizedReadingTopicName(update.topic);
             }
          }

          // Unlock the tab early if it has content, so user can navigate to it
          // This allows viewing the tab while it generates, WITHOUT triggering the next tab yet
          if (update.content && update.tabType === 'reading' && update.content.reading?.length > 20) {
             setAvailableTabsForTopics(prev => {
                const topicTabs = prev[update.topic] || [];
                if (!topicTabs.includes(update.tabType)) {
                   console.log(`🔓 [ON CONTENT UPDATE] Early unlock for ${update.tabType} of ${update.topic}`);
                   return { ...prev, [update.topic]: [...topicTabs, update.tabType] };
                }
                return prev;
             });
          }
        },
        onTabComplete: (tabInfo) => {
          console.log(`🎬 [ON TAB COMPLETE] Tab ${tabInfo.tabType} completed for ${tabInfo.topic}`);
          // Make this tab clickable immediately for this topic (for all topics progressively)
          setAvailableTabsForTopics(prev => {
            const topicTabs = prev[tabInfo.topic] || [];
            const alreadyIncluded = topicTabs.includes(tabInfo.tabType);
            const updated = alreadyIncluded
              ? prev
              : { ...prev, [tabInfo.topic]: [...topicTabs, tabInfo.tabType] };
            console.log(`🔓 [ON TAB COMPLETE] Updating availability for ${tabInfo.topic}:`, {
              tabType: tabInfo.tabType,
              alreadyIncluded,
              previousTabs: topicTabs,
              newTabs: updated[tabInfo.topic]
            });
            return updated;
          });

          // Use ref to get current selected topic
          const currentSelected = selectedTopicRef?.current || selectedTopic;
          const currentName = currentSelected?.name || currentSelected;

          // Immediately update content if this is the currently selected topic
          if (currentName === tabInfo.topic) {
            console.log(`📝 DEBUG: Tab ${tabInfo.tabName} completed for ${tabInfo.topic} - updating content immediately`);
            
            // Get the fresh content and update immediately
            const freshContent = getProgressiveTopicContent(tabInfo.topic);
            console.log(`🔍 [ON TAB COMPLETE] Fresh content for ${tabInfo.topic}:`, {
              hasResources: Array.isArray(freshContent?.resources),
              resourcesCount: freshContent?.resources?.length || 0,
              hasResourcesMetadata: !!freshContent?.resourcesMetadata,
              generatedAt: freshContent?.resourcesMetadata?.generatedAt
            });
            if (freshContent) {
            const formattedContent = {
              reading: freshContent.reading || '',
              summary: freshContent.summary || '',
              quiz: freshContent.quiz || [],
              videos: freshContent.videos || [],
              resources: freshContent.resources || [],
              resourcesMetadata: freshContent.resourcesMetadata || null
            };
            console.log(`✨ [ON TAB COMPLETE] Formatted content:`, {
              hasResourcesMetadata: !!formattedContent.resourcesMetadata,
              generatedAt: formattedContent.resourcesMetadata?.generatedAt,
              resourcesCount: Array.isArray(formattedContent.resources) ? formattedContent.resources.length : 0
            });
              // Merge new tab content into existing state
              // IMPORTANT: preserve previously displayed reading; don't overwrite with later updates
              setContent(prev => ({
                reading: (prev?.reading && prev.reading.trim().length > 0)
                  ? prev.reading
                  : (formattedContent.reading || ''),
                summary: formattedContent.summary || prev?.summary || '',
                quiz: (Array.isArray(formattedContent.quiz) && formattedContent.quiz.length > 0) ? formattedContent.quiz : (prev?.quiz || []),
                videos: (Array.isArray(formattedContent.videos) && formattedContent.videos.length > 0) ? formattedContent.videos : (prev?.videos || []),
                resources: (Array.isArray(formattedContent.resources) && formattedContent.resources.length > 0) ? formattedContent.resources : (prev?.resources || []),
                resourcesMetadata: formattedContent.resourcesMetadata || prev?.resourcesMetadata || null
              }));
                  // Set the topic name for which this content is now current so non-reading tabs can render immediately
                  try { setContentTopicName(tabInfo.topic); } catch {}
              
              // If this is the first time reading becomes available, initialize sections and sanitized view
              if (tabInfo.tabType === 'reading' && freshContent.reading && (!dependencies.content || !dependencies.content.reading)) {
                const sections = parseReadingSections(freshContent.reading);
                setReadingSections(sections);
                setReadingSectionIndex(0);
                // Properly sanitize reading content before rendering
                try {
                  const sanitized = preSanitizeMarkdown(freshContent.reading);
                  setSanitizedReading(sanitized);
                  setReadingRenderReady(true);
                  setSanitizedReadingTopicName(tabInfo.topic);
                  // Ensure content-topic association is set for immediate readiness checks
                  setContentTopicName(tabInfo.topic);
                  console.log('✨ [ON TAB COMPLETE] Reading sanitized and ready for:', tabInfo.topic);
                } catch (e) {
                  console.error('❌ [ON TAB COMPLETE] Failed to sanitize reading:', e);
                  // Fallback: set raw content
                  setSanitizedReading(String(freshContent.reading || ''));
                  setReadingRenderReady(true);
                  setSanitizedReadingTopicName(tabInfo.topic);
                  setContentTopicName(tabInfo.topic);
                }
              }
              
              // CRITICAL FIX: Clear the loading indicator for the completed tab
              // Clear progressiveGenerationProgress to remove loading state
              console.log(`🔓 [ON TAB COMPLETE] Clearing loading state for ${tabInfo.tabType} of ${tabInfo.topic}`);
              setProgressiveGenerationProgress(prev => {
                // If this was the tab being tracked, clear it
                if (prev?.topic === tabInfo.topic && prev?.tabType === tabInfo.tabType) {
                  console.log(`✅ [ON TAB COMPLETE] Cleared progress state for ${tabInfo.tabType}`);
                  return {};
                }
                return prev;
              });
              
              // Also clear isLoading state to ensure content can render immediately
              setIsLoading(false);
              setLoadingStep('');
            }
          } else if (!currentSelected && topicsList?.length > 0 && (topicsList[0].name === tabInfo.topic || (topicsList[0] === tabInfo.topic))) {
            // If no selectedTopic yet, set it and hydrate
            setSelectedTopic(typeof topicsList[0] === 'string' ? { name: topicsList[0] } : topicsList[0]);
            loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
          }
        },
        onTopicComplete: () => {},
        onAllComplete: () => {
          // Progressive generation across ALL topics has finished
          console.log('🔥 DEBUG: Progressive generation completed for all topics');
          setIsProgressiveGenerating(false);
          setAllTopicsGenerated(true);
          setIsLoading(false);
          setCourseGenerationStatus('✅ All topics generated successfully!');

          // Switch to reload mode to prevent any auto-restart loops
          try { setLoadScenario('reload'); } catch {}

          // Hard reset progress state to prevent any stuck spinners
          setProgressiveGenerationProgress({});
          setShowSkeletons(false);
          setLoadingStep('');

          // Auto-save after full progressive completion
          autoSaveToBackend().catch(error => {
            console.warn('Auto-save failed:', error);
          });

          // Clear the batch marker since generation is complete
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('proLearning_batchMarker');
              console.log('🧹 DEBUG: Batch marker cleared after progressive completion');
            }
          } catch (error) {
            console.warn('⚠️ DEBUG: Failed to clear batch marker:', error);
          }
        },
        onError: (err) => {
          console.error('❌ Progressive generation error:', err);
          setIsProgressiveGenerating(false);
        }
}, { 
  courseId: getCourseId(),
  // Pass user info for background notification support (logged-in users only)
  isLoggedIn: isLoggedIn || false,
  userId: userId || null
});

      setIsProgressiveGenerating(true);
      // Do not block the UI with the generic loader; tabs should appear as they become ready
      setIsGeneratingCourse(false);
      
// Start progressive generation across ALL topics (do not await)
startProgressiveGeneration();

      // Load first topic immediately (hydrate without blocking loader)
      const topicToLoad = topicParam || topicsList[0]?.name;
      if (topicToLoad) {
        await loadProgressiveTopicContent(topicToLoad, { showLoader: false });
      }
    } else {
      // Legacy batch generation (kept as fallback)
      await proContentManager.generateAllContentBatch(
        topicsList,
        currentCourseId,
        (current, total, topicName, contentType) => {
          const progress = Math.round((current / total) * 100);
          setCourseGenerationProgress(progress);
          setCourseGenerationStatus(`Generating ${contentType} for ${topicName}...`);
          console.log(`📈 Pro Learning Start Progress: ${progress}% - ${contentType} for ${topicName}`);
        }
      );

      // Mark all topics as generated
      setAllTopicsGenerated(true);
      setCourseGenerationStatus("✅ All topics generated successfully!");
      
      // Auto-load first topic content or topic from URL
      const topicToLoad = topicParam || topicsList[0]?.name;
      if (topicToLoad) {
        console.log('🎯 Auto-loading topic after Pro Learning start:', topicToLoad);
        await loadTopicContent(topicToLoad);
      }
    }

  } catch (error) {
    console.error('❌ Pro Learning start failed:', error);
    setCourseGenerationStatus("❌ Generation failed. Please try again.");
  } finally {
    setTimeout(() => {
      setIsGeneratingCourse(false);
      setCourseGenerationProgress(0);
      setCourseGenerationStatus("");
    }, 2000);
  }
};

/**
 * Handle batch generation from ChatbotPage
 */
export const handleContentGeneration = async (dependencies) => {
  const {
    getCourseId,
    courseId,
    proContentManager,
    setTopicsList,
    setAllTopicsGenerated,
    useProgressiveGeneration,
    topicParam,
    clearTopicFromBothStorages,
    initializeProgressiveGeneration,
    courseTitle,
    setProgressiveGenerationProgress,
    setAvailableTabsForTopics,
    loadProgressiveTopicContent,
    setSelectedTopic,
    selectedTopic,
    selectedTopicRef,
    setIsProgressiveGenerating,
    startProgressiveGeneration,
    setLoadScenario,
    setShowSkeletons,
    setIsLoading,
    setLoadingStep,
    autoSaveToBackend,
    setIsBatchGenerating,
    setBatchGenerationProgress,
    setBatchGenerationStatus,
    loadTopicContent,
    setContent,
    setContentTopicName,
    setReadingRenderReady,
    setSanitizedReadingTopicName,
    // User info for background generation notifications (for logged-in users)
    user,
    isLoggedIn,
    userId
  } = dependencies;

  try {
    // Read batch payload from localStorage only
    const marker = typeof localStorage !== 'undefined' ? localStorage.getItem('proLearning_batchMarker') : null;
    let payload = null;
    if (typeof localStorage !== 'undefined') {
      const legacy = localStorage.getItem('proLearning_batchGeneration');
      if (legacy) {
        try { payload = JSON.parse(legacy); } catch {}
      }
    }
    if (!payload) return;

    const { courseId: batchCourseId, topics, topicString, triggerBatchGeneration, timestamp } = payload;

    // Only trigger if this is a recent request (within 5 minutes) and for this course
    const isRecent = timestamp && (Date.now() - timestamp < 5 * 60 * 1000);
    const isCurrentCourse = batchCourseId === courseId;
    
    if (!triggerBatchGeneration || !isRecent || !isCurrentCourse) {
      return;
    }

    // Check if content already exists for this course
    const existingContent = await proContentManager.getStoredCourseContent(batchCourseId);
    if (existingContent && existingContent.metadata.status === 'completed') {
      console.log('✅ Course content already exists, loading from storage');
      setTopicsList(topics);
      setAllTopicsGenerated(true);
      return;
    }

    setTopicsList(topics);

    if (useProgressiveGeneration) {
      // Set batch marker to indicate fresh course creation
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('proLearning_batchMarker', String(Date.now()));
          console.log('🔄 DEBUG: Batch marker set for automatic progressive generation');

          // Clear existing content from both storage systems to ensure fresh generation (only once)
          const topicToClear = (topicParam || topics?.[0]?.name || topics?.[0]) || '';
          if (topicToClear && batchCourseId) {
            // Only clear if we haven't already cleared this topic in this session
            const clearKey = `cleared_${batchCourseId}_${topicToClear}`;
            if (!sessionStorage.getItem(clearKey)) {
              clearTopicFromBothStorages(batchCourseId, topicToClear);
              sessionStorage.setItem(clearKey, 'true');
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ DEBUG: Failed to set batch marker:', error);
      }

      // Initialize progressive generation
      await initializeProgressiveGeneration(courseTitle, topics, {
        onProgress: (progress) => {
          setProgressiveGenerationProgress(progress);
        },
        onContentUpdate: (update) => {
            // Use ref to get current selected topic
            const currentSelected = selectedTopicRef?.current || selectedTopic;
            const currentName = currentSelected?.name || currentSelected;

            // Stream content updates if this is the selected topic
            if (currentSelected && currentName === update.topic) {
                if (setContent) {
                    setContent(prev => ({ ...prev, ...update.content }));
                    if (setContentTopicName) {
                        try { setContentTopicName(update.topic); } catch {}
                    }
                    
                    // Handle reading render readiness
                    if (update.tabType === 'reading' && update.content?.reading && setReadingRenderReady) {
                        setReadingRenderReady(true);
                        if (setSanitizedReadingTopicName) setSanitizedReadingTopicName(update.topic);
                    }
                }
            }

            // Unlock the tab early if it has content, so user can navigate to it
            // This allows viewing the tab while it generates, WITHOUT triggering the next tab yet
            if (update.content && update.tabType === 'reading' && update.content.reading?.length > 20) {
                setAvailableTabsForTopics(prev => {
                    const topicTabs = prev[update.topic] || [];
                    if (!topicTabs.includes(update.tabType)) {
                        console.log(`🔓 [ON CONTENT UPDATE] Early unlock for ${update.tabType} of ${update.topic}`);
                        return { ...prev, [update.topic]: [...topicTabs, update.tabType] };
                    }
                    return prev;
                });
            }
        },
        onTabComplete: (tabInfo) => {
          console.log(`✅ Tab completed: ${tabInfo.tabName} for ${tabInfo.topic}`);
          
          // Update available tabs ONLY if content is meaningful for this tab
          setAvailableTabsForTopics(prev => {
            const topicTabs = prev[tabInfo.topic] || [];
            const c = tabInfo.content;
            const hasMeaningful = (tabType, content) => {
              switch (tabType) {
                case 'reading': return typeof content === 'string' && content.trim().length > 0;
                case 'summary': return typeof content === 'string' && content.trim().length > 0;
                case 'videos': return Array.isArray(content) && content.length > 0;
                case 'quiz': {
                  if (Array.isArray(content)) return content.length > 0;
                  if (content && typeof content === 'object') {
                    return Array.isArray(content.questions) && content.questions.length > 0;
                  }
                  return false;
                }
                case 'resources': {
                  if (Array.isArray(content)) {
                    return content.length > 0;
                  }
                  return content && typeof content === 'object' && 
                         ((Array.isArray(content.resources) && content.resources.length > 0) ||
                          !!content.resourcesMetadata?.generatedAt);
                }
                default: return false;
              }
            };
            const hasContent = hasMeaningful(tabInfo.tabType, c);
            console.log(`🔍 [ON TAB COMPLETE - INIT] Checking ${tabInfo.tabType}:`, {
              topic: tabInfo.topic,
              hasContent,
              contentType: typeof c,
              isArray: Array.isArray(c),
              alreadyInList: topicTabs.includes(tabInfo.tabType)
            });
            if (!topicTabs.includes(tabInfo.tabType) && hasContent) {
              console.log(`✅ [ON TAB COMPLETE - INIT] Adding ${tabInfo.tabType} to available tabs for ${tabInfo.topic}`);
              const nextTabs = [...topicTabs, tabInfo.tabType];
              const same = topicTabs.length === nextTabs.length && topicTabs.every((t, i) => t === nextTabs[i]);
              if (same) return prev;
              return {
                ...prev,
                [tabInfo.topic]: nextTabs
              };
            }
            return prev;
          });

          // If this is the first tab of the first topic, auto-load it
          if (tabInfo.topicIndex === 0 && tabInfo.tabIndex === 0) {
            const topicToLoad = topicParam || topics[0]?.name;
            if (topicToLoad === tabInfo.topic) {
              console.log('🎯 Auto-loading first topic content after first tab generation');
              loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
              
              // Set the selected topic
              const topicData = topics.find(t => (t.name || t) === tabInfo.topic);
              if (topicData) {
                setSelectedTopic(topicData);
              }
            }
          }
          
          // Use ref to get current selected topic
          const currentSelected = selectedTopicRef?.current || selectedTopic;
          const currentName = currentSelected?.name || currentSelected;

          // If the current selected topic just got new content, refresh it
          if (currentSelected && currentName === tabInfo.topic) {
            console.log('🔄 Refreshing content for current topic:', tabInfo.topic);
            loadProgressiveTopicContent(tabInfo.topic, { showLoader: false });
          }
        },
        onTopicComplete: (topicInfo) => {
          console.log(`🎉 Topic completed: ${topicInfo.topic}`);
        },
        onAllComplete: () => {
          // All progressive content generation completed!
          setIsProgressiveGenerating(false);
          setAllTopicsGenerated(true);
          // Prevent auto-restart by switching to reload mode
          try { setLoadScenario('reload'); } catch {}
          // Clear any 'fresh' batch marker so tabs are not blocked after completion
          try { if (typeof localStorage !== 'undefined') localStorage.removeItem('proLearning_batchMarker'); } catch {}

          // Hard reset progress/loading state to avoid lingering tab spinners
          setProgressiveGenerationProgress({});
          setShowSkeletons(false);
          setIsLoading(false);
          setLoadingStep('');
          
          // Auto-save for progressive generation completion
          console.log('🚀 Progressive generation completed, triggering auto-save...');
          autoSaveToBackend().catch(error => {
            console.warn('Auto-save failed:', error);
          });
        },
        onError: (error) => {
          console.error('❌ Progressive generation error:', error);
          setIsProgressiveGenerating(false);
        }
      }, { 
        courseId: batchCourseId,
        // Pass user info for background notification support (logged-in users only)
        isLoggedIn: isLoggedIn || false,
        userId: userId || null
      });

      // Start progressive generation
      setIsProgressiveGenerating(true);
      await startProgressiveGeneration();
    } else {
      // Fallback to batch generation
      console.log('🎯 Using batch content generation');
      setIsBatchGenerating(true);
      setBatchGenerationProgress(0);
      setBatchGenerationStatus('Initializing course generation...');

      // Start batch generation
      await proContentManager.generateAllContentBatch(
        topics,
        batchCourseId,
        (current, total, topicName, contentType) => {
          const progress = Math.round((current / total) * 100);
          setBatchGenerationProgress(progress);
          setBatchGenerationStatus(`Generating ${contentType} for ${topicName}...`);
          console.log(`📈 Batch Generation Progress: ${progress}% - ${contentType} for ${topicName}`);
        }
      );

      // Mark generation as complete
      setIsBatchGenerating(false);
      setAllTopicsGenerated(true);
      setBatchGenerationProgress(100);
      setBatchGenerationStatus('Course generation completed!');
      
      console.log('✅ Legacy batch generation completed with auto-save');
    }
    
    // Auto-load the first topic or topic from URL for batch generation
    if (!useProgressiveGeneration) {
      const topicToLoad = topicParam || topics[0]?.name;
      if (topicToLoad) {
        console.log('🎯 Auto-loading topic after batch generation:', topicToLoad);
        loadTopicContent(topicToLoad);
      }
    }
    
    // Clear the trigger so it doesn't run again
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('proLearning_batchGeneration');
        localStorage.removeItem('proLearning_batchMarker');
      }
    } catch {}

  } catch (error) {
    console.error('❌ Content generation failed:', error);
    setIsBatchGenerating(false);
    setIsProgressiveGenerating(false);
    setBatchGenerationStatus('Generation failed. Please try again.');
  }
};
