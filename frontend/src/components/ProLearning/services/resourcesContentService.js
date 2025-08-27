// Resources Content Generation Service
// Uses Google Programmable Search API to find real, quality online learning resources
// Excludes YouTube videos since they're handled in the Videos tab

// Cache for storing resources to avoid repeated API calls
const resourcesCache = new Map();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Generate resources using Google Programmable Search API
 * Fetches real, working resources from trusted educational sources
 */
const generateResourcesWithGoogleSearch = async (topic) => {
  try {
    // Generating high-quality resources for topic
    
    // Check cache first
    const cacheKey = topic.toLowerCase().trim();
    const cached = resourcesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached resources for:', topic);
      return cached.resources;
    }

    // Call our backend API that uses Google Search
    const response = await fetch('/api/resources/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic,
        excludeYoutube: true // Exclude YouTube since we have a dedicated Videos tab
      })
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Backend API Response:', data);
    
    if (!data.resources || !Array.isArray(data.resources)) {
      console.error('❌ Invalid response format:', data);
      throw new Error(`Invalid response format from API: ${JSON.stringify(data)}`);
    }

    // If we got results, use them
    if (data.resources.length > 0) {
      console.log(`✅ Got ${data.resources.length} resources from Google Search API`);
      
      // Enhance resources with additional metadata
      const enhancedResources = data.resources.map((resource, index) => ({
        ...resource,
        id: `resource_${Date.now()}_${index}`,
        tags: [topic.toLowerCase(), resource.type?.toLowerCase()].filter(Boolean),
        category: 'Learning'
      }));
      
      // Cache the results
      resourcesCache.set(cacheKey, {
        resources: enhancedResources,
        timestamp: Date.now()
      });

      console.log(`✅ Final result: ${enhancedResources.length} high-quality resources for: ${topic}`);
      return enhancedResources;
    } else {
      console.warn('⚠️ No resources returned from Google Search API, using fallback');
      throw new Error('No resources found from Google Search');
    }

  } catch (error) {
    console.error('❌ Error generating resources with Google Search:', error);
    
    // Fallback to basic resources if Google Search fails
    console.log('🔄 Falling back to basic resources');
    return generateFallbackResources(topic);
  }
};

/**
 * Fallback resource generation when Google Search API fails
 * Provides basic educational resource recommendations (excluding YouTube)
 */
const generateFallbackResources = (topic) => {
  console.log('🔄 Using fallback resources for:', topic);
  
  const baseResources = [
    {
      title: `${topic} - Wikipedia`,
      type: "Documentation",
      description: `Comprehensive overview and introduction to ${topic}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`,
      difficulty: "All Levels",
      free: true,
      rating: "High",
      provider: "Wikipedia"
    },
    {
      title: `${topic} Tutorial - GeeksforGeeks`,
      type: "Tutorial",
      description: `Step-by-step tutorial and examples for ${topic}`,
      url: `https://www.geeksforgeeks.org/?s=${encodeURIComponent(topic)}`,
      difficulty: "Beginner",
      free: true,
      rating: "High",
      provider: "GeeksforGeeks"
    },
    {
      title: `${topic} Course - freeCodeCamp`,
      type: "Course",
      description: `Free comprehensive course covering ${topic}`,
      url: `https://www.freecodecamp.org/learn`,
      difficulty: "Beginner",
      free: true,
      rating: "High",
      provider: "freeCodeCamp"
    },
    {
      title: `${topic} Practice - HackerRank`,
      type: "Practice",
      description: `Practice exercises and challenges for ${topic}`,
      url: `https://www.hackerrank.com/domains`,
      difficulty: "All Levels",
      free: true,
      rating: "High",
      provider: "HackerRank"
    },
    {
      title: `${topic} Documentation - MDN Web Docs`,
      type: "Documentation",
      description: `Official documentation and reference for ${topic}`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`,
      difficulty: "All Levels",
      free: true,
      rating: "High",
      provider: "MDN Web Docs"
    },
    {
      title: `${topic} Questions - Stack Overflow`,
      type: "Reference",
      description: `Community questions, answers, and discussions about ${topic}`,
      url: `https://stackoverflow.com/search?q=${encodeURIComponent(topic)}`,
      difficulty: "All Levels",
      free: true,
      rating: "High",
      provider: "Stack Overflow"
    }
  ];

  return baseResources;
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

// Main function to generate resources content using Google Search API
export async function generateResourcesContent(setContent, topic = '', options = {}) {
  // Generating Google Search-powered resources for topic
  
  // Add a try-catch to ensure setContent is always called
  try {
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

    const cacheKey = `google_search_${topic.toLowerCase()}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (resourcesCache.has(cacheKey)) {
      const cached = resourcesCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        // Using cached Google Search resources
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
    
    // Generate resources using Google Programmable Search API
    const searchResources = await generateResourcesWithGoogleSearch(topic);
    
    // Validate and enhance resources
    const validatedResources = validateAndEnhanceResources(searchResources, topic);
    
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalResources: validatedResources.length,
      categories: extractResourceCategories(validatedResources),
      types: extractResourceTypes(validatedResources),
      topic: topic,
      fromCache: false,
      source: 'google_search_api',
      searchEngine: 'google_programmable_search',
      excludesYoutube: true
    };
    
    // Cache the results
    resourcesCache.set(cacheKey, {
      resources: validatedResources,
      metadata: metadata,
      timestamp: Date.now()
    });
    
    // Successfully generated Google Search-powered resources
    
    // Set the content
    setContent({
      resources: validatedResources,
      resourcesMetadata: metadata
    });
    
  } catch (error) {
    console.error('❌ Error generating resources:', error);
    
    try {
      // Fallback to basic resources
      const fallbackResources = generateFallbackResources(topic);
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
      
      console.log('🔄 Using fallback resources due to error:', error.message);
      setContent({
        resources: validatedFallback,
        resourcesMetadata: errorMetadata
      });
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      // Ensure we ALWAYS call setContent, even with empty results
      setContent({
        resources: [],
        resourcesMetadata: {
          generatedAt: new Date().toISOString(),
          totalResources: 0,
          topic: topic,
          fromCache: false,
          source: 'error',
          error: `Both main and fallback failed: ${error.message}`
        }
      });
    }
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
    'Article': '📄',
    'Resource': '🔗'
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
  const fallbackResources = generateFallbackResources(topic);
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
