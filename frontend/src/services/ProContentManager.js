// ProContentManager.js
// Manages content retrieval and caching for Pro Learning system
// Acts as an interface between UI components and ContentStorageService

import contentStorageService from './ContentStorageService.js';
import logger from '../utils/logger';

class ProContentManager {
  constructor() {
    this.currentCourse = null;
    this.currentCourseId = null;
    this.generationPromises = new Map(); // Track ongoing content generation
    this.courseContentCache = new Map(); // In-memory cache for course content
  }

  /**
   * Initialize course content from IndexedDB into cache
   * @param {String} courseId - Course ID
   * @returns {Promise<boolean>} - True if content was loaded
   */
  async initializeCourse(courseId) {
    if (this.courseContentCache.has(courseId)) {
      return true;
    }

    // Prefer loading from backend DB now
    try {
      const dbCourse = await this.fetchCourseFromDB(courseId);
      if (dbCourse && dbCourse.topics) {
        const aggregated = this.aggregateDatabaseCourse(dbCourse, courseId);
        this.courseContentCache.set(courseId, aggregated);
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(`course_content_${courseId}`, JSON.stringify(aggregated)); } catch {}
        return true;
      }
    } catch (e) {
  logger.warn('Failed to initialize from backend DB, will fallback to local storage:', e);
    }

    try {
      const cached = (typeof localStorage !== 'undefined') ? localStorage.getItem(`course_content_${courseId}`) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        this.courseContentCache.set(courseId, parsed);
        return true;
      }
    } catch (e) {
  logger.error('Failed to load from localStorage fallback', e);
    }

    return false;
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
   * Fetch a Pro Learning course from backend
   */
  async fetchCourseFromDB(courseId) {
    const tryFetch = async (accessToken) => {
      const resp = await fetch(`http://localhost:8000/api/courses/pro-learning/${courseId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return resp;
    };

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return null;

      let resp = await tryFetch(token);
      // If unauthorized, try a one-time refresh using refreshToken from localStorage
      if (resp.status === 401) {
        const refresh = typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refresh) {
          try {
            const r = await fetch('http://localhost:8000/api/auth/token/refresh/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh })
            });
            if (r.ok) {
              const data = await r.json();
              if (data?.access) {
                try { localStorage.setItem('accessToken', data.access); } catch {}
                resp = await tryFetch(data.access);
              }
            }
          } catch {}
        }
      }

      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) {
      return null;
    }
  }

  /**
   * Convert backend course shape into aggregated course_content structure
   */
  aggregateDatabaseCourse(dbCourse, courseId) {
    const topicsObj = {};
    const topics = Array.isArray(dbCourse.topics) ? dbCourse.topics : [];
    topics.forEach((t, idx) => {
      const name = t.topic_name || t.name || `Topic ${idx + 1}`;
      topicsObj[name] = {
        id: t.id || idx + 1,
        name,
        content: this.transformDatabaseContent(t) || {},
        status: 'completed'
      };
    });
    return {
      courseId,
      topics: topicsObj,
      metadata: {
        source: 'database',
        updatedAt: new Date().toISOString(),
        totalTopics: Object.keys(topicsObj).length
      }
    };
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
  logger.log('🔍 ContentStorageService check:', {
          topicName,
          courseId: this.currentCourseId,
          hasStoredContent: !!storedContent,
          hasReading: !!storedContent?.reading?.length
        });
        
        if (storedContent?.reading?.length > 0) {
          logger.log('✅ Using stored content from ContentStorageService');
          return {
            source: 'storage',
            content: storedContent,
            fromCache: true
          };
        }

        // Step 2: Check for database content if dbTopic is provided
        if (dbTopic && (dbTopic.reading_material || dbTopic.summary || dbTopic.videos?.length > 0 || dbTopic.quiz_questions?.length > 0 || dbTopic.resources?.length > 0)) {
          logger.log('🗄️ Database topic found, transforming content:', {
            topicName,
            hasReadingMaterial: !!dbTopic.reading_material,
            hasSummary: !!dbTopic.summary,
            hasVideos: !!dbTopic.videos?.length,
            hasQuiz: !!dbTopic.quiz_questions?.length,
            hasResources: !!dbTopic.resources?.length
          });
          
          const transformedContent = this.transformDatabaseContent(dbTopic);
          
          logger.log('🔄 Transformed database content:', {
            hasReading: !!transformedContent?.reading,
            hasSummary: !!transformedContent?.summary,
            hasVideos: !!transformedContent?.videos?.length,
            hasQuiz: !!transformedContent?.quiz?.length,
            hasResources: !!transformedContent?.resources?.length
          });
          
          if (transformedContent) {
            return {
              source: 'database',
              content: transformedContent,
              fromCache: true
            };
          }
        }

        // Step 3: If no valid content and no generator, return null
        if (!generateCallback) {
          return null;
        }

        const generationStartTime = Date.now();
        const generatedContent = await new Promise((resolve, reject) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              const elapsed = (Date.now() - generationStartTime) / 1000;
              logger.error(`⏰ Content generation timeout after ${elapsed}s for topic: ${topicName}`);
              reject(new Error('Content generation timeout - this usually means the setContent callback was not called properly'));
            }
          }, 300000); // Increased to 5 minutes for AI content generation with retry logic

          generateCallback({
            topic: topicName,
            setIsLoading: () => {},
            setLoadingProgress: () => {},
            setShowSkeletons: () => {},
            setLoadingStep: () => {},
            setContent: (newContent) => {
              const elapsed = (Date.now() - generationStartTime) / 1000;
              if (!resolved) {
                clearTimeout(timeout);
                resolved = true;
                
                // Ensure we have a proper content object
                const content = typeof newContent === 'function' ? newContent({}) : newContent;
                
                resolve(content);
              } else {
                // Content already resolved, ignore
              }
            },
            setStats: () => {},
            content: null
          });
        });

        // Once content is generated, store it atomically
        
        // Find or create topic
        let topic = contentStorageService.getTopicByName(topicName, this.currentCourseId);
        if (!topic) {
          const topicId = contentStorageService.createTopic(topicName, this.currentCourseId);
          topic = { id: topicId, name: topicName };
        }
        
        // Store the content
        if (topic) {
          contentStorageService.storeTopicContent(topic.id, generatedContent);
          
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
  logger.error('❌ Content generation/storage failed:', error);
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
  async storeTopics(topics, forceCourseId = null) {
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
    
    // Store the topics in ContentStorageService
    const topicIds = contentStorageService.storeTopics(courseId, topics);
    
    // Create/update aggregated structure in memory (DB-first approach)
    try {
      let courseContent = this.courseContentCache.get(courseId) || {
        courseId,
        topics: {},
        metadata: {
          createdAt: new Date().toISOString(),
          totalTopics: topics.length,
          status: 'topics_stored'
        }
      };

      topics.forEach((topic, index) => {
        const topicName = topic.name;
        if (!courseContent.topics[topicName]) {
          courseContent.topics[topicName] = {
            id: topic.id || index + 1,
            name: topicName,
            content: {},
            status: 'topic_created'
          };
        }
      });

      courseContent.metadata.updatedAt = new Date().toISOString();
      courseContent.metadata.totalTopics = Object.keys(courseContent.topics).length;
      this.courseContentCache.set(courseId, courseContent);

  // Do not auto-create minimal backend records with empty content.
  // We persist to the database only when full content is available or the user explicitly saves.

      // Keep a small localStorage cache as a fallback only
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(`course_content_${courseId}`, JSON.stringify(courseContent)); } catch {}
    } catch (error) {
  logger.error('❌ Failed to update in-memory course content structure:', error);
    }
    
    return topicIds;
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
          // Using topic name for content generation
          
          // Validate topic name
          if (!topicName || typeof topicName !== 'string' || topicName.trim().length === 0) {
            logger.error(`❌ Invalid topic name received: "${topicName}"`);
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
            
            // Generating contentType for topic.name
            
            try {
              switch (contentType) {
                case 'reading':
                  // Calling generateReadingContent with topic
                  await generateReadingContent(topicName, (contentOrFunction) => {
                    // Reading content received
                    
                    // Handle both direct content and function-based content
                    let content;
                    if (typeof contentOrFunction === 'function') {
                      // If it's a function, call it with empty object to get the content
                      content = contentOrFunction({});
                    } else {
                      content = contentOrFunction;
                    }
                    
                    // Processed reading content
                    if (content && content.reading) {
                      generatedContent.reading = content.reading;
                    }
                  });
                  // Ensure we have some reading content even if the function doesn't set it
                  if (!generatedContent.reading) {
                    // No reading content received, using fallback
                    generatedContent.reading = `# ${topicName}\n\nThis is the reading material for ${topicName}.`;
                  }
                  break;
                case 'summary':
                  // Generating summary with reading content
                  // Summary service expects (setContent, topic, readingContent)
                  await generateSummaryContent((content) => {
                    // Summary content received
                    if (content && content.summary) {
                      generatedContent.summary = content.summary;
                      // Summary stored
                    } else {
                      // No summary content in response
                    }
                  }, topicName, generatedContent.reading);
                  // Ensure we have summary content
                  if (!generatedContent.summary) {
                    // No summary generated, using fallback
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
                    // No videos received, using fallback
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
              // Generated contentType for topic
              
            } catch (error) {
              logger.error(`❌ Failed to generate ${contentType} for ${topic.name}:`, error);
              currentStep++;
              // Continue with next content type instead of failing completely
            }
          }
          
          // Call setContent with the complete generated content
          if (params.setContent) {
            // Calling setContent with generated content
            params.setContent(generatedContent);
          } else {
            logger.warn('⚠️ No setContent callback available');
          }
          
          return generatedContent;
        });

        // Store the generated content in our course structure
        courseContent.topics[topic.name].content = content;
        courseContent.topics[topic.name].status = 'completed';
        
        // Completed all content for topic
        
      } catch (error) {
  logger.error(`❌ Failed to generate content for topic ${topic.name}:`, error);
        courseContent.topics[topic.name].status = 'failed';
        courseContent.topics[topic.name].error = error.message;
      }
    }

    // Mark course as completed
    courseContent.metadata.status = 'completed';
    courseContent.metadata.completedAt = new Date().toISOString();
    
    // Always update in-memory cache and a tiny localStorage fallback FIRST
    this.courseContentCache.set(courseId, courseContent);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(`course_content_${courseId}`, JSON.stringify(courseContent)); } catch {}
    
  // Then persist aggregated content to backend (DB-first)
    try {
  // Persist via working endpoint that creates course with full topics/content
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
  logger.log('🚀 ProContentManager: Saving batch to backend with full content...');
  logger.log('📊 Course Data Preview:', {
          courseId,
          title: this.currentCourse || 'AI Generated Course',
          topicCount: Object.keys(courseContent.topics).length,
          topicNames: Object.keys(courseContent.topics),
          sampleTopic: Object.keys(courseContent.topics)[0] ? {
            name: Object.keys(courseContent.topics)[0],
            hasReading: !!(courseContent.topics[Object.keys(courseContent.topics)[0]]?.content?.reading),
            hasResources: !!(courseContent.topics[Object.keys(courseContent.topics)[0]]?.content?.resources?.length > 0)
          } : null
        });
        
        // Derive a smart title from topics if currentCourse looks generic
        const topicKeys = Object.keys(courseContent.topics || {});
        const topicNames = topicKeys.map(k => k).filter(Boolean);
        const isGenericTitle = (t) => !t || /^(AI Course:|AI Generated Course:?|ProLearning Course|Generated Course|Database Course)$/i.test(String(t).trim());
        let smartTitle = this.currentCourse;
        if (isGenericTitle(smartTitle) || !smartTitle) {
          if (topicNames.length > 0) {
            const first = topicNames[0];
            const additional = Math.max(0, topicNames.length - 1);
            if (additional === 0) smartTitle = first;
            else if (additional === 1) smartTitle = `${first} +1`;
            else if (additional === 2) smartTitle = `${first} +1 +2`;
            else if (additional === 3) smartTitle = `${first} +1 +2 +3`;
            else smartTitle = `${first} +1 +2 +3 +...`;
          } else {
            smartTitle = 'AI Generated Course';
          }
        }
        const payload = {
          course_name: courseId, // used for idempotency check server-side
          title: smartTitle,
          overwrite: true,
          topics: Object.fromEntries(
            Object.entries(courseContent.topics).map(([name, t]) => {
              const c = t?.content ?? t ?? {};
              // Normalize fields
              const reading = c.reading || c.readingMaterial || '';
              const summary = c.summary || c.topicSummary || '';
              const videos = Array.isArray(c.videos) ? c.videos : [];
              let quiz = [];
              if (Array.isArray(c.quiz)) quiz = c.quiz;
              else if (c.quiz && Array.isArray(c.quiz.questions)) quiz = c.quiz.questions;
              else if (Array.isArray(c.quizQuestions)) quiz = c.quizQuestions;
              const resources = Array.isArray(c.resources) ? c.resources : [];
              return [name, {
                // Nested format
                content: { reading, summary, videos, quiz, resources },
                // Flat format for backward-compat on backend
                readingMaterial: reading,
                summary,
                videos,
                quiz,
                resources
              }];
            })
          )
        };
        
  const response = await fetch('/api/courses/pro-learning/save-course/', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          logger.log('✅ ProContentManager: Batch successfully saved to backend database');
        } else {
          logger.error('❌ ProContentManager: Failed to save batch to backend:', await response.text());
        }
      } else {
  logger.warn('⚠️ ProContentManager: No auth token available, skipping backend save');
      }
    } catch (e) {
  logger.error('❌ ProContentManager: Failed to persist batch to backend:', e);
    }
    
    // Batch content generation completed
    return courseContent;
  }

  /**
   * Get stored course content by course ID
   * @param {String} courseId - Course ID
   * @returns {Promise<Object|null>} - Complete course content or null if not found
   */
  async getStoredCourseContent(courseId) {
    // 1) Fast path: in-memory cache
    const cached = this.courseContentCache.get(courseId);
    if (cached) return cached;

    // 2) Primary source: Backend DB
    try {
      const dbCourse = await this.fetchCourseFromDB(courseId);
      if (dbCourse && dbCourse.topics) {
        const aggregated = this.aggregateDatabaseCourse(dbCourse, courseId);
        this.courseContentCache.set(courseId, aggregated);
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(`course_content_${courseId}`, JSON.stringify(aggregated)); } catch {}
        return aggregated;
      }
    } catch (e) {
  logger.warn('Failed to load course from backend DB:', e);
    }

  // 3) Fallback: localStorage only (IndexedDB removed)
  try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`course_content_${courseId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.courseContentCache.set(courseId, parsed);
          return parsed;
        }
      }
    } catch (_) {}

    return null;
  }

  /**
   * Get stored topics for a course
   * @param {String} courseId - Course ID
   * @returns {Promise<Array>} - Array of topic objects
   */
  async getStoredTopics(courseId) {
    const courseContent = await this.getStoredCourseContent(courseId);

    // Primary path: aggregate cache from course_content_{courseId}
    if (courseContent && courseContent.topics) {
      return Object.values(courseContent.topics).map((topic, index) => ({
        id: topic.id || index + 1,
        name: topic.name,
        isActive: false,
        hasContent: !!(topic.content && topic.content.reading)
      }));
    }

    // Fallback: reconstruct from ContentStorageService maps (already loaded from IDB)
    try {
      const topics = contentStorageService.getTopicsForCourse(courseId);
      if (topics && topics.length > 0) {
        return topics.map((t, index) => ({
          id: t.id || index + 1,
          name: t.name,
          isActive: !!t.isActive,
          hasContent: !!t.contentGenerated
        }));
      }
    } catch (_) {}

    return [];
  }

  /**
   * Get specific topic content from stored course data
   * @param {String} courseId - Course ID
   * @param {String} topicName - Topic name
   * @param {String} contentType - Content type (reading, summary, quiz, resources, videos)
   * @returns {Promise<Object|null>} - Specific content or null if not found
   */
  async getStoredTopicContent(courseId, topicName, contentType = null) {
    // Prefer aggregated course content if available
    const courseContent = await this.getStoredCourseContent(courseId);
    // Helper to decide if content is meaningful
    const hasMeaningful = (c) => !!((c?.reading && String(c.reading).trim().length) || (c?.summary && String(c.summary).trim().length));

    if (courseContent && courseContent.topics) {
      // Try exact key first
      let topicEntry = courseContent.topics[topicName];
      // If not found, try case-insensitive match
      if (!topicEntry) {
        const matchKey = Object.keys(courseContent.topics).find(k => k.toLowerCase().trim() === String(topicName).toLowerCase().trim());
        if (matchKey) topicEntry = courseContent.topics[matchKey];
      }

      if (topicEntry) {
        const c = topicEntry.content || {};
        // If DB/aggregated content is meaningful, return it directly
        if (hasMeaningful(c)) {
          return contentType ? (c[contentType] ?? null) : c;
        }
        // Otherwise, attempt to enrich from local ContentStorageService
        try {
          const stored = contentStorageService.getContentByTopicName(topicName, courseId);
          if (stored && hasMeaningful(stored)) {
            return contentType ? (stored[contentType] ?? null) : stored;
          }
        } catch (_) {}
        // Fall back to original (potentially empty) content
        return contentType ? (c[contentType] ?? null) : c;
      }
    }

    // Fallback: read directly from ContentStorageService (progressive path / per-topic storage)
    try {
      const stored = contentStorageService.getContentByTopicName(topicName, courseId);
      if (!stored) return null;
      if (contentType) {
        return stored[contentType] || null;
      }
      return stored;
    } catch (_) {
      return null;
    }
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
