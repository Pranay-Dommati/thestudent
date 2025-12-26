/**
 * TopicContentLoader.jsx
 * 
 * Handles loading topic content from storage and database, with fallback to generation.
 * Extracted from ProLearningPage.jsx for better modularity.
 * 
 * Key responsibilities:
 * - Check progressive generation status and route accordingly
 * - Load content from storage (multiple methods)
 * - Fetch from database if not in storage
 * - Generate content if not found anywhere
 * - Update available tabs based on loaded content
 * - Handle loading states and errors
 */

import proContentManager from '../../../services/ProContentManager';
import { parseReadingSections } from '../utils/ReadingUtils';

/**
 * Creates the loadTopicContent function with all necessary dependencies
 * 
 * @param {Object} dependencies - All required dependencies from parent component
 * @returns {Function} - The async loadTopicContent function
 */
export const createLoadTopicContent = (dependencies) => {
  const {
    getCourseId,
    useProgressiveGeneration,
    getProgressiveGenerationStatus,
    shouldSkipOldCachedContent,
    loadProgressiveTopicContent,
    selectedTopic,
    content,
    isLoading,
    setContentTopicName,
    setAvailableTabsForTopics,
    setIsLoading,
    setLoadingStep,
    setContentWithSanitization,
    setReadingSections,
    setReadingSectionIndex,
    courseTitle,
    topicsList,
    fetchCourseFromDB,
    generateProContent
  } = dependencies;

  return async (topicName) => {
    const currentCourseId = getCourseId();
    if (!currentCourseId) return;

    // During active progressive generation or fresh-batch window, avoid hydrating from storage/DB
    // to ensure the reading shown is the raw progressive one.
    try {
      if (useProgressiveGeneration) {
        const status = getProgressiveGenerationStatus();
        const activelyGenerating = !!(status && status.isGenerating);
        const freshBatch = shouldSkipOldCachedContent();
        if (activelyGenerating || freshBatch) {
          await loadProgressiveTopicContent(topicName, { showLoader: true });
          return;
        }
      }
    } catch {}

    // OPTIMIZATION: Check if content is already loaded for this topic and user hasn't switched topics
    if (selectedTopic?.name === topicName && content && content.reading && !isLoading) {
      console.log('🚀 Content already loaded for topic:', topicName, '- updating tabs and skipping reload');
      setContentTopicName(topicName);
      
      // CRITICAL: Even if content is loaded, always update available tabs for the topic
      const availableTabs = [];
      if (content.reading) availableTabs.push('reading');
      if (content.summary) availableTabs.push('summary');
      if (content.videos?.length > 0) availableTabs.push('videos');
      if (content.quiz?.length > 0 || (content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
      // Consider resources generation complete if metadata.generatedAt exists (even with 0 results)
      if ((content.resources?.length > 0) || (content.resourcesMetadata?.generatedAt)) availableTabs.push('resources');
      
      setAvailableTabsForTopics(prev => {
        const prevTabs = prev[topicName] || [];
        const same = prevTabs.length === availableTabs.length && prevTabs.every((t, i) => t === availableTabs[i]);
        if (same) return prev; // idempotent - avoid unnecessary state update
        return {
          ...prev,
          [topicName]: availableTabs
        };
      });
      
      console.log('🎯 Updated available tabs for already loaded topic:', topicName, availableTabs);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStep(`Loading ${topicName} content...`);

      // Try multiple ways to get stored content
      let storedContent = null;
      
      // Method 1: Try the ProContentManager method
      storedContent = await proContentManager.getStoredTopicContent(currentCourseId, topicName);
      
      // Method 2: Try direct storage access if Method 1 fails
      if (!storedContent) {
        try {
          const courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
          
          if (courseContent && courseContent.topics) {
            storedContent = courseContent.topics[topicName]?.content;
            console.log('🔍 Method 2 (Direct access):', storedContent ? 'Found' : 'Not found');
          }
        } catch (err) {
          console.warn('🔍 Method 2 failed:', err);
        }
      }
      
      // Method 3: Try checking with different topic name formats if still not found
      if (!storedContent && topicName) {
        const courseContent = await proContentManager.getStoredCourseContent(currentCourseId);
        if (courseContent && courseContent.topics) {
          // Try to find topic with similar names (case insensitive, trimmed)
          const topicKeys = Object.keys(courseContent.topics);
          const matchingKey = topicKeys.find(key => 
            key.toLowerCase().trim() === topicName.toLowerCase().trim()
          );
          
          if (matchingKey) {
            storedContent = courseContent.topics[matchingKey]?.content;
            console.log('🔍 Method 3 (Case insensitive):', storedContent ? `Found with key: ${matchingKey}` : 'Not found');
          }
        }
      }
      
      if (storedContent && (storedContent.reading || storedContent.summary)) {
        console.log('✅ Successfully found stored content for:', topicName);
        
        // Transform stored content to the expected format
        const transformedContent = {
          // Do NOT inject placeholder reading; keep empty string so first real reading can win
          reading: typeof storedContent.reading === 'string' ? storedContent.reading : '',
          summary: storedContent.summary || 'Summary not available',
          quiz: storedContent.quiz || { questions: [], currentQuestion: 0 },
          videos: storedContent.videos || [],
          resources: storedContent.resources || []
        };
        
        setContentWithSanitization(transformedContent, 'reload:transformedContent');
        setContentTopicName(topicName);
        
        // Update available tabs for the topic based on loaded content
        const availableTabs = [];
        if (transformedContent.reading) availableTabs.push('reading');
        if (transformedContent.summary) availableTabs.push('summary');
        if (transformedContent.videos?.length > 0) availableTabs.push('videos');
        if (transformedContent.quiz?.length > 0 || (transformedContent.quiz?.questions?.length > 0)) availableTabs.push('quiz');
        if (transformedContent.resources?.length > 0) availableTabs.push('resources');
        
        setAvailableTabsForTopics(prev => {
          const prevTabs = prev[topicName] || [];
          const same = prevTabs.length === availableTabs.length && prevTabs.every((t, i) => t === availableTabs[i]);
          if (same) return prev;
          return {
            ...prev,
            [topicName]: availableTabs
          };
        });
        
        // Parse and set reading sections
        if (storedContent.reading) {
          const sections = parseReadingSections(storedContent.reading);
          setReadingSections(sections);
          setReadingSectionIndex(0);
        }
        
        console.log('✅ Content loaded successfully from storage');
        setIsLoading(false);
        setLoadingStep('');
        return; // CRITICAL: Exit here to avoid continuing to database fetch logic
      } else {
        // Fallback to generating content if not in storage
        
        // CRITICAL: Set course context in ProContentManager before calling getTopicContent
        proContentManager.setCourse(courseTitle || "Database Course", currentCourseId);
        
        // Try to get database topic data - first check if it's already in the topics list
        let dbTopic = null;
        const topicWithDbData = topicsList.find(t => t.name === topicName && t.dbTopic);
        if (topicWithDbData) {
          dbTopic = topicWithDbData.dbTopic;
          console.log('🗄️ Using cached database topic:', {
            topicName,
            hasDbTopic: !!dbTopic,
            dbTopicKeys: dbTopic ? Object.keys(dbTopic) : [],
            hasReadingMaterial: !!dbTopic?.reading_material,
            hasSummary: !!dbTopic?.summary,
            hasVideos: !!dbTopic?.videos?.length,
            hasQuiz: !!dbTopic?.quiz_questions?.length,
            hasResources: !!dbTopic?.resources?.length
          });
        } else {
          // Fallback: fetch from database if not cached
          console.log('⚠️ No cached database topic found, fetching from database');
          const databaseCourse = await fetchCourseFromDB(currentCourseId);
          if (databaseCourse?.topics) {
            dbTopic = databaseCourse.topics.find(topic => topic.topic_name === topicName);
            console.log('🗄️ Fetched database topic:', dbTopic ? 'Found' : 'Not found');
          }
        }
        
        console.log('🔄 Calling proContentManager.getTopicContent with:', {
          topicName,
          hasDbTopic: !!dbTopic,
          hasGenerateCallback: !!generateProContent
        });
        
        const result = await proContentManager.getTopicContent(topicName, generateProContent, dbTopic);
        
        console.log('📝 ProContentManager result for topic:', topicName, {
          hasResult: !!result,
          source: result?.source,
          hasContent: !!result?.content,
          contentKeys: result?.content ? Object.keys(result.content) : []
        });
        
        if (result && result.content) {
          console.log('✅ Setting content for topic:', topicName, {
            hasReading: !!result.content.reading,
            hasSummary: !!result.content.summary,
            hasVideos: !!result.content.videos?.length,
            hasQuiz: !!result.content.quiz?.length,
            hasResources: !!result.content.resources?.length
          });
          
          setContentWithSanitization(result.content, 'direct:generateProContent');
          setContentTopicName(topicName);
          
          // Update available tabs for the topic based on generated content
          const availableTabs = [];
          if (result.content.reading) availableTabs.push('reading');
          if (result.content.summary) availableTabs.push('summary');
          if (result.content.videos?.length > 0) availableTabs.push('videos');
          if (result.content.quiz?.length > 0 || (result.content.quiz?.questions?.length > 0)) availableTabs.push('quiz');
          if (result.content.resources?.length > 0) availableTabs.push('resources');
          
          setAvailableTabsForTopics(prev => ({
            ...prev,
            [topicName]: availableTabs
          }));
          
          // Parse and set reading sections for generated content
          if (result.content && result.content.reading) {
            const sections = parseReadingSections(result.content.reading);
            setReadingSections(sections);
            setReadingSectionIndex(0);
          }
          
          // Clear loading states after content is successfully set
          setIsLoading(false);
          setLoadingStep('');
        } else {
          throw new Error('Failed to generate or retrieve content');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load topic content:', error);
      const errorContent = {
        reading: 'Failed to load content. Please try again.',
        summary: 'Failed to load summary.',
        quiz: { questions: [], currentQuestion: 0 },
        videos: [],
        resources: []
      };
      setContentWithSanitization(errorContent, 'progressive:loadError');
      setContentTopicName(topicName);
      
      // Even for error content, set the reading tab as available
      setAvailableTabsForTopics(prev => ({
        ...prev,
        [topicName]: ['reading', 'summary'] // At least show reading/summary tabs for error content
      }));
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };
};
