// Resources Content Generation Service
// Handles generating additional learning resources, links, and materials

// Cache for storing resources to avoid repeated API calls
const resourcesCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Generate additional learning resources for the given topic
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to find resources for
 * @param {Object} options - Additional options for resource generation
 */
export async function generateResourcesContent(setContent, topic = '', options = {}) {
  console.log('📚 Curating additional learning resources...');
  
  if (!topic || topic.trim().length === 0) {
    console.warn('⚠️ No topic provided for resource generation');
    setContent((prev) => ({
      ...prev,
      resources: [],
      resourcesMetadata: {
        generatedAt: new Date().toISOString(),
        totalResources: 0,
        error: 'No topic provided'
      }
    }));
    return;
  }

  const cacheKey = `${topic.toLowerCase()}_${JSON.stringify(options)}`;
  
  // Check cache first
  if (resourcesCache.has(cacheKey)) {
    const cached = resourcesCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached resources');
      setContent((prev) => ({
        ...prev,
        resources: cached.resources,
        resourcesMetadata: {
          ...cached.metadata,
          fromCache: true
        }
      }));
      return;
    }
  }
  
  try {
    // Generate comprehensive resources
    const resourcesContent = await generateCuratedResources(topic, options);
    
    // Validate and deduplicate resources
    const validatedResources = validateAndDeduplicateResources(resourcesContent);
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalResources: validatedResources.length,
      categories: extractResourceCategories(validatedResources),
      types: extractResourceTypes(validatedResources),
      topic: topic,
      fromCache: false
    };
    
    // Cache the results
    resourcesCache.set(cacheKey, {
      resources: validatedResources,
      metadata: metadata,
      timestamp: Date.now()
    });
    
    setContent((prev) => ({
      ...prev,
      resources: validatedResources,
      resourcesMetadata: metadata
    }));
    
    console.log(`✅ Curated ${validatedResources.length} learning resources`);
    
  } catch (error) {
    console.error('🚨 Resources generation failed:', error);
    
    // Use fallback resources on error
    const fallbackResources = generateFallbackResources(topic);
    const metadata = {
      generatedAt: new Date().toISOString(),
      type: 'fallback',
      totalResources: fallbackResources.length,
      error: error.message,
      topic: topic
    };
    
    setContent((prev) => ({
      ...prev,
      resources: fallbackResources,
      resourcesMetadata: metadata
    }));
  }
}

// Generate curated resources based on topic
async function generateCuratedResources(topic, options = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ No API key available, using fallback resources');
    return generateFallbackResources(topic);
  }

  try {
    // Rate limiting check
    await checkRateLimit();
    
    const resourcesPrompt = createResourcesPrompt(topic, options);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: resourcesPrompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 4096, // Increased for more resources
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
      ],
      signal: controller.signal
    };

    try {
      const resourcesText = await tryGeminiModels(requestBody, apiKey);
      clearTimeout(timeoutId);
      if (resourcesText.length < 100) {
        throw new Error('Resources response too short, likely incomplete');
      }
      return parseResourceRecommendations(resourcesText, topic);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Resources API request timed out, using fallback');
    } else {
      console.warn('AI resources generation failed, using fallback:', error.message);
    }
    return generateFallbackResources(topic);
  }
}

// Simple rate limiting mechanism
let lastApiCall = 0;
const MIN_API_INTERVAL = 1000; // 1 second between calls

async function checkRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    const waitTime = MIN_API_INTERVAL - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCall = Date.now();
}

// Create optimized prompt for resources generation
function createResourcesPrompt(topic, options = {}) {
  const {
    difficulty = 'all',
    resourceCount = 4, // Changed from 15 to 4 for better quality
    includeFreePaid = 'both',
    focus = 'general'
  } = options;

  const difficultyGuidance = difficulty === 'all' 
    ? 'Include resources for all skill levels (beginner to advanced)'
    : `Focus primarily on ${difficulty} level resources`;
    
  const freeGuidance = includeFreePaid === 'free'
    ? 'Prioritize free resources only'
    : includeFreePaid === 'paid'
    ? 'Include premium/paid resources for higher quality'
    : 'Mix of both free and premium resources';
    
  const focusGuidance = focus === 'practical'
    ? 'Emphasize hands-on, project-based learning resources'
    : focus === 'theoretical'
    ? 'Focus on conceptual understanding and academic resources'
    : 'Balanced mix of theoretical and practical resources';

  return `
You are an expert educational resource curator with deep knowledge of learning platforms, documentation, and educational content. Recommend EXACTLY 4 TOP-QUALITY learning resources for the topic: "${topic}"

**CRITICAL REQUIREMENTS:**
- Provide EXACTLY ${resourceCount} resources (no more, no less)
- ${difficultyGuidance}
- ${freeGuidance}
- ${focusGuidance}
- Only recommend HIGH-QUALITY, well-maintained, and reputable sources
- Prioritize official documentation, popular tutorials, and trusted platforms
- Each resource must offer unique value and serve different learning needs

**Required Format for each recommendation:**
TITLE: [Specific, descriptive resource title]
TYPE: [Documentation/Tutorial/Course/Tool/Library/Book/Article/Practice/Community/Reference/Video/Certification]
DESCRIPTION: [2-3 sentences describing the resource's unique value, target audience, and key features]
URL: [Specific URL or platform name - be as accurate as possible]
DIFFICULTY: [Beginner/Intermediate/Advanced/All Levels]
FREE: [Yes/No/Freemium]
RATING: [High/Medium/Good]
TAGS: [3-5 relevant, specific tags separated by commas]

**Resource Distribution (EXACTLY 4 resources):**
1. **Official Documentation** (1 resource)
   - The primary official documentation or API reference
2. **Interactive Learning** (1 resource)
   - High-quality tutorial, interactive platform, or guided learning
3. **Comprehensive Course/Book** (1 resource)
   - Structured learning path, popular course, or authoritative book
4. **Practical Tool/Community** (1 resource)
   - Development tool, practice platform, or active community

**Quality Criteria:**
- Must be current and actively maintained (prefer resources updated within last 2 years)
- From authoritative sources (official docs, respected authors, established platforms)
- High community engagement and positive reviews
- Comprehensive coverage of the topic
- Professional and well-organized content

**Example Format:**
TITLE: ${topic} Official Documentation
TYPE: Documentation
DESCRIPTION: Comprehensive official documentation covering all aspects of ${topic}. Includes detailed API references, getting started guides, and best practices. Regularly updated by the core team and considered the authoritative source.
URL: https://docs.${topic.toLowerCase().replace(/\s+/g, '')}.org
DIFFICULTY: All Levels
FREE: Yes
RATING: High
TAGS: Official, Documentation, Reference, Comprehensive, Authoritative

Generate EXACTLY ${resourceCount} high-quality resources following this format. Each resource must be distinct and serve a different learning purpose.
`;
}

// Helper function to extract field values from text lines
function extractFieldValue(line, fieldName) {
  const parts = line.split(':');
  if (parts.length >= 2) {
    return parts.slice(1).join(':').trim();
  }
  return '';
}

// Parse AI-generated resource recommendations
function parseResourceRecommendations(resourcesText, topic) {
  try {
    const resourceBlocks = resourcesText.split(/TITLE:/i).filter(block => block.trim().length > 0);
    const resources = [];
    
    resourceBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const resource = {
        id: `resource_${Date.now()}_${index}`, // More unique ID
        title: '',
        type: 'Article',
        description: '',
        url: '',
        difficulty: 'Beginner',
        free: true,
        rating: 'Good',
        tags: [],
        category: 'Learning',
        validatedAt: new Date().toISOString()
      };
      
      // Extract title (first non-empty line that doesn't contain colons)
      const firstLine = lines[0]?.trim();
      if (firstLine && firstLine.length > 0 && !firstLine.includes(':')) {
        resource.title = firstLine;
      }
      
      lines.forEach(line => {
        const cleanLine = line.trim();
        
        // Skip empty lines and the title line
        if (!cleanLine || cleanLine === resource.title) return;
        
        if (cleanLine.toUpperCase().startsWith('TYPE:')) {
          resource.type = extractFieldValue(cleanLine, 'TYPE');
        } else if (cleanLine.toUpperCase().startsWith('DESCRIPTION:')) {
          resource.description = extractFieldValue(cleanLine, 'DESCRIPTION');
        } else if (cleanLine.toUpperCase().startsWith('URL:')) {
          resource.url = extractFieldValue(cleanLine, 'URL');
        } else if (cleanLine.toUpperCase().startsWith('DIFFICULTY:')) {
          resource.difficulty = extractFieldValue(cleanLine, 'DIFFICULTY');
        } else if (cleanLine.toUpperCase().startsWith('FREE:')) {
          const freeStatus = extractFieldValue(cleanLine, 'FREE').toLowerCase();
          resource.free = freeStatus === 'yes' || freeStatus === 'true' || freeStatus === 'freemium';
        } else if (cleanLine.toUpperCase().startsWith('RATING:')) {
          resource.rating = extractFieldValue(cleanLine, 'RATING');
        } else if (cleanLine.toUpperCase().startsWith('TAGS:')) {
          const tagString = extractFieldValue(cleanLine, 'TAGS');
          resource.tags = tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
      });
      
      // Validate and clean up the resource
      if (validateResource(resource, topic)) {
        // Set title if still empty
        if (!resource.title) {
          resource.title = generateResourceTitle(topic, resource.type, index);
        }
        
        // Set category based on type
        resource.category = categorizeResource(resource.type);
        
        // Set placeholder URL if none provided or invalid
        if (!resource.url || resource.url === 'URL:' || !isValidUrl(resource.url)) {
          resource.url = generateResourceUrl(topic, resource.type);
        }
        
        // Ensure we have tags
        if (resource.tags.length === 0) {
          resource.tags = generateDefaultTags(topic, resource.type, resource.difficulty);
        }
        
        // Clean up description
        if (resource.description.length > 300) {
          resource.description = resource.description.substring(0, 297) + '...';
        }
        
        resources.push(resource);
      }
    });
    
    // Remove duplicates and limit results to 4-5 resources
    const deduplicatedResources = deduplicateResources(resources);
    return deduplicatedResources.slice(0, 4); // Limit to 4 high-quality resources
    
  } catch (error) {
    console.warn('Failed to parse resource recommendations:', error);
    return generateFallbackResources(topic);
  }
}

// Deduplicate resources based on title and URL similarity
function deduplicateResources(resources) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const resource of resources) {
    // Create a key based on normalized title and URL
    const titleKey = resource.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const urlKey = resource.url.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${titleKey}_${urlKey}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(resource);
    }
  }
  
  return deduplicated;
}

// Validate individual resource
function validateResource(resource, topic) {
  // Must have title and description
  if (!resource.title && !resource.description) {
    return false;
  }
  
  // Description should be meaningful
  if (resource.description && resource.description.length < 20) {
    return false;
  }
  
  // Type should be valid
  const validTypes = ['Documentation', 'Tutorial', 'Course', 'Tool', 'Library', 'Book', 'Article', 'Practice', 'Community', 'Reference', 'Video', 'Certification'];
  if (!validTypes.includes(resource.type)) {
    resource.type = 'Article'; // Default fallback
  }
  
  return true;
}

// Validate and deduplicate resources
function validateAndDeduplicateResources(resources) {
  if (!resources || !Array.isArray(resources)) {
    return [];
  }
  
  // Filter out invalid resources
  const validResources = resources.filter(resource => {
    return resource && 
           typeof resource === 'object' &&
           resource.title && 
           resource.description &&
           resource.title.length > 0 &&
           resource.description.length > 10;
  });
  
  // Deduplicate
  const deduplicated = deduplicateResources(validResources);
  
  // Sort by rating and type for better presentation
  return deduplicated.sort((a, b) => {
    const ratingOrder = { 'High': 3, 'Medium': 2, 'Good': 1 };
    const ratingDiff = (ratingOrder[b.rating] || 1) - (ratingOrder[a.rating] || 1);
    
    if (ratingDiff !== 0) return ratingDiff;
    
    // Secondary sort by type importance
    const typeOrder = { 
      'Documentation': 7, 'Course': 6, 'Tutorial': 5, 
      'Tool': 4, 'Book': 3, 'Practice': 2, 'Community': 1 
    };
    return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
  });
}

// Check if URL is valid format
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Allow both full URLs and platform names
    return url.includes('.') || url.length > 5;
  } catch {
    return false;
  }
}

// Generate default tags for resources
function generateDefaultTags(topic, type, difficulty) {
  const baseTags = [topic.toLowerCase()];
  
  if (type) baseTags.push(type.toLowerCase());
  if (difficulty && difficulty !== 'All Levels') baseTags.push(difficulty.toLowerCase());
  
  // Add contextual tags based on type
  const contextualTags = {
    'Documentation': ['reference', 'official'],
    'Tutorial': ['hands-on', 'learning'],
    'Course': ['structured', 'comprehensive'],
    'Tool': ['development', 'productivity'],
    'Book': ['in-depth', 'theory'],
    'Practice': ['coding', 'exercises'],
    'Community': ['support', 'discussion']
  };
  
  if (contextualTags[type]) {
    baseTags.push(...contextualTags[type]);
  }
  
  return baseTags.slice(0, 5); // Limit to 5 tags
}

// Generate meaningful resource titles
function generateResourceTitle(topic, type, index) {
  const templates = {
    'Documentation': `${topic} Official Documentation`,
    'Tutorial': `Learn ${topic} - Step by Step Tutorial`,
    'Course': `Complete ${topic} Course`,
    'Tool': `${topic} Development Tools`,
    'Book': `${topic} Programming Guide`,
    'Practice': `${topic} Coding Challenges`,
    'Community': `${topic} Developer Community`
  };
  
  return templates[type] || `${topic} ${type} Resource ${index + 1}`;
}

// Generate fallback resources when AI is not available
function generateFallbackResources(topic) {
  const fallbackResources = [
    {
      id: 'resource_1',
      title: `Official ${topic} Documentation`,
      type: 'Documentation',
      description: `Comprehensive official documentation for ${topic}. Includes detailed guides, API references, and best practices. Essential for understanding core concepts and serves as the authoritative source.`,
      url: generateResourceUrl(topic, 'Documentation'),
      difficulty: 'All Levels',
      free: true,
      rating: 'High',
      tags: [topic, 'Documentation', 'Official', 'Reference'],
      category: 'Documentation'
    },
    {
      id: 'resource_2',
      title: `${topic} Interactive Tutorial`,
      type: 'Tutorial',
      description: `Step-by-step interactive tutorial covering ${topic} fundamentals. Features hands-on exercises, practical examples, and progressive learning to build solid understanding.`,
      url: generateResourceUrl(topic, 'Tutorial'),
      difficulty: 'Beginner',
      free: true,
      rating: 'High',
      tags: [topic, 'Tutorial', 'Interactive', 'Beginner'],
      category: 'Learning'
    },
    {
      id: 'resource_3',
      title: `Complete ${topic} Course`,
      type: 'Course',
      description: `Comprehensive online course covering ${topic} from basics to advanced concepts. Includes structured lessons, real-world projects, and certification upon completion.`,
      url: generateResourceUrl(topic, 'Course'),
      difficulty: 'All Levels',
      free: false,
      rating: 'High',
      tags: [topic, 'Course', 'Comprehensive', 'Certification'],
      category: 'Learning'
    },
    {
      id: 'resource_4',
      title: `${topic} Developer Community`,
      type: 'Community',
      description: `Active community forum for ${topic} developers and learners. Connect with experts, get help with problems, share knowledge, and stay updated with latest trends.`,
      url: generateResourceUrl(topic, 'Community'),
      difficulty: 'All Levels',
      free: true,
      rating: 'High',
      tags: [topic, 'Community', 'Support', 'Networking'],
      category: 'Community'
    }
  ];
  
  return fallbackResources;
}

// Categorize resource based on type
function categorizeResource(type) {
  const typeCategories = {
    'Documentation': 'Documentation',
    'Tutorial': 'Learning',
    'Course': 'Learning',
    'Tool': 'Tools',
    'Library': 'Tools',
    'Book': 'Learning',
    'Article': 'Reference',
    'Practice': 'Practice',
    'Community': 'Community',
    'Reference': 'Reference'
  };
  
  return typeCategories[type] || 'Learning';
}

// Generate placeholder URLs for resources
function generateResourceUrl(topic, type) {
  const encodedTopic = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'));
  const searchTopic = encodeURIComponent(topic);
  
  // More sophisticated URL mapping based on common patterns
  const urlMappings = {
    'Documentation': [
      `https://docs.${encodedTopic}.org`,
      `https://${encodedTopic}.readthedocs.io`,
      `https://developer.mozilla.org/en-US/search?q=${searchTopic}`,
      `https://devdocs.io/${encodedTopic}`
    ],
    'Tutorial': [
      `https://www.freecodecamp.org/news/search/?query=${searchTopic}`,
      `https://www.codecademy.com/catalog/subject/${encodedTopic}`,
      `https://www.w3schools.com/${encodedTopic}`,
      `https://developer.mozilla.org/en-US/docs/Learn`
    ],
    'Course': [
      `https://www.coursera.org/courses?query=${searchTopic}`,
      `https://www.edx.org/search?q=${searchTopic}`,
      `https://www.udacity.com/search?query=${searchTopic}`,
      `https://www.pluralsight.com/search?q=${searchTopic}`
    ],
    'Tool': [
      `https://github.com/topics/${encodedTopic}`,
      `https://marketplace.visualstudio.com/search?term=${searchTopic}`,
      `https://www.npmjs.com/search?q=${searchTopic}`,
      `https://pypi.org/search/?q=${searchTopic}`
    ],
    'Library': [
      `https://www.npmjs.com/search?q=${searchTopic}`,
      `https://pypi.org/search/?q=${searchTopic}`,
      `https://github.com/search?q=${searchTopic}&type=repositories`,
      `https://awesome.re/#${encodedTopic}`
    ],
    'Book': [
      `https://www.oreilly.com/search/?query=${searchTopic}`,
      `https://www.manning.com/search?query=${searchTopic}`,
      `https://www.packtpub.com/catalogsearch/result/?q=${searchTopic}`,
      `https://pragprog.com/search/?q=${searchTopic}`
    ],
    'Article': [
      `https://medium.com/search?q=${searchTopic}`,
      `https://dev.to/search?q=${searchTopic}`,
      `https://css-tricks.com/?s=${searchTopic}`,
      `https://www.smashingmagazine.com/search/?q=${searchTopic}`
    ],
    'Practice': [
      `https://leetcode.com/tag/${encodedTopic}`,
      `https://www.hackerrank.com/domains/${encodedTopic}`,
      `https://codewars.com/kata/search/${encodedTopic}`,
      `https://www.codingame.com/search?q=${searchTopic}`
    ],
    'Community': [
      `https://stackoverflow.com/questions/tagged/${encodedTopic}`,
      `https://www.reddit.com/r/${encodedTopic}`,
      `https://discord.com/invite/${encodedTopic}`,
      `https://gitter.im/${encodedTopic}`
    ],
    'Reference': [
      `https://devdocs.io/${encodedTopic}`,
      `https://developer.mozilla.org/en-US/search?q=${searchTopic}`,
      `https://www.w3.org/standards/${encodedTopic}`,
      `https://caniuse.com/?search=${searchTopic}`
    ],
    'Video': [
      `https://www.youtube.com/results?search_query=${searchTopic}+tutorial`,
      `https://www.youtube.com/c/${encodedTopic}`,
      `https://egghead.io/q/${searchTopic}`,
      `https://www.pluralsight.com/search?q=${searchTopic}`
    ],
    'Certification': [
      `https://www.coursera.org/professional-certificates/${encodedTopic}`,
      `https://www.edx.org/certificates/${encodedTopic}`,
      `https://aws.amazon.com/certification/`,
      `https://cloud.google.com/certification`
    ]
  };
  
  // Get URLs for the type, fallback to general search
  const typeUrls = urlMappings[type] || [
    `https://www.google.com/search?q=${searchTopic}+${type.toLowerCase()}`,
    `https://github.com/search?q=${searchTopic}`,
    `https://stackoverflow.com/search?q=${searchTopic}`
  ];
  
  // Return the first URL, with topic-specific logic
  let selectedUrl = typeUrls[0];
  
  // Special handling for popular topics
  const topicSpecificUrls = getTopicSpecificUrl(topic, type);
  if (topicSpecificUrls) {
    selectedUrl = topicSpecificUrls;
  }
  
  return selectedUrl;
}

// Get topic-specific URLs for popular frameworks/languages
function getTopicSpecificUrl(topic, type) {
  const topicLower = topic.toLowerCase();
  
  // Framework/Language specific mappings
  const specificMappings = {
    'react': {
      'Documentation': 'https://react.dev',
      'Tutorial': 'https://react.dev/learn',
      'Tool': 'https://create-react-app.dev'
    },
    'vue': {
      'Documentation': 'https://vuejs.org/guide/',
      'Tutorial': 'https://vuejs.org/tutorial/',
      'Tool': 'https://cli.vuejs.org'
    },
    'angular': {
      'Documentation': 'https://angular.io/docs',
      'Tutorial': 'https://angular.io/tutorial',
      'Tool': 'https://cli.angular.io'
    },
    'javascript': {
      'Documentation': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'Reference': 'https://javascript.info',
      'Practice': 'https://javascript30.com'
    },
    'python': {
      'Documentation': 'https://docs.python.org/3/',
      'Tutorial': 'https://docs.python.org/3/tutorial/',
      'Library': 'https://pypi.org'
    },
    'node': {
      'Documentation': 'https://nodejs.org/en/docs/',
      'Library': 'https://www.npmjs.com',
      'Tutorial': 'https://nodejs.dev/learn'
    },
    'css': {
      'Documentation': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
      'Reference': 'https://css-tricks.com/almanac/',
      'Practice': 'https://cssbattle.dev'
    }
  };
  
  // Check for partial matches
  for (const [key, mapping] of Object.entries(specificMappings)) {
    if (topicLower.includes(key) && mapping[type]) {
      return mapping[type];
    }
  }
  
  return null;
}

// Extract categories from resources
function extractResourceCategories(resources) {
  if (!resources || resources.length === 0) return [];
  
  const categories = new Set();
  resources.forEach(resource => {
    if (resource.category) categories.add(resource.category);
  });
  
  return Array.from(categories);
}

// Extract types from resources
function extractResourceTypes(resources) {
  if (!resources || resources.length === 0) return [];
  
  const types = new Set();
  resources.forEach(resource => {
    if (resource.type) types.add(resource.type);
  });
  
  return Array.from(types);
}

// Utility functions for resource filtering and display
export function filterResourcesByCategory(resources, category) {
  if (!resources || !category) return resources;
  return resources.filter(resource => 
    resource.category && resource.category.toLowerCase() === category.toLowerCase()
  );
}

export function filterResourcesByType(resources, type) {
  if (!resources || !type) return resources;
  return resources.filter(resource => 
    resource.type && resource.type.toLowerCase() === type.toLowerCase()
  );
}

export function filterResourcesByDifficulty(resources, difficulty) {
  if (!resources || !difficulty) return resources;
  return resources.filter(resource => 
    resource.difficulty && 
    (resource.difficulty.toLowerCase() === difficulty.toLowerCase() || 
     resource.difficulty.toLowerCase() === 'all levels')
  );
}

export function filterFreeResources(resources) {
  if (!resources) return [];
  return resources.filter(resource => resource.free === true);
}

export function getResourcesByRating(resources, minRating = 'Good') {
  if (!resources) return [];
  
  const ratingOrder = { 'High': 3, 'Medium': 2, 'Good': 1 };
  const minRatingValue = ratingOrder[minRating] || 1;
  
  return resources.filter(resource => {
    const resourceRating = ratingOrder[resource.rating] || 1;
    return resourceRating >= minRatingValue;
  });
}

export function searchResources(resources, searchTerm) {
  if (!resources || !searchTerm) return resources;
  
  const term = searchTerm.toLowerCase();
  return resources.filter(resource =>
    resource.title.toLowerCase().includes(term) ||
    resource.description.toLowerCase().includes(term) ||
    resource.tags.some(tag => tag.toLowerCase().includes(term))
  );
}

// Clear resources cache (useful for development or when user wants fresh results)
export function clearResourcesCache() {
  resourcesCache.clear();
  console.log('🧹 Resources cache cleared');
}

// Get cache statistics
export function getCacheStats() {
  return {
    size: resourcesCache.size,
    entries: Array.from(resourcesCache.keys())
  };
}

// Export resources data for external use (sharing, saving, etc.)
export function exportResourcesData(resources, metadata) {
  const exportData = {
    resources: resources || [],
    metadata: metadata || {},
    exportedAt: new Date().toISOString(),
    version: '2.0'
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Import resources data from external source
export function importResourcesData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.resources || !Array.isArray(data.resources)) {
      throw new Error('Invalid resources data format');
    }
    
    // Validate imported resources
    const validatedResources = validateAndDeduplicateResources(data.resources);
    
    return {
      success: true,
      resources: validatedResources,
      metadata: {
        ...data.metadata,
        importedAt: new Date().toISOString(),
        originalCount: data.resources.length,
        validCount: validatedResources.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get resource recommendations based on user's learning history or preferences
export function getPersonalizedResources(resources, userPreferences = {}) {
  if (!resources || !Array.isArray(resources)) return [];
  
  const {
    preferredDifficulty = 'All Levels',
    preferredTypes = [],
    onlyFree = false,
    excludeTypes = []
  } = userPreferences;
  
  let filtered = [...resources];
  
  // Filter by difficulty preference
  if (preferredDifficulty !== 'All Levels') {
    filtered = filterResourcesByDifficulty(filtered, preferredDifficulty);
  }
  
  // Filter by preferred types
  if (preferredTypes.length > 0) {
    filtered = filtered.filter(resource => 
      preferredTypes.some(type => 
        resource.type.toLowerCase() === type.toLowerCase()
      )
    );
  }
  
  // Exclude certain types
  if (excludeTypes.length > 0) {
    filtered = filtered.filter(resource => 
      !excludeTypes.some(type => 
        resource.type.toLowerCase() === type.toLowerCase()
      )
    );
  }
  
  // Filter by free preference
  if (onlyFree) {
    filtered = filterFreeResources(filtered);
  }
  
  return filtered;
}

// Analyze resource distribution for insights
export function analyzeResourceDistribution(resources) {
  if (!resources || !Array.isArray(resources)) {
    return {
      totalResources: 0,
      byCategory: {},
      byType: {},
      byDifficulty: {},
      byRating: {},
      freeVsPaid: { free: 0, paid: 0 }
    };
  }
  
  const analysis = {
    totalResources: resources.length,
    byCategory: {},
    byType: {},
    byDifficulty: {},
    byRating: {},
    freeVsPaid: { free: 0, paid: 0 }
  };
  
  resources.forEach(resource => {
    // Count by category
    const category = resource.category || 'Other';
    analysis.byCategory[category] = (analysis.byCategory[category] || 0) + 1;
    
    // Count by type
    const type = resource.type || 'Other';
    analysis.byType[type] = (analysis.byType[type] || 0) + 1;
    
    // Count by difficulty
    const difficulty = resource.difficulty || 'Unknown';
    analysis.byDifficulty[difficulty] = (analysis.byDifficulty[difficulty] || 0) + 1;
    
    // Count by rating
    const rating = resource.rating || 'Unknown';
    analysis.byRating[rating] = (analysis.byRating[rating] || 0) + 1;
    
    // Count free vs paid
    if (resource.free) {
      analysis.freeVsPaid.free++;
    } else {
      analysis.freeVsPaid.paid++;
    }
  });
  
  return analysis;
}

// Import icon components (these would need to be available in the component using this)
// This function maps resource types to appropriate icons
export function getResourceIcon(type) {
  // This function should be used in the component to get the appropriate icon
  // The actual icon components need to be imported where this function is used
  const iconMap = {
    'Documentation': 'FaBookOpen',
    'Tutorial': 'FaGraduationCap',
    'Course': 'FaVideo',
    'Tool': 'FaCode',
    'Library': 'FaDownload',
    'Book': 'FaBook',
    'Article': 'FaNewspaper',
    'Practice': 'FaLaptopCode',
    'Community': 'FaUsers',
    'Reference': 'FaBookmark',
    'Video': 'FaYoutube',
    'Certification': 'FaCertificate'
  };
  
  return iconMap[type] || 'FaExternalLinkAlt';
}

// Add icon property to resources based on their type
export function addIconsToResources(resources) {
  return resources.map(resource => ({
    ...resource,
    iconName: getResourceIcon(resource.type)
  }));
}

// Gemini model configuration (only use gemini-1.5-flash)
const GEMINI_MODEL = 'gemini-1.5-flash';

// Try Gemini model (no fallback)
async function tryGeminiModels(requestBody, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: requestBody.signal
  });
  if (!response.ok) throw new Error(`Gemini API request failed: ${response.status}`);
  const result = await response.json();
  if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return result.candidates[0].content.parts[0].text.trim();
  }
  throw new Error('Invalid Gemini API response');
}
