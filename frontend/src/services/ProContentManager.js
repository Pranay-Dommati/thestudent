// ProContentManager.js
// Manages content retrieval and caching for Pro Learning system
// Acts as an interface between UI components and ContentStorageService

import contentStorageService from './ContentStorageService.js';

class ProContentManager {
  constructor() {
    this.currentCourse = null;
    this.currentCourseId = null;
    this.generationPromises = new Map(); // Track ongoing generations to prevent duplicates
  }

  /**
   * Normalize topic name for consistent key generation
   * @param {String} topicName - Topic name to normalize
   * @returns {String} - Normalized topic name
   */
  normalizeTopicName(topicName) {
    return topicName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Generate lookup key for topic content
   * @param {String} courseId - Course ID
   * @param {String} topicName - Topic name
   * @returns {String} - Lookup key
   */
  generateLookupKey(courseId, topicName) {
    return `${courseId}-${this.normalizeTopicName(topicName)}`;
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
   * Transform database topic content to localStorage format
   * @param {Object} dbTopic - Database topic object
   * @returns {Object} - Transformed content object
   */
  transformDatabaseContent(dbTopic) {
    if (!dbTopic) return null;
    
    // Transform database format to localStorage format
    const transformedContent = {
      reading: dbTopic.reading_material || null,
      summary: dbTopic.summary || null,
      videos: this.transformVideos(dbTopic.videos || []),
      quiz: this.transformQuizQuestions(dbTopic.quiz_questions || []), // This will return [] if no quiz data
      resources: this.transformResources(dbTopic.resources || [])
    };
    
    return transformedContent;
  }

  /**
   * Transform database videos to localStorage format
   * @param {Array} dbVideos - Database videos array
   * @returns {Array} - Transformed videos array
   */
  transformVideos(dbVideos) {
    if (!dbVideos || dbVideos.length === 0) return [];
    
    return dbVideos.map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      description: video.description || '',
      duration: video.duration || '',
      is_watched: video.is_watched || false,
      order: video.order || 0
    }));
  }

  /**
   * Transform database resources to localStorage format
   * @param {Array} dbResources - Database resources array
   * @returns {Array} - Transformed resources array
   */
  transformResources(dbResources) {
    if (!dbResources || dbResources.length === 0) return [];
    
    return dbResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      type: resource.resource_type || 'link',
      description: resource.description || '',
      order: resource.order || 0
    }));
  }

  /**
   * Transform database quiz questions to localStorage format
   * @param {Array} dbQuizQuestions - Database quiz questions
   * @returns {Array} - Transformed quiz array (not object!)
   */
  transformQuizQuestions(dbQuizQuestions) {
    if (!dbQuizQuestions || dbQuizQuestions.length === 0) return [];
    
    return dbQuizQuestions.map(q => ({
      id: q.id,
      question: q.question_text,
      type: q.question_type || 'multiple_choice',
      options: q.options || [],
      correct: q.correct_answer,
      explanation: q.explanation || '',
      points: q.points || 1,
      order: q.order || 0,
      userAnswer: null // Initialize as null for quiz functionality
    }));
  }

  /**
   * Get content for a topic, prioritizing stored content over generation
   * @param {String} topicName - Topic name
   * @param {Function} generateCallback - Fallback generation function
   * @param {Object} dbTopic - Optional database topic object for content extraction
   * @returns {Promise<Object>} - Content object
   */
  async getTopicContent(topicName, generateCallback = null, dbTopic = null) {
    if (!this.currentCourse || !this.currentCourseId) {
      throw new Error('No course context set. Call setCourse() first.');
    }

    const generationKey = `${this.currentCourseId}_${topicName}`;

    // Check if generation is already in progress for this topic
    if (this.generationPromises.has(generationKey)) {
      return this.generationPromises.get(generationKey);
    }

    // Create a new promise for this generation request
    const contentPromise = (async () => {
      try {
        // Step 1: Check for valid stored content first (localStorage)
        const storedContent = contentStorageService.getContentByTopicName(topicName, this.currentCourseId);
        if (storedContent?.reading?.length > 0) {
          return {
            source: 'storage',
            content: storedContent,
            fromCache: true
          };
        }

        // Step 2: Check for database content if dbTopic is provided
        if (dbTopic && (dbTopic.reading_material || dbTopic.summary || dbTopic.videos?.length > 0 || dbTopic.quiz_questions?.length > 0 || dbTopic.resources?.length > 0)) {
          const transformedContent = this.transformDatabaseContent(dbTopic);
          
          if (transformedContent) {
            return {
              source: 'database',
              content: transformedContent,
              fromCache: true
            };
          }
        }

        // Step 3: If no valid content and no generator, return null
        // CRITICAL FIX: Don't generate content here - let ProLearningLogic handle generation
        if (!generateCallback) {
          return null;
        }

        // CRITICAL FIX: Even if generateCallback exists, don't use it here
        // This prevents double generation - ProLearningLogic should be the only generator
        return null;

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
      courseContent.topics[topic.name] = {
        id: topic.id,
        name: topic.name,
        content: {},
        status: 'generating'
      };

      try {
        // Generate all content for this topic
        const { content } = await this.getTopicContent(topic.name, async (params) => {
          // Extract topic name from params object
          const topicName = params.topic || topic.name;
          
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
            
            try {
              switch (contentType) {
                case 'reading':
                  await generateReadingContent(topicName, (contentOrFunction) => {
                    
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
                      
                      // 🚀 STORE READING IMMEDIATELY for incremental access
                      try {
                        // Use the current courseId instead of topic.courseId to ensure consistency
                        const currentCourseId = courseId; // Use the courseId parameter from batchGenerateContent
                        console.log('💾 Storing reading with courseId:', currentCourseId, 'topicId:', topic.id);
                        contentStorageService.mergeTopicContent(topic.id, { reading: content.reading });
                        
                        // Also create/update the direct lookup key for immediate access
                        const lookupKey = this.generateLookupKey(currentCourseId, topic.name);
                        const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                        const updatedContent = { ...existingContent, reading: content.reading };
                        contentStorageService.storage.contents.set(lookupKey, updatedContent);
                        contentStorageService.persistToStorage();
                        
                        console.log('💾 Reading content stored incrementally for:', topic.name, 'under key:', lookupKey);
                      } catch (error) {
                        console.error('❌ Failed to store reading incrementally:', error);
                      }
                    }
                  });
                  // Ensure we have some reading content even if the function doesn't set it
                  if (!generatedContent.reading) {
                    console.log(`⚠️ No reading content received, using fallback for ${topicName}`);
                    generatedContent.reading = `# ${topicName}\n\nThis is the reading material for ${topicName}.`;
                    
                    // Store fallback reading content too
                    try {
                      const currentCourseId = courseId;
                      console.log('💾 Storing fallback reading with courseId:', currentCourseId, 'topicId:', topic.id);
                      contentStorageService.mergeTopicContent(topic.id, { reading: generatedContent.reading });
                      
                      // Also create/update the direct lookup key for immediate access
                      const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                      const updatedContent = { ...existingContent, reading: generatedContent.reading };
                      contentStorageService.storage.contents.set(lookupKey, updatedContent);
                      contentStorageService.persistToStorage();
                      
                      console.log('💾 Fallback reading content stored incrementally for:', topic.name, 'under key:', lookupKey);
                    } catch (error) {
                      console.error('❌ Failed to store fallback reading incrementally:', error);
                    }
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
                      
                      // 🚀 STORE SUMMARY IMMEDIATELY
                      try {
                        const currentCourseId = courseId;
                        console.log('💾 Storing summary with courseId:', currentCourseId, 'topicId:', topic.id);
                        contentStorageService.mergeTopicContent(topic.id, { summary: content.summary });
                        
                        // Also create/update the direct lookup key for immediate access
                        const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                        const updatedContent = { ...existingContent, summary: content.summary };
                        contentStorageService.storage.contents.set(lookupKey, updatedContent);
                        contentStorageService.persistToStorage();
                        
                        console.log('💾 Summary content stored incrementally for:', topic.name, 'under key:', lookupKey);
                      } catch (error) {
                        console.error('❌ Failed to store summary incrementally:', error);
                      }
                    } else {
                      console.log(`⚠️ No summary content in response:`, content);
                    }
                  }, topicName, generatedContent.reading);
                  // Ensure we have summary content
                  if (!generatedContent.summary) {
                    console.log(`⚠️ No summary generated, using fallback for ${topicName}`);
                    generatedContent.summary = `## Summary of ${topicName}\n\n• **Key Topic**: ${topicName}\n• **Main Focus**: Understanding core concepts and applications\n• **Learning Outcome**: Practical knowledge and implementation skills`;
                    
                    // Store fallback summary too
                    try {
                      const currentCourseId = courseId;
                      console.log('💾 Storing fallback summary with courseId:', currentCourseId, 'topicId:', topic.id);
                      contentStorageService.mergeTopicContent(topic.id, { summary: generatedContent.summary });
                      
                      // Also create/update the direct lookup key for immediate access
                      const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                      const updatedContent = { ...existingContent, summary: generatedContent.summary };
                      contentStorageService.storage.contents.set(lookupKey, updatedContent);
                      contentStorageService.persistToStorage();
                      
                      console.log('💾 Fallback summary content stored incrementally for:', topic.name, 'under key:', lookupKey);
                    } catch (error) {
                      console.error('❌ Failed to store fallback summary incrementally:', error);
                    }
                  }
                  break;
                case 'quiz':
                  await generateQuizContent((content) => {
                    if (content && content.quiz) {
                      generatedContent.quiz = content.quiz;
                      
                      // 🚀 STORE QUIZ IMMEDIATELY
                      try {
                        const currentCourseId = courseId;
                        console.log('💾 Storing quiz with courseId:', currentCourseId, 'topicId:', topic.id);
                        contentStorageService.mergeTopicContent(topic.id, { quiz: content.quiz });
                        
                        // Also create/update the direct lookup key for immediate access
                        const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                        const updatedContent = { ...existingContent, quiz: content.quiz };
                        contentStorageService.storage.contents.set(lookupKey, updatedContent);
                        contentStorageService.persistToStorage();
                        
                        console.log('💾 Quiz content stored incrementally for:', topic.name, 'under key:', lookupKey);
                      } catch (error) {
                        console.error('❌ Failed to store quiz incrementally:', error);
                      }
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
                    
                    // Store fallback quiz too
                    try {
                      const currentCourseId = courseId;
                      console.log('💾 Storing fallback quiz with courseId:', currentCourseId, 'topicId:', topic.id);
                      contentStorageService.mergeTopicContent(topic.id, { quiz: generatedContent.quiz });
                      
                      // Also create/update the direct lookup key for immediate access
                      const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                      const updatedContent = { ...existingContent, quiz: generatedContent.quiz };
                      contentStorageService.storage.contents.set(lookupKey, updatedContent);
                      contentStorageService.persistToStorage();
                      
                      console.log('💾 Fallback quiz content stored incrementally for:', topic.name, 'under key:', lookupKey);
                    } catch (error) {
                      console.error('❌ Failed to store fallback quiz incrementally:', error);
                    }
                  }
                  break;
                case 'resources':
                  await generateResourcesContent((content) => {
                    if (content && content.resources) {
                      generatedContent.resources = content.resources;
                      
                      // 🚀 STORE RESOURCES IMMEDIATELY
                      try {
                        const currentCourseId = courseId;
                        console.log('💾 Storing resources with courseId:', currentCourseId, 'topicId:', topic.id);
                        contentStorageService.mergeTopicContent(topic.id, { resources: content.resources });
                        
                        // Also create/update the direct lookup key for immediate access
                        const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                        const updatedContent = { ...existingContent, resources: content.resources };
                        contentStorageService.storage.contents.set(lookupKey, updatedContent);
                        contentStorageService.persistToStorage();
                        
                        console.log('💾 Resources content stored incrementally for:', topic.name, 'under key:', lookupKey);
                      } catch (error) {
                        console.error('❌ Failed to store resources incrementally:', error);
                      }
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
                    
                    // Store fallback resources too
                    try {
                      const currentCourseId = courseId;
                      console.log('💾 Storing fallback resources with courseId:', currentCourseId, 'topicId:', topic.id);
                      contentStorageService.mergeTopicContent(topic.id, { resources: generatedContent.resources });
                      
                      // Also create/update the direct lookup key for immediate access
                      const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                      const updatedContent = { ...existingContent, resources: generatedContent.resources };
                      contentStorageService.storage.contents.set(lookupKey, updatedContent);
                      contentStorageService.persistToStorage();
                      
                      console.log('💾 Fallback resources content stored incrementally for:', topic.name, 'under key:', lookupKey);
                    } catch (error) {
                      console.error('❌ Failed to store fallback resources incrementally:', error);
                    }
                  }
                  break;
                case 'videos':
                  await generateVideosContent((content) => {
                    if (content && content.videos) {
                      generatedContent.videos = content.videos;
                      
                      // 🚀 STORE VIDEOS IMMEDIATELY
                      try {
                        const currentCourseId = courseId;
                        console.log('💾 Storing videos with courseId:', currentCourseId, 'topicId:', topic.id);
                        contentStorageService.mergeTopicContent(topic.id, { videos: content.videos });
                        
                        // Also create/update the direct lookup key for immediate access
                        const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                        const updatedContent = { ...existingContent, videos: content.videos };
                        contentStorageService.storage.contents.set(lookupKey, updatedContent);
                        contentStorageService.persistToStorage();
                        
                        console.log('💾 Videos content stored incrementally for:', topic.name, 'under key:', lookupKey);
                      } catch (error) {
                        console.error('❌ Failed to store videos incrementally:', error);
                      }
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
                    
                    // Store fallback videos too
                    try {
                      const currentCourseId = courseId;
                      console.log('💾 Storing fallback videos with courseId:', currentCourseId, 'topicId:', topic.id);
                      contentStorageService.mergeTopicContent(topic.id, { videos: generatedContent.videos });
                      
                      // Also create/update the direct lookup key for immediate access
                      const lookupKey = `${currentCourseId}-${topic.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                      const existingContent = contentStorageService.storage.contents.get(lookupKey) || {};
                      const updatedContent = { ...existingContent, videos: generatedContent.videos };
                      contentStorageService.storage.contents.set(lookupKey, updatedContent);
                      contentStorageService.persistToStorage();
                      
                      console.log('💾 Fallback videos content stored incrementally for:', topic.name, 'under key:', lookupKey);
                    } catch (error) {
                      console.error('❌ Failed to store fallback videos incrementally:', error);
                    }
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
    // Method 1: Try the original course content structure
    const courseContent = this.getStoredCourseContent(courseId);
    
    if (courseContent && courseContent.topics && courseContent.topics[topicName]) {
      const topicData = courseContent.topics[topicName];
      
      if (contentType) {
        return topicData.content[contentType] || null;
      }
      
      return topicData.content;
    }
    
    // Method 2: Try ContentStorageService direct lookup
    try {
      const lookupKey = this.generateLookupKey(courseId, topicName);
      console.log('🔍 Trying direct lookup with key:', lookupKey);
      
      // Use the imported contentStorageService
      const content = contentStorageService.storage.contents.get(lookupKey);
      
      if (content) {
        console.log('✅ Found content via direct lookup!', { courseId, topicName, contentType });
        
        if (contentType) {
          return content[contentType] || null;
        }
        
        return content;
      }
    } catch (error) {
      console.error('❌ Direct lookup failed:', error);
    }
    
    console.log('❌ No content found for topic:', { courseId, topicName, contentType });
    return null;
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
