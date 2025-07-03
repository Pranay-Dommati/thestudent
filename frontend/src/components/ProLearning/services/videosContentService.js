// Videos Content Generation Service
// Handles finding and curating educational videos for topics

/**
 * Generate videos content for the given topic
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to find videos for
 */
export async function generateVideosContent(setContent, topic = '') {
  console.log('🎥 Finding educational videos...');
  
  try {
    // For now, we'll generate curated video recommendations
    // In the future, this could integrate with YouTube API or other video services
    const videoContent = await generateCuratedVideos(topic);
    
    setContent((prev) => ({
      ...prev,
      videos: videoContent,
      videosMetadata: {
        generatedAt: new Date().toISOString(),
        totalVideos: videoContent.length,
        totalDuration: calculateTotalDuration(videoContent),
        categories: extractVideoCategories(videoContent)
      }
    }));
    
    console.log(`✅ Found ${videoContent.length} educational videos`);
    
  } catch (error) {
    console.error('🚨 Video content generation failed:', error);
    
    // Use fallback videos on error
    const fallbackVideos = generateFallbackVideos(topic);
    setContent((prev) => ({
      ...prev,
      videos: fallbackVideos,
      videosMetadata: {
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        totalVideos: fallbackVideos.length,
        error: error.message
      }
    }));
  }
}

// Generate curated video recommendations based on topic
async function generateCuratedVideos(topic) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackVideos(topic);
  }

  try {
    const videoPrompt = createVideoPrompt(topic);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: videoPrompt }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 2048,
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
      throw new Error(`Video API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid video API response');
    }

    const videoText = result.candidates[0].content.parts[0].text.trim();
    return parseVideoRecommendations(videoText, topic);
    
  } catch (error) {
    console.warn('AI video generation failed, using fallback:', error.message);
    return generateFallbackVideos(topic);
  }
}

// Create optimized prompt for video recommendations
function createVideoPrompt(topic) {
  return `
You are an educational content curator specializing in finding the best learning videos. Recommend high-quality educational videos for the topic: "${topic}"

**Requirements:**
Suggest 6-8 educational videos that would be perfect for learning ${topic}. For each video, provide:

**Format for each recommendation:**
Title: [Descriptive video title]
Description: [2-3 sentence description of what the video covers]
Duration: [Estimated duration in minutes]
Difficulty: [Beginner/Intermediate/Advanced]
Channel: [Suggested channel type or name style]
KeyTopics: [3-4 main topics covered]

**Guidelines:**
- Focus on reputable educational channels
- Include a mix of difficulty levels (2-3 beginner, 2-3 intermediate, 1-2 advanced)
- Prioritize comprehensive tutorials over quick tips
- Include both theoretical and practical content
- Suggest videos that complement each other
- Focus on popular, well-regarded educational content creators
- Include hands-on coding/implementation videos where applicable

**Example Format:**
Title: Complete ${topic} Tutorial for Beginners
Description: A comprehensive introduction covering the fundamentals of ${topic} with practical examples and real-world applications. Perfect for those starting their learning journey.
Duration: 45
Difficulty: Beginner
Channel: Tech Education Hub
KeyTopics: Basics, Setup, First Steps, Best Practices

Generate 6-8 video recommendations following this exact format.
`;
}

// Parse AI-generated video recommendations
function parseVideoRecommendations(videoText, topic) {
  try {
    const videoBlocks = videoText.split(/Title:/i).filter(block => block.trim().length > 0);
    const videos = [];
    
    videoBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n');
      const video = {
        id: `video_${index + 1}`,
        title: '',
        description: '',
        duration: 30,
        difficulty: 'Beginner',
        channel: 'Educational Channel',
        keyTopics: [],
        thumbnail: generateThumbnailUrl(topic, index),
        url: generateVideoUrl(topic, index)
      };
      
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('Description:')) {
          video.description = cleanLine.replace('Description:', '').trim();
        } else if (cleanLine.startsWith('Duration:')) {
          const duration = parseInt(cleanLine.replace('Duration:', '').trim());
          video.duration = isNaN(duration) ? 30 : duration;
        } else if (cleanLine.startsWith('Difficulty:')) {
          video.difficulty = cleanLine.replace('Difficulty:', '').trim();
        } else if (cleanLine.startsWith('Channel:')) {
          video.channel = cleanLine.replace('Channel:', '').trim();
        } else if (cleanLine.startsWith('KeyTopics:')) {
          const topics = cleanLine.replace('KeyTopics:', '').trim().split(',');
          video.keyTopics = topics.map(t => t.trim()).filter(t => t.length > 0);
        } else if (index === 0 && cleanLine.length > 0 && !cleanLine.includes(':')) {
          video.title = cleanLine;
        }
      });
      
      // Set title if not found
      if (!video.title) {
        video.title = `${topic} Tutorial - ${video.difficulty} Level`;
      }
      
      // Ensure we have key topics
      if (video.keyTopics.length === 0) {
        video.keyTopics = [topic, 'Tutorial', 'Learning', 'Practice'];
      }
      
      videos.push(video);
    });
    
    return videos.slice(0, 8); // Limit to 8 videos
    
  } catch (error) {
    console.warn('Failed to parse video recommendations:', error);
    return generateFallbackVideos(topic);
  }
}

// Generate fallback videos when AI is not available
function generateFallbackVideos(topic) {
  const fallbackVideos = [
    {
      id: 'video_1',
      title: `${topic} - Complete Beginner Tutorial`,
      description: `A comprehensive introduction to ${topic} covering all the fundamental concepts you need to get started. Perfect for beginners with no prior experience.`,
      duration: 45,
      difficulty: 'Beginner',
      channel: 'Learning Hub',
      keyTopics: [topic, 'Basics', 'Introduction', 'Getting Started'],
      thumbnail: generateThumbnailUrl(topic, 0),
      url: generateVideoUrl(topic, 0)
    },
    {
      id: 'video_2',
      title: `${topic} Fundamentals Explained`,
      description: `Deep dive into the core concepts of ${topic} with practical examples and real-world applications. Build a solid foundation.`,
      duration: 35,
      difficulty: 'Beginner',
      channel: 'Tech Academy',
      keyTopics: [topic, 'Fundamentals', 'Core Concepts', 'Examples'],
      thumbnail: generateThumbnailUrl(topic, 1),
      url: generateVideoUrl(topic, 1)
    },
    {
      id: 'video_3',
      title: `Hands-On ${topic} Project`,
      description: `Build a complete project using ${topic} from scratch. Follow along and create something meaningful while learning.`,
      duration: 60,
      difficulty: 'Intermediate',
      channel: 'Code Workshop',
      keyTopics: [topic, 'Project', 'Hands-On', 'Implementation'],
      thumbnail: generateThumbnailUrl(topic, 2),
      url: generateVideoUrl(topic, 2)
    },
    {
      id: 'video_4',
      title: `${topic} Best Practices & Tips`,
      description: `Learn industry best practices, common pitfalls to avoid, and professional tips for working with ${topic} effectively.`,
      duration: 25,
      difficulty: 'Intermediate',
      channel: 'Pro Developer',
      keyTopics: [topic, 'Best Practices', 'Tips', 'Professional'],
      thumbnail: generateThumbnailUrl(topic, 3),
      url: generateVideoUrl(topic, 3)
    },
    {
      id: 'video_5',
      title: `Advanced ${topic} Techniques`,
      description: `Master advanced concepts and techniques in ${topic}. Learn optimization strategies and advanced implementation patterns.`,
      duration: 50,
      difficulty: 'Advanced',
      channel: 'Expert Tutorials',
      keyTopics: [topic, 'Advanced', 'Optimization', 'Expert Level'],
      thumbnail: generateThumbnailUrl(topic, 4),
      url: generateVideoUrl(topic, 4)
    },
    {
      id: 'video_6',
      title: `${topic} in Real-World Applications`,
      description: `See how ${topic} is used in real industry projects. Case studies and examples from actual production environments.`,
      duration: 40,
      difficulty: 'Intermediate',
      channel: 'Industry Insights',
      keyTopics: [topic, 'Real-World', 'Industry', 'Case Studies'],
      thumbnail: generateThumbnailUrl(topic, 5),
      url: generateVideoUrl(topic, 5)
    }
  ];
  
  return fallbackVideos;
}

// Generate placeholder thumbnail URL
function generateThumbnailUrl(topic, index) {
  // Using a placeholder service for thumbnails
  const colors = ['4A90E2', 'F5A623', '7ED321', 'D0021B', 'BD10E0', '50E3C2'];
  const color = colors[index % colors.length];
  const encodedTopic = encodeURIComponent(topic);
  return `https://via.placeholder.com/320x180/${color}/ffffff?text=${encodedTopic}+Tutorial`;
}

// Generate placeholder video URL (in real implementation, these would be actual video URLs)
function generateVideoUrl(topic, index) {
  // This would be replaced with actual video URLs from YouTube, Vimeo, etc.
  const encodedTopic = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '+'));
  return `https://www.youtube.com/results?search_query=${encodedTopic}+tutorial`;
}

// Calculate total duration of all videos
function calculateTotalDuration(videos) {
  if (!videos || videos.length === 0) return 0;
  return videos.reduce((total, video) => total + (video.duration || 0), 0);
}

// Extract categories from video content
function extractVideoCategories(videos) {
  if (!videos || videos.length === 0) return [];
  
  const categories = new Set();
  videos.forEach(video => {
    if (video.difficulty) categories.add(video.difficulty);
    if (video.keyTopics) {
      video.keyTopics.forEach(topic => categories.add(topic));
    }
  });
  
  return Array.from(categories).slice(0, 10); // Limit to 10 categories
}

// Format video duration for display
export function formatDuration(minutes) {
  if (!minutes || minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

// Filter videos by difficulty level
export function filterVideosByDifficulty(videos, difficulty) {
  if (!videos || !difficulty) return videos;
  return videos.filter(video => 
    video.difficulty && video.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

// Get videos by category/topic
export function getVideosByTopic(videos, topic) {
  if (!videos || !topic) return videos;
  return videos.filter(video =>
    video.keyTopics && video.keyTopics.some(t => 
      t.toLowerCase().includes(topic.toLowerCase())
    )
  );
}
