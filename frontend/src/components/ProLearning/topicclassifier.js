// ProLearning Topic Classification and Rate Limiting
// Handles topic extraction from user queries with rate limiting support

import universalToast from '../../utils/universalToast';
import aiAxios from '../../utils/axiosAi';
import logger from '../../utils/logger';

// Custom error class for network connection issues
class NetworkConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkConnectionError';
  }
}

// Rate limiting constants
export const MAX_TOPICS_PER_DAY = 16; // kept for compatibility when daily is enabled
export const MAX_TOPICS_PER_REQUEST = 4;
export const MAX_TOPICS_PER_MONTH = 15;

// Normalize backend usage stats into a common shape
const normalizeStats = (u) => {
  if (!u) return null;
  const rate = u.rate_limits || {};
  const daily = rate.daily || {};
  const monthly = rate.monthly || {};
  return {
    daily: {
      used: u.daily_count ?? u.daily_used ?? daily.used ?? 0,
      limit: u.daily_limit ?? daily.limit ?? MAX_TOPICS_PER_DAY,
      remaining: (u.daily_limit ?? daily.limit ?? MAX_TOPICS_PER_DAY) - (u.daily_count ?? u.daily_used ?? daily.used ?? 0),
      enforced: daily.enforced ?? true,
    },
    request: {
      used: u.request_count ?? 0,
      limit: u.request_limit ?? u.per_request_limit ?? MAX_TOPICS_PER_REQUEST,
      remaining: (u.request_limit ?? u.per_request_limit ?? MAX_TOPICS_PER_REQUEST) - (u.request_count ?? 0),
    },
    monthly: {
      used: monthly.used ?? 0,
      limit: monthly.limit ?? MAX_TOPICS_PER_MONTH,
      remaining: (monthly.limit ?? MAX_TOPICS_PER_MONTH) - (monthly.used ?? 0),
    }
  };
};

// Enhanced error handling for rate limits
export const handleRateLimitError = (error, usageStats = null) => {
  logger.error('Rate limit error:', error);
  
  if (usageStats) {
    const norm = normalizeStats(usageStats);
    const remainingDaily = norm.daily.remaining;
    const remainingRequest = norm.request.remaining;
    const remainingMonthly = norm.monthly.remaining;
    
    if (remainingMonthly === 0) {
  universalToast.error(
        `Monthly limit reached! You've used all ${norm.monthly.limit} topics this month. Resets on the 1st.`,
        { duration: 6000, icon: '🚫' }
      );
    } else if (remainingRequest === 0) {
  universalToast.error(
        `Too many topics in this request! Maximum ${norm.request.limit} topics per request. ${remainingMonthly} remaining this month.`,
        { duration: 5000, icon: '⚠️' }
      );
    } else {
  universalToast.error(
        `Rate limit exceeded. Monthly remaining: ${remainingMonthly}/${norm.monthly.limit}`,
        { duration: 4000, icon: '⏱️' }
      );
    }
  } else {
  universalToast.error('Rate limit exceeded. Please try again later.', { duration: 4000 });
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
  const norm = normalizeStats(usageStats);
  const remainingRequest = norm.request.remaining;
  const remainingMonthly = norm.monthly.remaining;
  
  if (requestedCount > remainingRequest) {
    return { 
      canCreate: false, 
      reason: 'request_limit',
      message: `Too many topics in this request. Maximum ${norm.request.limit} per request.`
    };
  }
  if (requestedCount > remainingMonthly) {
    return { 
      canCreate: false, 
      reason: 'insufficient_monthly',
      message: `Not enough monthly topics remaining. You have ${remainingMonthly} left this month.`
    };
  }
  
  return { canCreate: true, reason: null };
};

// Get formatted remaining limits for display
export const getRemainingLimits = (usageStats) => {
  if (!usageStats) {
    return {
      monthly: { used: 0, limit: MAX_TOPICS_PER_MONTH, remaining: MAX_TOPICS_PER_MONTH },
      daily: { used: 0, limit: MAX_TOPICS_PER_DAY, remaining: MAX_TOPICS_PER_DAY },
      request: { used: 0, limit: MAX_TOPICS_PER_REQUEST, remaining: MAX_TOPICS_PER_REQUEST }
    };
  }
  const norm = normalizeStats(usageStats);
  return norm;
};

// Get rate limit status from API
export const getRateLimitStatus = async () => {
  try {
    const { data: result } = await aiAxios.get('/rate-limit-status/');
    
    if (result.rate_limit_info) {
      return result.rate_limit_info;
    }
    
    return getRemainingLimits(null);
  } catch (error) {
  logger.error('Failed to fetch rate limit status:', error);
    return getRemainingLimits(null);
  }
};

// Main topic classification function with enhanced rate limiting
export const classifyTopics = async (query, expectedTopics = null) => {
  try {
    // Prepare request data
    const requestData = {
      query: query.trim(),
      ...(expectedTopics && { expected_topics: expectedTopics })
    };
    const { data: result } = await aiAxios.post('/classify_topics/', requestData);
    // Persist latest classification for downstream personalization/context usage
    try {
      const payloadToStore = {
        query: query.trim(),
        topics: Array.isArray(result?.topics) ? result.topics : [],
        personalization: typeof result?.personalization === 'string' ? result.personalization : null,
        timestamp: Date.now(),
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('proLearning:lastClassification', JSON.stringify(payloadToStore));
      }
    } catch (e) {
      // Non-fatal: storage unavailable or quota exceeded
      logger.warn('Could not persist latest classification payload:', e?.message || e);
    }
    return handleClassificationSuccess(result);
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const result = error.response.data || {};
      // In development, surface raw AI text to the console to debug parsing issues
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        console.log('🔍 Debug: classify_topics error response (dev mode):', {
          status,
          used_model: result.used_model,
          raw_ai_text_preview: typeof result.raw_ai_text === 'string' ? result.raw_ai_text.slice(0, 1000) : null,
          error: result.error,
          full_result: result
        });
      }
      if (status === 429) {
        handleRateLimitError(result.error || 'Rate limit exceeded', result.usage_stats);
        throw new Error('Rate limit exceeded');
      }
      if (status === 503 && result.error === 'network_error') {
  logger.warn('🌐 Network connection lost. Attempting to reconnect...');
        throw new NetworkConnectionError(result.message || 'Network connection lost. Attempting to reconnect...');
      }
      throw new Error(result.error || `HTTP ${status}`);
    } else if (error instanceof NetworkConnectionError) {
      // Handle network errors specifically - don't show toast here, let ChatbotPage handle it
  logger.error('🌐 Network error:', error.message);
      throw error;
    } else if (error.message !== 'Rate limit exceeded') {
  logger.error('Topic classification error:', error);
      // Don't show toast for network-related errors to avoid duplicate notifications
      if (!error.message.includes('Network') && !error.message.includes('connection')) {
  universalToast.error(`Failed to classify topics: ${error.message}`, { duration: 4000 });
      }
    }
    throw error;
  }
};

// Format usage stats for display
export const formatUsageStats = (usageStats) => {
  if (!usageStats) return null;
  
  const limits = getRemainingLimits(usageStats);
  const monthlyPercentage = (limits.monthly.used / limits.monthly.limit) * 100;
  
  return {
    monthly: {
      ...limits.monthly,
      percentage: Math.round(monthlyPercentage),
      status: monthlyPercentage >= 100 ? 'exhausted' : monthlyPercentage >= 80 ? 'warning' : 'normal'
    },
    request: limits.request,
    daily: limits.daily,
  };
};

// Get user-friendly status message
export const getStatusMessage = (usageStats) => {
  if (!usageStats) return "Ready to create topics";
  
  const limits = getRemainingLimits(usageStats);
  const rem = limits.monthly.remaining;
  if (rem === 0) return "Monthly limit reached - resets on the 1st";
  if (rem <= 3) return `Only ${rem} topic${rem !== 1 ? 's' : ''} left this month`;
  return `${rem} topics remaining this month`;
};

// Legacy compatibility function for ProLearningPage
// Wraps the new classifyTopics function to maintain backward compatibility
export const classifyTopicsWithGemini = async (query, apiKey = null) => {
  try {
  logger.log('🔄 Using legacy classifyTopicsWithGemini wrapper for:', query);
    
    // Call the new rate-limited API instead of direct Gemini
    const result = await classifyTopics(query);
    
    // Return just the topics array for backward compatibility
    return result.topics || [];
    
  } catch (error) {
  logger.error('Legacy topic classification error:', error);
    
    // For rate limit errors, return empty array to avoid breaking the UI
    if (error.message === 'Rate limit exceeded') {
  logger.warn('Rate limit exceeded in legacy function, returning empty array');
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
    if (limits.monthly.remaining === 0) {
      return `🚫 Monthly limit reached! You've used all ${limits.monthly.limit} topics this month. Resets on the 1st.`;
    }
    if (error.message && error.message.includes('per request')) {
      return `⚠️ Too many topics in this request! Maximum ${limits.request.limit} topics per request. ${limits.monthly.remaining} remaining this month.`;
    }
    return `⏱️ Rate limit exceeded. You have ${limits.monthly.remaining} topics remaining this month (${limits.monthly.used}/${limits.monthly.limit} used).`;
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
