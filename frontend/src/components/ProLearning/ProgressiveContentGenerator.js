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
  async initializeGeneration(courseTitle, topicsList, callbacks = {}) {
    if (this.isGenerating) {
      console.warn('⚠️ Generation already in progress');
      return { success: false, message: 'Generation already in progress' };
    }

    this.courseTitle = courseTitle;
    this.topics = topicsList || [];
    this.callbacks = {
      onProgress: callbacks.onProgress || (() => {}),
      onTabComplete: callbacks.onTabComplete || (() => {}),
      onTopicComplete: callbacks.onTopicComplete || (() => {}),
      onAllComplete: callbacks.onAllComplete || (() => {}),
      onError: callbacks.onError || (() => {})
    };

    // Initialize course storage
    let course = contentStorageService.getCourseByTitle(courseTitle);
    if (!course) {
      this.courseId = contentStorageService.storeCourse({
        title: courseTitle,
        description: `AI-generated course: ${courseTitle}`
      });
    } else {
      this.courseId = course.id;
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
      console.warn('⚠️ Generation already in progress');
      return;
    }

    if (!this.topics || this.topics.length === 0) {
      console.error('❌ No topics to generate');
      this.callbacks.onError('No topics to generate');
      return;
    }

    this.isGenerating = true;
    this.currentTopic = 0;
    this.currentTab = 0;

    console.log('🚀 Starting progressive content generation...');
    console.log(`📚 Topics: ${this.topics.length}, Tabs per topic: ${this.tabOrder.length}`);

    try {
      await this.generateNextTabContent();
    } catch (error) {
      console.error('❌ Progressive generation failed:', error);
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
      this.callbacks.onAllComplete();
      console.log('🎉 All progressive content generation completed!');
      return;
    }

    const topic = this.topics[this.currentTopic];
    const tab = this.tabOrder[this.currentTab];
    
    console.log(`🔄 Generating ${tab.name} for ${topic.name || topic} (Topic ${this.currentTopic + 1}/${this.topics.length}, Tab ${this.currentTab + 1}/${this.tabOrder.length})`);

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
      console.error(`❌ Failed to generate ${tab.name} for ${topic.name || topic}:`, error);
      
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
    
    return new Promise((resolve, reject) => {
      let timeoutId;
      let resolved = false;

      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Timeout generating ${tab.name} for ${topicName}`));
        }
      }, 45000); // 45 second timeout

      // Create content setter that captures the generated content
      const setContent = (newContent) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          
          let content;
          if (typeof newContent === 'function') {
            // If it's a function, call it with empty object
            content = newContent({});
          } else {
            content = newContent;
          }
          
          // Extract the specific tab content
          let tabContent;
          switch (tab.id) {
            case 'reading':
              tabContent = content.reading || '';
              break;
            case 'summary':
              tabContent = content.summary || '';
              break;
            case 'videos':
              tabContent = content.videos || [];
              break;
            case 'quiz':
              tabContent = content.quiz || [];
              break;
            case 'resources':
              tabContent = content.resources || [];
              break;
            default:
              tabContent = content;
          }
          
          resolve(tabContent);
        }
      };

      // Generate content based on tab type
      try {
        switch (tab.id) {
          case 'reading':
            tab.generator(topicName, setContent);
            break;
          case 'summary':
            // For summary, we need existing reading content
            const existingContent = this.getExistingTopicContent(topicName);
            const readingContent = existingContent?.reading || '';
            tab.generator(setContent, topicName, readingContent);
            break;
          case 'videos':
            tab.generator(setContent, topicName);
            break;
          case 'quiz':
            // For quiz, we need existing reading content
            const existingContentForQuiz = this.getExistingTopicContent(topicName);
            const readingContentForQuiz = existingContentForQuiz?.reading || '';
            tab.generator(setContent, topicName, readingContentForQuiz);
            break;
          case 'resources':
            tab.generator(setContent, topicName);
            break;
          default:
            reject(new Error(`Unknown tab type: ${tab.id}`));
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
    
    // Get existing content for this topic
    let existingContent = this.getExistingTopicContent(topicName) || {
      reading: '',
      summary: '',
      videos: [],
      quiz: [],
      resources: [],
      metadata: {}
    };

    // Update the specific tab content
    existingContent[tabType] = content;
    existingContent.metadata = {
      ...existingContent.metadata,
      [`${tabType}Generated`]: true,
      [`${tabType}GeneratedAt`]: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Store the updated content
    const topicData = contentStorageService.getTopicsForCourse(this.courseId)
      .find(t => t.name === topicName);
    
    if (topicData) {
      contentStorageService.storeTopicContent(topicData.id, existingContent);
    }

    return existingContent;
  }

  /**
   * Get existing content for a topic
   */
  getExistingTopicContent(topicName) {
    return contentStorageService.getContentByTopicName(topicName, this.courseId);
  }

  /**
   * Stop progressive generation
   */
  stopGeneration() {
    this.isGenerating = false;
    console.log('🛑 Progressive generation stopped');
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
export const initializeProgressiveGeneration = (courseTitle, topicsList, callbacks) => {
  return progressiveContentGenerator.initializeGeneration(courseTitle, topicsList, callbacks);
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
