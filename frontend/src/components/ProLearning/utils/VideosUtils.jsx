/**
 * VideosUtils.js
 * 
 * Comprehensive utilities for video content management in ProLearning
 * Handles YouTube URL parsing, video modal state, validation, and rendering helpers
 */

import React from 'react';
import { IoPlayCircle, IoClose } from 'react-icons/io5';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * YouTube URL regex pattern for extracting video IDs
 * Supports multiple formats: watch, shorts, embed, youtu.be
 */
const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

/**
 * YouTube video ID regex pattern
 * Standard YouTube IDs are 11 characters (letters, numbers, hyphens, underscores)
 */
const YOUTUBE_ID_REGEX = /^[\w-]{11}$/;

// ============================================================================
// YOUTUBE ID EXTRACTION
// ============================================================================

/**
 * Extracts YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - Direct video ID (11 characters)
 * 
 * @param {string} value - URL or video ID to parse
 * @returns {string} - Extracted video ID or empty string
 */
export const extractYouTubeId = (value) => {
  if (!value) return '';
  
  const s = String(value);
  
  // If it's already a likely YouTube video ID (11 chars, alphanumeric + dash/underscore)
  if (YOUTUBE_ID_REGEX.test(s)) {
    return s;
  }
  
  // Try to extract from common URL formats
  const match = s.match(YOUTUBE_URL_REGEX);
  return match && match[1] ? match[1] : '';
};

/**
 * Generates YouTube embed URL for in-app playback
 * @param {Object} video - Video object containing URL or ID information
 * @returns {string} - YouTube embed URL with autoplay or empty string
 */
export const getEmbedUrlForVideo = (video) => {
  if (!video) return '';
  
  // Prefer extracting from URL; DB 'id' is a UUID, not a YouTube ID
  const idFromUrl = extractYouTubeId(video.url || video.video_url || '');
  const idFallback = extractYouTubeId(video.videoId || video.youtubeId || '');
  const id = idFromUrl || idFallback;
  
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';
};

// ============================================================================
// VIDEO VALIDATION & CONTENT CHECKS
// ============================================================================

/**
 * Validates if video content is present and valid
 * @param {Object} content - Content object to validate
 * @returns {boolean} - True if valid videos exist
 */
export const hasValidVideos = (content) => {
  if (!content) return false;
  return Array.isArray(content.videos) && content.videos.length > 0;
};

/**
 * Validates if videos array contains at least one valid video
 * @param {Array} videos - Array of video objects
 * @returns {boolean} - True if array has valid videos
 */
export const isValidVideosArray = (videos) => {
  return Array.isArray(videos) && videos.length > 0;
};

/**
 * Checks if a single video object has required fields
 * @param {Object} video - Video object to validate
 * @returns {boolean} - True if video has minimum required fields
 */
export const isValidVideoObject = (video) => {
  if (!video || typeof video !== 'object') return false;
  
  // Must have at least a URL or video_url
  const hasUrl = !!(video.url || video.video_url);
  // Should have a title
  const hasTitle = !!(video.title);
  
  return hasUrl && hasTitle;
};

/**
 * Gets video count from content object
 * @param {Object} content - Content object containing videos
 * @returns {number} - Number of videos or 0
 */
export const getVideoCount = (content) => {
  if (!content || !Array.isArray(content.videos)) return 0;
  return content.videos.length;
};

/**
 * Checks if video is from an educational channel
 * @param {Object} video - Video object
 * @returns {boolean} - True if marked as educational
 */
export const isEducationalVideo = (video) => {
  if (!video) return false;
  return video.isEducationalChannel === true || video.is_educational_channel === true;
};

/**
 * Gets video difficulty level
 * @param {Object} video - Video object
 * @returns {string} - Difficulty level (beginner, intermediate, advanced) or 'unknown'
 */
export const getVideoDifficulty = (video) => {
  if (!video) return 'unknown';
  return video.difficulty || video.video_difficulty || 'unknown';
};

// ============================================================================
// VIDEO METADATA EXTRACTION
// ============================================================================

/**
 * Extracts video channel name with fallback
 * @param {Object} video - Video object
 * @returns {string} - Channel name or 'Unknown Channel'
 */
export const getVideoChannel = (video) => {
  if (!video) return 'Unknown Channel';
  return video.channel || video.channelTitle || video.channel_title || 'Unknown Channel';
};

/**
 * Extracts video URL with fallback
 * @param {Object} video - Video object
 * @returns {string} - Video URL or empty string
 */
export const getVideoUrl = (video) => {
  if (!video) return '';
  return video.url || video.video_url || '';
};

/**
 * Extracts video thumbnail URL with fallback
 * @param {Object} video - Video object
 * @returns {string} - Thumbnail URL or placeholder
 */
export const getVideoThumbnail = (video) => {
  if (!video) return '';
  return video.thumbnail || video.thumbnailUrl || video.thumbnail_url || '';
};

/**
 * Formats view count for display (e.g., 1.2M views)
 * @param {number|string} count - View count
 * @returns {string} - Formatted view count
 */
export const formatViewCount = (count) => {
  if (!count) return '0 views';
  
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  
  if (isNaN(num)) return '0 views';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  } else {
    return `${num} views`;
  }
};

/**
 * Formats subscriber count for display
 * @param {number|string} count - Subscriber count
 * @returns {string} - Formatted subscriber count
 */
export const formatSubscriberCount = (count) => {
  if (!count) return '0 subscribers';
  
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  
  if (isNaN(num)) return '0 subscribers';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M subscribers`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K subscribers`;
  } else {
    return `${num} subscribers`;
  }
};

/**
 * Formats video duration for display (e.g., "10:45" or "1:05:30")
 * @param {string} duration - Duration string (ISO 8601 or HH:MM:SS format)
 * @returns {string} - Formatted duration
 */
export const formatVideoDuration = (duration) => {
  if (!duration) return '';
  
  // If already in MM:SS or HH:MM:SS format, return as-is
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(duration)) {
    return duration;
  }
  
  // Parse ISO 8601 duration (e.g., PT10M45S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
};

// ============================================================================
// VIDEO STATISTICS CALCULATION
// ============================================================================

/**
 * Calculates total views from video array
 * @param {Array} videos - Array of video objects
 * @returns {number} - Total view count
 */
export const calculateTotalViews = (videos) => {
  if (!Array.isArray(videos)) return 0;
  
  return videos.reduce((total, video) => {
    const views = video.viewCount || video.view_count || 0;
    const num = typeof views === 'string' ? parseInt(views, 10) : views;
    return total + (isNaN(num) ? 0 : num);
  }, 0);
};

/**
 * Calculates average views per video
 * @param {Array} videos - Array of video objects
 * @returns {number} - Average view count
 */
export const calculateAverageViews = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return 0;
  
  const total = calculateTotalViews(videos);
  return Math.round(total / videos.length);
};

/**
 * Counts HD videos in array
 * @param {Array} videos - Array of video objects
 * @returns {number} - Count of HD videos
 */
export const countHDVideos = (videos) => {
  if (!Array.isArray(videos)) return 0;
  
  return videos.filter(video => 
    video.isHD === true || 
    video.is_hd === true || 
    video.quality === 'HD' ||
    video.quality === 'hd'
  ).length;
};

/**
 * Counts verified channels in video array
 * @param {Array} videos - Array of video objects
 * @returns {number} - Count of verified channels
 */
export const countVerifiedChannels = (videos) => {
  if (!Array.isArray(videos)) return 0;
  
  const verifiedChannels = new Set();
  videos.forEach(video => {
    if (video.isVerified || video.is_verified) {
      const channel = getVideoChannel(video);
      verifiedChannels.add(channel);
    }
  });
  
  return verifiedChannels.size;
};

/**
 * Calculates total duration of all videos
 * @param {Array} videos - Array of video objects
 * @returns {string} - Total duration in readable format
 */
export const calculateTotalDuration = (videos) => {
  if (!Array.isArray(videos)) return '0:00';
  
  let totalSeconds = 0;
  
  videos.forEach(video => {
    const duration = video.duration || '';
    
    // Parse MM:SS or HH:MM:SS format
    const parts = duration.split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 2 && !parts.some(isNaN)) {
      // MM:SS
      totalSeconds += parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && !parts.some(isNaN)) {
      // HH:MM:SS
      totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  });
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
};

// ============================================================================
// VIDEO PLAYER MODAL COMPONENT
// ============================================================================

/**
 * Video Player Modal Component
 * Renders a full-screen modal with YouTube iframe embed
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Object} props.video - Video object to display
 * @param {Function} props.onClose - Close handler function
 * @returns {JSX.Element|null} - Modal component or null
 */
export const VideoPlayerModal = ({ isOpen, video, onClose }) => {
  if (!isOpen || !video) return null;
  
  const embedUrl = getEmbedUrlForVideo(video);
  
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IoPlayCircle className="w-5 h-5" />
              <span className="font-medium truncate">{video?.title || 'Playing video'}</span>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg" 
              aria-label="Close video"
            >
              <IoClose className="w-5 h-5" />
            </button>
          </div>
          
          {/* Player */}
          <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={video?.title || 'Video player'}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Unable to play this video</p>
              </div>
            )}
          </div>
          
          {/* Footer actions */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600 truncate">
              {getVideoChannel(video)}
            </div>
            {getVideoUrl(video) && (
              <a 
                href={getVideoUrl(video)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline"
              >
                Open on YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VIDEO ARRAY HELPERS
// ============================================================================

/**
 * Filters videos by difficulty level
 * @param {Array} videos - Array of video objects
 * @param {string} difficulty - Difficulty level to filter by
 * @returns {Array} - Filtered video array
 */
export const filterVideosByDifficulty = (videos, difficulty) => {
  if (!Array.isArray(videos) || !difficulty) return videos;
  
  return videos.filter(video => 
    getVideoDifficulty(video).toLowerCase() === difficulty.toLowerCase()
  );
};

/**
 * Sorts videos by view count (descending)
 * @param {Array} videos - Array of video objects
 * @returns {Array} - Sorted video array
 */
export const sortVideosByViews = (videos) => {
  if (!Array.isArray(videos)) return [];
  
  return [...videos].sort((a, b) => {
    const viewsA = a.viewCount || a.view_count || 0;
    const viewsB = b.viewCount || b.view_count || 0;
    return viewsB - viewsA;
  });
};

/**
 * Gets only educational videos from array
 * @param {Array} videos - Array of video objects
 * @returns {Array} - Filtered educational videos
 */
export const getEducationalVideos = (videos) => {
  if (!Array.isArray(videos)) return [];
  
  return videos.filter(video => isEducationalVideo(video));
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // YouTube helpers
  extractYouTubeId,
  getEmbedUrlForVideo,
  
  // Validation
  hasValidVideos,
  isValidVideosArray,
  isValidVideoObject,
  getVideoCount,
  isEducationalVideo,
  getVideoDifficulty,
  
  // Metadata extraction
  getVideoChannel,
  getVideoUrl,
  getVideoThumbnail,
  formatViewCount,
  formatSubscriberCount,
  formatVideoDuration,
  
  // Statistics
  calculateTotalViews,
  calculateAverageViews,
  countHDVideos,
  countVerifiedChannels,
  calculateTotalDuration,
  
  // Component
  VideoPlayerModal,
  
  // Array helpers
  filterVideosByDifficulty,
  sortVideosByViews,
  getEducationalVideos,
  
  // Constants
  YOUTUBE_URL_REGEX,
  YOUTUBE_ID_REGEX
};
