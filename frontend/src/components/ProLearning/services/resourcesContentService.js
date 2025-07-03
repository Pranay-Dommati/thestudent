// Resources Content Generation Service
// Handles generating additional learning resources, links, and materials

/**
 * Generate additional learning resources for the given topic
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to find resources for
 */
export async function generateResourcesContent(setContent, topic = '') {
  console.log('📚 Curating additional learning resources...');
  
  try {
    // Generate comprehensive resources
    const resourcesContent = await generateCuratedResources(topic);
    
    setContent((prev) => ({
      ...prev,
      resources: resourcesContent,
      resourcesMetadata: {
        generatedAt: new Date().toISOString(),
        totalResources: resourcesContent.length,
        categories: extractResourceCategories(resourcesContent),
        types: extractResourceTypes(resourcesContent)
      }
    }));
    
    console.log(`✅ Curated ${resourcesContent.length} learning resources`);
    
  } catch (error) {
    console.error('🚨 Resources generation failed:', error);
    
    // Use fallback resources on error
    const fallbackResources = generateFallbackResources(topic);
    setContent((prev) => ({
      ...prev,
      resources: fallbackResources,
      resourcesMetadata: {
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        totalResources: fallbackResources.length,
        error: error.message
      }
    }));
  }
}

// Generate curated resources based on topic
async function generateCuratedResources(topic) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackResources(topic);
  }

  try {
    const resourcesPrompt = createResourcesPrompt(topic);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: resourcesPrompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 3072,
        stopSequences: []
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Resources API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid resources API response');
    }

    const resourcesText = result.candidates[0].content.parts[0].text.trim();
    return parseResourceRecommendations(resourcesText, topic);
    
  } catch (error) {
    console.warn('AI resources generation failed, using fallback:', error.message);
    return generateFallbackResources(topic);
  }
}

// Create optimized prompt for resources generation
function createResourcesPrompt(topic) {
  return `
You are an expert educational resource curator. Recommend the best learning resources for the topic: "${topic}"

**Requirements:**
Suggest 12-15 high-quality learning resources across different categories. For each resource, provide:

**Format for each recommendation:**
TITLE: [Resource title]
TYPE: [Documentation/Tutorial/Course/Tool/Library/Book/Article/Practice/Community/Reference]
DESCRIPTION: [2-3 sentence description of the resource and what it offers]
URL: [Suggested URL or platform name]
DIFFICULTY: [Beginner/Intermediate/Advanced/All Levels]
FREE: [Yes/No]
RATING: [High/Medium/Good]
TAGS: [3-4 relevant tags separated by commas]

**Categories to Cover:**
1. **Official Documentation** (2-3 resources)
2. **Interactive Tutorials** (2-3 resources)
3. **Online Courses** (2-3 resources)
4. **Development Tools** (2-3 resources)
5. **Books & Articles** (2-3 resources)
6. **Practice Platforms** (1-2 resources)
7. **Community Resources** (1-2 resources)

**Guidelines:**
- Prioritize free and high-quality resources
- Include both beginner-friendly and advanced resources
- Mix official and community-created content
- Include hands-on practice resources
- Suggest tools that enhance learning and productivity
- Include resources for continued learning and staying updated
- Focus on reputable and well-maintained resources

**Example Format:**
TITLE: Official ${topic} Documentation
TYPE: Documentation
DESCRIPTION: Comprehensive official documentation covering all aspects of ${topic}. Includes API references, guides, and examples. Essential resource for both beginners and experts.
URL: Official ${topic} website
DIFFICULTY: All Levels
FREE: Yes
RATING: High
TAGS: Official, Documentation, Reference, Complete

Generate 12-15 resources following this exact format, covering all the specified categories.
`;
}

// Parse AI-generated resource recommendations
function parseResourceRecommendations(resourcesText, topic) {
  try {
    const resourceBlocks = resourcesText.split(/TITLE:/i).filter(block => block.trim().length > 0);
    const resources = [];
    
    resourceBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const resource = {
        id: `resource_${index + 1}`,
        title: '',
        type: 'Article',
        description: '',
        url: '',
        difficulty: 'Beginner',
        free: true,
        rating: 'Good',
        tags: [],
        category: 'Learning'
      };
      
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('TYPE:')) {
          resource.type = cleanLine.replace('TYPE:', '').trim();
        } else if (cleanLine.startsWith('DESCRIPTION:')) {
          resource.description = cleanLine.replace('DESCRIPTION:', '').trim();
        } else if (cleanLine.startsWith('URL:')) {
          resource.url = cleanLine.replace('URL:', '').trim();
        } else if (cleanLine.startsWith('DIFFICULTY:')) {
          resource.difficulty = cleanLine.replace('DIFFICULTY:', '').trim();
        } else if (cleanLine.startsWith('FREE:')) {
          const freeStatus = cleanLine.replace('FREE:', '').trim().toLowerCase();
          resource.free = freeStatus === 'yes' || freeStatus === 'true';
        } else if (cleanLine.startsWith('RATING:')) {
          resource.rating = cleanLine.replace('RATING:', '').trim();
        } else if (cleanLine.startsWith('TAGS:')) {
          const tags = cleanLine.replace('TAGS:', '').trim().split(',');
          resource.tags = tags.map(t => t.trim()).filter(t => t.length > 0);
        } else if (index === 0 && cleanLine.length > 0 && !cleanLine.includes(':')) {
          resource.title = cleanLine;
        }
      });
      
      // Set title if not found
      if (!resource.title) {
        resource.title = `${topic} ${resource.type}`;
      }
      
      // Set category based on type
      resource.category = categorizeResource(resource.type);
      
      // Set placeholder URL if none provided
      if (!resource.url || resource.url === 'URL:') {
        resource.url = generateResourceUrl(topic, resource.type);
      }
      
      // Ensure we have tags
      if (resource.tags.length === 0) {
        resource.tags = [topic, resource.type, resource.difficulty];
      }
      
      resources.push(resource);
    });
    
    return resources.slice(0, 15); // Limit to 15 resources
    
  } catch (error) {
    console.warn('Failed to parse resource recommendations:', error);
    return generateFallbackResources(topic);
  }
}

// Generate fallback resources when AI is not available
function generateFallbackResources(topic) {
  const fallbackResources = [
    {
      id: 'resource_1',
      title: `Official ${topic} Documentation`,
      type: 'Documentation',
      description: `Comprehensive official documentation for ${topic}. Includes detailed guides, API references, and best practices. Essential for understanding core concepts.`,
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
      description: `Step-by-step interactive tutorial covering ${topic} fundamentals. Hands-on exercises and practical examples to build understanding.`,
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
      description: `Comprehensive online course covering ${topic} from basics to advanced concepts. Includes projects, assignments, and certification.`,
      url: generateResourceUrl(topic, 'Course'),
      difficulty: 'All Levels',
      free: false,
      rating: 'High',
      tags: [topic, 'Course', 'Comprehensive', 'Certification'],
      category: 'Learning'
    },
    {
      id: 'resource_4',
      title: `${topic} Development Tools`,
      type: 'Tool',
      description: `Essential development tools and utilities for working with ${topic}. Includes editors, debuggers, and productivity extensions.`,
      url: generateResourceUrl(topic, 'Tool'),
      difficulty: 'Intermediate',
      free: true,
      rating: 'High',
      tags: [topic, 'Tools', 'Development', 'Productivity'],
      category: 'Tools'
    },
    {
      id: 'resource_5',
      title: `${topic} Best Practices Guide`,
      type: 'Article',
      description: `Industry best practices and coding standards for ${topic}. Learn from expert recommendations and avoid common pitfalls.`,
      url: generateResourceUrl(topic, 'Article'),
      difficulty: 'Intermediate',
      free: true,
      rating: 'High',
      tags: [topic, 'Best Practices', 'Standards', 'Expert'],
      category: 'Reference'
    },
    {
      id: 'resource_6',
      title: `${topic} Practical Examples`,
      type: 'Practice',
      description: `Collection of practical examples and coding exercises for ${topic}. Build real projects while learning core concepts.`,
      url: generateResourceUrl(topic, 'Practice'),
      difficulty: 'All Levels',
      free: true,
      rating: 'Good',
      tags: [topic, 'Practice', 'Examples', 'Projects'],
      category: 'Practice'
    },
    {
      id: 'resource_7',
      title: `${topic} Community Forum`,
      type: 'Community',
      description: `Active community forum for ${topic} developers. Get help, share knowledge, and connect with other learners and experts.`,
      url: generateResourceUrl(topic, 'Community'),
      difficulty: 'All Levels',
      free: true,
      rating: 'Good',
      tags: [topic, 'Community', 'Forum', 'Support'],
      category: 'Community'
    },
    {
      id: 'resource_8',
      title: `${topic} Quick Reference`,
      type: 'Reference',
      description: `Quick reference guide and cheat sheet for ${topic}. Essential syntax, commands, and concepts at your fingertips.`,
      url: generateResourceUrl(topic, 'Reference'),
      difficulty: 'All Levels',
      free: true,
      rating: 'Good',
      tags: [topic, 'Reference', 'Cheat Sheet', 'Quick'],
      category: 'Reference'
    },
    {
      id: 'resource_9',
      title: `Advanced ${topic} Techniques`,
      type: 'Book',
      description: `In-depth book covering advanced ${topic} techniques and patterns. Perfect for developers looking to deepen their expertise.`,
      url: generateResourceUrl(topic, 'Book'),
      difficulty: 'Advanced',
      free: false,
      rating: 'High',
      tags: [topic, 'Advanced', 'Book', 'Expert'],
      category: 'Learning'
    },
    {
      id: 'resource_10',
      title: `${topic} Code Libraries`,
      type: 'Library',
      description: `Popular libraries and frameworks for ${topic}. Accelerate development with pre-built components and utilities.`,
      url: generateResourceUrl(topic, 'Library'),
      difficulty: 'Intermediate',
      free: true,
      rating: 'Good',
      tags: [topic, 'Libraries', 'Frameworks', 'Components'],
      category: 'Tools'
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
  const encodedTopic = encodeURIComponent(topic.toLowerCase());
  
  const urlMappings = {
    'Documentation': `https://docs.${encodedTopic}.org`,
    'Tutorial': `https://www.tutorialspoint.com/${encodedTopic}`,
    'Course': `https://www.coursera.org/courses?query=${encodedTopic}`,
    'Tool': `https://github.com/topics/${encodedTopic}`,
    'Library': `https://www.npmjs.com/search?q=${encodedTopic}`,
    'Book': `https://www.amazon.com/s?k=${encodedTopic}+programming`,
    'Article': `https://medium.com/search?q=${encodedTopic}`,
    'Practice': `https://leetcode.com/tag/${encodedTopic}`,
    'Community': `https://stackoverflow.com/questions/tagged/${encodedTopic}`,
    'Reference': `https://devdocs.io/${encodedTopic}`
  };
  
  return urlMappings[type] || `https://www.google.com/search?q=${encodedTopic}`;
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
