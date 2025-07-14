// Topic Classifier - Simplified version using backend API only
// Extracts topics from user queries via Django backend

// Cache for topic classification to reduce API calls
const topicCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Main function to classify topics from user query
 * Now routes all AI calls through the Django backend
 */
export const classifyTopicsWithGemini = async (userQuery) => {
  try {
    console.log('🔍 Classifying topics for:', userQuery);
    
    // Check cache first
    const cacheKey = userQuery.toLowerCase().trim();
    const cached = topicCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached topics');
      return cached.topics;
    }

    // Call backend API for topic classification
    const response = await fetch('/ai/classify-topics/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: userQuery
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract topics from response
    const topics = data.topics || [];
    
    // Cache the result
    topicCache.set(cacheKey, {
      topics,
      timestamp: Date.now()
    });

    console.log('✅ Topics classified successfully:', topics);
    return topics;

  } catch (error) {
    console.error('❌ Error in topic classification:', error);
    
    // Return fallback topics based on basic keyword matching
    return generateFallbackTopics(userQuery);
  }
};

/**
 * Generate fallback topics when AI classification fails
 * Simple keyword-based topic extraction
 */
const generateFallbackTopics = (query) => {
  console.log('🔄 Generating fallback topics for:', query);
  
  const topics = [];
  const words = query.toLowerCase().split(/\s+/);
  
  // Technology keywords
  const techKeywords = {
    'javascript': 'JavaScript Programming',
    'python': 'Python Programming', 
    'react': 'React.js Development',
    'html': 'HTML & Web Development',
    'css': 'CSS & Styling',
    'api': 'API Development',
    'database': 'Database Management',
    'algorithm': 'Algorithms & Data Structures',
    'machine learning': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'web': 'Web Development',
    'mobile': 'Mobile Development',
    'design': 'UI/UX Design',
    'security': 'Cybersecurity',
    'cloud': 'Cloud Computing'
  };
  
  // Math/Science keywords
  const scienceKeywords = {
    'math': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'calculus': 'Calculus',
    'algebra': 'Algebra',
    'statistics': 'Statistics'
  };
  
  // Business keywords
  const businessKeywords = {
    'marketing': 'Digital Marketing',
    'business': 'Business Strategy',
    'finance': 'Finance & Economics',
    'management': 'Project Management',
    'sales': 'Sales & Customer Relations'
  };
  
  // Check for matches
  const allKeywords = { ...techKeywords, ...scienceKeywords, ...businessKeywords };
  
  for (const [keyword, topic] of Object.entries(allKeywords)) {
    if (words.some(word => word.includes(keyword)) || query.toLowerCase().includes(keyword)) {
      topics.push(topic);
    }
  }
  
  // If no specific matches, provide general categories
  if (topics.length === 0) {
    if (query.length > 50) {
      topics.push('General Learning', 'Study Skills');
    } else {
      topics.push('General Knowledge');
    }
  }
  
  // Limit to 3 topics max
  return topics.slice(0, 3);
};

/**
 * Clear the topic cache (useful for testing or manual cache management)
 */
export const clearTopicCache = () => {
  topicCache.clear();
  console.log('🧹 Topic cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: topicCache.size,
    entries: Array.from(topicCache.keys())
  };
};

