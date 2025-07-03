// Reading Content Generation Service
// Handles AI-powered content generation for educational materials

// Configuration constants for AI model handling
const AI_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // Base delay in ms
  TIMEOUT: 30000, // 30 seconds
  MAX_TOPICS_PARALLEL: 3, // Prevent rate limiting
  MIN_CONTENT_LENGTH: 100,
  FALLBACK_MODELS: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  RATE_LIMIT_DELAY: 500 // Delay between requests
};

// Content caching to reduce API calls
const contentCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Get cached content if available and not expired
function getCachedContent(cacheKey) {
  const cached = contentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached content for: ${cacheKey}`);
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

// Advanced API key management with validation
function getGeminiApiKey() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('Invalid or missing Gemini API key. Please check your environment variables.');
  }
  return apiKey;
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

// Model fallback logic for when primary model fails
async function tryModelFallback(topic, apiKey, primaryModel) {
  console.log(`🔄 Trying fallback models for topic: ${topic}`);
  
  for (const fallbackModel of AI_CONFIG.FALLBACK_MODELS) {
    if (fallbackModel === primaryModel) continue; // Skip the model that already failed
    
    try {
      console.log(`🧪 Attempting with model: ${fallbackModel}`);
      const content = await generateSingleTopicContent(topic, apiKey, fallbackModel);
      console.log(`✅ Fallback successful with model: ${fallbackModel}`);
      return content;
    } catch (error) {
      console.warn(`❌ Fallback model ${fallbackModel} also failed:`, error.message);
    }
  }
  
  throw new Error(`All model fallbacks failed for topic: ${topic}`);
}

// Advanced content validation
function validateGeneratedContent(content, topic) {
  if (!content || typeof content !== 'string') {
    throw new Error(`No content generated for topic: ${topic}`);
  }
  
  if (content.length < AI_CONFIG.MIN_CONTENT_LENGTH) {
    throw new Error(`Generated content too short for topic: ${topic}`);
  }
  
  // Check for essential markdown sections
  const requiredSections = ['## 📘', '### 🔹 What is', '### 🔹 Core Concepts'];
  const missingSection = requiredSections.find(section => !content.includes(section));
  if (missingSection) {
    console.warn(`Missing expected section "${missingSection}" in generated content for: ${topic}`);
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
async function generateSingleTopicContent(topic, apiKey, model) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const prompt = createOptimizedPrompt(topic);
  
  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      stopSequences: []
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProLearning-Platform/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      } catch (e) {
        // Ignore JSON parse errors for error response
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Enhanced response validation
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API response structure:', result);
      throw new Error('API returned invalid response structure');
    }

    const generatedText = result.candidates[0].content.parts[0].text.trim();
    
    // Validate content quality
    validateGeneratedContent(generatedText, topic);
    
    return generatedText;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for topic: ${topic}`);
    }
    
    // Handle specific API errors
    if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.message.includes('403')) {
      throw new Error('API key invalid or insufficient permissions.');
    }
    
    throw error;
  }
}

// Create optimized prompt with better structure
function createOptimizedPrompt(topic) {
  return `
You are an expert educational content creator specializing in technical topics. Generate comprehensive, engaging learning material.

**Topic**: ${topic}

**Requirements**: Create a detailed markdown guide that follows this exact structure:

## 📘 ${topic}: Complete Learning Guide

### 🔹 What is ${topic}?
- Provide a clear, beginner-friendly definition
- Explain why this topic is important
- Give context about where it fits in the broader field

### 🔹 Core Concepts & Components  
- Break down the main ideas or parts with detailed explanations
- Use bullet points and sub-bullets for clarity with examples
- Include any fundamental principles with practical context
- Explain the relationship between different components
- Provide visual analogies or metaphors where helpful
- Detail the hierarchy or structure of concepts
- Include prerequisites or foundational knowledge needed
- Explain how each component contributes to the whole system
- Add sub-sections for complex topics:
  * **Primary Components**: Essential building blocks
  * **Secondary Elements**: Supporting features or advanced concepts
  * **Integration Points**: How components work together
  * **Dependencies**: What relies on what
- Use numbered lists for sequential concepts
- Include brief code snippets or examples for each major concept
- Explain common terminology and jargon
- Add "Deep Dive" sub-sections for complex components

### 🔹 Technical Details & Syntax
- Show relevant syntax, commands, or structures with detailed examples and explanations
- Use clean, professional code blocks with proper language labels
- Include multiple code examples with clear section headers and descriptions
- Add comprehensive comments within code for better understanding
- Show both basic and advanced syntax variations with clean formatting
- Provide step-by-step syntax breakdown with line-by-line explanations
- Include parameter descriptions and return value explanations
- Add error handling examples and common pitfalls to avoid
- Show alternative syntax approaches and when to use each
- Include interactive examples with "Try this:" sections
- Add syntax comparison tables for different approaches
- Provide debugging examples and troubleshooting tips
- Include performance considerations for different syntax choices
- Add IDE/editor configuration tips for better syntax highlighting
- Show integration examples with popular frameworks or libraries
- Include command-line usage examples where applicable
- Add configuration file examples and setup instructions
- Provide cross-platform syntax differences if applicable
- Include version-specific syntax variations and compatibility notes
- Add code optimization examples and best practices

### 🔹 Real-World Applications
- Describe practical uses in industry
- Give specific examples of implementations
- Mention popular tools or platforms that use this

### 🔹 Types & Variations
- Create a well-formatted comparison table with proper markdown syntax
- Use exactly this table format with proper pipe separators and spacing
- Ensure each table row starts and ends with proper pipe symbols
- Use clear column headers with consistent formatting: Type | Description | Pros | Cons | Use Cases
- Explain when to use each variation with detailed descriptions and use cases
- Include pros and cons in separate columns with specific examples
- Ensure proper spacing between pipes and content (single space on each side)
- Add performance comparisons between different types where applicable
- Include scalability considerations for each variation
- Provide cost-benefit analysis for different approaches
- Add compatibility information with different systems or frameworks
- Include learning curve difficulty for each type
- Show code examples or syntax differences for each variation
- Add industry adoption rates and popularity metrics where relevant
- Include historical evolution of different types
- Provide decision-making criteria to help choose between variations
- Add migration paths between different types if applicable
- Include maintenance requirements for each variation
- Show resource requirements (memory, CPU, storage) for different types
- Add security considerations specific to each variation
- Include version compatibility and support lifecycle information
- Provide community support and documentation quality for each type
- CRITICAL: Always use proper markdown table syntax with correct pipe placement and spacing

### 🔹 Practical Example
- Provide multiple detailed, working code examples with clear titles
- Include step-by-step explanation with line-by-line comments
- Show expected output or results in separate code blocks
- Add "Try this:" sections with interactive examples
- Include both beginner and advanced code samples

### 🔹 Common Challenges & Solutions
- List frequent problems beginners encounter
- Provide solutions and best practices
- Include debugging tips

### ✅ Hands-On Practice
- Design a practical exercise
- Include clear instructions and expected outcomes
- Provide hints for completion

**Formatting Rules**:
- Use \`##\` and \`###\` for all headers
- Code blocks must specify language: \`\`\`python, \`\`\`javascript, etc.
- Use **bold** for important terms
- Create proper markdown tables where needed with this EXACT format:
  * Header row: | Column1 | Column2 | Column3 |
  * Separator row: |---------|---------|---------|
  * Data rows: | Data1 | Data2 | Data3 |
- Use consistent spacing and alignment in tables (single space after each pipe)
- Ensure table headers are clear and descriptive
- Format table content with proper column alignment
- Each table row must start and end with a pipe symbol |
- Keep tone professional and educational
- No apologies, disclaimers, or meta-commentary
- For code examples, always include:
  * Clear descriptive titles before each code block
  * Detailed inline comments explaining each line
  * Expected output in separate clean \`\`\` blocks (no special formatting)
  * Multiple examples showing different use cases
  * Copy-paste ready code that actually works

**Code Block Enhancement Rules**:
- Start each code section with clear, descriptive titles
- Add comprehensive comments within code for clarity
- Show input and output separately with clean formatting
- Include error handling examples where relevant
- Provide multiple difficulty levels with clean progression
- Use consistent indentation and professional code style
- Keep code examples practical and immediately usable

Generate only the markdown content. Be comprehensive but concise.
`;
}

// Enhanced fallback content generator
function generateEnhancedFallbackContent(topic, errorMessage) {
  const sanitizedTopic = topic.replace(/[^\w\s-]/g, '').trim();
  
  return `
## 📘 ${sanitizedTopic}: Learning Guide

### 🔹 What is ${sanitizedTopic}?
${sanitizedTopic} is an important concept in its field. This guide will help you understand the fundamentals and practical applications.

### 🔹 Core Concepts
- **Definition**: The basic principles of ${sanitizedTopic}
- **Purpose**: Why ${sanitizedTopic} is used and its benefits
- **Components**: Main parts or elements involved

### 🔹 Getting Started

#### Basic Structure

\`\`\`javascript
// Example code structure for ${sanitizedTopic}
// This is a template - actual implementation varies
function example() {
  // Your ${sanitizedTopic} code here
  console.log("Hello ${sanitizedTopic}!");
  return "Hello ${sanitizedTopic}";
}

// Call the function
example();
\`\`\`

**Output:**
\`\`\`
Hello ${sanitizedTopic}!
\`\`\`

**Instructions:** Copy the code above and run it in your environment to see the output.

### 🔹 Real-World Usage
${sanitizedTopic} is commonly used in:
- Software development projects
- Educational applications  
- Industry solutions
- Research and development

### 🔹 Learning Resources
| Resource Type | Description |
|---------------|-------------|
| Documentation | Official guides and references |
| Tutorials | Step-by-step learning materials |
| Community | Forums and discussion groups |
| Practice | Hands-on exercises and projects |

### ✅ Next Steps
1. Research official documentation for ${sanitizedTopic}
2. Find relevant tutorials and examples
3. Practice with simple exercises
4. Join community discussions

---
*Note: This is fallback content. For detailed information, please check your internet connection and try again.*
*Error details: ${errorMessage}*
`;
}

// Simple fallback for individual topic failures
function generateFallbackContent(topic) {
  return `
## 📘 ${topic}: Quick Overview

### 🔹 About ${topic}
This topic covers important concepts related to ${topic}. 

### 🔹 Key Points
- Understanding the basics
- Practical applications
- Best practices

### 💻 Basic Example

#### Getting Started with ${topic}

\`\`\`javascript
// Basic ${topic} example
// Replace this with actual ${topic} code
function ${topic.toLowerCase().replace(/\s+/g, '')}Example() {
  console.log("Learning ${topic}!");
  // Add your ${topic} logic here
  return "Success!";
}

// Run the example
${topic.toLowerCase().replace(/\s+/g, '')}Example();
\`\`\`

**Output:**
\`\`\`
Learning ${topic}!
\`\`\`

### ✅ Learn More
Please refer to official documentation and tutorials for comprehensive information about ${topic}.

**Instructions:** Look for interactive examples and hands-on tutorials to practice ${topic}.
`;
}

/**
 * Enhanced generateReadingContent with professional AI handling
 * @param {string} user_input - The topic(s) to generate content for
 * @param {function} setContent - React setContent function
 * @param {string} [model='gemini-1.5-pro'] - Gemini model to use
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
export async function generateReadingContent(user_input, setContent, model = 'gemini-1.5-pro', options = {}) {
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
    setContent((prev) => ({
      ...prev,
      reading: cachedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'cached',
        topicsProcessed: topics.length,
        successRate: '100%'
      }
    }));
    console.log(`📦 Served from cache: ${user_input}`);
    return;
  }

  console.log(`🚀 Generating content for ${topics.length} topic(s) using model: ${model}`);

  try {
    const apiKey = getGeminiApiKey();
    
    // Process topics in batches to respect rate limits
    const batches = [];
    for (let i = 0; i < topics.length; i += AI_CONFIG.MAX_TOPICS_PARALLEL) {
      batches.push(topics.slice(i, i + AI_CONFIG.MAX_TOPICS_PARALLEL));
    }

    const allResponses = [];
    
    for (const batch of batches) {
      console.log(`📝 Processing batch of ${batch.length} topics...`);
      
      const batchPromises = batch.map(async (topic, index) => {
        // Check cache first
        const cacheKey = `${topic}-${model}`.toLowerCase().replace(/\s+/g, '-');
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
            const content = await generateSingleTopicContent(topic, apiKey, model);
            // Cache successful content
            setCachedContent(cacheKey, content);
            return content;
          } catch (error) {
            // Try model fallback before giving up
            console.warn(`Primary model failed for ${topic}, trying fallbacks...`);
            const fallbackContent = await tryModelFallback(topic, apiKey, model);
            setCachedContent(cacheKey, fallbackContent);
            return fallbackContent;
          }
        });
      });

      const batchResponses = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResponses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allResponses.push(result.value);
        } else {
          console.error(`Failed to generate content for topic: ${batch[index]}`, result.reason);
          // Add fallback content for failed topics
          allResponses.push(generateFallbackContent(batch[index]));
        }
      });
    }

    // Validate and join responses
    const validResponses = allResponses.filter(response => {
      try {
        return validateGeneratedContent(response, 'batch');
      } catch (error) {
        console.warn('Invalid response filtered out:', error.message);
        return false;
      }
    });

    if (validResponses.length === 0) {
      throw new Error('No valid content could be generated for any topic');
    }

    const finalContent = validResponses.join('\n\n---\n\n');
    
    // Update content with success metrics
    setContent((prev) => ({
      ...prev,
      reading: finalContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: model,
        topicsProcessed: topics.length,
        successRate: (validResponses.length / topics.length * 100).toFixed(1) + '%'
      }
    }));

    // Cache the successful content
    setCachedContent(user_input, finalContent);

    console.log(`✅ Successfully generated content for ${validResponses.length}/${topics.length} topics`);

  } catch (error) {
    console.error('🚨 Content generation failed:', error);
    
    // Enhanced fallback with user-friendly content
    const fallbackContent = generateEnhancedFallbackContent(user_input, error.message);
    setContent((prev) => ({
      ...prev,
      reading: fallbackContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'fallback',
        error: error.message,
        topicsProcessed: topics.length,
        successRate: '0%'
      }
    }));
    
    // Don't throw error to prevent UI breaking
    console.warn('Using fallback content due to generation failure');
  }
}
