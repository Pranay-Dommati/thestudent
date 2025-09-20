// Videos Content Generation Service
// Handles finding and curating top educational videos from YouTube

import logger from '../../../utils/logger';

/**
 * Generate top-quality videos content for the given topic using YouTube Data API
 * @param {function} setContent - React setContent function
 * @param {string} topic - The topic to find videos for
 */
export async function generateVideosContent(setContent, topic = '') {
  logger.log('🎥 Fetching top YouTube educational videos...');
  
  try {
    // Use backend YouTube proxy only (server-side API key, no client key exposure)
    let source = 'backend_youtube';
    let videoContent = await fetchFromBackendYouTube(topic);

    // If backend returns no videos, fall back to AI-curated recommendations (still via backend)
    if (!videoContent || videoContent.length === 0) {
      source = 'backend_ai';
      videoContent = await generateCuratedVideos(topic);
    }
    // Normalize fields for UI
    let normalized = normalizeVideosForUI(videoContent, topic);
    // Filter out YouTube Shorts and ultra-short clips (< 2 minutes)
    const MIN_DURATION_MINUTES = 2;
    const filtered = normalized.filter(v => {
      const url = v.url || '';
      const isShortsUrl = /youtube\.com\/shorts\//i.test(url);
      const hasDuration = typeof v.duration === 'number' && Number.isFinite(v.duration);
      const tooShort = hasDuration ? v.duration < MIN_DURATION_MINUTES : false;
      return !isShortsUrl && !tooShort;
    });
    if (filtered.length > 0) {
      normalized = filtered;
    }
    
    setContent({
      videos: normalized,
      videosMetadata: {
        generatedAt: new Date().toISOString(),
        totalVideos: normalized.length,
        totalDuration: calculateTotalDuration(normalized),
        categories: extractVideoCategories(normalized),
        source,
        avgViewCount: calculateAverageViews(normalized)
      }
    });
    
  logger.log(`✅ Found ${normalized.length} top YouTube videos with ${calculateTotalViews(normalized)} total views`);
    
  } catch (error) {
  logger.error('🚨 Backend video fetch failed, trying AI recommendations:', error);
    
    try {
      // Fallback to AI-generated recommendations with YouTube search links (backend)
      const aiVideoContent = await generateCuratedVideos(topic);
      setContent({
        videos: aiVideoContent,
        videosMetadata: {
          generatedAt: new Date().toISOString(),
          type: 'ai_curated',
          totalVideos: aiVideoContent.length,
          source: 'backend_ai'
        }
      });
    } catch (aiError) {
      // Ultimate fallback
      throw new Error('Video generation failed');
    }
  }
}

// Try server-side YouTube Data API via backend to avoid exposing API key
async function fetchFromBackendYouTube(topic) {
  const url = '/ai/youtube_search/';
  try {
    const axiosAi = (await import('../../../utils/axiosAi')).default;
    const { data } = await axiosAi.post('/youtube_search/', { topic, maxResults: 10 });
    const vids = Array.isArray(data?.videos) ? data.videos : [];
    return vids;
  } catch (e) {
  logger.warn('Backend YouTube search error:', e);
    throw e; // Let caller fallback
  }
}

async function safeJson(resp) {
  try {
    return await resp.json();
  } catch {
    return { message: 'non-JSON error body' };
  }
}

// Normalize YouTube API results (backend/client) for our UI expectations
function normalizeVideosForUI(videos, topic) {
  if (!Array.isArray(videos)) return [];
  return videos.map((v, idx) => {
    const id = v.id || v.videoId || `video_${idx + 1}`;
    const title = v.title || '';
    const description = v.description || '';
    const url = v.url || (id ? `https://www.youtube.com/watch?v=${id}` : generateVideoUrl(topic, idx));
    const channel = v.channel || v.channelTitle || '';
    const thumbnail = v.thumbnail || v.thumbnails?.high?.url || v.thumbnails?.medium?.url || v.thumbnails?.default?.url || '';
    const viewCount = typeof v.viewCount === 'number' ? v.viewCount : (parseInt(v.views || 0) || 0);
    // Duration: handle ISO 8601 (PT...) or minutes number
    const minutes = typeof v.duration === 'string' ? parseDuration(v.duration) : (v.duration || 0);
    return {
      id,
      title,
      description,
      url,
      thumbnail,
      channel,
      channelTitle: channel,
      viewCount,
      formattedViewCount: formatViewCount(viewCount),
      duration: minutes,
      formattedDuration: formatDuration(minutes),
      isEducationalChannel: isEducationalChannelName(channel),
      keyTopics: extractKeyTopics(title, description, topic),
    };
  });
}

// Generate curated video recommendations based on topic
async function generateCuratedVideos(topic) {
  try {
    const axiosAi = (await import('../../../utils/axiosAi')).default;
    const { data: result } = await axiosAi.post('/videos/', { topic });
    const videoText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return parseVideoRecommendations(videoText, topic);
  } catch (error) {
    throw new Error('Video generation failed');
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
    logger.warn('Failed to parse video recommendations:', error);
    throw new Error('Video generation failed');
  }
}

// Generate placeholder thumbnail URL
function generateThumbnailUrl(topic, index) {
  // Using a placeholder service for thumbnails
  const colors = ['4A90E2', 'F5A623', '7ED321', 'D0021B', 'BD10E0', '50E3C2'];
  const color = colors[index % colors.length];
  const encodedTopic = encodeURIComponent(topic);
  // Use a data URL placeholder instead of external service
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  // Set background color
  ctx.fillStyle = `#${color}`;
  ctx.fillRect(0, 0, 320, 180);
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${topic} Tutorial`, 160, 90);
  
  return canvas.toDataURL('image/png');
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

// Helper function to calculate video quality score
function calculateVideoQuality(videoDetails) {
  if (!videoDetails) return 0;
  
  const views = parseInt(videoDetails.statistics?.viewCount) || 0;
  const likes = parseInt(videoDetails.statistics?.likeCount) || 0;
  
  // Simple quality score based on views and likes
  return (views * 0.7) + (likes * 0.3);
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

// Parse ISO 8601 duration into seconds (e.g., PT1H2M3S)
function parseISODurationToSeconds(iso) {
  if (!iso || typeof iso !== 'string') return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
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
