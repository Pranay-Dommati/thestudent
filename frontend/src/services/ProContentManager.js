// ProContentManager.js
// Manages content retrieval and caching for Pro Learning system
// Acts as an interface between UI components and ContentStorageService

import contentStorageService from './ContentStorageService.js';

class ProContentManager {
  constructor() {
    this.currentCourse = null;
    this.currentCourseId = null;
    this.generationPromises = new Map(); // Track ongoing content generation
  }

  /**
   * Set the current course context
   * @param {String} courseTitle - Course title
   * @param {String} courseId - Course ID (optional, will search by title if not provided)
   */
  setCourse(courseTitle, courseId = null) {
    this.currentCourse = courseTitle;
    
    if (courseId) {
      this.currentCourseId = courseId;
    } else {
      const course = contentStorageService.getCourseByTitle(courseTitle);
      this.currentCourseId = course ? course.id : null;
    }
  }

  /**
   * Get content for a topic, prioritizing stored content over generation
   * @param {String} topicName - Topic name
   * @param {Function} generateCallback - Fallback generation function
   * @returns {Promise<Object>} - Content object
   */
  async getTopicContent(topicName, generateCallback = null) {
    if (!this.currentCourse || !this.currentCourseId) {
      throw new Error('No course context set. Call setCourse() first.');
    }

    const generationKey = `${this.currentCourseId}_${topicName}`;

    // Check if generation is already in progress for this topic
    if (this.generationPromises.has(generationKey)) {
      console.log('🔄 Content generation already in progress for:', topicName);
      return this.generationPromises.get(generationKey);
    }

    // Create a new promise for this generation request
    const contentPromise = (async () => {
      try {
        // Check for valid stored content first
        const storedContent = contentStorageService.getContentByTopicName(topicName, this.currentCourseId);
        if (storedContent?.reading?.length > 0) {
          console.log('📦 Using stored content for:', topicName);
          return {
            source: 'storage',
            content: storedContent,
            fromCache: true
          };
        }

        // If no valid content and no generator, return null
        if (!generateCallback) {
          return null;
        }

        // Start content generation
        console.log('🚀 Starting content generation for:', topicName);
        const generatedContent = await new Promise((resolve, reject) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              reject(new Error('Content generation timeout'));
            }
          }, 30000);

          generateCallback({
            topic: topicName,
            setIsLoading: () => {},
            setLoadingProgress: () => {},
            setShowSkeletons: () => {},
            setLoadingStep: () => {},
            setContent: (newContent) => {
              if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                
                // Ensure we have a proper content object
                const content = typeof newContent === 'function' ? newContent({}) : newContent;
                
                // Validate generated content
                if (!content || !content.reading || content.reading.length === 0) {
                  reject(new Error('Generated content validation failed'));
                  return;
                }
                
                resolve(content);
              }
            },
            setStats: () => {},
            content: null
          });
        });

        // Once content is generated, store it atomically
        console.log('✅ Content generated successfully for:', topicName);
        
        // Find or create topic
        let topic = contentStorageService.getTopicByName(topicName, this.currentCourseId);
        if (!topic) {
          const topicId = contentStorageService.createTopic(topicName, this.currentCourseId);
          topic = { id: topicId, name: topicName };
          console.log('📝 Created new topic:', topicId);
        }
        
        // Store the content
        if (topic) {
          contentStorageService.storeTopicContent(topic.id, generatedContent);
          console.log('💾 Content stored successfully for:', topicName);
          
          // Verify storage worked
          const storedContent = contentStorageService.getTopicContent(topic.id);
          if (!storedContent?.reading) {
            throw new Error('Content storage verification failed');
          }
        }
        
        return {
          source: 'generated',
          content: generatedContent,
          fromCache: false
        };

      } catch (error) {
        console.error('❌ Content generation/storage failed:', error);
        throw error;
      } finally {
        // Always clean up the generation promise
        this.generationPromises.delete(generationKey);
      }
    })();
    
    // Store the promise for this generation
    this.generationPromises.set(generationKey, contentPromise);
    
    return contentPromise;
  }

  /**
   * Check if content exists for a topic
   * @param {String} topicName - Topic name
   * @returns {Boolean} - True if valid content exists
   */
  hasContent(topicName) {
    if (!this.currentCourse || !this.currentCourseId) return false;
    const storedContent = contentStorageService.getContentByTopicName(topicName, this.currentCourseId);
    return !!(storedContent?.reading?.length > 0);
  }

  /**
   * Get generation status for all topics
   */
  getAllTopicsWithStatus() {
    if (!this.currentCourseId) return [];
    const topics = contentStorageService.getTopicsForCourse(this.currentCourseId);
    return topics.map(topic => ({
      ...topic,
      hasContent: this.hasContent(topic.name),
      isGenerating: this.generationPromises.has(`${this.currentCourseId}_${topic.name}`)
    }));
  }

  /**
   * Store a list of topics for the current course
   * @param {Array} topics - Array of topic objects with {name} property
   * @param {String} forceCourseId - Optional course ID to use instead of generating a new one
   * @returns {Array} - Array of stored topic IDs
   */
  storeTopics(topics, forceCourseId = null) {
    // Use provided course ID or current one
    const courseId = forceCourseId || this.currentCourseId;
    if (!courseId) {
      throw new Error('No course context set. Call setCourse() first.');
    }
    
    // Ensure we have a course in storage
    let course = contentStorageService.getCourse(courseId);
    if (!course) {
      // Create course if it doesn't exist, but keep the provided ID
      contentStorageService.storeCourse({
        id: courseId,
        title: this.currentCourse,
        description: `Pro Learning course: ${this.currentCourse}`
      });
      course = contentStorageService.getCourse(courseId);
    }

    this.currentCourseId = courseId; // Update the current course ID
    
    // Store the topics
    return contentStorageService.storeTopics(courseId, topics);
  }

  /**
   * Generate all content for multiple topics in batch
   * @param {Array} topics - Array of topic objects with {id, name}
   * @param {String} courseId - Course ID
   * @param {Function} progressCallback - Progress callback (current, total, topicName, contentType)
   * @returns {Promise<Object>} - Complete course content structure
   */
  async generateAllContentBatch(topics, courseId, progressCallback = null) {
    if (!topics || topics.length === 0) {
      throw new Error('No topics provided for batch generation');
    }

    console.log('🚀 Starting batch content generation for', topics.length, 'topics');
    
    // Set course context
    this.setCourse("Generated Course", courseId);
    
    const courseContent = {
      courseId,
      topics: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTopics: topics.length,
        status: 'generating'
      }
    };

    // Content types to generate for each topic
    const contentTypes = ['reading', 'summary', 'quiz', 'resources', 'videos'];
    const totalSteps = topics.length * contentTypes.length;
    let currentStep = 0;

    for (const topic of topics) {
      console.log(`📚 Generating content for topic: ${topic.name}`);
      
      courseContent.topics[topic.name] = {
        id: topic.id,
        name: topic.name,
        content: {},
        status: 'generating'
      };

      try {
        // Generate all content for this topic
        const { content } = await this.getTopicContent(topic.name, async (topicName) => {
          // Use the existing content generation logic from ProLearningLogic
          const { 
            generateReadingContent,
            generateSummaryContent,
            generateVideosContent,
            generateQuizContent,
            generateResourcesContent
          } = await import('../components/ProLearning/services/index.js');
          
          const generatedContent = {};
          
          // Generate each content type
          for (const contentType of contentTypes) {
            if (progressCallback) {
              progressCallback(currentStep, totalSteps, topic.name, contentType);
            }
            
            console.log(`📝 Generating ${contentType} for ${topic.name}`);
            
            try {
              switch (contentType) {
                case 'reading':
                  generatedContent.reading = await generateReadingContent(topicName);
                  break;
                case 'summary':
                  generatedContent.summary = await generateSummaryContent(topicName);
                  break;
                case 'quiz':
                  generatedContent.quiz = await generateQuizContent(topicName);
                  break;
                case 'resources':
                  generatedContent.resources = await generateResourcesContent(topicName);
                  break;
                case 'videos':
                  generatedContent.videos = await generateVideosContent(topicName);
                  break;
              }
              
              currentStep++;
              console.log(`✅ Generated ${contentType} for ${topic.name}`);
              
            } catch (error) {
              console.error(`❌ Failed to generate ${contentType} for ${topic.name}:`, error);
              // Continue with other content types even if one fails
              generatedContent[contentType] = { error: error.message };
              currentStep++;
            }
          }
          
          return generatedContent;
        });

        // Store the generated content in our course structure
        courseContent.topics[topic.name].content = content;
        courseContent.topics[topic.name].status = 'completed';
        
        console.log(`✅ Completed all content for topic: ${topic.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to generate content for topic ${topic.name}:`, error);
        courseContent.topics[topic.name].status = 'failed';
        courseContent.topics[topic.name].error = error.message;
      }
    }

    // Mark course as completed
    courseContent.metadata.status = 'completed';
    courseContent.metadata.completedAt = new Date().toISOString();
    
    // Store the complete course structure
    try {
      localStorage.setItem(`course_content_${courseId}`, JSON.stringify(courseContent));
      console.log('💾 Batch generated content stored successfully for course:', courseId);
    } catch (error) {
      console.error('❌ Failed to store batch generated content:', error);
    }
    
    console.log('🎉 Batch content generation completed for course:', courseId);
    return courseContent;
  }

  /**
   * Get stored course content by course ID
   * @param {String} courseId - Course ID
   * @returns {Object|null} - Complete course content or null if not found
   */
  getStoredCourseContent(courseId) {
    try {
      const stored = localStorage.getItem(`course_content_${courseId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to retrieve stored course content:', error);
      return null;
    }
  }

  /**
   * Get specific topic content from stored course data
   * @param {String} courseId - Course ID
   * @param {String} topicName - Topic name
   * @param {String} contentType - Content type (reading, summary, quiz, resources, videos)
   * @returns {Object|null} - Specific content or null if not found
   */
  getStoredTopicContent(courseId, topicName, contentType = null) {
    const courseContent = this.getStoredCourseContent(courseId);
    
    if (!courseContent || !courseContent.topics[topicName]) {
      return null;
    }
    
    const topicData = courseContent.topics[topicName];
    
    if (contentType) {
      return topicData.content[contentType] || null;
    }
    
    return topicData.content;
  }

  /**
   * Clear all stored content
   */
  clearStorage() {
    contentStorageService.clearStorage();
  }
}

const proContentManager = new ProContentManager();
export default proContentManager;
export { ProContentManager };
