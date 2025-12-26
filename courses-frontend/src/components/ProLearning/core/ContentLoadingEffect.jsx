/**
 * ContentLoadingEffect.jsx
 * 
 * Factory function that creates the content loading effect for ProLearningPage.
 * This effect handles:
 * - Initial topic content loading from storage or generation
 * - Batch generation polling
 * - URL-based topic loading
 * - Content hydration and deduplication
 * - Database fallback for saved courses
 */

/**
 * Creates the content loading effect logic
 * @param {Object} dependencies - All required dependencies
 * @returns {Function} Effect function to be used in useEffect
 */
export const createContentLoadingEffect = (dependencies) => {
  const {
    loadScenario,
    isDirectUrlGeneration,
    topicParam,
    topicsList,
    shouldSkipOldCachedContent,
    getProgressiveGenerationStatus,
    debugLog,
    courseTitle,
    getCourseId,
    generatingContentRef,
    content,
    setIsLoading,
    setShowSkeletons,
    getStoredTopicContent,
    setContentWithSanitization,
    parseReadingSections,
    setReadingSections,
    setReadingSectionIndex,
    isBatchGenerating,
    setLoadingStep,
    setSectionGenerating,
    setGeneratingTopics,
    proContentManager,
    generateProContent,
    lastGeneratedTopicRef,
    getCurrentTopicFromParam,
    fetchCourseFromDB
  } = dependencies;

  // Return the effect function
  return () => {
    // If this page was opened for an already-saved course (DB reload),
    // skip this effect entirely to avoid kicking off any new generation.
    if (loadScenario === 'reload') {
      return;
    }
    // Skip if we're handling URL-based topic loading directly or during direct URL generation
    if (isDirectUrlGeneration || (topicParam && !topicsList.length)) {
      return; // Let the URL topic loading useEffect handle this
    }
    
    // Check if we're in fresh course creation mode using consistent logic
    const shouldSkipOld = shouldSkipOldCachedContent();
    const progressiveStatus = getProgressiveGenerationStatus();
    const isProgressiveGeneration = progressiveStatus && progressiveStatus.isGenerating;
    const shouldForceGeneration = shouldSkipOld || isProgressiveGeneration;
    
    if (shouldForceGeneration) {
      debugLog('🔄 DEBUG: Fresh course creation detected - skipping cached content loading in initial topic effect');
      return;
    }
    
    if (topicsList.length > 0 && courseTitle) {
      const activeTopic = topicsList.find(t => t.isActive);
      if (activeTopic) {
        // CRITICAL: Check if we're already generating content for this topic
        const generationKey = `${getCourseId()}_${activeTopic.name}`;
        if (generatingContentRef.current.has(generationKey)) {
          console.log('🛑 Already generating content for:', activeTopic.name, '- skipping duplicate request');
          return;
        }
        
        // If we already have content in state, avoid hydrating from storage to prevent overwriting
        // progressive content with a different post-generation copy.
        if (content && (content.reading || content.summary || content.videos?.length || content.quiz?.length || content.resources?.length)) {
          console.log('🛡️ Skipping stored content hydration to preserve already displayed content for:', activeTopic.name);
          setIsLoading(false);
          setShowSkeletons(false);
          return;
        }

        // Check if content exists in storage for the active topic
        const storedContent = getStoredTopicContent(activeTopic.name, courseTitle, getCourseId());
        
        if (storedContent) {
          setContentWithSanitization(storedContent, 'initialActiveTopic:stored');
          
          // Parse reading content into sections if available
          if (storedContent.reading) {
            const sections = parseReadingSections(storedContent.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          }
          
          setIsLoading(false);
          setShowSkeletons(false);
        } else if (isBatchGenerating) {
          // Show loading if content is being generated in batch
          setIsLoading(true);
          setShowSkeletons(true);
          setLoadingStep(`Generating content for ${activeTopic.name}... Please wait.`);
          
          // Check periodically if content becomes available in storage
          const checkContentInterval = setInterval(() => {
            const newStoredContent = getStoredTopicContent(activeTopic.name, courseTitle, getCourseId());
            if (newStoredContent) {
              setContentWithSanitization(newStoredContent, 'initialActiveTopic:storedPolling');
              
              // Parse reading content into sections
              if (newStoredContent.reading) {
                const sections = parseReadingSections(newStoredContent.reading);
                setReadingSections(sections);
                setReadingSectionIndex(0);
              }
              
              setIsLoading(false);
              setShowSkeletons(false);
              clearInterval(checkContentInterval);
            }
          }, 1000); // Check every second
          
          // Clean up interval
          return () => clearInterval(checkContentInterval);
        } else {
          // If not in batch generation and no stored content, load from ProContentManager
          setIsLoading(true);
          setShowSkeletons(true);
          setSectionGenerating(true);
          setGeneratingTopics(prev => [...prev, activeTopic.name]);
          
          // Pass database topic data if available
          const dbTopic = activeTopic?.dbTopic || null;
          
          // Mark this topic as being generated
          const generationKey = `${getCourseId()}_${activeTopic.name}`;
          generatingContentRef.current.add(generationKey);
          console.log('🚀 Starting content generation for:', activeTopic.name);
          
          proContentManager.getTopicContent(activeTopic.name, generateProContent, dbTopic)
            .then(result => {
              // Remove from generating set when done
              generatingContentRef.current.delete(generationKey);
              lastGeneratedTopicRef.current = activeTopic.name;
              console.log('✅ Completed content generation for:', activeTopic.name);
              
              setSectionGenerating(false);
              setGeneratingTopics(prev => prev.filter(t => t !== activeTopic.name));
              if (result && result.content) {
                setContentWithSanitization(result.content, 'initialActiveTopic:getTopicContent');
                
                // Parse reading content into sections
                if (result.content && result.content.reading) {
                  const sections = parseReadingSections(result.content.reading);
                  setReadingSections(sections);
                  setReadingSectionIndex(0);
                } else {
                  setReadingSections([]);
                  setReadingSectionIndex(0);
                }
                
              }
              setIsLoading(false);
              setShowSkeletons(false);
            })
            .catch(error => {
              // Remove from generating set on error too
              generatingContentRef.current.delete(generationKey);
              console.error('❌ Failed to load content for:', activeTopic.name, error);
              setIsLoading(false);
              setShowSkeletons(false);
            });
        }
      }
    } else if (topicParam && !topicsList.length) {
      // If no topics list but we have a topic from URL, handle content loading/generation
      const actualTopic = getCurrentTopicFromParam(topicParam);
      const currentCourseId = getCourseId();
      
      if (currentCourseId) {
        // CRITICAL: Check if we're already generating content for this topic
        const generationKey = `${currentCourseId}_${actualTopic}`;
        if (generatingContentRef.current.has(generationKey)) {
          console.log('🛑 Already generating content for:', actualTopic, '- skipping duplicate URL request');
          return;
        }
        
        setIsLoading(true);
        setShowSkeletons(true);
        setLoadingStep(`Loading content for ${actualTopic}...`);
        
        // Mark this topic as being generated
        generatingContentRef.current.add(generationKey);
        console.log('🚀 Starting URL-based content generation for:', actualTopic);
        
        // First try to get database topic data
        const getDatabaseTopicData = async () => {
          const databaseCourse = await fetchCourseFromDB(currentCourseId);
          if (databaseCourse?.topics) {
            // Set course context with database course name if courseTitle is empty
            const courseName = courseTitle || databaseCourse.course_name || "Database Course";
            proContentManager.setCourse(courseName, currentCourseId);
            console.log('✅ ProContentManager initialized for direct URL with course:', courseName);
            
            return {
              dbTopic: databaseCourse.topics.find(topic => topic.topic_name === actualTopic),
              courseName: databaseCourse.course_name
            };
          }
          return null;
        };
        
        // Use ProContentManager to handle content retrieval/generation
        proContentManager.setCourse(courseTitle || 'Generated Course', currentCourseId);
        
        getDatabaseTopicData().then(result => {
          const dbTopic = result?.dbTopic || null;
          return proContentManager.getTopicContent(actualTopic, generateProContent, dbTopic);
        })
          .then(result => {
            // Remove from generating set when done
            generatingContentRef.current.delete(generationKey);
            lastGeneratedTopicRef.current = actualTopic;
            console.log('✅ Completed URL-based content generation for:', actualTopic);
            
            if (result?.content?.reading) {
              setContentWithSanitization(result.content, 'direct:getTopicContentWithReading');
              const sections = parseReadingSections(result.content.reading);
              setReadingSections(sections);
              setReadingSectionIndex(0);
              console.log('✅ Content ready:', result.source === 'storage' ? 'from storage' : result.source === 'database' ? 'from database' : 'newly generated');
            } else {
              throw new Error('Invalid content received');
            }
          })
          .catch(error => {
            // Remove from generating set on error
            generatingContentRef.current.delete(generationKey);
            console.error('❌ Failed to load/generate content for:', actualTopic, error);
          })
          .finally(() => {
            setIsLoading(false);
            setShowSkeletons(false);
          });
      }
    }
  };
};
