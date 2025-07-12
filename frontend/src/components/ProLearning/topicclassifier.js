// topicclassifier.js
// Multi-API topic classifier with dual Gemini API key load balancing

// Get API keys from environment variables
const GEMINI_API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,     // First account
  import.meta.env.VITE_GEMINI_API_KEY_2    // Second account
].filter(key => key && key.length > 10); // Only use valid keys

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

// Rate limiting: Cache results and track API key usage
const topicCache = new Map();
const MIN_API_DELAY = 1000; // Reduced to 1 second since we have multiple keys

// Track usage for each API key to implement intelligent load balancing
const apiKeyUsage = GEMINI_API_KEYS.map((_, index) => ({
  lastUsed: 0,
  requestCount: 0,
  failures: 0,
  cooldownUntil: 0
}));

// Intelligent API key selection with load balancing
function selectBestApiKey() {
  const now = Date.now();
  const FAILURE_COOLDOWN = 30000; // 30 seconds cooldown after rate limit
  const USAGE_COOLDOWN = 5000;    // 5 seconds between uses of same key
  
  // Filter available keys (not in cooldown)
  const availableKeys = GEMINI_API_KEYS.map((key, index) => ({
    key,
    index,
    usage: apiKeyUsage[index],
    isAvailable: now > apiKeyUsage[index].cooldownUntil && 
                 (now - apiKeyUsage[index].lastUsed) > USAGE_COOLDOWN
  })).filter(keyInfo => keyInfo.isAvailable);

  if (availableKeys.length === 0) {
    // All keys are in cooldown, use the one with earliest cooldown end
    const bestKey = GEMINI_API_KEYS.map((key, index) => ({
      key, index, cooldownEnds: apiKeyUsage[index].cooldownUntil
    })).sort((a, b) => a.cooldownEnds - b.cooldownEnds)[0];
    
    console.log(`🔑 All keys in cooldown, using Key ${bestKey.index + 1} (forced)`);
    return bestKey;
  }

  // Select key with least recent usage among available keys
  const bestKey = availableKeys.sort((a, b) => 
    a.usage.lastUsed - b.usage.lastUsed
  )[0];

  console.log(`🔑 Selected API Key ${bestKey.index + 1} (${availableKeys.length} available)`);
  return bestKey;
}

// Update API key usage and handle failures
function updateApiKeyUsage(keyIndex, wasSuccessful = true, wasRateLimit = false) {
  const now = Date.now();
  apiKeyUsage[keyIndex].lastUsed = now;
  apiKeyUsage[keyIndex].requestCount++;
  
  if (wasRateLimit) {
    apiKeyUsage[keyIndex].failures++;
    apiKeyUsage[keyIndex].cooldownUntil = now + (30000 * Math.min(apiKeyUsage[keyIndex].failures, 5)); // Max 2.5 min cooldown
    console.log(`⏰ API Key ${keyIndex + 1} in cooldown until ${new Date(apiKeyUsage[keyIndex].cooldownUntil).toLocaleTimeString()}`);
  } else if (wasSuccessful) {
    apiKeyUsage[keyIndex].failures = Math.max(0, apiKeyUsage[keyIndex].failures - 1); // Reduce failure count on success
  }
}

// Helper to sleep for ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// DeepSeek API fallback for when Gemini hits rate limits
async function classifyTopicsWithDeepSeek(userInput) {
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.length < 10) {
    throw new Error('DeepSeek API key not available');
  }

  console.log('[DeepSeek] Trying DeepSeek API as fallback...');
  
  // Check cache first (using same cache key format)
  const cacheKey = userInput.trim().toLowerCase();
  if (topicCache.has(cacheKey)) {
    console.log('[Cache] Returning cached result for DeepSeek fallback:', userInput);
    return topicCache.get(cacheKey);
  }
  
  const prompt = `You are an educational topic classifier. Extract 1-5 concrete learning topics from the user input. Return only a JSON array of topic names.

Examples:
Input: "I want to learn JavaScript arrays and functions"
Output: ["JavaScript", "Arrays", "Functions"]

Input: "Teach me Python and Django"
Output: ["Python", "Django"]

Input: "hello world"
Output: []

User input: "${userInput}"
JSON array:`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  
  try {
    const topics = JSON.parse(text);
    if (Array.isArray(topics)) {
      // Cache the result before returning
      const result = topics.map((name, idx) => ({ id: idx + 1, name: name.trim(), isActive: idx === 0 }));
      topicCache.set(cacheKey, result);
      console.log('[Cache] Stored DeepSeek result for:', userInput);
      return result;
    }
  } catch (e) {
    throw new Error('Failed to parse DeepSeek response as JSON array');
  }
  
  throw new Error('DeepSeek returned invalid response format');
}

// Gemini-based topic classifier with dual API key load balancing
export async function classifyTopicsWithGemini(userInput, apiKey = null) {
  console.log('[Gemini] classifyTopicsWithGemini called with:', userInput);
  
  // Prevent API calls for empty or very short input
  if (!userInput || userInput.trim().length < 3) {
    return [];
  }

  // Check cache first
  const cacheKey = userInput.trim().toLowerCase();
  if (topicCache.has(cacheKey)) {
    console.log('[Cache] Returning cached result for:', userInput);
    return topicCache.get(cacheKey);
  }

  // Validate that we have at least one API key
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No valid Gemini API keys available. Please check your environment variables.');
  }

  console.log(`[Keys] Available Gemini API keys: ${GEMINI_API_KEYS.length}`);

  const models = ['gemini-1.5-flash']; // Use lighter model to avoid rate limits
  let lastError;

  // Try each model with intelligent key selection
  for (const model of models) {
    const maxKeyRetries = Math.min(GEMINI_API_KEYS.length, 2); // Try up to 2 different keys
    
    for (let keyAttempt = 0; keyAttempt < maxKeyRetries; keyAttempt++) {
      try {
        const selectedKey = selectBestApiKey();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${selectedKey.key}`;
        
        console.log(`[Gemini] Trying ${model} with API Key ${selectedKey.index + 1} (attempt ${keyAttempt + 1})`);

        // Rate limiting: ensure minimum delay between API calls
        const now = Date.now();
        const timeSinceLastCall = now - selectedKey.usage.lastUsed;
        if (timeSinceLastCall < MIN_API_DELAY) {
          const waitTime = MIN_API_DELAY - timeSinceLastCall;
          console.log(`[Rate Limit] Waiting ${waitTime}ms before API call...`);
          await sleep(waitTime);
        }

        const prompt = `
You are a smart educational topic classifier AI integrated into a student learning platform.

Your task: Extract 1-5 concrete learning topics from user input.
- Focus on technical subjects, programming languages, frameworks, concepts
- Return a clean JSON array of topic names only
- Use proper capitalization and standard naming
- Return empty array [] if no learning topics found
- Expand abbreviations to full names when clear (e.g., "DSA" → "Data Structures and Algorithms")
- Return between 1 to 5 *actual learning topics* only if they exist in the input.

Examples:

Input: "I want to learn HTML and CSS"  
Output: ["HTML", "CSS"]

Input: "Please help me with machine learning and data science basics"  
Output: ["Machine Learning", "Data Science"]

Input: "I wanna be a hacker and learn something"  
Output: []

Input: "Teach me React.js, TypeScript, and Node.js"  
Output: ["React.js", "TypeScript", "Node.js"]

Input: "I need Java and DSA"  
Output: ["Java", "Data Structures and Algorithms"]

Input: "Create a course for dynamic programming"  
Output: ["Dynamic Programming"]

Now classify the user input below accordingly.

User input: "${userInput}"

Topics (JSON array only):
`;

        // Add timeout (AbortController)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage += ` - ${JSON.stringify(errorData)}`;
          } catch {}
          
          if (response.status === 429) {
            // Rate limit hit - mark key as failed and try next key
            updateApiKeyUsage(selectedKey.index, false, true);
            console.log(`[Gemini] Rate limit hit for ${model} with Key ${selectedKey.index + 1}, trying different key...`);
            lastError = new Error(`Rate limit exceeded for ${model} with Key ${selectedKey.index + 1}.`);
            continue; // Try next key
          }
          
          if (response.status === 403) {
            updateApiKeyUsage(selectedKey.index, false, false);
            lastError = new Error(`API access forbidden for ${model} with Key ${selectedKey.index + 1}. Please check your API key and billing.`);
            continue; // Try next key
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        // Extract the JSON array from the model's response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        try {
          const topics = JSON.parse(text);
          if (Array.isArray(topics)) {
            // Success! Update usage and cache result
            updateApiKeyUsage(selectedKey.index, true, false);
            const result = topics.map((name, idx) => ({ id: idx + 1, name: name.trim(), isActive: idx === 0 }));
            topicCache.set(cacheKey, result);
            console.log(`[Success] Got topics using Key ${selectedKey.index + 1}:`, result.map(t => t.name));
            return result;
          }
        } catch (e) {
          updateApiKeyUsage(selectedKey.index, false, false);
          lastError = new Error(`Failed to parse ${model} response as JSON array.`);
          continue; // Try next key
        }
      } catch (error) {
        lastError = error;
      }
    }
  }

  // If all Gemini keys failed, try DeepSeek fallback
  console.log('[Fallback] All Gemini keys failed, trying DeepSeek...');
  try {
    return await classifyTopicsWithDeepSeek(userInput);
  } catch (deepseekError) {
    console.error('[Fallback] DeepSeek also failed:', deepseekError);
    throw lastError || new Error('All AI models failed to extract topics. Please wait a moment and try again with a clearer learning query.');
  }
} 