// Logic and helper functions for ProLearningPage

// Helper to split markdown into sections by '## '
export function splitMarkdownSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  let sections = [];
  let current = [];
  let header = '';
  for (let line of lines) {
    if (line.startsWith('## ')) {
      if (current.length > 0) {
        sections.push({ header, content: current.join('\n') });
      }
      header = line;
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    sections.push({ header, content: current.join('\n') });
  }
  return sections;
}

// Content generation and quiz logic (placeholders, to be filled in by parent component)
export async function generateProContent({ topic, setIsLoading, setLoadingProgress, setShowSkeletons, setLoadingStep, setContent, setStats, content }) {
  setIsLoading(true);
  setLoadingProgress(0);
  setShowSkeletons(true);
  try {
    setLoadingStep('📘 Generating comprehensive reading material...');
    setLoadingProgress(10);
    await generateReadingContent(topic, setContent);
    setLoadingStep('🧠 Creating summary and key points...');
    setLoadingProgress(30);
    await generateSummaryContent(setContent);
    setLoadingStep('🎥 Finding best educational videos...');
    setLoadingProgress(50);
    await generateVideosContent(setContent);
    setLoadingStep('✅ Designing interactive quiz questions...');
    setLoadingProgress(70);
    await generateQuizContent(setContent);
    setLoadingStep('📚 Curating additional learning resources...');
    setLoadingProgress(85);
    await generateResourcesContent(setContent);
    setLoadingStep('✨ Finalizing your learning experience...');
    setLoadingProgress(95);
    const readingWordCount = content.reading.split(' ').length;
    setStats({
      estimatedReadTime: Math.ceil(readingWordCount / 200),
      totalQuestions: content.quiz.length,
      totalVideos: content.videos.length,
      totalResources: content.resources.length,
      difficulty: readingWordCount > 1500 ? 'Advanced' : readingWordCount > 800 ? 'Intermediate' : 'Beginner',
      completionRate: 0
    });
    setLoadingProgress(100);
  } catch (error) {
    setLoadingStep('❌ Error loading content. Please refresh and try again.');
  } finally {
    setTimeout(() => {
      setIsLoading(false);
      setShowSkeletons(false);
    }, 1500);
  }
}

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
- Break down the main ideas or parts
- Use bullet points and sub-bullets for clarity
- Include any fundamental principles

### 🔹 Technical Details & Syntax
- Show relevant syntax, commands, or structures
- Use appropriate code blocks with language labels
- Explain technical specifications if applicable

### 🔹 Real-World Applications
- Describe practical uses in industry
- Give specific examples of implementations
- Mention popular tools or platforms that use this

### 🔹 Types & Variations
- Create a comparison table if there are different types
- Explain when to use each variation
- Include pros and cons

### 🔹 Practical Example
- Provide a detailed, working code example
- Include step-by-step explanation
- Show expected output or results

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
- Create proper markdown tables where needed
- Keep tone professional and educational
- No apologies, disclaimers, or meta-commentary

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
\`\`\`
// Example code structure for ${sanitizedTopic}
// This is a template - actual implementation varies
function example() {
  // Your ${sanitizedTopic} code here
  return "Hello ${sanitizedTopic}";
}
\`\`\`

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

### ✅ Learn More
Please refer to official documentation and tutorials for comprehensive information about ${topic}.
`;
}

export async function generateSummaryContent(setContent) {
  // Placeholder for summary content generation
}

export async function generateVideosContent(setContent) {
  // Placeholder for videos content generation
}

export async function generateQuizContent(setContent) {
  // Placeholder for quiz content generation
}

export async function generateResourcesContent(setContent) {
  // Placeholder for resources content generation
}

export function handleQuizAnswer(questionId, answerIndex, content, setContent, setQuizScore, setShowQuizResults) {
  setContent(prev => ({
    ...prev,
    quiz: prev.quiz.map(q =>
      q.id === questionId ? { ...q, userAnswer: answerIndex } : q
    )
  }));
  const updatedQuiz = content.quiz.map(q =>
    q.id === questionId ? { ...q, userAnswer: answerIndex } : q
  );
  const correctAnswers = updatedQuiz.filter(q => q.userAnswer === q.correct).length;
  const answeredQuestions = updatedQuiz.filter(q => q.userAnswer !== null).length;
  setQuizScore(correctAnswers);
  if (answeredQuestions === content.quiz.length) {
    setTimeout(() => setShowQuizResults(true), 500);
  }
}

export function restartQuiz(setContent, setQuizScore, setCurrentQuestionIndex, setShowQuizResults, content) {
  setContent(prev => ({
    ...prev,
    quiz: prev.quiz.map(q => ({ ...q, userAnswer: null }))
  }));
  setQuizScore(0);
  setCurrentQuestionIndex(0);
  setShowQuizResults(false);
}

export function nextQuestion(currentQuestionIndex, setCurrentQuestionIndex, content) {
  if (currentQuestionIndex < content.quiz.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }
}

export function prevQuestion(currentQuestionIndex, setCurrentQuestionIndex) {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
}

export function toggleBookmark(bookmarked, setBookmarked) {
  setBookmarked(!bookmarked);
  // Here you could save to localStorage or send to backend
}