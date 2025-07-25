// ProBatchGenerator.js
// Handles batch generation of content for all topics when course is created
// Uses ContentStorageService for database-like storage instead of simple caching

import contentStorageService from '../../services/ContentStorageService.js';

/**
 * Generate content for all topics in batch when a course is created
 * This function runs once when the pro-learning page loads and stores content in structured storage
 * 
 * @param {String} courseTitle - Course title to identify the course
 * @param {Array} topicsList - List of topics for the course
 * @param {Function} generateProContent - Function to generate content for a topic
 * @param {Function} setLoadingStatus - Function to update loading status
 * @param {Function} setIsGenerating - Function to update generation status
 * @param {Function} setGenerationProgress - Function to update generation progress
 */
export const batchGenerateAllTopics = async (
  courseTitle,
  topicsList, 
  generateProContent, 
  setLoadingStatus, 
  setIsGenerating,
  setGenerationProgress
) => {
  if (!topicsList || topicsList.length === 0) {
    setIsGenerating(false);
    return { success: false, message: 'No topics provided' };
  }

  if (!courseTitle) {
    setIsGenerating(false);
    return { success: false, message: 'No course title provided' };
  }

  setIsGenerating(true);
  setLoadingStatus('Initializing content generation for all topics...');
  
  try {
    // 1. First, ensure course exists in storage
    let course = contentStorageService.getCourseByTitle(courseTitle);
    let courseId;
    
    if (!course) {
      // Create course if it doesn't exist
      courseId = contentStorageService.storeCourse({
        title: courseTitle,
        description: `AI-generated course: ${courseTitle}`
      });
      course = contentStorageService.getCourse(courseId);
    } else {
      courseId = course.id;
    }

    // 2. Store topics in the structured storage
    const topicIds = contentStorageService.storeTopics(courseId, topicsList);

    // 3. Check which topics already have content
    const progress = contentStorageService.getCourseProgress(courseId);

    if (progress.isComplete) {
      setLoadingStatus('All topics are ready! Content loaded from storage.');
      setGenerationProgress(100);
      setIsGenerating(false);
      return { success: true, message: 'Content already exists', courseId };
    }

    // 4. Generate content for topics that don't have it
    let processedCount = progress.generated; // Start from already generated count
    const topicsToGenerate = contentStorageService.getTopicsForCourse(courseId)
      .filter(topic => !topic.contentGenerated);


    // Process each topic that needs content generation
    for (const topic of topicsToGenerate) {
      setLoadingStatus(`Generating content for ${topic.name} (${processedCount + 1}/${topicsList.length})...`);
      
      try {
        // Generate content for the topic
        let generatedContent = null;
        
        // Create a promise that will capture the generated content
        await new Promise((resolve, reject) => {
          let resolved = false;
          
          // Set a timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              reject(new Error(`Content generation timeout for ${topic.name}`));
            }
          }, 45000); // 45 second timeout per topic
          
          generateProContent({
            topic: topic.name,
            setIsLoading: () => {},  // Empty functions as we're handling loading state separately
            setLoadingProgress: () => {},
            setShowSkeletons: () => {},
            setLoadingStep: (step) => setLoadingStatus(`${topic.name}: ${step}`),
            setContent: (newContent) => {
              if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                
                // Capture the generated content
                if (typeof newContent === 'function') {
                  generatedContent = newContent({});
                } else {
                  generatedContent = newContent;
                }
                resolve();
              }
            },
            setStats: () => {},
            content: null
          });
        });
        
        // Store the generated content in our structured storage
        if (generatedContent) {
          const contentId = contentStorageService.storeTopicContent(topic.id, generatedContent);
        } else {
          console.warn(`⚠️ No content generated for topic: ${topic.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to generate content for topic: ${topic.name}`, error);
        // Continue with next topic even if one fails
      }
      
      // Update progress
      processedCount++;
      const progressPercentage = Math.floor((processedCount / topicsList.length) * 100);
      setGenerationProgress(progressPercentage);
    }
    
    // 5. Final progress check and completion
    const finalProgress = contentStorageService.getCourseProgress(courseId);
    
    if (finalProgress.isComplete) {
      setLoadingStatus('All topics are ready! Click on a topic to start learning.');
      setGenerationProgress(100); // Ensure progress is set to 100% when complete
    } else {
      setLoadingStatus(`${finalProgress.generated}/${finalProgress.total} topics ready. Some content generation may have failed.`);
      // Set progress based on actual completion percentage
      const completionPercentage = Math.floor((finalProgress.generated / finalProgress.total) * 100);
      setGenerationProgress(completionPercentage);
    }
    
    return { 
      success: true, 
      courseId, 
      progress: finalProgress, 
      message: 'Batch generation completed' 
    };
    
  } catch (error) {
    console.error('❌ Batch generation failed:', error);
    setLoadingStatus('Content generation failed. Please try again.');
    return { success: false, message: error.message };
  } finally {
    setIsGenerating(false);
  }
};

/**
 * Check if a topic's content is already generated and stored
 * @param {String} topicName - Topic name
 * @param {String} courseTitle - Course title
 * @returns {Boolean} - True if content exists
 */
export const isTopicContentGenerated = (topicName, courseTitle) => {
  if (!topicName || !courseTitle) return false;
  
  const course = contentStorageService.getCourseByTitle(courseTitle);
  if (!course) return false;
  
  const content = contentStorageService.getContentByTopicName(topicName, course.id);
  return !!content;
};

/**
 * Get stored content for a topic
 * @param {String} topicName - Topic name
 * @param {String} courseTitle - Course title
 * @returns {Object|null} - Stored content or null
 */
export const getStoredTopicContent = (topicName, courseTitle, courseId = null) => {
  if (!topicName || !courseTitle) return null;
  
  // CRITICAL: If courseId is provided, use it directly to avoid wrong course lookup
  let targetCourseId = courseId;
  
  if (!targetCourseId) {
    // Fallback: find course by title, but this could return wrong course if duplicates exist
    const course = contentStorageService.getCourseByTitle(courseTitle);
    if (!course) return null;
    targetCourseId = course.id;
  }
  
  
  return contentStorageService.getContentByTopicName(topicName, targetCourseId);
};

/**
 * Get generation progress details for a course
 * @param {String} courseTitle - Course title
 * @returns {Object} - Progress details
 */
export const getGenerationProgress = (courseTitle) => {
  if (!courseTitle) {
    return { percentage: 0, generated: 0, total: 0, isComplete: false };
  }
  
  const course = contentStorageService.getCourseByTitle(courseTitle);
  if (!course) {
    return { percentage: 0, generated: 0, total: 0, isComplete: false };
  }
  
  return contentStorageService.getCourseProgress(course.id);
};

/**
 * Get all topics for a course with their content status
 * @param {String} courseTitle - Course title
 * @returns {Array} - Array of topics with content status
 */
export const getCourseTopicsWithStatus = (courseTitle) => {
  if (!courseTitle) return [];
  
  const course = contentStorageService.getCourseByTitle(courseTitle);
  if (!course) return [];
  
  const topics = contentStorageService.getTopicsForCourse(course.id);
  return topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    isActive: topic.isActive,
    isCompleted: topic.isCompleted,
    hasContent: topic.contentGenerated,
    contentId: topic.contentId
  }));
};

/**
 * Initialize course and topics in storage (call this when course is created)
 * @param {String} courseTitle - Course title
 * @param {Array} topicsList - List of topics
 * @returns {Object} - Course and topic IDs
 */
export const initializeCourseStorage = (courseTitle, topicsList) => {
  if (!courseTitle || !topicsList || topicsList.length === 0) {
    return { success: false, message: 'Invalid course data' };
  }

  try {
    // Create or get existing course
    let course = contentStorageService.getCourseByTitle(courseTitle);
    let courseId;
    
    if (!course) {
      courseId = contentStorageService.storeCourse({
        title: courseTitle,
        description: `AI-generated course: ${courseTitle}`
      });
    } else {
      courseId = course.id;
    }

    // Store topics
    const topicIds = contentStorageService.storeTopics(courseId, topicsList);
    
    return { 
      success: true, 
      courseId, 
      topicIds, 
      message: 'Course initialized successfully' 
    };
  } catch (error) {
    console.error('❌ Failed to initialize course storage:', error);
    return { success: false, message: error.message };
  }
};
