// Topic Classifier with Dual API Key Support and Rate Limiting
// Extracts topics from user queries using AI and returns structured data

// API Key Management and Load Balancing System
let apiKeyUsage = {
  key1: { requests: 0, lastReset: Date.now(), isBlocked: false, blockUntil: 0 },
  key2: { requests: 0, lastReset: Date.now(), isBlocked: false, blockUntil: 0 }
};

const MAX_REQUESTS_PER_HOUR = 50; // Conservative limit per key
const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes cooldown after rate limit

// Request queue for throttling
let requestQueue = [];
let isProcessingQueue = false;

// Cache for topic classification to reduce API calls
const topicCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Select the best available API key based on usage and availability
 */
const selectBestApiKey = () => {
  const now = Date.now();
  const key1 = import.meta.env.VITE_GEMINI_API_KEY;
  const key2 = import.meta.env.VITE_GEMINI_API_KEY_2;
  
  // Reset hourly counters if needed
  if (now - apiKeyUsage.key1.lastReset > 60 * 60 * 1000) {
    apiKeyUsage.key1.requests = 0;
    apiKeyUsage.key1.lastReset = now;
  }
  if (now - apiKeyUsage.key2.lastReset > 60 * 60 * 1000) {
    apiKeyUsage.key2.requests = 0;
    apiKeyUsage.key2.lastReset = now;
  }
  
  // Check if keys are blocked and unblock if cooldown period has passed
  if (apiKeyUsage.key1.isBlocked && now > apiKeyUsage.key1.blockUntil) {
    apiKeyUsage.key1.isBlocked = false;
  }
  if (apiKeyUsage.key2.isBlocked && now > apiKeyUsage.key2.blockUntil) {
    apiKeyUsage.key2.isBlocked = false;
  }
  
  // Select key with lowest usage that's not blocked
  if (!apiKeyUsage.key1.isBlocked && apiKeyUsage.key1.requests < MAX_REQUESTS_PER_HOUR) {
    if (!apiKeyUsage.key2.isBlocked && apiKeyUsage.key2.requests < MAX_REQUESTS_PER_HOUR) {
      // Both available, choose the one with fewer requests
      return apiKeyUsage.key1.requests <= apiKeyUsage.key2.requests ? 
        { key: key1, id: 'key1' } : { key: key2, id: 'key2' };
    }
    return { key: key1, id: 'key1' };
  }
  
  if (!apiKeyUsage.key2.isBlocked && apiKeyUsage.key2.requests < MAX_REQUESTS_PER_HOUR) {
    return { key: key2, id: 'key2' };
  }
  
  // Both keys are either blocked or at limit
  throw new Error('All API keys are currently rate limited. Please try again later.');
};

/**
 * Update API key usage tracking
 */
const updateApiKeyUsage = (keyId, wasRateLimited = false) => {
  if (apiKeyUsage[keyId]) {
    apiKeyUsage[keyId].requests++;
    if (wasRateLimited) {
      apiKeyUsage[keyId].isBlocked = true;
      apiKeyUsage[keyId].blockUntil = Date.now() + COOLDOWN_PERIOD;
    }
  }
};

/**
 * Add delay between requests to prevent overwhelming the API
 */
const addRequestDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Process request queue to throttle API calls
 */
const processRequestQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, requestFn } = requestQueue.shift();
    
    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Add delay between requests
    if (requestQueue.length > 0) {
      await addRequestDelay(2000); // 2 second delay between requests
    }
  }
  
  isProcessingQueue = false;
};

/**
 * Queue a request to be processed with throttling
 */
const queueRequest = (requestFn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, requestFn });
    processRequestQueue();
  });
};

/**
 * Call Gemini API with enhanced error handling and rate limiting
 */
const callGeminiAPI = async (message, retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    const { key: apiKey, id: keyId } = selectBestApiKey();
    
    if (!apiKey) {
      throw new Error('No Gemini API key available');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: message }]
          }]
        })
      }
    );

    if (response.status === 429) {
      // Rate limited
      updateApiKeyUsage(keyId, true);
      
      if (retryCount < maxRetries) {
        console.log(`Rate limited on ${keyId}, retrying with different key... (attempt ${retryCount + 1})`);
        await addRequestDelay(Math.pow(2, retryCount) * 2000); // Exponential backoff
        return await callGeminiAPI(message, retryCount + 1);
      } else {
        throw new Error('Rate limited on all available API keys');
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    updateApiKeyUsage(keyId, false);
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    if (error.message.includes('rate limited') && retryCount < maxRetries) {
      console.log(`API error, retrying... (attempt ${retryCount + 1})`);
      await addRequestDelay(Math.pow(2, retryCount) * 2000);
      return await callGeminiAPI(message, retryCount + 1);
    }
    throw error;
  }
};

/**
 * Fallback to DeepSeek API when Gemini keys are exhausted
 */
const callDeepSeekAPI = async (message) => {
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not available');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Main function to classify topics from user query using AI
 * Returns structured topic data with proper formatting
 */
export const classifyTopicsWithGemini = async (userQuery) => {
  if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
    throw new Error('Invalid user query provided');
  }

  // Check cache first
  const cacheKey = userQuery.toLowerCase().trim();
  const cached = topicCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached topic classification');
    return cached.data;
  }

  const prompt = `Analyze this user query and extract 3-5 relevant learning topics that would help them. 
  
User Query: "${userQuery}"

Return ONLY a JSON array of topics in this exact format:
[
  {"id": 1, "name": "Topic Name", "isActive": true},
  {"id": 2, "name": "Another Topic", "isActive": true}
]

Rules:
- Extract topics that are specific, actionable, and educational
- Each topic should be 1-4 words maximum
- Focus on concrete skills, technologies, or concepts
- Ensure topics are relevant to the user's query
- Return exactly 3-5 topics
- Use proper JSON formatting
- Do not include any explanation or additional text`;

  try {
    // Queue the request to prevent overwhelming the API
    const response = await queueRequest(() => callGeminiAPI(prompt));
    
    // Parse the JSON response
    const cleanedResponse = response.trim();
    let topics;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        topics = JSON.parse(cleanedResponse);
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini response, trying DeepSeek...', parseError);
      
      // Fallback to DeepSeek
      const deepSeekResponse = await callDeepSeekAPI(prompt);
      const deepSeekJsonMatch = deepSeekResponse.match(/\[[\s\S]*\]/);
      if (deepSeekJsonMatch) {
        topics = JSON.parse(deepSeekJsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Validate the response structure
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid topics array received from AI');
    }

    // Ensure proper structure and add missing properties
    const validatedTopics = topics.map((topic, index) => ({
      id: topic.id || (index + 1),
      name: topic.name || topic.topic || 'Unknown Topic',
      isActive: typeof topic.isActive === 'boolean' ? topic.isActive : true
    })).filter(topic => topic.name !== 'Unknown Topic');

    if (validatedTopics.length === 0) {
      throw new Error('No valid topics extracted from AI response');
    }

    // Cache the result
    topicCache.set(cacheKey, {
      data: validatedTopics,
      timestamp: Date.now()
    });

    console.log('Successfully classified topics:', validatedTopics);
    return validatedTopics;

  } catch (error) {
    console.error('Error in topic classification:', error);
    
    // Return fallback topics based on common keywords in the query
    const fallbackTopics = generateFallbackTopics(userQuery);
    
    // Cache fallback topics for a shorter duration
    topicCache.set(cacheKey, {
      data: fallbackTopics,
      timestamp: Date.now() - (CACHE_DURATION * 0.8) // Shorter cache for fallbacks
    });
    
    return fallbackTopics;
  }
};

/**
 * Generate fallback topics when AI classification fails
 */
const generateFallbackTopics = (userQuery) => {
  const query = userQuery.toLowerCase();
  const fallbackTopics = [];
  let id = 1;

  // Common programming topics mapping
  const topicMapping = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'python': 'Python',
    'react': 'React',
    'html': 'HTML',
    'css': 'CSS',
    'node': 'Node.js',
    'api': 'APIs',
    'database': 'Databases',
    'sql': 'SQL',
    'web': 'Web Development',
    'mobile': 'Mobile Development',
    'ai': 'Artificial Intelligence',
    'machine learning': 'Machine Learning',
    'data': 'Data Science',
    'algorithm': 'Algorithms',
    'programming': 'Programming',
    'coding': 'Coding',
    'software': 'Software Development'
  };

  // Find matching topics
  for (const [keyword, topic] of Object.entries(topicMapping)) {
    if (query.includes(keyword) && !fallbackTopics.some(t => t.name === topic)) {
      fallbackTopics.push({
        id: id++,
        name: topic,
        isActive: true
      });
    }
  }

  // If no matches found, provide generic programming topics
  if (fallbackTopics.length === 0) {
    return [
      { id: 1, name: 'Programming', isActive: true },
      { id: 2, name: 'Web Development', isActive: true },
      { id: 3, name: 'Problem Solving', isActive: true }
    ];
  }

  return fallbackTopics.slice(0, 5); // Limit to 5 topics
};

/**
 * Get current API key usage statistics
 */
export const getApiKeyUsage = () => {
  return {
    key1: { ...apiKeyUsage.key1 },
    key2: { ...apiKeyUsage.key2 },
    queueLength: requestQueue.length,
    cacheSize: topicCache.size
  };
};

/**
 * Clear the topic classification cache
 */
export const clearTopicCache = () => {
  topicCache.clear();
  console.log('Topic classification cache cleared');
};

// Export default for backward compatibility
export default classifyTopicsWithGemini;