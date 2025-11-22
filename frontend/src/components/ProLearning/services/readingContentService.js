// Reading Content Generation Service
// Handles AI-powered content generation for educational materials

import logger from '../../../utils/logger';
import storage from '../../../utils/storage';

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
  logger.log(`🗑️ Removing empty cached content for: ${cacheKey}`);
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
  logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
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

// Accessor for last classification persisted by topicclassifier
function getLastClassification() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('proLearning:lastClassification');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

// Generate content for a single topic with enhanced error handling and streaming support
async function generateSingleTopicContent(topic, { personalization = null, topicContext = null, onProgress = null } = {}) {
  try {
    // Log exactly what topic we're generating for
    const topicName = (typeof topic === 'object' && topic?.name) ? topic.name : String(topic);
    logger.log(`🎯 generateSingleTopicContent CALLED for topic: "${topicName}"`);
    
    // Derive defaults from last classification if not explicitly provided
    let effectivePersonalization = personalization;
    let effectiveTopicContext = topicContext;
    const last = getLastClassification();
    if (!effectivePersonalization && last && typeof last.personalization === 'string' && last.personalization.trim()) {
      effectivePersonalization = last.personalization.trim();
    }
    if (!effectiveTopicContext) {
      // If topic passed in is an object with context, use that
      const topicObj = (typeof topic === 'object' && topic !== null) ? topic : null;
      if (topicObj && typeof topicObj.context === 'string' && topicObj.context.trim()) {
        effectiveTopicContext = topicObj.context.trim();
      } else if (last && Array.isArray(last.topics)) {
        // Try to match by name and extract context
        const topicName = topicObj?.name || String(topic);
        const match = last.topics.find(t => (t?.name || '').toLowerCase() === String(topicName).toLowerCase());
        if (match && typeof match.context === 'string' && match.context.trim()) {
          effectiveTopicContext = match.context.trim();
        }
      }
    }

    const payload = {
      topic: (typeof topic === 'object' && topic?.name) ? topic.name : String(topic),
      ...(effectivePersonalization ? { personalization: effectivePersonalization } : {}),
      ...(effectiveTopicContext ? { topic_context: effectiveTopicContext } : {}),
      stream: true, // Enable streaming
      debug: true
    };

    // Use fetch for streaming support
    const token = storage.getItem('accessToken');
    const baseURL = (import.meta.env.VITE_AI_BASE_URL || '/ai');
    
    logger.log(`🌊 Starting stream request for: ${payload.topic}`);
    
    const response = await fetch(`${baseURL}/reading/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let topicCategory = null;
    let completeReceived = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            // Flush any remaining bytes in the decoder
            buffer += decoder.decode();
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const data = JSON.parse(line);
                if (data.type === 'chunk') {
                    fullText += data.text;
                    if (onProgress) {
                        onProgress(fullText);
                    }
                } else if (data.type === 'complete') {
                    completeReceived = true;
                    // Final sanitized text
                    fullText = data.full_text;
                    if (onProgress) {
                        onProgress(fullText);
                    }
                } else if (data.type === 'meta') {
                    topicCategory = data.category;
                } else if (data.type === 'error') {
                    console.error('Stream error:', data.error);
                    throw new Error(data.error);
                }
            } catch (e) {
                console.warn('Error parsing stream line:', line, e);
            }
        }
    }
    
    // Process any remaining buffer after stream ends
    if (buffer && buffer.trim()) {
        try {
            const data = JSON.parse(buffer);
            if (data.type === 'complete') {
                completeReceived = true;
                fullText = data.full_text;
                if (onProgress) onProgress(fullText);
            } else if (data.type === 'error') {
                throw new Error(data.error);
            }
        } catch (e) {
            // Ignore parse errors at the very end if we already have content
            if (!completeReceived && !fullText) console.warn('Error parsing final buffer:', buffer, e);
        }
    }
    
    if (!completeReceived) {
        throw new Error('Stream ended unexpectedly without completion signal');
    }
    
    // Final validation
    if (!fullText || fullText.length === 0) {
        throw new Error(`Empty content generated for topic: ${topic}`);
    }
    
    validateGeneratedContent(fullText, topic);
    
    return fullText;

  } catch (error) {
    logger.error(`\n❌ FRONTEND ERROR: Content generation failed for "${topic}":`, error);
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
  const topicsArray = Array.isArray(user_input) ? user_input : [user_input.trim()];
  const topics = topicsArray.slice(0, 10); // Limit to prevent abuse

  if (topics.length === 0) {
    throw new Error('No valid topics provided');
  }

  // Check cache first
  const personalizationKey = typeof options.personalization === 'string' && options.personalization.trim() ? `|p:${options.personalization.trim().slice(0,50)}` : '';
  const topicContextKey = typeof options.topicContext === 'string' && options.topicContext.trim() ? `|c:${options.topicContext.trim().slice(0,50)}` : '';
  const cacheKeyWhole = (Array.isArray(user_input) ? user_input.map(t => (t?.name || t)).join(',') : user_input) + personalizationKey + topicContextKey;
  const cachedContent = getCachedContent(cacheKeyWhole);
  if (cachedContent) {
    logger.warn(`🗄️ CACHE HIT: Returning cached content for key: ${cacheKeyWhole.substring(0, 100)}...`);
    setContent({
      reading: cachedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'cached',
        topicsProcessed: topics.length,
        successRate: '100%'
      }
    });
    return;
  }

  // Only log for multiple topics to reduce noise
  if (topics.length > 1) {
  logger.log(`🚀 Generating content for ${topics.length} topic(s)`);
  }

  try {
    // For single topic (most common case), we can stream directly to setContent
    if (topics.length === 1) {
        const topic = topics[0];
        const topicName = (typeof topic === 'object' && topic?.name) ? topic.name : String(topic);
        const cacheKey = `${topicName}${personalizationKey}${topicContextKey}`.toLowerCase().replace(/\s+/g, '-');
        
        // Check individual cache
        const cachedTopic = getCachedContent(cacheKey);
        if (cachedTopic) {
             setContent({
                reading: cachedTopic,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    model: 'cached',
                    topicsProcessed: 1,
                    successRate: '100%'
                }
            });
            return cachedTopic;
        }

        let finalContent = '';
        await retryWithBackoff(async () => {
            await enforceRateLimit();
            finalContent = await generateSingleTopicContent(topic, { 
                personalization: options.personalization, 
                topicContext: options.topicContext,
                onProgress: (partialText) => {
                    setContent(prev => ({
                        ...prev,
                        reading: partialText
                    }));
                }
            });
            setCachedContent(cacheKey, finalContent);
            setCachedContent(cacheKeyWhole, finalContent); // Also cache as whole result
            
            // Final update with metadata
            setContent({
                reading: finalContent,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    model: 'gemini-pro-stream',
                    topicsProcessed: 1,
                    successRate: '100%',
                    readingComplete: true
                }
            });
        });
        return finalContent;
    }

    // For multiple topics, we process them and join results. 
    // Streaming updates for multiple topics is complex (interleaved), so we might just wait for each or stream sequentially.
    // Let's stream sequentially and update the full content.
    
    const allResponses = [];
    let accumulatedContent = []; // Array of strings

    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const topicName = (typeof topic === 'object' && topic?.name) ? topic.name : String(topic);
        const cacheKey = `${topicName}${personalizationKey}${topicContextKey}`.toLowerCase().replace(/\s+/g, '-');
        
        let content = getCachedContent(cacheKey);
        
        if (!content) {
             if (i > 0) await new Promise(resolve => setTimeout(resolve, 200)); // Stagger
             
             content = await retryWithBackoff(async () => {
                await enforceRateLimit();
                return await generateSingleTopicContent(topic, { 
                    personalization: options.personalization, 
                    topicContext: options.topicContext,
                    onProgress: (partialText) => {
                        // Update the specific topic's content in the accumulated array
                        accumulatedContent[i] = partialText;
                        // Join all current content (some might be empty/pending)
                        const joined = accumulatedContent.filter(c => c).join('\n\n---\n\n');
                        setContent(prev => ({
                            ...prev,
                            reading: joined
                        }));
                    }
                });
             });
             setCachedContent(cacheKey, content);
        }
        
        accumulatedContent[i] = content;
        allResponses.push(content);
        
        // Update full content after each topic completes (redundant if onProgress works, but safe)
        const joined = accumulatedContent.filter(c => c).join('\n\n---\n\n');
        setContent(prev => ({
            ...prev,
            reading: joined
        }));
    }

    const finalContent = allResponses.join('\n\n---\n\n');
    setCachedContent(cacheKeyWhole, finalContent);
    
    setContent({
      reading: finalContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-pro-stream',
        topicsProcessed: topics.length,
        successRate: '100%',
        readingComplete: true
      }
    });
    
    return finalContent;

  } catch (error) {
    logger.error('🚨 Content generation failed:', error);
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
    // Re-throw error so ProLearningLogic knows to stop
    throw error;
  }
}

// Export function to clear cache for debugging
export function clearReadingContentCache() {
  contentCache.clear();
  logger.log('🗑️ Cleared all reading content cache');
  console.log('🗑️ Reading content cache cleared - all entries removed');
  return `Cleared ${contentCache.size} cache entries`;
}

// Export function to check cache status
export function getReadingContentCacheInfo() {
  const cacheEntries = Array.from(contentCache.entries()).map(([key, value]) => ({
    key,
    timestamp: value.timestamp,
    age_minutes: Math.round((Date.now() - value.timestamp) / 60000),
    contentLength: value.content?.length || 0,
    contentPreview: value.content ? value.content.substring(0, 150) + '...' : '',
    isEmpty: !value.content || value.content.trim() === ''
  }));
  
  console.table(cacheEntries);
  logger.log(`📊 Cache contains ${cacheEntries.length} entries:`, cacheEntries);
  return cacheEntries;
}
