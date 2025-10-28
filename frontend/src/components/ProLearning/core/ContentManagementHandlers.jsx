/**
 * ContentManagementHandlers.jsx
 * 
 * Handles content loading, topic selection, course saving, and related operations
 * for the ProLearning feature.
 * 
 * Extracted from ProLearningPage.jsx for better code organization and modularity.
 */

import proContentManager from '../../../services/ProContentManager';
import contentStorageService from '../../../services/ContentStorageService.js';
import { parseReadingSections } from '../utils/ReadingUtils';
import { 
  getProgressiveTopicContent, 
  getProgressiveGenerationStatus,
  initializeProgressiveGeneration 
} from '../ProgressiveContentGenerator';
import { getSummaryContent, validateSummaryForTab } from '../utils/SummaryUtils';
import universalToast from '../../../utils/universalToast';

/**
 * Load topic content from progressive generation data
 */
export const loadProgressiveTopicContent = async (
  topicName, 
  options = {},
  dependencies
) => {
  const {
    showLoader = true
  } = options;

  const {
    setIsLoading,
    setLoadingStep,
    shouldSkipOldCachedContent,
    getCourseId,
    courseTitle,
    topicsList,
    isContentFreshlyGenerated,
    content,
    contentTopicName,
    setContentWithSanitization,
    setContentTopicName,
    setAvailableTabsForTopics,
    setReadingSections,
    setReadingSectionIndex
  } = dependencies;

  if (!topicName) return;

  console.log('🔄 DEBUG: loadProgressiveTopicContent called for:', topicName);

  try {
    if (showLoader) setIsLoading(true);
    setLoadingStep(`Loading ${topicName} content...`);
    
    // Note: We DON'T manually set progressiveGenerationProgress here because
    // the actual generator's onProgress callback will set it correctly.
    // Manually setting it creates a race condition with the generator's updates.

    // Check if we should skip old cached content during fresh course creation
    const shouldSkipOld = shouldSkipOldCachedContent();
    console.log('🔍 DEBUG: Should skip old content:', shouldSkipOld);
    
    // Get content from progressive generator (ensure generator knows courseId)
    if (!getProgressiveGenerationStatus()?.courseId) {
      try {
        // Best-effort nudge: initialize internal courseId for the generator without restarting
        const cid = getCourseId();
        if (cid) {
          await initializeProgressiveGeneration(courseTitle || 'Pro Learning Course', topicsList.length ? topicsList : [{ name: topicName }], {}, { courseId: cid });
        }
      } catch {}
    }
    const progressiveContent = getProgressiveTopicContent(topicName);
    console.log('🔍 DEBUG: Progressive content found:', !!progressiveContent);
    if (progressiveContent) {
      console.log('🔍 DEBUG: Progressive content details:', {
        hasReading: !!progressiveContent.reading,
        hasSummary: !!progressiveContent.summary,
        hasMetadata: !!progressiveContent.metadata,
        metadataKeys: progressiveContent.metadata ? Object.keys(progressiveContent.metadata) : []
      });
    }
    
    if (progressiveContent) {
      // Check if we should use this content
      let shouldUseContent = true;
      
      if (shouldSkipOld) {
        // During fresh course creation, only use freshly generated content
        shouldUseContent = isContentFreshlyGenerated(progressiveContent, true); // Enable strict mode
        console.log('🔍 DEBUG: Should use progressive content (strict mode):', shouldUseContent);
        if (!shouldUseContent) {
          console.log('❌ DEBUG: Skipping old cached progressive content for:', topicName);
        }
      } else {
        console.log('✅ DEBUG: Normal mode - using available progressive content for:', topicName);
      }
      
      if (shouldUseContent) {
        console.log('📚 DEBUG: Loading progressive content for:', topicName);
        
        // Debug: Check what's actually in progressiveContent
        console.log('🔍 [DEBUG] Raw progressiveContent.resourcesMetadata:', progressiveContent.resourcesMetadata);
        console.log('🔍 [DEBUG] Type of resourcesMetadata:', typeof progressiveContent.resourcesMetadata);
        console.log('🔍 [DEBUG] progressiveContent.resources length:', progressiveContent.resources?.length || 0);
        console.log('🔍 [DEBUG] Content was generated at:', progressiveContent.generatedAt);
        console.log('🔍 [DEBUG] Content generation method:', progressiveContent.generationMethod);
        console.log('🔍 [DEBUG] Is this OLD content?', progressiveContent.generatedAt ? new Date(progressiveContent.generatedAt).toLocaleString() : 'unknown');
        
        // Transform content to expected format, preserving resourcesMetadata
        const formattedContent = {
          reading: progressiveContent.reading || '',
          summary: progressiveContent.summary || '',
          quiz: progressiveContent.quiz || [],
          videos: progressiveContent.videos || [],
          resources: progressiveContent.resources || [],
          resourcesMetadata: progressiveContent.resourcesMetadata || null  // ← PRESERVE METADATA
        };
        console.log('📚 [LOAD CONTENT] Raw progressive content reading:', {
          hasReading: !!progressiveContent.reading,
          readingType: typeof progressiveContent.reading,
          readingLength: progressiveContent.reading?.length || 0,
          readingTrimLength: progressiveContent.reading?.trim()?.length || 0,
          readingPreview: progressiveContent.reading ? progressiveContent.reading.substring(0, 150) + '...' : 'N/A'
        });
        console.log('📚 [LOAD CONTENT] Formatted progressive content:', {
          topicName,
          resourcesCount: Array.isArray(formattedContent.resources) ? formattedContent.resources.length : 0,
          hasResourcesMetadata: !!formattedContent.resourcesMetadata,
          generatedAt: formattedContent.resourcesMetadata?.generatedAt,
          progressiveContentKeys: Object.keys(progressiveContent)
        });

        // Set content for this topic only - but preserve any already displayed reading
        // ONLY if it belongs to the SAME topic (avoid mixing topics' reading content)
        const hasExistingReading = !!(content && typeof content.reading === 'string' && content.reading.trim().length);
        const readingBelongsToCurrentTopic = hasExistingReading && contentTopicName === topicName;
        const nextContent = readingBelongsToCurrentTopic
          ? {
              ...formattedContent,
              reading: content.reading  // ← PRESERVE EXISTING READING for same topic
            }
          : {
              ...formattedContent,
              resourcesMetadata: formattedContent.resourcesMetadata  // ← PRESERVE METADATA
            };
        setContentWithSanitization(nextContent, 'progressive:topicContent');
        setContentTopicName(topicName);

        // Immediately mark available tabs based on the ACTUAL content being set (nextContent)
        const newReady = [];
        // Check what we're actually setting, not just formattedContent
        const hasValidReading = typeof nextContent.reading === 'string' && nextContent.reading.trim().length > 0;
        const hasValidSummary = validateSummaryForTab(nextContent);
        
        console.log('🔍 [TAB AVAILABILITY] Content validation:', {
          topicName,
          hasValidReading,
          hasValidSummary,
          readingLength: nextContent.reading?.length || 0,
          summaryLength: nextContent.summary?.length || 0,
          formattedReadingLength: formattedContent.reading?.length || 0,
          wasPreserved: readingBelongsToCurrentTopic,
          isNewTopicReading: !readingBelongsToCurrentTopic && formattedContent.reading?.length > 0
        });
        
        if (hasValidReading) newReady.push('reading');
        if (hasValidSummary) newReady.push('summary');
        if ((formattedContent.videos?.length || 0) > 0) newReady.push('videos');
        if ((Array.isArray(formattedContent.quiz) && formattedContent.quiz.length > 0) || (formattedContent?.quiz?.questions?.length > 0)) newReady.push('quiz');
        // Mark resources as available ONLY if generation completed (with or without results)
        // Check metadata.generatedAt to ensure generation actually completed
        console.log('🔓 [TAB AVAILABILITY] Checking resources availability:', {
          topicName,
          hasMetadata: !!formattedContent?.resourcesMetadata,
          generatedAt: formattedContent?.resourcesMetadata?.generatedAt,
          resourcesCount: formattedContent?.resources?.length || 0,
          legacyNoMetadata: !formattedContent?.resourcesMetadata && Array.isArray(formattedContent?.resources) && formattedContent.resources.length > 0
        });
        if (formattedContent?.resourcesMetadata?.generatedAt) {
          console.log('✅ [TAB AVAILABILITY] Unlocking resources tab (metadata) for:', topicName);
          newReady.push('resources');
        } else if (!formattedContent?.resourcesMetadata && Array.isArray(formattedContent?.resources) && formattedContent.resources.length > 0) {
          console.log('🕰️ [TAB AVAILABILITY] Unlocking resources tab (legacy array present, no metadata) for:', topicName);
          newReady.push('resources');
        } else {
          console.log('❌ [TAB AVAILABILITY] Resources tab stays LOCKED (no data yet) for:', topicName);
        }
        if (newReady.length > 0) {
          console.log(`🔓 [LOAD CONTENT] Setting available tabs for ${topicName}:`, {
            newReady,
            includesResources: newReady.includes('resources')
          });
          setAvailableTabsForTopics(prev => {
            const combined = Array.from(new Set([...(prev[topicName] || []), ...newReady]));
            const prevTabs = prev[topicName] || [];
            const same = prevTabs.length === combined.length && prevTabs.every((t, i) => t === combined[i]);
            if (same) return prev; // no-op if identical
            const updated = {
              ...prev,
              [topicName]: combined
            };
            console.log(`🔓 [LOAD CONTENT] Updated availability:`, {
              topicName,
              previousTabs: prevTabs,
              newTabs: updated[topicName]
            });
            return updated;
          });
        } else {
          console.log(`⚠️ [LOAD CONTENT] No tabs to unlock for ${topicName} (newReady is empty)`);
        }
        
        // Parse and set reading sections only when we actually set reading freshly
        if (progressiveContent.reading && !hasExistingReading) {
          const sections = parseReadingSections(progressiveContent.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        } else {
          // Ensure stale sections are cleared if reading isn't ready yet
          setReadingSections([]);
          setReadingSectionIndex(0);
        }
      } else {
        // Show empty content and let the generation process fill it
        console.log('🆕 DEBUG: Initializing empty content for fresh generation:', topicName);
        setContentWithSanitization({
          reading: '',
          summary: '',
          quiz: [],
          videos: [],
          resources: []
        }, 'progressive:initEmpty');
        setContentTopicName(topicName);
      }
      
    } else {
      
      // Show empty content with placeholders for topic that hasn't started generating
      setContentWithSanitization({
        reading: '',
        summary: '',
        quiz: [],
        videos: [],
        resources: []
      }, 'progressive:noContentYet');
      setContentTopicName(topicName);
      setReadingSections([]);
      setReadingSectionIndex(0);
    }
  } catch (error) {
    console.error('❌ Failed to load progressive content:', error);
    setContentWithSanitization({
      reading: 'Failed to load content. Please try again.',
      summary: 'Failed to load summary.',
      quiz: [],
      videos: [],
      resources: []
    }, 'progressive:error');
    setContentTopicName(topicName);
  } finally {
    if (showLoader) setIsLoading(false);
    setLoadingStep('');
  }
};

/**
 * Handle topic selection from sidebar
 */
export const handleTopicSelect = (
  topicId,
  dependencies
) => {
  const {
    topicsList,
    setTopicsList,
    setSelectedTopic,
    updateTopicInUrl,
    setContent,
    setContentTopicName,
    setReadingSections,
    setReadingSectionIndex,
    setActiveTab,
    setAvailableTabsForTopics,
    getCourseId,
    isTopicBlocked,
    setIsLoading,
    setLoadingStep,
    loadScenario,
    loadContentForReloadMode,
    useProgressiveGeneration,
    loadProgressiveTopicContent,
    availableTabsForTopics,
    isProgressiveGenerating,
    setIsProgressiveGenerating,
    allTopicsGenerated,
    hasTopicContent,
    loadTopicContent
  } = dependencies;

  // Find the topic in the list
  const selectedTopic = topicsList.find(t => t.id === topicId);
  if (!selectedTopic) return;

  // Update URL with new topic
  updateTopicInUrl(selectedTopic.name);

  // Update active states and set selected topic
  setTopicsList(topics => topics.map(topic => ({
    ...topic,
    isActive: topic.id === topicId
  })));
  
  setSelectedTopic(selectedTopic);

  // CRITICAL: Clear content immediately when switching topics to prevent cross-topic content display
  setContent(null);
  setContentTopicName(null);
  // Also clear reading sections so previous topic's text doesn't persist
  setReadingSections([]);
  setReadingSectionIndex(0);
  
  // Reset active tab to 'reading' for new topic
  setActiveTab('reading');

  // CRITICAL: Always check and update available tabs for the selected topic
  const updateTabsForTopic = async (topicName) => {
    try {
      const currentCourseId = getCourseId();
      if (currentCourseId) {
        const storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
        if (storedContent) {
          const availableTabs = [];
          if (storedContent.reading) availableTabs.push('reading');
          if (storedContent.summary) availableTabs.push('summary');
          if (storedContent.videos?.length > 0) availableTabs.push('videos');
          if (storedContent.quiz?.length > 0 || (storedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
          // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
          if ((storedContent.resources?.length > 0) || (storedContent.resourcesMetadata?.generatedAt)) availableTabs.push('resources');
          
          if (availableTabs.length > 0) {
            setAvailableTabsForTopics(prev => {
              const prevTabs = prev[topicName] || [];
              const same = prevTabs.length === availableTabs.length && prevTabs.every((t, i) => t === availableTabs[i]);
              if (same) return prev;
              return {
                ...prev,
                [topicName]: availableTabs
              };
            });
            console.log('🎯 Updated tabs for selected topic:', topicName, availableTabs);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update tabs for topic:', topicName, error);
    }
  };
  
  // Update tabs asynchronously
  updateTabsForTopic(selectedTopic.name);

  // Check if this topic is blocked (2nd topic onwards until course completion)
  if (isTopicBlocked(selectedTopic.name)) {
    // For blocked topics, set loading state with appropriate message
    setIsLoading(true);
    setLoadingStep(`Loading ${selectedTopic.name} content...`);
    console.log('🚫 Topic is blocked until course completion:', selectedTopic.name);
    return; // Exit early, content will show loading UI
  }

  // Handle content loading for non-blocked topics
  if (loadScenario === 'reload') {
    // RELOAD MODE: Simple content loading
    loadContentForReloadMode(selectedTopic.name);
  } else if (useProgressiveGeneration) {
    // FIRST-TIME MODE: Progressive generation
    loadProgressiveTopicContent(selectedTopic.name, { showLoader: false });
    
    // If no content is available yet for this topic, ensure we're in generation mode
    const hasProgressiveContent = getProgressiveTopicContent(selectedTopic.name);
    const hasAvailableTabs = availableTabsForTopics[selectedTopic.name]?.length > 0;
    
    if (!hasProgressiveContent && !hasAvailableTabs && !isProgressiveGenerating) {
      console.log('🚀 Topic has no content yet, ensuring progressive generation is running for:', selectedTopic.name);
      // The progressive generation should already be running for all topics
      // but ensure we show the generation status
      setIsProgressiveGenerating(true);
    }
  } else {
    // FIRST-TIME MODE: Batch generation
    if (allTopicsGenerated || hasTopicContent(selectedTopic.name)) {
      loadTopicContent(selectedTopic.name);
    } else {
      // Show message that content needs to be generated
      setContent(null);
    }
  }
};

/**
 * Toggle topic completion status
 */
export const toggleTopicCompletion = (topicId, event, dependencies) => {
  const { setCompletedTopics, getCourseId } = dependencies;

  event.stopPropagation(); // Prevent topic selection when clicking the toggle
  
  setCompletedTopics(prev => {
    const isCurrentlyCompleted = prev.includes(topicId);
    const updated = isCurrentlyCompleted
      ? prev.filter(id => id !== topicId)
      : [...prev, topicId];
    
    // Save to localStorage with course-specific key
    try {
      const courseId = getCourseId();
      const storageKey = courseId ? `proLearning_completedTopics_${courseId}` : 'proLearning_completedTopics';
      localStorage.setItem(storageKey, JSON.stringify(updated));
      
      // Show brief feedback
      console.log(isCurrentlyCompleted ? '✅ Topic marked as incomplete' : '🎉 Topic completed!');
    } catch (error) {
      console.warn('Failed to save completion status:', error);
    }
    
    return updated;
  });
};

/**
 * Sidebar toggle handler
 */
export const handleSidebarToggle = (isVisible, setSidebarVisible) => {
  setSidebarVisible(isVisible);
};

/**
 * Copy code to clipboard functionality
 */
export const handleCopyCode = (codeString, blockId, setCopySuccessMap) => {
  navigator.clipboard.writeText(codeString).then(() => {
    setCopySuccessMap(prev => ({ ...prev, [blockId]: true }));
    setTimeout(() => {
      setCopySuccessMap(prev => ({ ...prev, [blockId]: false }));
    }, 2000);
  });
};

/**
 * Generate smart course name based on topics
 */
export const generateSmartCourseName = (topicsData, fallbackTitle) => {
  // If explicit non-generic title exists, prefer it
  if (fallbackTitle && !/^AI Course:|^ProLearning Course|^Generated Course|^Database Course/i.test(fallbackTitle)) {
    return fallbackTitle;
  }
  // Normalize topicsData to an array of { name }
  let topicArray = [];
  if (Array.isArray(topicsData)) {
    topicArray = topicsData;
  } else if (topicsData && typeof topicsData === 'object') {
    topicArray = Object.keys(topicsData).map(name => ({ name }));
  }
  if (!topicArray || topicArray.length === 0) {
    return 'AI Generated Course';
  }
  const names = topicArray.map(t => (t?.name || '').trim()).filter(Boolean);
  if (names.length === 0) return 'AI Generated Course';
  // Build: FirstTopic +2 +3 (+...)
  const first = names[0];
  const additional = Math.max(0, names.length - 1);
  if (additional === 0) return first;
  if (additional === 1) return `${first} +1`;
  if (additional === 2) return `${first} +1 +2`;
  // For more than 2 additional, show first two increments then ellipsis
  return `${first} +1 +2 +...`;
};

/**
 * Helper to sanitize topic names
 */
const sanitizeTopicName = (name) => (name || '').toString().replace(/\s*:\s*true$/i, '').trim();

/**
 * Auto-save function for post-generation saves (no UI state updates)
 */
export const autoSaveToBackend = async (dependencies) => {
  const {
    getCourseId,
    currentCourse,
    topicsList,
    content,
    selectedTopic,
    courseTitle
  } = dependencies;

  try {
    console.log('🤖 AUTO-SAVE: Starting auto-save process...');
    
    // Try to get course ID from multiple sources
    let currentCourseId = getCourseId();
    console.log('🤖 AUTO-SAVE: Course ID from getCourseId():', currentCourseId);
    
    // Try getting from local storage
    if (!currentCourseId) {
      const savedCourseId = localStorage.getItem('currentCourseId');
      if (savedCourseId) {
        currentCourseId = savedCourseId;
        console.log('📝 Using course ID from localStorage:', currentCourseId);
      }
    }

    if (!currentCourseId) {
      currentCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('currentCourseId', currentCourseId);
      console.log('🤖 AUTO-SAVE: Generated new course ID:', currentCourseId);
    }

    console.log('🤖 AUTO-SAVE: Final course ID:', currentCourseId);
    
    // Wait a moment for content to be fully saved to storage
    console.log('🤖 AUTO-SAVE: Waiting 3 seconds for content stabilization...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Initialize course content gathering
    let courseContent = null;
    let topicsWithContent = [];
    
    console.log('🤖 AUTO-SAVE: Checking topics list:', topicsList?.length, 'topics');
    console.log('🤖 AUTO-SAVE: Checking content state:', content ? 'has content' : 'no content');
    
    // Try to get content from multiple sources
    // First check if we have current content in state
    if (content && Object.keys(content).length > 0) {
      console.log('🤖 AUTO-SAVE: Found content in current state');
      // Convert current content state to topics format
      topicsWithContent.push({
        name: selectedTopic || 'Current Topic',
        content: {
          reading: content.reading || content.readingMaterial || '',
          summary: getSummaryContent(content),
          videos: Array.isArray(content.videos) ? content.videos : [],
          quiz: Array.isArray(content.quiz) ? content.quiz : 
                Array.isArray(content.quizQuestions) ? content.quizQuestions : [],
          resources: Array.isArray(content.resources) ? content.resources : []
        }
      });
      console.log(`🤖 AUTO-SAVE: Added current content (reading: ${content.reading?.length || 0} chars, summary: ${getSummaryContent(content).length} chars)`);
    }
    
    // If no content from current state, try topics list approach
    if (topicsWithContent.length === 0 && Array.isArray(topicsList) && topicsList.length > 0) {
      console.log('🤖 AUTO-SAVE: Using topics from current state:', topicsList.length, 'topics');
      
      // Try to gather content for each topic in the current state
      for (const topic of topicsList) {
        try {
          const rawName = typeof topic === 'string' ? topic : topic?.name;
          const topicName = sanitizeTopicName(rawName);
          if (!topicName) continue;

          let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
          // Fallback: search without courseId (global scan) if not found
          if (!content) {
            content = await proContentManager.getStoredTopicContent(null, topicName);
          }
          if (content) {
            topicsWithContent.push({
              name: topicName,
              content: {
                reading: content.reading || content.readingMaterial || '',
                summary: getSummaryContent(content),
                videos: Array.isArray(content.videos) ? content.videos : [],
                quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                resources: Array.isArray(content.resources) ? content.resources : []
              }
            });
            console.log(`📝 Added content for topic: ${topicName} (reading: ${content.reading?.length || 0} chars, summary: ${getSummaryContent(content).length} chars)`);
          }
        } catch (e) {
          console.warn('Failed to get content for topic:', topic.name, e);
        }
      }
    }
    
    // If still nothing, try a more comprehensive storage scan
    if (topicsWithContent.length === 0) {
      try {
        console.log('🤖 AUTO-SAVE: Doing comprehensive storage scan...');
        
        // Try getting complete course content first
        const storedCourseContent = await proContentManager.getStoredCourseContent(currentCourseId);
        if (storedCourseContent && storedCourseContent.topics) {
          console.log('🤖 AUTO-SAVE: Found stored course content with topics');
          // Evaluate if storedCourseContent actually has non-empty topics
          const tmp = (() => {
            const topics = storedCourseContent.topics;
            const entries = Array.isArray(topics) ? topics : Object.values(topics);
            const nonEmpty = entries.filter(t => {
              const c = (t?.content ?? t) || {};
              const r = c.reading || c.readingMaterial || '';
              const s = getSummaryContent(c);
              return (r && String(r).trim().length) || (s && String(s).trim().length);
            }).length;
            return { count: nonEmpty };
          })();
          if (tmp.count > 0) {
            courseContent = storedCourseContent;
          } else {
            console.log('🤖 AUTO-SAVE: Stored course content has 0 non-empty topics, will try per-topic scan');
          }
        }
        if (!courseContent) {
          // Try to get any stored topics for this course
          const allStoredTopics = await proContentManager.getStoredTopics(currentCourseId);
          console.log('🤖 AUTO-SAVE: Found stored topics:', allStoredTopics?.length || 0);
          
          if (Array.isArray(allStoredTopics) && allStoredTopics.length > 0) {
            for (const topic of allStoredTopics) {
              try {
                const topicName = sanitizeTopicName(topic?.name);
                // Probe multiple name variants to avoid key mismatches
                const nameVariants = [
                  topicName,
                  topicName.toLowerCase(),
                  topicName.toUpperCase(),
                  topicName.replace(/\s+/g, ' ').trim(),
                ];
                let topicContent = null;
                for (const n of nameVariants) {
                  topicContent = await proContentManager.getStoredTopicContent(currentCourseId, n);
                  if (topicContent && (topicContent.reading || topicContent.summary)) break;
                }
                if (topicContent && (topicContent.reading || topicContent.summary)) {
                  topicsWithContent.push({
                    name: topicName,
                    content: {
                      reading: topicContent.reading || topicContent.readingMaterial || '',
                      summary: getSummaryContent(topicContent),
                      videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                      quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : [],
                      resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                    }
                  });
                  console.log(`🤖 AUTO-SAVE: Found content for "${topicName}" (reading: ${topicContent.reading?.length || 0}, summary: ${getSummaryContent(topicContent).length})`);
                }
              } catch (e) {
                console.warn('Error getting content for topic:', topic.name, e);
              }
            }
            
            if (topicsWithContent.length > 0) {
              courseContent = { topics: topicsWithContent };
              console.log('🤖 AUTO-SAVE: Assembled course content from stored topics');
            }
          }
        }
      } catch (e) {
        console.error('🤖 AUTO-SAVE: Error in comprehensive storage scan:', e);
      }
    }
    
    // If still nothing and we have a selectedTopic, try to fetch just that one
    if (topicsWithContent.length === 0 && selectedTopic) {
      try {
        const rawName = typeof selectedTopic === 'string' ? selectedTopic : selectedTopic?.name;
        const topicName = sanitizeTopicName(rawName);
        if (topicName) {
          let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
          if (!content) content = await proContentManager.getStoredTopicContent(null, topicName);
          if (content) {
            topicsWithContent.push({
              name: topicName,
              content: {
                reading: content.reading || content.readingMaterial || '',
                summary: getSummaryContent(content),
                videos: Array.isArray(content.videos) ? content.videos : [],
                quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                resources: Array.isArray(content.resources) ? content.resources : []
              }
            });
            console.log('📝 Added content from selectedTopic:', topicName);
          }
        }
      } catch (e) {
        console.warn('Failed to get content for selectedTopic:', e);
      }
    }

    // If we already have topics from current state, use them
    if (topicsWithContent.length > 0 && !courseContent) {
      courseContent = { topics: topicsWithContent };
      console.log('📝 Using course content from current state topics:', topicsWithContent.length);
    }

    // If no content found from current state, try storage methods
    if (topicsWithContent.length === 0) {
      try {
        // Try getting complete course content first
        courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
        console.log('📝 Retrieved stored course content:', courseContent ? 'found' : 'not found');
        
        // If no course content, try assembling from stored topics
        if (!courseContent || !courseContent.topics) {
          const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
          console.log('📝 Retrieved stored topics:', storedTopics?.length || 0);
          
          if (Array.isArray(storedTopics) && storedTopics.length > 0) {
            for (const topic of storedTopics) {
              try {
                const topicName = sanitizeTopicName(topic?.name);
                let topicContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
                if (!topicContent) {
                  topicContent = await proContentManager.getStoredTopicContent(null, topicName);
                }
                if (topicContent) {
                  topicsWithContent.push({
                    name: topicName,
                    content: {
                      reading: topicContent.reading || topicContent.readingMaterial || '',
                      summary: getSummaryContent(topicContent),
                      videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                      quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : 
                            Array.isArray(topicContent.quizQuestions) ? topicContent.quizQuestions : [],
                      resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                    }
                  });
                  console.log('📝 Assembled content for stored topic:', topicName);
                }
              } catch (e) {
                console.warn('Failed to get content for stored topic:', topic.name, e);
              }
            }
            
            if (topicsWithContent.length > 0) {
              courseContent = { topics: topicsWithContent };
              console.log('📝 Successfully assembled course content from stored topics');
            }
          }
        }
      } catch (e) {
        console.warn('Failed to get content from storage:', e);
      }
    }
    
    const topicsEmpty = !courseContent || !courseContent.topics ||
      (Array.isArray(courseContent.topics) ? courseContent.topics.length === 0 : Object.keys(courseContent.topics).length === 0);
    if (topicsEmpty) {
      console.error('❌ AUTO-SAVE: No course content found for auto-save');
      console.log('🤖 AUTO-SAVE: Debug info:', {
        hasCourseContent: !!courseContent,
        hasTopics: !!(courseContent?.topics),
        topicsIsArray: Array.isArray(courseContent?.topics),
        topicsLength: Array.isArray(courseContent?.topics) ? courseContent.topics.length : Object.keys(courseContent?.topics || {}).length
      });
      return; // Silently fail for auto-save
    }

    console.log('🤖 AUTO-SAVE: Found course content with', 
      Array.isArray(courseContent.topics) ? courseContent.topics.length : Object.keys(courseContent.topics).length, 
      'topics');
    
    console.log('🤖 AUTO-SAVE: Raw course content structure:', {
      hasTopics: Array.isArray(courseContent.topics),
      topicsCount: courseContent.topics?.length || 0,
      sampleTopic: courseContent.topics?.[0],
      fullCourseContent: courseContent
    });

    // Generate smart course name based on topics
    const smartCourseName = generateSmartCourseName(courseContent.topics, courseTitle);

    // Helper to build topics object and compute non-empty stats
    const buildTopicsObjectAndStats = (cc) => {
      let nonEmpty = 0;
      if (!cc || !cc.topics) return { topicsObj: {}, nonEmpty };

      if (Array.isArray(cc.topics)) {
        const topicsObj = Object.fromEntries(cc.topics.map((t, idx) => {
          let c = t?.content ?? t ?? {};
          const reading = c.reading || c.readingMaterial || '';
          const summary = getSummaryContent(c);
          const videos = Array.isArray(c.videos) ? c.videos : [];
          let quiz = [];
          if (Array.isArray(c.quiz)) quiz = c.quiz;
          else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
          else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
          const resources = Array.isArray(c.resources) ? c.resources : [];

          let finalReading = reading;
          let finalSummary = summary;
          // If empty, attempt to enrich from ContentStorageService
          if (!(finalReading && finalReading.trim().length) && !(finalSummary && finalSummary.trim().length)) {
            try {
              let stored = contentStorageService.getContentByTopicName(sanitizeTopicName(t.name), currentCourseId);
              if (!stored) stored = contentStorageService.getContentByTopicName(sanitizeTopicName(t.name));
              if (stored) {
                finalReading = stored.reading || finalReading;
                finalSummary = getSummaryContent(stored) || finalSummary;
              }
            } catch {}
          }

          if ((finalReading && finalReading.trim().length) || (finalSummary && finalSummary.trim().length)) nonEmpty++;

          console.log(`🤖 AUTO-SAVE: Processing topic "${t.name}":`, {
            hasReading: !!finalReading,
            readingLength: finalReading?.length || 0,
            readingPreview: finalReading?.substring(0, 100) + '...',
            hasSummary: !!finalSummary,
            summaryLength: finalSummary?.length || 0,
            summaryPreview: finalSummary?.substring(0, 100) + '...',
            videosCount: videos.length,
            quizCount: quiz.length,
            resourcesCount: resources.length,
            rawContent: c
          });

          return [
            sanitizeTopicName(t.name),
            { content: { reading: finalReading, summary: finalSummary, videos, quiz, resources }, order: idx, readingMaterial: finalReading, summary: finalSummary, videos, quiz, resources }
          ];
        }));
        return { topicsObj, nonEmpty };
      }

      const topicsObj = Object.fromEntries(Object.entries(cc.topics).map(([name, t], idx) => {
        let c = t?.content ?? t ?? {};
        let reading = c.reading || c.readingMaterial || '';
        let summary = getSummaryContent(c);
        const videos = Array.isArray(c.videos) ? c.videos : [];
        let quiz = [];
        if (Array.isArray(c.quiz)) quiz = c.quiz;
        else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
        else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
        const resources = Array.isArray(c.resources) ? c.resources : [];

        if (!(reading && reading.trim().length) && !(summary && summary.trim().length)) {
          try {
            let stored = contentStorageService.getContentByTopicName(sanitizeTopicName(name), currentCourseId);
            if (!stored) stored = contentStorageService.getContentByTopicName(sanitizeTopicName(name));
            if (stored) {
              reading = stored.reading || reading;
              summary = getSummaryContent(stored) || summary;
            }
          } catch {}
        }

        if ((reading && reading.trim().length) || (summary && summary.trim().length)) nonEmpty++;

        return [
          sanitizeTopicName(name),
          { content: { reading, summary, videos, quiz, resources }, order: idx, readingMaterial: reading, summary, videos, quiz, resources }
        ];
      }));
      return { topicsObj, nonEmpty };
    };

    // Retry loop: ensure we have at least one non-empty topic before POST
    let topicsObject = {};
    let nonEmptyCount = 0;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const built = buildTopicsObjectAndStats(courseContent);
      topicsObject = built.topicsObj;
      nonEmptyCount = built.nonEmpty;
      console.log(`🤖 AUTO-SAVE: Build attempt ${attempt}/5 -> nonEmptyTopics=${nonEmptyCount}`);
      if (nonEmptyCount > 0) break;
      console.warn(`⏳ AUTO-SAVE: All topics empty on attempt ${attempt}. Retrying after 1500ms...`);
      await new Promise(r => setTimeout(r, 1500));
      try {
        const refreshed = await proContentManager.getStoredCourseContent(currentCourseId);
        if (refreshed && refreshed.topics) {
          courseContent = refreshed;
          console.log('🔁 AUTO-SAVE: Refreshed course content from storage');
        }
      } catch (e) {
        console.warn('🔁 AUTO-SAVE: Failed to refresh stored course content', e);
      }
    }

    if (nonEmptyCount === 0) {
      console.error('❌ AUTO-SAVE: Aborting POST — all topics have empty reading/summary after retries');
      return; // avoid saving empty topics
    }

    const courseData = {
      course_name: currentCourseId, // stable identifier used by backend
      title: smartCourseName,
      overwrite: true,
      topics: topicsObject
    };

    // Get auth token from localStorage only (no IndexedDB)
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      console.error('❌ AUTO-SAVE: No authentication token found for auto-save');
      return; // Silently fail for auto-save
    }

    console.log('🤖 AUTO-SAVE: Found auth token, preparing to save...');

    // Save to backend using Django endpoint
    console.log('🤖 AUTO-SAVE: Sending POST request to /api/courses/pro-learning/save-course/');
    console.log('🤖 AUTO-SAVE: Final course data being sent:', JSON.stringify(courseData, null, 2));
    console.log('🤖 AUTO-SAVE: POST payload size:', JSON.stringify(courseData).length, 'characters');
    console.log('🤖 AUTO-SAVE: Topics in payload:', Object.keys(courseData.topics || {}));
    
    // Log each topic's content in detail
    if (courseData.topics) {
      Object.entries(courseData.topics).forEach(([topicName, topicData]) => {
        console.log(`🤖 AUTO-SAVE: Topic "${topicName}" payload:`, {
          hasContent: !!topicData.content,
          reading: topicData.content?.reading || 'EMPTY',
          readingLength: (topicData.content?.reading || '').length,
          summary: topicData.content?.summary || 'EMPTY', 
          summaryLength: (topicData.content?.summary || '').length,
          fullTopicData: topicData
        });
      });
    }

    console.log('🤖 AUTO-SAVE: Making POST request to /api/courses/pro-learning/save-course/...');
    
    const axios = (await import('../../../utils/axios')).default;
    const response = await axios.post('/courses/pro-learning/save-course/', courseData);
    const responseData = response.data;

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ AUTO-SAVE: Course auto-saved to backend successfully!', responseData);
      
      // Mark course as ready (but don't force UI updates)
      localStorage.setItem(`proLearning_courseReady_${currentCourseId}`, 'true');

      // Show a one-time notification that generation completed and was added to Learning Hub
      try {
        const notifiedKey = `proLearning_savedNotified_${currentCourseId}`;
        const alreadyNotified = localStorage.getItem(notifiedKey) === 'true';
        if (!alreadyNotified) {
          universalToast.success('🎉 Course generation completed and added to your Learning Hub');
          localStorage.setItem(notifiedKey, 'true');
        }
      } catch (_) {
        // ignore toast/localStorage failures
      }
      
      // 🔥 IMPORTANT: Dispatch event to invalidate cache in chat page sidebar
      // This ensures newly saved courses appear immediately in /chat after auto-save completes
      try {
        localStorage.removeItem('prolearning_courses_cache');
        localStorage.removeItem('prolearning_courses_cache_timestamp');
        window.dispatchEvent(new Event('prolearning-courses-updated'));
        console.log('✅ [AUTO-SAVE] Cache invalidated and event dispatched for course:', currentCourseId);
      } catch (e) {
        console.warn('[AUTO-SAVE] Failed to dispatch cache invalidation event:', e);
      }
      
    } else {
      console.error('❌ AUTO-SAVE: Failed to auto-save course. Status:', response.status, 'Response:', responseData);
      // Don't show UI errors for auto-save failures
    }

  } catch (error) {
    // Improved logging: include server response body if available to help debugging
    try {
      const serverData = error?.response?.data;
      if (serverData) {
        console.error('❌ AUTO-SAVE: Server response body:', serverData);
      }
    } catch (e) {
      // ignore
    }
    console.error('❌ AUTO-SAVE: Failed to auto-save course to backend:', error);
    try { 
      const tracking = (await import('../../../services/trackingService')).default;
      tracking.capture('pro_learning.save_failed', { auto: true, status: error?.response?.status || null }, { feature: 'pro_learning', success: false, error_code: String(error?.response?.status || 'ERR') }); 
    } catch {}
    // Silently fail for auto-save
  }
};

/**
 * Manual save to Learning Hub handler
 */
export const handleSaveToLearningHub = async (dependencies) => {
  const {
    getCourseId,
    currentCourse,
    topicsList,
    selectedTopic,
    courseTitle
  } = dependencies;

  try {
    
    // Try to get course ID from multiple sources
    let currentCourseId = getCourseId();
    
    // Try getting from local storage
    if (!currentCourseId) {
      const savedCourseId = localStorage.getItem('currentCourseId');
      if (savedCourseId) {
        currentCourseId = savedCourseId;
        console.log('📝 Using course ID from localStorage:', currentCourseId);
      }
    }

    // If still no ID, create a new one
    if (!currentCourseId) {
      currentCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('currentCourseId', currentCourseId);
      console.log('📝 Generated new course ID:', currentCourseId);
    }

    // Initialize course content gathering
    let courseContent = null;
    let topicsWithContent = [];
    
    // First try to get topics from current state
    if (Array.isArray(topicsList) && topicsList.length > 0) {
      console.log('📝 Using topics from current state:', topicsList.length, 'topics');
      
      // Try to gather content for each topic in the current state
      for (const topic of topicsList) {
        try {
          const rawName = typeof topic === 'string' ? topic : topic?.name;
          const topicName = sanitizeTopicName(rawName);
          if (!topicName) continue;

          let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
          // Fallback: search without courseId (global scan) if not found
          if (!content) {
            content = await proContentManager.getStoredTopicContent(null, topicName);
          }
          if (content) {
            topicsWithContent.push({
              name: topicName,
              content: {
                reading: content.reading || content.readingMaterial || '',
                summary: getSummaryContent(content),
                videos: Array.isArray(content.videos) ? content.videos : [],
                quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                resources: Array.isArray(content.resources) ? content.resources : []
              }
            });
            console.log('📝 Added content for topic:', topic.name);
          }
        } catch (e) {
          console.warn('Failed to get content for topic:', topic.name, e);
        }
      }
    }
    
    // If still nothing and we have a selectedTopic, try to fetch just that one
    if (topicsWithContent.length === 0 && selectedTopic) {
      try {
        const rawName = typeof selectedTopic === 'string' ? selectedTopic : selectedTopic?.name;
        const topicName = sanitizeTopicName(rawName);
        if (topicName) {
          let content = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
          if (!content) content = await proContentManager.getStoredTopicContent(null, topicName);
          if (content) {
            topicsWithContent.push({
              name: topicName,
              content: {
                reading: content.reading || content.readingMaterial || '',
                summary: getSummaryContent(content),
                videos: Array.isArray(content.videos) ? content.videos : [],
                quiz: Array.isArray(content.quiz) ? content.quiz : (Array.isArray(content.quizQuestions) ? content.quizQuestions : []),
                resources: Array.isArray(content.resources) ? content.resources : []
              }
            });
            console.log('📝 Added content from selectedTopic:', topicName);
          }
        }
      } catch (e) {
        console.warn('Failed to get content for selectedTopic:', e);
      }
    }

    // If we already have topics from current state, use them
    if (topicsWithContent.length > 0 && !courseContent) {
      courseContent = { topics: topicsWithContent };
      console.log('📝 Using course content from current state topics:', topicsWithContent.length);
    }

    // If no content found from current state, try storage methods
    if (topicsWithContent.length === 0) {
      try {
        // Try getting complete course content first
        courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
        console.log('📝 Retrieved stored course content:', courseContent ? 'found' : 'not found');
        
        // If no course content, try assembling from stored topics
        if (!courseContent || !courseContent.topics) {
          const storedTopics = await proContentManager.getStoredTopics(currentCourseId);
          console.log('📝 Retrieved stored topics:', storedTopics?.length || 0);
          
          if (Array.isArray(storedTopics) && storedTopics.length > 0) {
            for (const topic of storedTopics) {
              try {
                const topicName = sanitizeTopicName(topic?.name);
                let topicContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
                if (!topicContent) {
                  topicContent = await proContentManager.getStoredTopicContent(null, topicName);
                }
                if (topicContent) {
                  topicsWithContent.push({
                    name: topicName,
                    content: {
                      reading: topicContent.reading || topicContent.readingMaterial || '',
                      summary: getSummaryContent(topicContent),
                      videos: Array.isArray(topicContent.videos) ? topicContent.videos : [],
                      quiz: Array.isArray(topicContent.quiz) ? topicContent.quiz : 
                            Array.isArray(topicContent.quizQuestions) ? topicContent.quizQuestions : [],
                      resources: Array.isArray(topicContent.resources) ? topicContent.resources : []
                    }
                  });
                  console.log('📝 Assembled content for stored topic:', topic.name);
                }
              } catch (e) {
                console.warn('Failed to get content for stored topic:', topic.name, e);
              }
            }
            
            if (topicsWithContent.length > 0) {
              courseContent = { topics: topicsWithContent };
              console.log('📝 Successfully assembled course content from stored topics');
            }
          }
        }
      } catch (e) {
        console.warn('Failed to get content from storage:', e);
      }
    }
    
    const topicsEmpty = !courseContent || !courseContent.topics ||
      (Array.isArray(courseContent.topics) ? courseContent.topics.length === 0 : Object.keys(courseContent.topics).length === 0);
    if (topicsEmpty) {
      console.error('❌ No course content found in local storage (after fallback)');
      alert('Error: No course content found. Please generate content first.');
      return;
    }

    // Generate smart course name based on topics
    const smartCourseName = generateSmartCourseName(courseContent.topics, courseTitle);
    
    // Prepare course data for working Django endpoint (expects topics as object)
    const topicsObject = Array.isArray(courseContent.topics)
      ? Object.fromEntries(courseContent.topics.map((t, idx) => {
          const c = t?.content ?? t ?? {};
          const reading = c.reading || c.readingMaterial || '';
          const summary = getSummaryContent(c);
          const videos = Array.isArray(c.videos) ? c.videos : [];
          let quiz = [];
          if (Array.isArray(c.quiz)) quiz = c.quiz;
          else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
          else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
          const resources = Array.isArray(c.resources) ? c.resources : [];
          return [
            sanitizeTopicName(t.name),
            {
              content: { reading, summary, videos, quiz, resources },
              order: idx,
              readingMaterial: reading,
              summary,
              videos,
              quiz,
              resources
            }
          ]
        }))
      : Object.fromEntries(Object.entries(courseContent.topics).map(([name, t], idx) => {
          const c = t?.content ?? t ?? {};
          const reading = c.reading || c.readingMaterial || '';
          const summary = getSummaryContent(c);
          const videos = Array.isArray(c.videos) ? c.videos : [];
          let quiz = [];
          if (Array.isArray(c.quiz)) quiz = c.quiz;
          else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
          else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
          const resources = Array.isArray(c.resources) ? c.resources : [];
          return [
            sanitizeTopicName(name),
            {
              content: { reading, summary, videos, quiz, resources },
              order: idx,
              readingMaterial: reading,
              summary,
              videos,
              quiz,
              resources
            }
          ];
        }));

    const courseData = {
      course_name: currentCourseId, // stable identifier used by backend
      title: smartCourseName,
      overwrite: true,
      topics: topicsObject
    };

    // Get auth token from localStorage only (no IndexedDB)
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      console.error('❌ No authentication token found');
      alert('Please log in to save courses to your Learning Hub.');
      return;
    }

    // Save to SQLite using Django endpoint
    try { 
      const tracking = (await import('../../../services/trackingService')).default;
      tracking.capture('pro_learning.save_attempted', { course_id: currentCourseId }, { feature: 'pro_learning' }); 
    } catch {}
    const axios = (await import('../../../utils/axios')).default;
    const response = await axios.post('/courses/pro-learning/save-course/', courseData);
    const responseData = response.data;

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Course saved to Learning Hub successfully!', responseData);
      try { 
        const tracking = (await import('../../../services/trackingService')).default;
        tracking.capture('pro_learning.save_succeeded', { course_id: currentCourseId }, { feature: 'pro_learning' }); 
      } catch {}
      universalToast.success('✅ Course saved to your Learning Hub successfully!');
      
      // Refresh usage stats after saving (topics were created in DB)
      try {
        const { getRateLimitStatus } = await import('../topicclassifier');
        const freshStats = await getRateLimitStatus();
        if (freshStats && typeof window !== 'undefined' && window.chatbotSetUsageStats) {
          window.chatbotSetUsageStats(freshStats);
        }
      } catch (statsErr) {
        console.warn('Could not refresh usage stats after course save:', statsErr);
      }
      
      // Update course saved status
      const courseKey = `${currentCourseId}_${smartCourseName}`;
      const savedStatus = localStorage.getItem('coursesSavedToHub');
      let savedCourses = [];
      
      if (savedStatus) {
        try {
          savedCourses = JSON.parse(savedStatus);
        } catch (error) {
          console.error('Error parsing saved courses:', error);
        }
      }
      
      if (!savedCourses.includes(courseKey)) {
        savedCourses.push(courseKey);
        localStorage.setItem('coursesSavedToHub', JSON.stringify(savedCourses));
      }
      
      // Mark course as ready and mark notified to avoid duplicate toasts later
      localStorage.setItem(`proLearning_courseReady_${currentCourseId}`, 'true');
      try {
        localStorage.setItem(`proLearning_savedNotified_${currentCourseId}`, 'true');
      } catch (_) {}
      
      // 🔥 IMPORTANT: Dispatch event to invalidate cache in chat page sidebar
      // This ensures newly saved courses appear immediately in /chat
      try {
        localStorage.removeItem('prolearning_courses_cache');
        localStorage.removeItem('prolearning_courses_cache_timestamp');
        window.dispatchEvent(new Event('prolearning-courses-updated'));
        console.log('✅ Cache invalidated and event dispatched for course:', currentCourseId);
      } catch (e) {
        console.warn('Failed to dispatch cache invalidation event:', e);
      }
      
    } else {
      console.error('❌ Failed to save course:', responseData);
      try { 
        const tracking = (await import('../../../services/trackingService')).default;
        tracking.capture('pro_learning.save_failed', { course_id: currentCourseId, status: response.status }, { feature: 'pro_learning', success: false, error_code: String(response.status) }); 
      } catch {}
      if (response.status === 401) {
        universalToast.error('Authentication failed. Please log in again.');
      } else if (response.status === 409) {
        // Use central toast util to ensure de-duplication
        universalToast.show('This course already exists in your Learning Hub.');
        // Mark as saved locally to reflect existing state
        try {
          const courseKey = `${currentCourseId}_${smartCourseName}`;
          const savedStatus = localStorage.getItem('coursesSavedToHub');
          const savedCourses = savedStatus ? JSON.parse(savedStatus) : [];
          if (!savedCourses.includes(courseKey)) {
            savedCourses.push(courseKey);
            localStorage.setItem('coursesSavedToHub', JSON.stringify(savedCourses));
          }
          
          // 🔥 IMPORTANT: Dispatch event even for 409 - course exists in backend but not in chat cache
          localStorage.removeItem('prolearning_courses_cache');
          localStorage.removeItem('prolearning_courses_cache_timestamp');
          window.dispatchEvent(new Event('prolearning-courses-updated'));
          console.log('✅ Cache invalidated for existing course:', currentCourseId);
        } catch {}
      } else {
        universalToast.error(responseData.error || 'Failed to save course');
      }
    }

  } catch (error) {
    console.error('❌ Failed to save course to Learning Hub:', error);
    const currentCourseId = getCourseId();
    try { 
      const tracking = (await import('../../../services/trackingService')).default;
      tracking.capture('pro_learning.save_failed', { course_id: currentCourseId, message: String(error) }, { feature: 'pro_learning', success: false, error_code: 'NETWORK' }); 
    } catch {}
    universalToast.error('Network error. Please check your connection and try again.');
  }
};
