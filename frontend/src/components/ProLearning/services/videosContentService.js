// Videos Content Generation Service
// Handles finding and curating top educational videos from YouTube

/**
 * Generate top-quality videos content for the given topic using YouTube Data API
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to find videos for
 */
export async function generateVideosContent(setContent, topic = '') {
  console.log('🎥 Fetching top YouTube educational videos...');
  
  try {
    // First try to get real YouTube videos
    const videoContent = await fetchTopYouTubeVideos(topic);
    
    setContent((prev) => ({
      ...prev,
      videos: videoContent,
      videosMetadata: {
        generatedAt: new Date().toISOString(),
        totalVideos: videoContent.length,
        totalDuration: calculateTotalDuration(videoContent),
        categories: extractVideoCategories(videoContent),
        source: 'youtube_api',
        avgViewCount: calculateAverageViews(videoContent)
      }
    }));
    
    console.log(`✅ Found ${videoContent.length} top YouTube videos with ${calculateTotalViews(videoContent)} total views`);
    
  } catch (error) {
    console.error('🚨 YouTube API failed, trying AI recommendations:', error);
    
    try {
      // Fallback to AI-generated recommendations with YouTube search links
      const aiVideoContent = await generateCuratedVideos(topic);
      setContent((prev) => ({
        ...prev,
        videos: aiVideoContent,
        videosMetadata: {
          generatedAt: new Date().toISOString(),
          type: 'ai_curated',
          totalVideos: aiVideoContent.length,
          source: 'gemini_ai'
        }
      }));
    } catch (aiError) {
      // Ultimate fallback
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

// Fetch top YouTube videos using YouTube Data API v3
async function fetchTopYouTubeVideos(topic) {
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!youtubeApiKey) {
    console.warn('YouTube API key not found, falling back to AI recommendations');
    return generateCuratedVideos(topic);
  }

  try {
    // Create multiple targeted search queries to match YouTube's top results
    const searchQueries = [
      `${topic} explained tutorial beginner`,
      `${topic} complete guide introduction`,
      `${topic} basics fundamentals course`,
      `${topic} transistor electronics tutorial`,
      `what is ${topic} explained`
    ];
    
    // Get videos from multiple search queries for better coverage
    let allSearchResults = [];
    
    for (const query of searchQueries) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&order=relevance&videoDuration=medium&videoDefinition=high&maxResults=8&key=${youtubeApiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.items) {
          allSearchResults = allSearchResults.concat(searchData.items);
        }
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Remove duplicates based on video ID
    const uniqueResults = allSearchResults.filter((video, index, self) => 
      index === self.findIndex(v => v.id.videoId === video.id.videoId)
    );
    
    if (uniqueResults.length === 0) {
      throw new Error('No videos found on YouTube');
    }
    
    // Use the unique results for further processing
    const searchData = { items: uniqueResults.slice(0, 20) }; // Limit to top 20 for processing
    
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error('No videos found on YouTube');
    }

    // Get video IDs for detailed statistics
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    
    // Fetch detailed video statistics
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${youtubeApiKey}`;
    
    const statsResponse = await fetch(statsUrl);
    if (!statsResponse.ok) {
      throw new Error(`YouTube stats failed: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    
    // Get channel information for subscriber counts
    const channelIds = statsData.items.map(item => item.snippet.channelId).join(',');
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${youtubeApiKey}`;
    
    const channelsResponse = await fetch(channelsUrl);
    const channelsData = channelsResponse.ok ? await channelsResponse.json() : { items: [] };
    
    // Create channel lookup map
    const channelMap = {};
    channelsData.items?.forEach(channel => {
      channelMap[channel.id] = {
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        channelTitle: channel.snippet.title,
        channelThumbnail: channel.snippet.thumbnails.default?.url
      };
    });

    // Process and rank videos by quality metrics with enhanced scoring
    const processedVideos = statsData.items.map((video, index) => {
      const channelInfo = channelMap[video.snippet.channelId] || {};
      const viewCount = parseInt(video.statistics.viewCount) || 0;
      const likeCount = parseInt(video.statistics.likeCount) || 0;
      const subscriberCount = channelInfo.subscriberCount || 0;
      const commentCount = parseInt(video.statistics.commentCount) || 0;
      
      // Enhanced quality score that prioritizes educational indicators
      const educationalBonus = isEducationalContent(video.snippet.title, video.snippet.description) ? 1000000 : 0;
      const popularityScore = viewCount + (likeCount * 50) + (commentCount * 25);
      const channelReputationScore = subscriberCount * 0.5;
      const engagementRate = viewCount > 0 ? (likeCount / viewCount) * 100000 : 0;
      
      // Bonus for established educational channels
      const isEducationalChannel = isEducationalChannelName(channelInfo.channelTitle || video.snippet.channelTitle);
      const channelBonus = isEducationalChannel ? 2000000 : 0;
      
      // Recency bonus (newer videos get slight preference)
      const publishDate = new Date(video.snippet.publishedAt);
      const now = new Date();
      const daysSincePublish = (now - publishDate) / (1000 * 60 * 60 * 24);
      const recencyBonus = daysSincePublish < 365 ? 500000 : daysSincePublish < 1095 ? 250000 : 0;
      
      const qualityScore = popularityScore + channelReputationScore + engagementRate + 
                          educationalBonus + channelBonus + recencyBonus;
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description.substring(0, 250) + '...',
        duration: parseDuration(video.contentDetails.duration),
        difficulty: categorizeDifficulty(video.snippet.title, video.snippet.description),
        channel: channelInfo.channelTitle || video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        subscriberCount: subscriberCount,
        viewCount: viewCount,
        likeCount: likeCount,
        commentCount: commentCount,
        qualityScore: qualityScore,
        publishedAt: video.snippet.publishedAt,
        keyTopics: extractKeyTopics(video.snippet.title, video.snippet.description, topic),
        thumbnail: getBestThumbnail(video.snippet.thumbnails),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        channelUrl: `https://www.youtube.com/channel/${video.snippet.channelId}`,
        channelThumbnail: channelInfo.channelThumbnail,
        // Additional metadata for display
        formattedViewCount: formatViewCount(viewCount),
        formattedSubscriberCount: formatSubscriberCount(subscriberCount),
        formattedDuration: formatDuration(parseDuration(video.contentDetails.duration)),
        engagementRate: engagementRate,
        isEducationalChannel: isEducationalChannel
      };
    });

    // Enhanced filtering and sorting to match YouTube's top results
    const topVideos = processedVideos
      .filter(video => {
        // More lenient filtering to include high-quality videos
        const minViews = topic.toLowerCase().includes('bjt') || topic.toLowerCase().includes('transistor') ? 500 : 1000;
        const hasGoodDuration = video.duration >= 3 && video.duration <= 180; // 3 min to 3 hours
        const hasEducationalContent = isEducationalContent(video.title, video.description) || 
                                    isEducationalChannelName(video.channel) ||
                                    video.viewCount > 50000; // Popular videos even if not explicitly educational
        
        // Special handling for technical/engineering topics
        const isTechnicalTopic = ['bjt', 'transistor', 'electronics', 'circuit', 'engineering'].some(term => 
          topic.toLowerCase().includes(term) || video.title.toLowerCase().includes(term)
        );
        
        if (isTechnicalTopic) {
          return video.viewCount >= minViews && hasGoodDuration;
        }
        
        return video.viewCount >= minViews && hasGoodDuration && hasEducationalContent;
      })
      .sort((a, b) => {
        // Prioritize exact topic matches in title
        const aHasExactMatch = a.title.toLowerCase().includes(topic.toLowerCase());
        const bHasExactMatch = b.title.toLowerCase().includes(topic.toLowerCase());
        
        if (aHasExactMatch && !bHasExactMatch) return -1;
        if (!aHasExactMatch && bHasExactMatch) return 1;
        
        // Then sort by quality score
        return b.qualityScore - a.qualityScore;
      })
      .slice(0, 6); // Return top 6 videos

    console.log('🎯 Top educational videos found:');
    topVideos.forEach((video, index) => {
      console.log(`${index + 1}. "${video.title.substring(0, 60)}..."`);
      console.log(`   📺 Channel: ${video.channel} (${video.formattedSubscriberCount})`);
      console.log(`   👀 Views: ${video.formattedViewCount} | Duration: ${video.formattedDuration}`);
      console.log(`   🎯 Quality Score: ${Math.round(video.qualityScore).toLocaleString()}`);
      console.log(`   🔗 URL: ${video.url}`);
      console.log('');
    });

    return topVideos;

  } catch (error) {
    console.error('YouTube API error:', error);
    throw error;
  }
}

// Parse YouTube duration format (PT4M13S) to minutes
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 60 + minutes + Math.round(seconds / 60);
}

// Categorize video difficulty based on title and description
function categorizeDifficulty(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('beginner') || text.includes('basics') || text.includes('introduction') || 
      text.includes('getting started') || text.includes('fundamentals')) {
    return 'Beginner';
  } else if (text.includes('advanced') || text.includes('expert') || text.includes('master') ||
             text.includes('professional') || text.includes('complex')) {
    return 'Advanced';
  } else {
    return 'Intermediate';
  }
}

// Extract key topics from title and description
function extractKeyTopics(title, description, mainTopic) {
  const text = (title + ' ' + description).toLowerCase();
  const topics = [mainTopic];
  
  // Common educational keywords
  const keywords = ['tutorial', 'guide', 'course', 'learn', 'practical', 'hands-on', 
                   'project', 'example', 'tips', 'tricks', 'best practices'];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      topics.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  return topics.slice(0, 4); // Limit to 4 topics
}

// Get the best quality thumbnail
function getBestThumbnail(thumbnails) {
  if (thumbnails.maxres) return thumbnails.maxres.url;
  if (thumbnails.high) return thumbnails.high.url;
  if (thumbnails.medium) return thumbnails.medium.url;
  return thumbnails.default?.url || '';
}

// Check if content is educational (enhanced for technical topics)
function isEducationalContent(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  // Educational indicators
  const educational = [
    'tutorial', 'learn', 'guide', 'course', 'lesson', 'teach', 'explain', 'explained',
    'how to', 'step by step', 'complete', 'full', 'introduction', 'basics', 'fundamentals',
    'beginners', 'advanced', 'master', 'understanding', 'concept', 'theory', 'practical',
    'demonstration', 'examples', 'illustrated', 'detailed', 'comprehensive', 'overview',
    'working', 'operation', 'principle', 'construction', 'application', 'uses',
    // Technical/Engineering specific
    'transistor', 'bjt', 'electronics', 'circuit', 'engineering', 'semiconductor',
    'amplifier', 'voltage', 'current', 'base', 'collector', 'emitter', 'npn', 'pnp',
    'biasing', 'configuration', 'characteristics', 'analysis', 'design'
  ];
  
  // Non-educational indicators (to filter out)
  const nonEducational = [
    'reaction', 'review', 'unboxing', 'vlog', 'funny', 'meme', 'prank', 'challenge',
    'compilation', 'fails', 'vs', 'versus', 'comparison', 'top 10', 'best of'
  ];
  
  const hasEducational = educational.some(word => text.includes(word));
  const hasNonEducational = nonEducational.some(word => text.includes(word));
  
  return hasEducational && !hasNonEducational;
}

// Format view count for display
function formatViewCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

// Format subscriber count for display
function formatSubscriberCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M subscribers`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K subscribers`;
  }
  return `${count} subscribers`;
}

// Calculate total views across all videos
function calculateTotalViews(videos) {
  return videos.reduce((total, video) => total + (video.viewCount || 0), 0);
}

// Calculate average views
function calculateAverageViews(videos) {
  if (!videos || videos.length === 0) return 0;
  return Math.round(calculateTotalViews(videos) / videos.length);
}

// Export YouTube-specific utility functions
export { formatViewCount, formatSubscriberCount };

// Get video engagement rate (likes/views ratio)
export function getEngagementRate(video) {
  if (!video.viewCount || !video.likeCount) return 0;
  return ((video.likeCount / video.viewCount) * 100).toFixed(2);
}

// Sort videos by different criteria
export function sortVideosByViews(videos, ascending = false) {
  return [...videos].sort((a, b) => 
    ascending ? a.viewCount - b.viewCount : b.viewCount - a.viewCount
  );
}

export function sortVideosBySubscribers(videos, ascending = false) {
  return [...videos].sort((a, b) => 
    ascending ? a.subscriberCount - b.subscriberCount : b.subscriberCount - a.subscriberCount
  );
}

export function sortVideosByQuality(videos, ascending = false) {
  return [...videos].sort((a, b) => 
    ascending ? a.qualityScore - b.qualityScore : b.qualityScore - a.qualityScore
  );
}

// Filter videos by minimum views/subscribers
export function filterByMinViews(videos, minViews = 10000) {
  return videos.filter(video => video.viewCount >= minViews);
}

export function filterByMinSubscribers(videos, minSubscribers = 1000) {
  return videos.filter(video => video.subscriberCount >= minSubscribers);
}

// Get channel statistics summary
export function getChannelStats(videos) {
  const channels = {};
  
  videos.forEach(video => {
    if (!channels[video.channelId]) {
      channels[video.channelId] = {
        name: video.channel,
        subscriberCount: video.subscriberCount,
        videoCount: 0,
        totalViews: 0
      };
    }
    channels[video.channelId].videoCount++;
    channels[video.channelId].totalViews += video.viewCount;
  });
  
  return Object.values(channels);
}

// Check if channel name indicates educational content
function isEducationalChannelName(channelName) {
  if (!channelName) return false;
  
  const educationalIndicators = [
    'academy', 'education', 'tutorial', 'learning', 'teach', 'university', 
    'institute', 'school', 'course', 'training', 'study', 'explained',
    'electronics', 'engineering', 'mindset', 'hub', 'lab', 'tech',
    'freecodecamp', 'khan', 'mit', 'stanford', 'harvard', 'coursera',
    'udemy', 'edx', 'brilliant', 'crash course', 'ted-ed', 'prof',
    'tutor', 'instructor', 'guru', 'master', 'expert', 'guide'
  ];
  
  const channelLower = channelName.toLowerCase();
  return educationalIndicators.some(indicator => channelLower.includes(indicator));
}
