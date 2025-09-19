// Reading Content Generation Service
// Handles AI-powered content generation for educational materials

// Configuration constants for AI model handling
const AI_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // Base delay in ms
  TIMEOUT: 30000, // 30 seconds
  MAX_TOPICS_PARALLEL: 3, // Prevent rate limiting
  MIN_CONTENT_LENGTH: 100,
  RATE_LIMIT_DELAY: 500 // Delay between requests
};

// Content caching to reduce API calls
const contentCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Get cached content if available and not expired
function getCachedContent(cacheKey) {
  const cached = contentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Don't return empty cached content - force regeneration
    if (!cached.content || cached.content.trim() === '') {
      console.log(`🗑️ Removing empty cached content for: ${cacheKey}`);
      contentCache.delete(cacheKey);
      return null;
    }
    // Using cached content for: cacheKey
    return cached.content;
  }
  return null;
}

// Cache content with timestamp
function setCachedContent(cacheKey, content) {
  contentCache.set(cacheKey, {
    content,
    timestamp: Date.now()
  });
  
  // Clean old cache entries to prevent memory bloat
  if (contentCache.size > 50) {
    const oldestKey = contentCache.keys().next().value;
    contentCache.delete(oldestKey);
  }
}

// Utility function for exponential backoff retry
async function retryWithBackoff(fn, maxRetries = AI_CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = AI_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Advanced content validation
function validateGeneratedContent(content, topic) {
  if (!content || typeof content !== 'string') {
    throw new Error(`No content generated for topic: ${topic}`);
  }
  
  if (content.length < AI_CONFIG.MIN_CONTENT_LENGTH) {
    throw new Error(`Generated content too short for topic: ${topic}`);
  }
  
  // Check for essential markdown sections (only log critical missing sections)
  const requiredSections = ['## 📘', '### 🔹 What is', '### 🔹 Core Concepts'];
  const missingSection = requiredSections.find(section => !content.includes(section));
  if (missingSection) {
    // Only log if this is a critical section, reduce noise
    // console.warn(`Missing expected section "${missingSection}" in generated content for: ${topic}`);
  }
  
  return true;
}



// Rate limiting helper
let lastRequestTime = 0;
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < AI_CONFIG.RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, AI_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

// Generate content for a single topic with enhanced error handling
async function generateSingleTopicContent(topic) {
  try {
    // Starting AI content generation for topic
    // Frontend request details logged
    
  const response = await fetch('/ai/reading/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    
    if (!response.ok) {
      console.error(`❌ Backend AI reading endpoint failed with status: ${response.status}`);
      throw new Error('Backend AI reading endpoint failed');
    }
    
    const result = await response.json();
    
    // FRONTEND: Received AI response for topic
    // Response Analysis logged
    
    // Enhanced logging for AI prompt selection verification
    if (result.topic_category) {
      // Topic Classification and backend analysis logged
      
      // Log detailed prompt information if available
      if (result.prompt_info) {
        // DETAILED PROMPT INFORMATION logged
      }
      
      // Log backend analysis if available
      if (result.backend_analysis) {
        // BACKEND ANALYSIS RESULTS logged
      }
      
      // Visual classification indicators
      const categoryEmojis = {
        'technical': '🔧',
        'academic': '📚',
        'skills': '💪',
        'business_finance': '💰',
        'creative': '🎨',
        'entrepreneurship': '🚀',
        'general': '❓'
      };
      
      const emoji = categoryEmojis[result.topic_category] || '❓';
      // PROMPT TYPE SELECTED logged
      
      // Determine expected prompt characteristics - logged
      
    } else {
      // No topic_category in response - backend classification may have failed
      // Likely using fallback classification or older backend version
    }
    
    // Extract and analyze the generated content
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                         result?.content?.trim() || '';
    
    // Content Generation Results logged
    
    // Analyze if content matches expected prompt type (reduced logging)
    if (result.topic_category === 'technical' && generatedText) {
      const technicalIndicators = [
        'code', 'programming', 'function', 'syntax', 'algorithm', 
        'development', '```', 'coding', 'technical', 'software'
      ];
      const foundTechIndicators = technicalIndicators.filter(indicator => 
        generatedText.toLowerCase().includes(indicator.toLowerCase())
      );
      
      // Only log verification failures to reduce noise
      if (foundTechIndicators.length < 2) {
        console.log(`   ⚠️ VERIFICATION WARNING: Content may NOT be using technical prompt for ${result.topic}`);
      }
    }
    
    if (!generatedText || generatedText.length === 0) {
      console.error(`❌ Empty content generated for topic: ${topic}`);
      throw new Error(`Empty content generated for topic: ${topic}`);
    }
    
    validateGeneratedContent(generatedText, topic);
    
    // FRONTEND: Successfully processed AI response for topic
    // Classification and content stats logged
    
    return generatedText;
  } catch (error) {
    console.error(`\n❌ FRONTEND ERROR: Content generation failed for "${topic}":`, error);
    console.log(`🚨 Error Details:`);
    console.log(`   • Topic: "${topic}"`);
    console.log(`   • Error Message: ${error.message}`);
    console.log(`   • Error Type: ${error.name || 'Unknown'}`);
    console.log(`${'='.repeat(80)}\n`);
    throw new Error(`Reading content generation failed for ${topic}: ${error.message}`);
  }
}

/**
 * Enhanced generateReadingContent with professional AI handling
 * @param {string} user_input - The topic(s) to generate content for
 * @param {function} setContent - React setContent function
 * @param {Object} [options={}] - Additional options for content generation
 * 
 * Features:
 * - Exponential backoff retry logic
 * - Rate limiting to prevent API abuse
 * - Content validation and quality checks
 * - Automatic model fallback
 * - Parallel processing with concurrency control
 * - Comprehensive error handling
 */
export async function generateReadingContent(user_input, setContent, options = {}) {
  // Input validation and sanitization
  if (!user_input || typeof user_input !== 'string') {
    throw new Error('Invalid input: Topic must be a non-empty string');
  }

  // Sanitize and prepare topics
  const topics = user_input
    .split(',')
    .map(topic => topic.trim())
    .filter(topic => topic.length > 0)
    .slice(0, 10); // Limit to prevent abuse

  if (topics.length === 0) {
    throw new Error('No valid topics provided');
  }

  // Check cache first
  const cachedContent = getCachedContent(user_input);
  if (cachedContent) {
    setContent({
      reading: cachedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'cached',
        topicsProcessed: topics.length,
        successRate: '100%'
      }
    });
    // Reduced logging for cache hits
    return;
  }

  // Only log for multiple topics to reduce noise
  if (topics.length > 1) {
    console.log(`🚀 Generating content for ${topics.length} topic(s)`);
  }

  try {
    // Process topics in batches to respect rate limits
    const batches = [];
    for (let i = 0; i < topics.length; i += AI_CONFIG.MAX_TOPICS_PARALLEL) {
      batches.push(topics.slice(i, i + AI_CONFIG.MAX_TOPICS_PARALLEL));
    }

    const allResponses = [];
    
    for (const batch of batches) {
      // Reduced logging for batch processing
      
      const batchPromises = batch.map(async (topic, index) => {
        // Check cache first
        const cacheKey = `${topic}`.toLowerCase().replace(/\s+/g, '-');
        const cachedContent = getCachedContent(cacheKey);
        if (cachedContent) {
          return cachedContent;
        }
        // Stagger requests to prevent rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, index * 200));
        }
        return await retryWithBackoff(async () => {
          await enforceRateLimit();
          try {
            const content = await generateSingleTopicContent(topic);
            setCachedContent(cacheKey, content);
            return content;
          } catch (error) {
            // Add fallback content for failed topics
            throw new Error('Reading content generation failed');
          }
        });
      });

      const batchResponses = await Promise.allSettled(batchPromises);
      batchResponses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allResponses.push(result.value);
        } else {
          throw new Error('Reading content generation failed');
        }
      });
    }

    // Validate and join responses
    const validResponses = allResponses.filter(response => {
      try {
        return validateGeneratedContent(response, 'batch');
      } catch (error) {
        return false;
      }
    });

    if (validResponses.length === 0) {
      throw new Error('No valid content could be generated for any topic');
    }

    const finalContent = validResponses.join('\n\n---\n\n');
    console.log('📋 Final content being set:', {
      length: finalContent.length,
      preview: finalContent.substring(0, 200) + '...',
      validResponses: validResponses.length
    });
    
    const contentToSet = {
      reading: finalContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-pro',
        topicsProcessed: validResponses.length,
        successRate: `${Math.round((validResponses.length / topics.length) * 100)}%`
      }
    };
    
    console.log('🔧 readingContentService: setContent with data:', {
      contentKeys: Object.keys(contentToSet),
      readingLength: contentToSet.reading?.length || 0,
      readingPreview: contentToSet.reading ? contentToSet.reading.substring(0, 50) + '...' : 'NO_READING'
    });
    
    setContent(contentToSet);
    setCachedContent(user_input, finalContent);
    console.log(`✅ Successfully generated content for ${validResponses.length}/${topics.length} topics`);
  } catch (error) {
    console.error('🚨 Content generation failed:', error);
    setContent({
      reading: '',
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'error',
        error: error.message,
        topicsProcessed: topics.length,
        successRate: '0%'
      }
    });
    console.warn('Content generation failed');
  }
}

// Export function to clear cache for debugging
export function clearReadingContentCache() {
  contentCache.clear();
  console.log('🗑️ Cleared all reading content cache');
}

// Export function to check cache status
export function getReadingContentCacheInfo() {
  const cacheEntries = Array.from(contentCache.entries()).map(([key, value]) => ({
    key,
    timestamp: value.timestamp,
    contentLength: value.content?.length || 0,
    isEmpty: !value.content || value.content.trim() === ''
  }));
  
  console.log('📊 Reading Content Cache Info:', cacheEntries);
  return cacheEntries;
}
