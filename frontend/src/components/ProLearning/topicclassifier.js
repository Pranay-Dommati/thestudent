// ProLearning Topic Classification and Rate Limiting
// Handles topic extraction from user queries with rate limiting support

import toast from 'react-hot-toast';

// Rate limiting constants
export const MAX_TOPICS_PER_DAY = 16;
export const MAX_TOPICS_PER_REQUEST = 4;

// Enhanced error handling for rate limits
export const handleRateLimitError = (error, usageStats = null) => {
  console.error('Rate limit error:', error);
  
  if (usageStats) {
    const remainingDaily = usageStats.daily_limit - usageStats.daily_count;
    const remainingRequest = usageStats.request_limit - usageStats.request_count;
    
    if (remainingDaily === 0) {
      toast.error(
        `Daily limit reached! You've used all ${usageStats.daily_limit} topics today. Resets at midnight.`,
        { duration: 6000, icon: '🚫' }
      );
    } else if (remainingRequest === 0) {
      toast.error(
        `Too many topics in this request! Maximum ${usageStats.request_limit} topics per request. You have ${remainingDaily} topics remaining today.`,
        { duration: 5000, icon: '⚠️' }
      );
    } else {
      toast.error(
        `Rate limit exceeded. Daily: ${remainingDaily}/${usageStats.daily_limit}, Request: ${remainingRequest}/${usageStats.request_limit}`,
        { duration: 4000, icon: '⏱️' }
      );
    }
  } else {
    toast.error('Rate limit exceeded. Please try again later.', { duration: 4000 });
  }
};

// Enhanced success handler with usage stats
export const handleClassificationSuccess = (result) => {
  const topics = result.topics || [];
  const usageStats = result.usage_stats;
  
  // Don't show success toast for classification - only show it for actual topic creation
  // This function is called when topics are extracted/classified, not when they're actually created
  return result;
  
  return result;
};

// Check if user can create more topics
export const canCreateTopics = (usageStats, requestedCount = 1) => {
  if (!usageStats) return { canCreate: true, reason: null };
  
  const remainingDaily = usageStats.daily_limit - usageStats.daily_count;
  const remainingRequest = usageStats.request_limit - usageStats.request_count;
  
  if (remainingDaily === 0) {
    return { 
      canCreate: false, 
      reason: 'daily_limit',
      message: `Daily limit reached (${usageStats.daily_count}/${usageStats.daily_limit}). Resets at midnight.`
    };
  }
  
  if (requestedCount > remainingRequest) {
    return { 
      canCreate: false, 
      reason: 'request_limit',
      message: `Too many topics in this request. Maximum ${usageStats.request_limit} per request.`
    };
  }
  
  if (requestedCount > remainingDaily) {
    return { 
      canCreate: false, 
      reason: 'insufficient_daily',
      message: `Not enough daily topics remaining. You have ${remainingDaily} left today.`
    };
  }
  
  return { canCreate: true, reason: null };
};

// Get formatted remaining limits for display
export const getRemainingLimits = (usageStats) => {
  if (!usageStats) {
    return {
      daily: { used: 0, limit: MAX_TOPICS_PER_DAY, remaining: MAX_TOPICS_PER_DAY },
      request: { used: 0, limit: MAX_TOPICS_PER_REQUEST, remaining: MAX_TOPICS_PER_REQUEST }
    };
  }
  
  return {
    daily: {
      used: usageStats.daily_count || 0,
      limit: usageStats.daily_limit || MAX_TOPICS_PER_DAY,
      remaining: (usageStats.daily_limit || MAX_TOPICS_PER_DAY) - (usageStats.daily_count || 0)
    },
    request: {
      used: usageStats.request_count || 0,
      limit: usageStats.request_limit || MAX_TOPICS_PER_REQUEST,
      remaining: (usageStats.request_limit || MAX_TOPICS_PER_REQUEST) - (usageStats.request_count || 0)
    }
  };
};

// Get rate limit status from API
export const getRateLimitStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/ai/rate-limit-status/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    const result = await response.json();
    
    if (result.rate_limit_info) {
      return {
        daily_count: result.rate_limit_info.daily_used || 0,
        daily_limit: result.rate_limit_info.daily_limit || 16,
        request_limit: result.rate_limit_info.per_request_limit || 4,
        remaining: result.rate_limit_info.daily_remaining || 16
      };
    }
    
    return getRemainingLimits(null);
  } catch (error) {
    console.error('Failed to fetch rate limit status:', error);
    return getRemainingLimits(null);
  }
};

// Main topic classification function with enhanced rate limiting
export const classifyTopics = async (query, expectedTopics = null) => {
  try {
    const token = localStorage.getItem('token');
    
    // Prepare request data
    const requestData = {
      query: query.trim(),
      ...(expectedTopics && { expected_topics: expectedTopics })
    };
    
        const response = await fetch('/ai/classify_topics/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (response.status === 429) {
      // Rate limit exceeded
      handleRateLimitError(result.error || 'Rate limit exceeded', result.usage_stats);
      throw new Error('Rate limit exceeded');
    }
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle successful response
    return handleClassificationSuccess(result);
    
  } catch (error) {
    if (error.message !== 'Rate limit exceeded') {
      console.error('Topic classification error:', error);
      toast.error(`Failed to classify topics: ${error.message}`, { duration: 4000 });
    }
    throw error;
  }
};

// Format usage stats for display
export const formatUsageStats = (usageStats) => {
  if (!usageStats) return null;
  
  const limits = getRemainingLimits(usageStats);
  const dailyPercentage = (limits.daily.used / limits.daily.limit) * 100;
  
  return {
    daily: {
      ...limits.daily,
      percentage: Math.round(dailyPercentage),
      status: dailyPercentage >= 100 ? 'exhausted' : dailyPercentage >= 80 ? 'warning' : 'normal'
    },
    request: limits.request
  };
};

// Get user-friendly status message
export const getStatusMessage = (usageStats) => {
  if (!usageStats) return "Ready to create topics";
  
  const limits = getRemainingLimits(usageStats);
  
  if (limits.daily.remaining === 0) {
    return "Daily limit reached - resets at midnight";
  }
  
  if (limits.daily.remaining <= 3) {
    return `Only ${limits.daily.remaining} topic${limits.daily.remaining !== 1 ? 's' : ''} remaining today`;
  }
  
  return `${limits.daily.remaining} topic${limits.daily.remaining !== 1 ? 's' : ''} remaining today`;
};

// Legacy compatibility function for ProLearningPage
// Wraps the new classifyTopics function to maintain backward compatibility
export const classifyTopicsWithGemini = async (query, apiKey = null) => {
  try {
    console.log('🔄 Using legacy classifyTopicsWithGemini wrapper for:', query);
    
    // Call the new rate-limited API instead of direct Gemini
    const result = await classifyTopics(query);
    
    // Return just the topics array for backward compatibility
    return result.topics || [];
    
  } catch (error) {
    console.error('Legacy topic classification error:', error);
    
    // For rate limit errors, return empty array to avoid breaking the UI
    if (error.message === 'Rate limit exceeded') {
      console.warn('Rate limit exceeded in legacy function, returning empty array');
      return [];
    }
    
    // For other errors, throw to maintain error handling behavior
    throw error;
  }
};

// Format rate limit error messages for user display
export const formatRateLimitMessage = (error) => {
  if (!error) return "Rate limit exceeded. Please try again later.";
  
  // If error has usage stats, provide detailed message
  if (error.usage_stats) {
    const limits = getRemainingLimits(error.usage_stats);
    
    if (limits.daily.remaining === 0) {
      return `🚫 Daily limit reached! You've used all ${limits.daily.limit} topics today. Limit resets at midnight.`;
    }
    
    if (error.message && error.message.includes('per request')) {
      return `⚠️ Too many topics in this request! Maximum ${limits.request.limit} topics per request. You have ${limits.daily.remaining} topics remaining today.`;
    }
    
    return `⏱️ Rate limit exceeded. You have ${limits.daily.remaining} topics remaining today (${limits.daily.used}/${limits.daily.limit} used).`;
  }
  
  // Fallback message
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return "Rate limit exceeded. Please try again later.";
};

export default {
  classifyTopics,
  classifyTopicsWithGemini,
  getRateLimitStatus,
  handleRateLimitError,
  handleClassificationSuccess,
  canCreateTopics,
  getRemainingLimits,
  formatUsageStats,
  getStatusMessage,
  formatRateLimitMessage,
  MAX_TOPICS_PER_DAY,
  MAX_TOPICS_PER_REQUEST
};
