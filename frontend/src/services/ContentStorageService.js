// ContentStorageService.js
// Database-like content storage service for Pro Learning system
// This will be easily replaceable with actual database calls later

class ContentStorageService {
  constructor() {
    // In-memory storage that simulates database tables
    this.storage = {
      courses: new Map(),      // courseId -> course data
      topics: new Map(),       // topicId -> topic data
      contents: new Map(),     // contentId -> content data
      metadata: new Map()      // general metadata storage
    };
    
    // Initialize from localStorage if available
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
    
    console.log('💾 Course stored:', courseId, course.title);
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
    });

    // Update course with topic IDs
    const course = this.storage.courses.get(courseId);
    if (course) {
      course.topicIds = topicIds;
      course.updatedAt = new Date().toISOString();
      this.storage.courses.set(courseId, course);
    }

    this.persistToStorage();
    console.log('💾 Topics stored for course:', courseId, topicIds.length, 'topics');
    return topicIds;
  }

  /**
   * Get topics for a course
   * @param {String} courseId - Course ID
   * @returns {Array} - Array of topic data
   */
  getTopicsForCourse(courseId) {
    const course = this.storage.courses.get(courseId);
    if (!course) return [];

    return course.topicIds.map(topicId => 
      this.storage.topics.get(topicId)
    ).filter(Boolean);
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
    console.log('💾 Single topic created:', topicId, topicName);
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
    const contentId = this.generateId('content');
    const content = {
      id: contentId,
      topicId: topicId,
      
      // Main content sections
      reading: contentData.reading || null,
      summary: contentData.summary || null,
      videos: contentData.videos || [],
      quiz: contentData.quiz || null,
      resources: contentData.resources || [],
      
      // Metadata
      generatedAt: new Date().toISOString(),
      generationMethod: 'ai_batch',
      version: '1.0',
      
      // Statistics
      stats: contentData.stats || {},
      
      // Status flags
      isComplete: true,
      hasReading: !!(contentData.reading),
      hasSummary: !!(contentData.summary),
      hasVideos: !!(contentData.videos && contentData.videos.length > 0),
      hasQuiz: !!(contentData.quiz),
      hasResources: !!(contentData.resources && contentData.resources.length > 0)
    };

    this.storage.contents.set(contentId, content);

    // Update topic to reference this content
    const topic = this.storage.topics.get(topicId);
    if (topic) {
      topic.contentGenerated = true;
      topic.contentId = contentId;
      topic.updatedAt = new Date().toISOString();
      this.storage.topics.set(topicId, topic);
      
      // ALSO store content under courseId + topicName key for easy retrieval
      const lookupKey = `${topic.courseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      this.storage.contents.set(lookupKey, content);
      console.log('💾 Content also stored under lookup key:', lookupKey);
    }

    this.persistToStorage();
    console.log('💾 Content stored for topic:', topicId, 'Content ID:', contentId);
    return contentId;
  }

  /**
   * Get content for a topic
   * @param {String} topicId - Topic ID
   * @returns {Object|null} - Content data or null
   */
  getTopicContent(topicId) {
    const topic = this.storage.topics.get(topicId);
    if (!topic || !topic.contentId) {
      console.log('🔧 ContentStorageService: No topic or contentId found:', { topicId, topic: !!topic, contentId: topic?.contentId });
      return null;
    }

    const content = this.storage.contents.get(topic.contentId);
    console.log('🔧 ContentStorageService: Retrieved content for topic:', topicId, {
      hasContent: !!content,
      contentKeys: content ? Object.keys(content) : 'NO_CONTENT',
      readingExists: !!content?.reading,
      readingLength: content?.reading?.length || 0,
      readingType: typeof content?.reading,
      readingPreview: content?.reading ? content.reading.substring(0, 100) + '...' : 'NO_READING'
    });
    
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
   * Merge partial content into existing topic content (for incremental generation)
   * @param {String} topicId - Topic ID
   * @param {Object} partialContent - Partial content to merge (e.g., { reading: "..." })
   * @returns {String|null} - Content ID or null if failed
   */
  mergeTopicContent(topicId, partialContent) {
    console.log('🔄 Merging partial content for topic:', topicId, 'Keys:', Object.keys(partialContent));
    
    // Get existing content or create new structure
    let existingContent = this.getTopicContent(topicId);
    let contentId;
    
    if (existingContent) {
      // Update existing content
      contentId = existingContent.id;
      const updatedContent = {
        ...existingContent,
        ...partialContent,
        updatedAt: new Date().toISOString()
      };
      
      this.storage.contents.set(contentId, updatedContent);
      console.log('🔄 Updated existing content:', contentId);
    } else {
      // Create new content entry
      contentId = this.storeTopicContent(topicId, partialContent);
      console.log('🔄 Created new content:', contentId);
    }
    
    // Also update the lookup key for ProContentManager compatibility
    const topic = this.storage.topics.get(topicId);
    if (topic) {
      const lookupKey = `${topic.courseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const updatedContent = this.storage.contents.get(contentId);
      this.storage.contents.set(lookupKey, updatedContent);
      console.log('🔄 Updated lookup key:', lookupKey);
    }
    
    this.persistToStorage();
    console.log('💾 Partial content merged and stored for topic:', topicId);
    return contentId;
  }

  /**
   * Get content by topic name and course (for backwards compatibility)
   * @param {String} topicName - Topic name
   * @param {String} courseId - Course ID
   * @returns {Object|null} - Content data or null
   */
  getContentByTopicName(topicName, courseId) {
    const topic = this.getTopicByName(topicName, courseId);
    if (!topic) return null;
    
    return this.getTopicContent(topic.id);
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

    console.log('💾 Batch content storage completed:', results);
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
   * Save storage to localStorage
   */
  persistToStorage() {
    try {
      const storageData = {
        courses: Object.fromEntries(this.storage.courses),
        topics: Object.fromEntries(this.storage.topics),
        contents: Object.fromEntries(this.storage.contents),
        metadata: Object.fromEntries(this.storage.metadata),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('proLearning_storage', JSON.stringify(storageData));
    } catch (error) {
      console.warn('Failed to persist storage:', error);
    }
  }

  /**
   * Load storage from localStorage
   */
  loadFromPersistence() {
    try {
      const savedData = localStorage.getItem('proLearning_storage');
      if (savedData) {
        const storageData = JSON.parse(savedData);
        
        this.storage.courses = new Map(Object.entries(storageData.courses || {}));
        this.storage.topics = new Map(Object.entries(storageData.topics || {}));
        this.storage.contents = new Map(Object.entries(storageData.contents || {}));
        this.storage.metadata = new Map(Object.entries(storageData.metadata || {}));
        
        console.log('💾 Storage loaded from persistence');
      }
    } catch (error) {
      console.warn('Failed to load storage from persistence:', error);
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
    console.log('🗑️ Storage cleared');
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
    console.log('💾 Storage imported successfully');
  }
}

// Create and export singleton instance
const contentStorageService = new ContentStorageService();
export default contentStorageService;

// Export class for testing/multiple instances
export { ContentStorageService };
