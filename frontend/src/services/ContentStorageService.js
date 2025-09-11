// ContentStorageService.js
// Database-like content storage service for Pro Learning system
// IndexedDB removed: using in-memory + localStorage only
import logger from '../utils/logger';

class ContentStorageService {
  constructor() {
    // In-memory storage that simulates database tables
    this.storage = {
      courses: new Map(),      // courseId -> course data
      topics: new Map(),       // topicId -> topic data
      contents: new Map(),     // contentId -> content data
      metadata: new Map()      // general metadata storage
    };
    
  // Initialize by loading from localStorage
  this.loadFromPersistence();
  }

  // ==================== COURSE MANAGEMENT ====================
  
  /**
   * Store course information
   * @param {Object} courseData - Course data object
   * @returns {String} - Generated course ID
   */
  storeCourse(courseData) {
    const courseId = this.generateId('course');
    const course = {
      id: courseId,
      title: courseData.title,
      description: courseData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      topicIds: []
    };
    
    this.storage.courses.set(courseId, course);
  this.persistToStorage();
    
    return courseId;
  }

  /**
   * Get course by ID
   * @param {String} courseId - Course ID
   * @returns {Object|null} - Course data or null
   */
  getCourse(courseId) {
    return this.storage.courses.get(courseId) || null;
  }

  /**
   * Get course by title (for current session compatibility)
   * @param {String} title - Course title
   * @returns {Object|null} - Course data or null
   */
  getCourseByTitle(title) {
    for (const [id, course] of this.storage.courses) {
      if (course.title === title) {
        return { ...course, id };
      }
    }
    return null;
  }

  // ==================== TOPIC MANAGEMENT ====================

  /**
   * Store topics for a course
   * @param {String} courseId - Course ID
   * @param {Array} topicsList - List of topics
   * @returns {Array} - Array of stored topic IDs
   */
  storeTopics(courseId, topicsList) {
  logger.log('📝 STORAGE DEBUG: Storing topics for course:', courseId);
    const topicIds = [];
    
    topicsList.forEach(topic => {
      const topicId = this.generateId('topic');
      const topicData = {
        id: topicId,
        courseId: courseId,
        name: topic.name,
        order: topic.id || topicIds.length,
        isActive: topic.isActive || false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        contentGenerated: false,
        contentId: null
      };
      
      this.storage.topics.set(topicId, topicData);
      topicIds.push(topicId);
  logger.log('📝 STORAGE DEBUG: Stored topic');
    });

    // Update course with topic IDs
    const course = this.storage.courses.get(courseId);
    if (course) {
      course.topicIds = topicIds;
      course.updatedAt = new Date().toISOString();
      this.storage.courses.set(courseId, course);
  logger.log('📝 STORAGE DEBUG: Course updated with topicIds');
    }

  this.persistToStorage();
    return topicIds;
  }

  /**
   * Get topics for a course
   * @param {String} courseId - Course ID
   * @returns {Array} - Array of topic data
   */
  getTopicsForCourse(courseId) {
    const course = this.storage.courses.get(courseId);
    if (!course) {
  logger.log('🔍 STORAGE DEBUG: Course not found for ID:', courseId);
      return [];
    }

    const topics = course.topicIds.map(topicId => 
      this.storage.topics.get(topicId)
    ).filter(Boolean);
    
    logger.log('🔍 STORAGE DEBUG: getTopicsForCourse result:', {
      courseId,
      topicIds: course.topicIds,
      foundTopics: topics.length,
      topicNames: topics.map(t => t.name)
    });
    
    return topics;
  }

  /**
   * Get topic by name and course
   * @param {String} topicName - Topic name
   * @param {String} courseId - Course ID
   * @returns {Object|null} - Topic data or null
   */
  getTopicByName(topicName, courseId) {
    for (const [id, topic] of this.storage.topics) {
      if (topic.name === topicName && topic.courseId === courseId) {
        return { ...topic, id };
      }
    }
    return null;
  }

  /**
   * Create a single topic for a course
   * @param {String} topicName - Topic name
   * @param {String} courseId - Course ID
   * @returns {String} - Topic ID
   */
  createTopic(topicName, courseId) {
    const topicId = this.generateId('topic');
    const topicData = {
      id: topicId,
      courseId: courseId,
      name: topicName,
      order: 0,
      isActive: true,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      contentGenerated: false,
      contentId: null
    };
    
    this.storage.topics.set(topicId, topicData);
    
    // Update course with the new topic ID
    const course = this.storage.courses.get(courseId);
    if (course) {
      course.topicIds = course.topicIds || [];
      course.topicIds.push(topicId);
      course.updatedAt = new Date().toISOString();
      this.storage.courses.set(courseId, course);
    }

  this.persistToStorage();
    return topicId;
  }

  // ==================== CONTENT MANAGEMENT ====================

  /**
   * Store generated content for a topic
   * @param {String} topicId - Topic ID
   * @param {Object} contentData - Generated content data
   * @returns {String} - Content ID
   */
  storeTopicContent(topicId, contentData) {
  logger.log('💾 STORAGE DEBUG: Storing content for topic ID:', topicId, 'contentData keys:', Object.keys(contentData || {}));
    const contentId = this.generateId('content');
    const isProgressive = !!(contentData && contentData.metadata);
    const content = {
      id: contentId,
      topicId: topicId,

      // Main content sections
      reading: contentData?.reading ?? null,
      summary: contentData?.summary ?? null,
      videos: Array.isArray(contentData?.videos) ? contentData.videos : (contentData?.videos ? contentData.videos : []),
      // Preserve quiz structure (array or object with questions)
      quiz: (Array.isArray(contentData?.quiz) || (contentData?.quiz && typeof contentData.quiz === 'object')) ? contentData.quiz : (contentData?.quiz ?? null),
      resources: Array.isArray(contentData?.resources) ? contentData.resources : (contentData?.resources ? contentData.resources : []),

      // Metadata (preserve progressive generation timestamps)
      metadata: contentData?.metadata ? { ...contentData.metadata } : undefined,
      generatedAt: (contentData?.metadata?.lastUpdated) || new Date().toISOString(),
      generationMethod: isProgressive ? 'ai_progressive' : 'ai_batch',
      version: '1.0',

      // Statistics
      stats: contentData?.stats || {},

      // Status flags
      isComplete: !!(
        (contentData?.reading && contentData?.summary) &&
        (Array.isArray(contentData?.videos) ? contentData.videos.length > 0 : false) &&
        ((Array.isArray(contentData?.quiz) ? contentData.quiz.length > 0 : (contentData?.quiz && Array.isArray(contentData.quiz.questions) && contentData.quiz.questions.length > 0))) &&
        (Array.isArray(contentData?.resources) ? contentData.resources.length > 0 : false)
      ),
      hasReading: !!(contentData?.reading),
      hasSummary: !!(contentData?.summary),
      hasVideos: !!(Array.isArray(contentData?.videos) && contentData.videos.length > 0),
      hasQuiz: !!(
        (Array.isArray(contentData?.quiz) && contentData.quiz.length > 0) ||
        (contentData?.quiz && Array.isArray(contentData.quiz.questions) && contentData.quiz.questions.length > 0)
      ),
      hasResources: !!(Array.isArray(contentData?.resources) && contentData.resources.length > 0)
    };

  this.storage.contents.set(contentId, content);
  logger.log('💾 STORAGE DEBUG: Content stored in contents map with ID:', contentId);

    // Update topic to reference this content
    const topic = this.storage.topics.get(topicId);
    if (topic) {
      topic.contentGenerated = true;
      topic.contentId = contentId;
      topic.updatedAt = new Date().toISOString();
  this.storage.topics.set(topicId, topic);
  logger.log('💾 STORAGE DEBUG: Topic updated with contentId:', contentId);

    // Persist changes asynchronously (best-effort)
    try { this.persistToStorage(); } catch {}
    } else {
      logger.error('❌ STORAGE DEBUG: Topic not found for ID:', topicId);
    }

    this.persistToStorage();
    return contentId;
  }

  /**
   * Remove content entry for a topic (by topicId)
   * @param {String} topicId - Topic ID
   */
  removeTopicContent(topicId) {
    // Find content by topicId
    let contentKeyToRemove = null;
    for (const [contentId, content] of this.storage.contents.entries()) {
      if (content.topicId === topicId) {
        contentKeyToRemove = contentId;
        break;
      }
    }
    if (contentKeyToRemove) {
      this.storage.contents.delete(contentKeyToRemove);
    }
    // Also update the topic linkage
    const topic = this.storage.topics.get(topicId);
    if (topic) {
      topic.contentGenerated = false;
      topic.contentId = null;
      topic.updatedAt = new Date().toISOString();
      this.storage.topics.set(topicId, topic);
    }
    this.persistToStorage();
  }

  /**
   * Remove a topic entirely from a course
   * @param {String} topicId - Topic ID
   */
  removeTopic(topicId) {
    // Remove associated content first
    this.removeTopicContent(topicId);
    // Remove topic record
    const topic = this.storage.topics.get(topicId);
    if (topic) {
      this.storage.topics.delete(topicId);
      // Remove from course.topicIds
      const course = this.storage.courses.get(topic.courseId);
      if (course) {
        course.topicIds = (course.topicIds || []).filter(id => id !== topicId);
        course.updatedAt = new Date().toISOString();
        this.storage.courses.set(topic.courseId, course);
      }
    }
    this.persistToStorage();
  }

  /**
   * Get content for a topic
   * @param {String} topicId - Topic ID
   * @returns {Object|null} - Content data or null
   */
  getTopicContent(topicId) {
    const topic = this.storage.topics.get(topicId);
    if (!topic || !topic.contentId) {
      return null;
    }

    const content = this.storage.contents.get(topic.contentId);
    
    return content ? { ...content } : null;
  }

  /**
   * Check if content exists for a topic
   * @param {String} topicId - Topic ID
   * @returns {Boolean} - True if content exists
   */
  hasTopicContent(topicId) {
    const topic = this.storage.topics.get(topicId);
    return !!(topic && topic.contentGenerated && topic.contentId);
  }

  /**
   * Get content by topic name and course (for backwards compatibility)
   * @param {String} topicName - Topic name
   * @param {String} courseId - Course ID
   * @returns {Object|null} - Content data or null
   */
  getContentByTopicName(topicName, courseId) {
  logger.log('🔍 STORAGE DEBUG: Looking for content - Topic:', topicName, 'Course:', courseId);
    const topic = this.getTopicByName(topicName, courseId);
  logger.log('🔍 STORAGE DEBUG: Found topic for', topicName, ':', !!topic, topic ? topic.id : 'none');
    if (!topic) return null;
    
    const content = this.getTopicContent(topic.id);
  logger.log('🔍 STORAGE DEBUG: Found content for topic', topicName, ':', !!content);
    return content;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Store content for multiple topics (batch operation)
   * @param {String} courseId - Course ID
   * @param {Object} batchContent - Object with topicName -> contentData mapping
   * @returns {Object} - Results summary
   */
  storeBatchContent(courseId, batchContent) {
    const results = {
      success: 0,
      failed: 0,
      contentIds: [],
      errors: []
    };

    Object.entries(batchContent).forEach(([topicName, contentData]) => {
      try {
        const topic = this.getTopicByName(topicName, courseId);
        if (topic) {
          const contentId = this.storeTopicContent(topic.id, contentData);
          results.contentIds.push({ topicName, contentId });
          results.success++;
        } else {
          results.errors.push(`Topic not found: ${topicName}`);
          results.failed++;
        }
      } catch (error) {
        results.errors.push(`Failed to store content for ${topicName}: ${error.message}`);
        results.failed++;
      }
    });

    // Batch content storage completed
    return results;
  }

  /**
   * Get generation progress for a course
   * @param {String} courseId - Course ID
   * @returns {Object} - Progress information
   */
  getCourseProgress(courseId) {
    const topics = this.getTopicsForCourse(courseId);
    const totalTopics = topics.length;
    const generatedTopics = topics.filter(topic => topic.contentGenerated).length;
    
    return {
      total: totalTopics,
      generated: generatedTopics,
      percentage: totalTopics > 0 ? Math.floor((generatedTopics / totalTopics) * 100) : 0,
      remaining: totalTopics - generatedTopics,
      isComplete: generatedTopics === totalTopics && totalTopics > 0
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique ID
   * @param {String} prefix - ID prefix
   * @returns {String} - Generated ID
   */
  generateId(prefix = 'id') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Persist storage to localStorage only (best-effort)
   */
  async persistToStorage() {
    try {
      if (typeof localStorage === 'undefined') return;
      const storageData = {
        courses: Object.fromEntries(this.storage.courses),
        topics: Object.fromEntries(this.storage.topics),
        contents: Object.fromEntries(this.storage.contents),
        metadata: Object.fromEntries(this.storage.metadata),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('proLearning_storage', JSON.stringify(storageData));
    } catch (error) {
  logger.warn('Failed to persist storage (localStorage):', error);
    }
  }

  /**
   * Load storage from localStorage only
   */
  async loadFromPersistence() {
    try {
      if (typeof localStorage === 'undefined') return;
      const saved = localStorage.getItem('proLearning_storage');
      const storageData = saved ? JSON.parse(saved) : null;
      if (storageData) {
        this.storage.courses = new Map(Object.entries(storageData.courses || {}));
        this.storage.topics = new Map(Object.entries(storageData.topics || {}));
        this.storage.contents = new Map(Object.entries(storageData.contents || {}));
        this.storage.metadata = new Map(Object.entries(storageData.metadata || {}));
      }
    } catch (error) {
  logger.warn('Failed to load storage (localStorage):', error);
    }
  }

  /**
   * Clear all storage (for testing/reset)
   */
  clearStorage() {
    this.storage.courses.clear();
    this.storage.topics.clear();
    this.storage.contents.clear();
    this.storage.metadata.clear();
    
  localStorage.removeItem('proLearning_storage');
  logger.log('🗑️ Storage cleared');
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage statistics
   */
  getStorageStats() {
    return {
      courses: this.storage.courses.size,
      topics: this.storage.topics.size,
      contents: this.storage.contents.size,
      metadata: this.storage.metadata.size,
      totalSize: this.storage.courses.size + this.storage.topics.size + this.storage.contents.size
    };
  }

  /**
   * Export storage data (for backup/migration)
   * @returns {Object} - Complete storage data
   */
  exportStorage() {
    return {
      courses: Object.fromEntries(this.storage.courses),
      topics: Object.fromEntries(this.storage.topics),
      contents: Object.fromEntries(this.storage.contents),
      metadata: Object.fromEntries(this.storage.metadata),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import storage data (for restore/migration)
   * @param {Object} storageData - Storage data to import
   */
  importStorage(storageData) {
    this.storage.courses = new Map(Object.entries(storageData.courses || {}));
    this.storage.topics = new Map(Object.entries(storageData.topics || {}));
    this.storage.contents = new Map(Object.entries(storageData.contents || {}));
    this.storage.metadata = new Map(Object.entries(storageData.metadata || {}));
    
  this.persistToStorage();
    // Storage imported successfully
  }
}

// Create and export singleton instance
const contentStorageService = new ContentStorageService();
export default contentStorageService;

// Export class for testing/multiple instances
export { ContentStorageService };
