// Resources Content Generation Service
// Uses Gemini AI to generate real, quality online learning resources

// Cache for storing resources to avoid repeated API calls
const resourcesCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// Gemini API function for generating resources
const generateResourcesWithGemini = async (topic) => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found');
  }

  const prompt = `Generate 6 high-quality, real online learning resources for the topic: "${topic}"

IMPORTANT REQUIREMENTS:
1. All URLs must be real, working links (no placeholders)
2. Include diverse resource types: Documentation, Tutorials, Courses, Practice Sites, Tools, Books
3. Prioritize well-known, reputable sources like MDN, GeeksforGeeks, Coursera, YouTube, GitHub, official documentation
4. Each resource should have accurate descriptions
5. Include difficulty levels and whether they're free or paid

Please respond in this EXACT JSON format:
{
  "resources": [
    {
      "title": "Resource Title",
      "type": "Documentation|Tutorial|Course|Practice|Tool|Book|Video",
      "description": "Detailed description of what this resource offers",
      "url": "https://real-working-url.com",
      "difficulty": "Beginner|Intermediate|Advanced|All Levels",
      "free": true|false,
      "rating": "High|Medium",
      "provider": "Provider name (e.g., MDN, Google, Microsoft)"
    }
  ]
}

Focus on providing real, working URLs from these trusted sources:
- MDN Web Docs (developer.mozilla.org)
- W3Schools (w3schools.com)
- GeeksforGeeks (geeksforgeeks.org)
- FreeCodeCamp (freecodecamp.org)
- Coursera (coursera.org)
- edX (edx.org)
- Khan Academy (khanacademy.org)
- YouTube (youtube.com)
- GitHub (github.com)
- Stack Overflow (stackoverflow.com)
- Official documentation sites
- LeetCode (leetcode.com)
- HackerRank (hackerrank.com)

Generate exactly 6 resources with real URLs only.`;

  try {
    console.log('🤖 Requesting resources from Gemini for topic:', topic);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent, factual responses
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response from Gemini API');
    }

    console.log('📝 Raw Gemini response:', responseText.slice(0, 200) + '...');

    // Extract JSON from the response (remove any markdown formatting)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const resourcesData = JSON.parse(cleanedResponse);
    
    if (!resourcesData.resources || !Array.isArray(resourcesData.resources)) {
      throw new Error('Invalid response format from Gemini');
    }

    console.log('✅ Successfully parsed', resourcesData.resources.length, 'resources from Gemini');
    return resourcesData.resources;

  } catch (error) {
    console.error('❌ Error generating resources with Gemini:', error);
    
    // Return fallback resources if Gemini fails
    return getFallbackResources(topic);
  }
};

// Fallback resources for when Gemini API fails
const getFallbackResources = (topic) => {
  return [
    {
      title: `${topic} - MDN Web Docs`,
      type: 'Documentation',
      description: `Official documentation and guides for ${topic} from Mozilla Developer Network.`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`,
      difficulty: 'All Levels',
      free: true,
      rating: 'High',
      provider: 'Mozilla'
    },
    {
      title: `${topic} Tutorial - W3Schools`,
      type: 'Tutorial',
      description: `Comprehensive ${topic} tutorial with examples and exercises.`,
      url: `https://www.w3schools.com/search/search_tryit.asp?searchtext=${encodeURIComponent(topic)}`,
      difficulty: 'Beginner',
      free: true,
      rating: 'High',
      provider: 'W3Schools'
    },
    {
      title: `${topic} - GeeksforGeeks`,
      type: 'Tutorial',
      description: `Detailed ${topic} tutorials with programming examples and practice problems.`,
      url: `https://www.geeksforgeeks.org/search/?query=${encodeURIComponent(topic)}`,
      difficulty: 'Intermediate',
      free: true,
      rating: 'High',
      provider: 'GeeksforGeeks'
    },
    {
      title: `${topic} Course - freeCodeCamp`,
      type: 'Course',
      description: `Free interactive ${topic} course with hands-on projects.`,
      url: `https://www.freecodecamp.org/search?query=${encodeURIComponent(topic)}`,
      difficulty: 'Beginner',
      free: true,
      rating: 'High',
      provider: 'freeCodeCamp'
    },
    {
      title: `${topic} Videos - YouTube`,
      type: 'Video',
      description: `Educational videos and tutorials about ${topic} from various creators.`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`,
      difficulty: 'All Levels',
      free: true,
      rating: 'Medium',
      provider: 'YouTube'
    },
    {
      title: `${topic} Questions - Stack Overflow`,
      type: 'Reference',
      description: `Community questions, answers, and discussions about ${topic}.`,
      url: `https://stackoverflow.com/search?q=${encodeURIComponent(topic)}`,
      difficulty: 'All Levels',
      free: true,
      rating: 'High',
      provider: 'Stack Overflow'
    }
  ];
};

// Helper function to validate and enhance resources
const validateAndEnhanceResources = (resources, topic) => {
  return resources.map((resource, index) => ({
    id: `resource_${Date.now()}_${index}`,
    title: resource.title || `${topic} Resource ${index + 1}`,
    type: resource.type || 'Tutorial',
    description: resource.description || `Learning resource for ${topic}`,
    url: resource.url || '#',
    difficulty: resource.difficulty || 'All Levels',
    free: resource.free !== undefined ? resource.free : true,
    rating: resource.rating || 'Medium',
    provider: resource.provider || 'Online',
    tags: [topic.toLowerCase(), resource.type?.toLowerCase()].filter(Boolean),
    category: 'Learning'
  }));
};

// Helper functions for metadata
const extractResourceCategories = (resources) => {
  const categories = new Set();
  resources.forEach(resource => {
    if (resource.category) categories.add(resource.category);
  });
  return Array.from(categories);
};

const extractResourceTypes = (resources) => {
  const types = new Set();
  resources.forEach(resource => {
    if (resource.type) types.add(resource.type);
  });
  return Array.from(types);
};

// Main function to generate resources content using Gemini AI
export async function generateResourcesContent(setContent, topic = '', options = {}) {
  console.log('📚 Generating AI-powered resources for:', topic);
  
  if (!topic || topic.trim().length === 0) {
    console.warn('⚠️ No topic provided for resource generation');
    setContent({
      resources: [],
      resourcesMetadata: {
        generatedAt: new Date().toISOString(),
        totalResources: 0,
        error: 'No topic provided'
      }
    });
    return;
  }

  const cacheKey = `gemini_${topic.toLowerCase()}_${JSON.stringify(options)}`;
  
  // Check cache first
  if (resourcesCache.has(cacheKey)) {
    const cached = resourcesCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached Gemini resources');
      setContent({
        resources: cached.resources,
        resourcesMetadata: {
          ...cached.metadata,
          fromCache: true
        }
      });
      return;
    }
  }
  
  try {
    // Generate resources using Gemini AI
    const geminiResources = await generateResourcesWithGemini(topic);
    
    // Validate and enhance resources
    const validatedResources = validateAndEnhanceResources(geminiResources, topic);
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalResources: validatedResources.length,
      categories: extractResourceCategories(validatedResources),
      types: extractResourceTypes(validatedResources),
      topic: topic,
      fromCache: false,
      source: 'gemini_ai',
      model: 'gemini-1.5-flash'
    };
    
    // Cache the results
    resourcesCache.set(cacheKey, {
      resources: validatedResources,
      metadata: metadata,
      timestamp: Date.now()
    });
    
    console.log('✅ Successfully generated', validatedResources.length, 'AI-powered resources');
    
    // Set the content
    setContent({
      resources: validatedResources,
      resourcesMetadata: metadata
    });
    
  } catch (error) {
    console.error('❌ Error generating resources:', error);
    
    // Fallback to basic resources
    const fallbackResources = getFallbackResources(topic);
    const validatedFallback = validateAndEnhanceResources(fallbackResources, topic);
    
    const errorMetadata = {
      generatedAt: new Date().toISOString(),
      totalResources: validatedFallback.length,
      categories: extractResourceCategories(validatedFallback),
      types: extractResourceTypes(validatedFallback),
      topic: topic,
      fromCache: false,
      source: 'fallback',
      error: error.message
    };
    
    setContent({
      resources: validatedFallback,
      resourcesMetadata: errorMetadata
    });
  }
}

// Filter functions for resource management
export function filterResourcesByCategory(resources, category) {
  if (!category || category === 'all') return resources;
  return resources.filter(resource => 
    resource.category && resource.category.toLowerCase() === category.toLowerCase()
  );
}

export function filterResourcesByType(resources, type) {
  if (!type || type === 'all') return resources;
  return resources.filter(resource => 
    resource.type && resource.type.toLowerCase() === type.toLowerCase()
  );
}

export function filterResourcesByDifficulty(resources, difficulty) {
  if (!difficulty || difficulty === 'all') return resources;
  return resources.filter(resource => 
    resource.difficulty && resource.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

export function filterFreeResources(resources) {
  return resources.filter(resource => resource.free === true);
}

export function getResourcesByRating(resources, minRating = 'Medium') {
  const ratingOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const minRatingValue = ratingOrder[minRating] || 2;
  
  return resources.filter(resource => {
    const resourceRating = ratingOrder[resource.rating] || 2;
    return resourceRating >= minRatingValue;
  });
}

export function searchResources(resources, query) {
  if (!query || query.trim().length === 0) return resources;
  
  const searchTerm = query.toLowerCase();
  return resources.filter(resource => 
    resource.title.toLowerCase().includes(searchTerm) ||
    resource.description.toLowerCase().includes(searchTerm) ||
    resource.type.toLowerCase().includes(searchTerm) ||
    resource.provider.toLowerCase().includes(searchTerm) ||
    (resource.tags && resource.tags.some(tag => tag.includes(searchTerm)))
  );
}

export function getResourceIcon(type) {
  const icons = {
    'Documentation': '📚',
    'Tutorial': '🎓',
    'Course': '🏫',
    'Practice': '💪',
    'Tool': '🛠️',
    'Book': '📖',
    'Video': '🎥',
    'Reference': '📋',
    'Interactive': '🎮',
    'Article': '📄'
  };
  return icons[type] || '📝';
}

export function addIconsToResources(resources) {
  return resources.map(resource => ({
    ...resource,
    icon: getResourceIcon(resource.type)
  }));
}

// Keep the existing generateCuratedResources function for compatibility
export function generateCuratedResources(topic) {
  console.log('📚 Generating curated resources for topic:', topic);
  
  if (!topic || topic.trim().length === 0) {
    return {
      resources: [],
      metadata: {
        totalResources: 0,
        error: 'No topic provided'
      }
    };
  }

  // Generate fallback resources
  const fallbackResources = getFallbackResources(topic);
  const validatedResources = validateAndEnhanceResources(fallbackResources, topic);
  
  return {
    resources: validatedResources,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalResources: validatedResources.length,
      categories: extractResourceCategories(validatedResources),
      types: extractResourceTypes(validatedResources),
      topic: topic,
      source: 'curated'
    }
  };
}
