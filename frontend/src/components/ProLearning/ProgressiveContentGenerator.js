// ProgressiveContentGenerator.js
// Handles progressive generation of content - generating and displaying one tab at a time for each topic

import { 
  generateReadingContent,
  generateSummaryContent,
  generateVideosContent,
  generateQuizContent,
  generateResourcesContent
} from './services/index.js';
import contentStorageService from '../../services/ContentStorageService.js';
import logger from '../../utils/logger';

/**
 * Progressive content generator that generates content one tab at a time
 * Order: Reading -> Summary -> Videos -> Quiz -> Resources for each topic
 * Then moves to next topic and repeats the cycle
 */
export class ProgressiveContentGenerator {
  constructor() {
    this.isGenerating = false;
    this.currentTopic = 0;
    this.currentTab = 0;
    this.topics = [];
    this.courseId = null;
    this.courseTitle = null;
    this.callbacks = {};
    
    // Tab generation order
    this.tabOrder = [
      { id: 'reading', name: 'Reading', generator: generateReadingContent },
      { id: 'summary', name: 'Summary', generator: generateSummaryContent },
      { id: 'videos', name: 'Videos', generator: generateVideosContent },
      { id: 'quiz', name: 'Quiz', generator: generateQuizContent },
      { id: 'resources', name: 'Resources', generator: generateResourcesContent }
    ];
  }

  /**
   * Initialize progressive generation for a course
   */
  async initializeGeneration(courseTitle, topicsList, callbacks = {}, options = {}) {
    if (this.isGenerating) {
      logger.warn('⚠️ Generation already in progress');
      return { success: false, message: 'Generation already in progress' };
    }

    this.courseTitle = courseTitle;
    this.topics = topicsList || [];
    this.callbacks = {
      onProgress: callbacks.onProgress || (() => {}),
      onContentUpdate: callbacks.onContentUpdate || (() => {}),
      onTabComplete: callbacks.onTabComplete || (() => {}),
      onTopicComplete: callbacks.onTopicComplete || (() => {}),
      onAllComplete: callbacks.onAllComplete || (() => {}),
      onError: callbacks.onError || (() => {})
    };

    // Initialize course context
    // If caller provides a courseId, prefer that to avoid picking an older course by title
    if (options && options.courseId) {
      this.courseId = options.courseId;
    } else {
      // Fallback to title-based lookup (may return an older course if titles clash)
      let course = contentStorageService.getCourseByTitle(courseTitle);
      if (!course) {
        this.courseId = contentStorageService.storeCourse({
          title: courseTitle,
          description: `AI-generated course: ${courseTitle}`
        });
      } else {
        this.courseId = course.id;
      }
    }

  // Store topics
    contentStorageService.storeTopics(this.courseId, this.topics);

    return { success: true, courseId: this.courseId };
  }

  /**
   * Start progressive generation
   */
  async startProgressiveGeneration() {
    if (this.isGenerating) {
      logger.warn('⚠️ Generation already in progress');
      return;
    }

    if (!this.topics || this.topics.length === 0) {
      logger.error('❌ No topics to generate');
      this.callbacks.onError('No topics to generate');
      return;
    }

    this.isGenerating = true;
    this.currentTopic = 0;
    this.currentTab = 0;

    // Starting progressive content generation...
    // Topics: this.topics.length, Tabs per topic: this.tabOrder.length

    try {
      await this.generateNextTabContent();
    } catch (error) {
      logger.error('❌ Progressive generation failed:', error);
      this.callbacks.onError(error.message);
      this.isGenerating = false;
    }
  }

  /**
   * Generate content for the next tab in sequence
   */
  async generateNextTabContent() {
    if (!this.isGenerating || this.currentTopic >= this.topics.length) {
      // All content generated
      this.isGenerating = false;
      logger.log('🔥 PROG GEN DEBUG: Calling onAllComplete callback!');
      this.callbacks.onAllComplete();
      logger.log('🔥 PROG GEN DEBUG: onAllComplete callback finished');
      // All progressive content generation completed!
      return;
    }

    const topic = this.topics[this.currentTopic];
    const tab = this.tabOrder[this.currentTab];
    
    // Generating tab.name for topic (progress info)

    // Calculate overall progress
    const totalTabs = this.topics.length * this.tabOrder.length;
    const completedTabs = this.currentTopic * this.tabOrder.length + this.currentTab;
    const progressPercentage = Math.round((completedTabs / totalTabs) * 100);

    // Notify progress
    this.callbacks.onProgress({
      topic: topic.name || topic,
      tabType: tab.id,
      tabName: tab.name,
      topicIndex: this.currentTopic,
      tabIndex: this.currentTab,
      totalTopics: this.topics.length,
      totalTabs: this.tabOrder.length,
      overallProgress: progressPercentage,
      completedTabs,
      totalTabs
    });

    try {
      // Generate content for current tab
      const generatedContent = await this.generateTabContent(topic, tab);
      
      // Store the content for this specific tab
      await this.storeTabContent(topic, tab.id, generatedContent);

      // Notify tab completion
      this.callbacks.onTabComplete({
        topic: topic.name || topic,
        tabType: tab.id,
        tabName: tab.name,
        content: generatedContent,
        topicIndex: this.currentTopic,
        tabIndex: this.currentTab
      });

      // Move to next tab/topic
      this.currentTab++;
      
      if (this.currentTab >= this.tabOrder.length) {
        // Completed all tabs for current topic
        this.currentTab = 0;
        this.currentTopic++;
        
        // Notify topic completion
        this.callbacks.onTopicComplete({
          topic: topic.name || topic,
          topicIndex: this.currentTopic - 1,
          totalTopics: this.topics.length
        });
      }

      // Generate next tab content
      setTimeout(() => {
        this.generateNextTabContent();
      }, 1000); // Small delay between generations

    } catch (error) {
  logger.error(`❌ Failed to generate ${tab.name} for ${topic.name || topic}:`, error);
      
      // Continue with next tab even if current one fails
      this.currentTab++;
      if (this.currentTab >= this.tabOrder.length) {
        this.currentTab = 0;
        this.currentTopic++;
      }
      
      // Continue generation despite error
      setTimeout(() => {
        this.generateNextTabContent();
      }, 1000);
    }
  }

  /**
   * Generate content for a specific tab
   */
  async generateTabContent(topic, tab) {
    const topicName = topic.name || topic;
    
    return new Promise(async (resolve, reject) => {
      let timeoutId;
      let resolved = false;

      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Timeout generating ${tab.name} for ${topicName}`));
        }
      }, 90000); // Increased to 90s for long streams

      // Create content setter that captures the generated content
      // We use this to capture the FINAL state if the generator doesn't return it
      let lastCapturedContent = {};
      
      const setContent = (newContent) => {
          let content;
          if (typeof newContent === 'function') {
            content = newContent(lastCapturedContent || {});
          } else {
            content = newContent;
          }
          lastCapturedContent = content;
          
          // Notify listener of content update (for streaming)
          if (this.callbacks.onContentUpdate) {
              this.callbacks.onContentUpdate({
                  topic: topicName,
                  tabType: tab.id,
                  content: lastCapturedContent
              });
          }
      };

      // Generate content based on tab type
      try {
        let result;
        switch (tab.id) {
          case 'reading':
            result = await tab.generator(topicName, setContent);
            break;
          case 'summary':
            // For summary, we need existing reading content
            const existingContent = this.getExistingTopicContent(topicName);
            const readingContent = existingContent?.reading || '';
            result = await tab.generator(setContent, topicName, readingContent);
            break;
          case 'videos':
            result = await tab.generator(setContent, topicName);
            break;
          case 'quiz':
            // For quiz, we need existing reading content
            const existingContentForQuiz = this.getExistingTopicContent(topicName);
            const readingContentForQuiz = existingContentForQuiz?.reading || '';
            result = await tab.generator(setContent, topicName, readingContentForQuiz);
            break;
          case 'resources':
            result = await tab.generator(setContent, topicName);
            break;
          default:
            throw new Error(`Unknown tab type: ${tab.id}`);
        }
        
        if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            
            // If generator returned a value, use it (Reading/Summary now do)
            if (result) {
                resolve(result);
                return;
            }
            
            // Fallback to last captured content from setContent
            if (lastCapturedContent) {
                let tabContent;
                switch (tab.id) {
                    case 'reading': tabContent = lastCapturedContent.reading || ''; break;
                    case 'summary': tabContent = lastCapturedContent.summary || ''; break;
                    case 'videos': tabContent = lastCapturedContent.videos || []; break;
                    case 'quiz': tabContent = lastCapturedContent.quiz || []; break;
                    case 'resources': 
                        // For resources, preserve both the array AND metadata
                        console.log('🔍 [PROG GEN] Raw content passed to extraction:', {
                            hasContent: !!lastCapturedContent,
                            contentKeys: lastCapturedContent ? Object.keys(lastCapturedContent) : [],
                            hasResources: 'resources' in (lastCapturedContent || {}),
                            hasResourcesMetadata: 'resourcesMetadata' in (lastCapturedContent || {}),
                            resourcesType: typeof lastCapturedContent?.resources,
                            resourcesMetadataType: typeof lastCapturedContent?.resourcesMetadata,
                            resourcesMetadataValue: lastCapturedContent?.resourcesMetadata
                        });
                        tabContent = {
                            resources: lastCapturedContent.resources || [],
                            resourcesMetadata: lastCapturedContent.resourcesMetadata || null
                        };
                        break;
                    default: tabContent = lastCapturedContent;
                }
                resolve(tabContent);
            } else {
                // If neither returned nor captured, resolve with empty/default
                resolve(tab.id === 'videos' || tab.id === 'quiz' || tab.id === 'resources' ? [] : '');
            }
        }
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      }
    });
  }

  /**
   * Store content for a specific tab
   */
  async storeTabContent(topic, tabType, content) {
  const topicName = topic.name || topic;
  logger.log('💾 PROG GEN DEBUG: Storing tab content:', { topicName, tabType, courseId: this.courseId, contentLength: typeof content === 'string' ? content.length : (Array.isArray(content) ? content.length : 'object') });
  
  // Debug: Log what we received for resources
  if (tabType === 'resources') {
    console.log('🔍 [PROG GEN] Received resources content:', {
      type: typeof content,
      isArray: Array.isArray(content),
      isObject: content && typeof content === 'object' && !Array.isArray(content),
      hasResourcesKey: content && 'resources' in content,
      hasMetadataKey: content && 'resourcesMetadata' in content,
      keys: content ? Object.keys(content) : [],
      resourcesLength: Array.isArray(content) ? content.length : (content?.resources?.length || 0),
      metadata: content?.resourcesMetadata || 'none'
    });
  }
    
    // Get existing content for this topic
    let existingContent = this.getExistingTopicContent(topicName) || {
      reading: '',
      summary: '',
      videos: [],
      quiz: [],
      resources: [],
      metadata: {}
    };

    // Handle resources specially to preserve metadata
    if (tabType === 'resources' && content && typeof content === 'object' && !Array.isArray(content)) {
      // Content is {resources: [...], resourcesMetadata: {...}}
      existingContent.resources = content.resources || [];
      existingContent.resourcesMetadata = content.resourcesMetadata || null;
      console.log('💾 [PROG GEN] Storing resources with metadata:', {
        topicName,
        resourcesCount: existingContent.resources.length,
        hasMetadata: !!existingContent.resourcesMetadata,
        generatedAt: existingContent.resourcesMetadata?.generatedAt
      });
    } else {
      // Normal tab content (string or array)
      existingContent[tabType] = content;
      console.log('💾 [PROG GEN] Storing normal tab content:', {
        topicName,
        tabType,
        contentType: typeof content,
        isArray: Array.isArray(content)
      });
    }
    
    existingContent.metadata = {
      ...existingContent.metadata,
      [`${tabType}Generated`]: true,
      [`${tabType}GeneratedAt`]: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Find existing topic first - try multiple approaches
    let topicData = null;
    
    // Approach 1: Look in current course topics
    const courseTopics = contentStorageService.getTopicsForCourse(this.courseId);
    topicData = courseTopics.find(t => t.name === topicName);
    
    // Approach 2: Direct lookup by name and course
    if (!topicData) {
      topicData = contentStorageService.getTopicByName(topicName, this.courseId);
    }
    
    // Approach 3: Only create if absolutely necessary
    if (!topicData) {
      logger.log('⚠️ PROG GEN DEBUG: Topic not found, creating new topic for:', topicName);
      const topicId = contentStorageService.createTopic(topicName, this.courseId);
      topicData = { id: topicId, name: topicName };
    } else {
      logger.log('✅ PROG GEN DEBUG: Using existing topic:', topicData.id, 'for:', topicName);
    }
    
    logger.log('💾 PROG GEN DEBUG: Storing content for topic ID:', topicData.id);
    const contentId = contentStorageService.storeTopicContent(topicData.id, existingContent);
    logger.log('💾 PROG GEN DEBUG: Content stored with ID:', contentId);

    // Verify storage worked
  const verifyContent = contentStorageService.getContentByTopicName(topicName, this.courseId);
  logger.log('✅ PROG GEN DEBUG: Verification - content retrieved:', !!verifyContent, verifyContent ? `has ${tabType}: ${!!(verifyContent[tabType])}` : 'none');

    return existingContent;
  }

  /**
   * Get existing content for a topic
   */
  getExistingTopicContent(topicName) {
  // Ensure we always have a valid courseId on reloads before looking up content
  if (!this.courseId) {
    try {
      // 1) Prefer currentCourseId persisted by the app
      const fallbackId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentCourseId') : null;
      if (fallbackId) {
        this.courseId = fallbackId;
      }
    } catch {}
  }

  if (!this.courseId && this.courseTitle) {
    // 2) Fallback to course lookup by title (best-effort)
    const course = contentStorageService.getCourseByTitle(this.courseTitle);
    if (course?.id) this.courseId = course.id;
  }

  logger.log('🔍 PROG GEN DEBUG: getExistingTopicContent', topicName, 'courseId:', this.courseId);
  return contentStorageService.getContentByTopicName(topicName, this.courseId);
  }

  /**
   * Stop progressive generation
   */
  stopGeneration() {
    this.isGenerating = false;
    logger.log('🛑 Progressive generation stopped');
  }

  /**
   * Get current generation status
   */
  getStatus() {
    return {
      isGenerating: this.isGenerating,
      currentTopic: this.currentTopic,
      currentTab: this.currentTab,
      topicsCount: this.topics.length,
      tabsCount: this.tabOrder.length
    };
  }

  /**
   * Check if a specific tab content is available for a topic
   */
  isTabContentAvailable(topicName, tabType) {
    const content = this.getExistingTopicContent(topicName);
    if (!content) return false;
    
    switch (tabType) {
      case 'reading':
        return !!(content.reading && content.reading.trim());
      case 'summary':
        return !!(content.summary && content.summary.trim());
      case 'videos':
        return !!(content.videos && content.videos.length > 0);
      case 'quiz':
        return !!(content.quiz && content.quiz.length > 0);
      case 'resources':
        return !!(content.resources && content.resources.length > 0);
      default:
        return false;
    }
  }

  /**
   * Get available tabs for a topic
   */
  getAvailableTabsForTopic(topicName) {
    const availableTabs = [];
    
    for (const tab of this.tabOrder) {
      if (this.isTabContentAvailable(topicName, tab.id)) {
        availableTabs.push(tab.id);
      }
    }
    
    return availableTabs;
  }
}

// Create a singleton instance
const progressiveContentGenerator = new ProgressiveContentGenerator();

export default progressiveContentGenerator;

// Export utility functions
export const initializeProgressiveGeneration = (courseTitle, topicsList, callbacks, options) => {
  return progressiveContentGenerator.initializeGeneration(courseTitle, topicsList, callbacks, options);
};

export const startProgressiveGeneration = () => {
  return progressiveContentGenerator.startProgressiveGeneration();
};

export const stopProgressiveGeneration = () => {
  return progressiveContentGenerator.stopGeneration();
};

export const getProgressiveGenerationStatus = () => {
  return progressiveContentGenerator.getStatus();
};

export const isTabContentAvailable = (topicName, tabType) => {
  return progressiveContentGenerator.isTabContentAvailable(topicName, tabType);
};

export const getAvailableTabsForTopic = (topicName) => {
  return progressiveContentGenerator.getAvailableTabsForTopic(topicName);
};

export const getProgressiveTopicContent = (topicName) => {
  return progressiveContentGenerator.getExistingTopicContent(topicName);
};
