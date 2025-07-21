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
              reject(new Error('Content generation timeout - this usually means the setContent callback was not called properly'));
            }
          }, 60000); // Increased to 60 seconds for batch generation

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
                
                console.log('✅ Content generation completed, resolving with:', content);
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

    // Content types to generate for each topic (reading first since others depend on it)
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
        const { content } = await this.getTopicContent(topic.name, async (params) => {
          console.log(`🔧 Content generator called with params:`, params);
          
          // Extract topic name from params object
          const topicName = params.topic || topic.name;
          console.log(`🔧 Using topic name: "${topicName}" (type: ${typeof topicName})`);
          
          // Validate topic name
          if (!topicName || typeof topicName !== 'string' || topicName.trim().length === 0) {
            console.error(`❌ Invalid topic name received: "${topicName}"`);
            throw new Error(`Invalid topic name: ${topicName}`);
          }
          // Use the existing content generation logic from ProLearningLogic
          const { 
            generateReadingContent,
            generateSummaryContent,
            generateVideosContent,
            generateQuizContent,
            generateResourcesContent
          } = await import('../components/ProLearning/services/index.js');
          
          const generatedContent = {
            reading: '',
            summary: '',
            quiz: [],
            videos: [],
            resources: []
          };
          
          // Generate each content type with proper function signatures
          for (const contentType of contentTypes) {
            if (progressCallback) {
              progressCallback(currentStep, totalSteps, topic.name, contentType);
            }
            
            console.log(`📝 Generating ${contentType} for ${topic.name}`);
            
            try {
              switch (contentType) {
                case 'reading':
                  console.log(`📖 Calling generateReadingContent with topic: "${topicName}"`);
                  await generateReadingContent(topicName, (contentOrFunction) => {
                    console.log(`📖 Reading content received:`, typeof contentOrFunction, contentOrFunction);
                    
                    // Handle both direct content and function-based content
                    let content;
                    if (typeof contentOrFunction === 'function') {
                      // If it's a function, call it with empty object to get the content
                      content = contentOrFunction({});
                    } else {
                      content = contentOrFunction;
                    }
                    
                    console.log(`📖 Processed reading content:`, content);
                    if (content && content.reading) {
                      generatedContent.reading = content.reading;
                    }
                  });
                  // Ensure we have some reading content even if the function doesn't set it
                  if (!generatedContent.reading) {
                    console.log(`⚠️ No reading content received, using fallback for ${topicName}`);
                    generatedContent.reading = `# ${topicName}\n\nThis is the reading material for ${topicName}.`;
                  }
                  break;
                case 'summary':
                  console.log(`📝 Generating summary for ${topicName} with reading content:`, 
                    generatedContent.reading ? `${generatedContent.reading.length} chars` : 'NO READING CONTENT');
                  // Summary service expects (setContent, topic, readingContent)
                  await generateSummaryContent((content) => {
                    console.log(`📝 Summary content received:`, content);
                    if (content && content.summary) {
                      generatedContent.summary = content.summary;
                      console.log(`📝 Summary stored:`, generatedContent.summary.length, 'chars');
                    } else {
                      console.log(`⚠️ No summary content in response:`, content);
                    }
                  }, topicName, generatedContent.reading);
                  // Ensure we have summary content
                  if (!generatedContent.summary) {
                    console.log(`⚠️ No summary generated, using fallback for ${topicName}`);
                    generatedContent.summary = `## Summary of ${topicName}\n\n• **Key Topic**: ${topicName}\n• **Main Focus**: Understanding core concepts and applications\n• **Learning Outcome**: Practical knowledge and implementation skills`;
                  }
                  break;
                case 'quiz':
                  await generateQuizContent((content) => {
                    if (content && content.quiz) {
                      generatedContent.quiz = content.quiz;
                    }
                  }, topicName, generatedContent.reading);
                  // Ensure we have quiz content
                  if (!generatedContent.quiz || generatedContent.quiz.length === 0) {
                    generatedContent.quiz = [
                      {
                        id: 1,
                        question: `What is ${topicName}?`,
                        options: [
                          'A fundamental programming concept',
                          'A type of data structure',
                          'A programming language',
                          'A software tool'
                        ],
                        correctAnswer: 0,
                        explanation: `${topicName} is a fundamental concept in programming.`
                      }
                    ];
                  }
                  break;
                case 'resources':
                  await generateResourcesContent((content) => {
                    if (content && content.resources) {
                      generatedContent.resources = content.resources;
                    }
                  }, topicName);
                  // Ensure we have resources content
                  if (!generatedContent.resources || generatedContent.resources.length === 0) {
                    generatedContent.resources = [
                      {
                        title: `${topicName} Documentation`,
                        url: `https://developer.mozilla.org/en-US/docs/`,
                        type: 'documentation',
                        icon: 'FaBook',
                        description: `Official documentation for ${topicName}`
                      }
                    ];
                  }
                  break;
                case 'videos':
                  await generateVideosContent((content) => {
                    if (content && content.videos) {
                      generatedContent.videos = content.videos;
                    }
                  }, topicName);
                  // Ensure we have videos even if API fails
                  if (!generatedContent.videos || generatedContent.videos.length === 0) {
                    console.log(`⚠️ No videos received, using fallback for ${topicName}`);
                    generatedContent.videos = [
                      {
                        title: `${topicName} - Complete Tutorial`,
                        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName + ' programming tutorial')}`,
                        thumbnail: 'https://via.placeholder.com/480x360/1a73e8/ffffff?text=Video+Tutorial',
                        duration: '15:30',
                        views: '1.2M',
                        channel: 'Programming Tutorials',
                        description: `Learn ${topicName} from scratch with this comprehensive tutorial`
                      },
                      {
                        title: `${topicName} Best Practices`,
                        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName + ' best practices')}`,
                        thumbnail: 'https://via.placeholder.com/480x360/34a853/ffffff?text=Best+Practices',
                        duration: '10:45',
                        views: '856K',
                        channel: 'Code Academy',
                        description: `Best practices and tips for working with ${topicName}`
                      }
                    ];
                  }
                  break;
              }
              
              currentStep++;
              console.log(`✅ Generated ${contentType} for ${topic.name}`);
              
            } catch (error) {
              console.error(`❌ Failed to generate ${contentType} for ${topic.name}:`, error);
              currentStep++;
              // Continue with next content type instead of failing completely
            }
          }
          
          // Call setContent with the complete generated content
          if (params.setContent) {
            console.log('🔧 Calling setContent with generated content:', {
              hasReading: !!generatedContent.reading,
              hasSummary: !!generatedContent.summary,
              hasQuiz: !!generatedContent.quiz,
              hasVideos: !!generatedContent.videos,
              hasResources: !!generatedContent.resources
            });
            params.setContent(generatedContent);
          } else {
            console.warn('⚠️ No setContent callback available');
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
   * Get stored topics for a course
   * @param {String} courseId - Course ID
   * @returns {Array} - Array of topic objects
   */
  getStoredTopics(courseId) {
    const courseContent = this.getStoredCourseContent(courseId);
    
    if (!courseContent || !courseContent.topics) {
      return [];
    }
    
    // Convert topics object to array format
    return Object.values(courseContent.topics).map((topic, index) => ({
      id: topic.id || index + 1,
      name: topic.name,
      isActive: false,
      hasContent: !!(topic.content && topic.content.reading)
    }));
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
