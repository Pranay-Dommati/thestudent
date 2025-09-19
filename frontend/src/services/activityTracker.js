import axios from '../utils/axios';
import logger from '../utils/logger';

class ActivityTracker {
  constructor() {
    this.isTracking = false;
    this.intervalId = null;
    this.lastActivityTime = Date.now();
    this.sessionMinutes = 0;
  }

  // Start tracking learning activity
  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.lastActivityTime = Date.now();
    this.sessionMinutes = 0;
    
    // Started learning activity tracking
    
    // Track every 5 minutes
    this.intervalId = setInterval(() => {
      this.trackActivity();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Track user interactions to detect if they're still active
    this.setupActivityListeners();
  }

  // Stop tracking learning activity
  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Send final activity update if there's any time to track
    if (this.sessionMinutes > 0) {
      this.sendActivityUpdate(this.sessionMinutes);
    }
    
  this.removeActivityListeners();
  logger.log('⏹️ Stopped learning activity tracking');
  }

  // Send activity update to backend
  async sendActivityUpdate(minutes) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        // No auth token found, skipping activity tracking
        return;
      }

      const response = await axios.post(`/courses/track-activity/`, {
        minutes: minutes
      });

      if (response.data.success) {
        // tracked
      }
    } catch (error) {
      logger.error('❌ Error tracking learning activity:', error);
    }
  }

  // Track activity (called every 5 minutes)
  trackActivity() {
    if (!this.isTracking) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    
    // If user has been inactive for more than 10 minutes, don't count this interval
    if (timeSinceLastActivity > 10 * 60 * 1000) {
      logger.log('🚫 User inactive for more than 10 minutes, not tracking this interval');
      this.lastActivityTime = now;
      return;
    }
    
    // Track 5 minutes of activity
    this.sessionMinutes += 5;
    this.sendActivityUpdate(5);
    this.lastActivityTime = now;
  }

  // Setup listeners to detect user activity
  setupActivityListeners() {
    this.onActivity = () => {
      this.lastActivityTime = Date.now();
    };

    // Listen for various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.onActivity, true);
    });
  }

  // Remove activity listeners
  removeActivityListeners() {
    if (this.onActivity) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.removeEventListener(event, this.onActivity, true);
      });
    }
  }

  // Get learning statistics
  static async getLearningStats() {
    try {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  logger.log('🔥 [LEARNING STATS] Token available:', !!token);
  logger.log('🔥 [LEARNING STATS] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
  logger.log('🔥 [LEARNING STATS] All localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        logger.error('🔥 [LEARNING STATS] ❌ No access token found in localStorage');
        return null;
      }

      logger.log('🔥 [LEARNING STATS] Making request to:', `/courses/learning-stats/`);
      const response = await axios.get(`/courses/learning-stats/`);

      logger.log('🔥 [LEARNING STATS] API Response status:', response.status);
      logger.log('🔥 [LEARNING STATS] API Response data (full):', response.data);
      logger.log('🔥 [LEARNING STATS] response.data.success:', response.data.success);
      logger.log('🔥 [LEARNING STATS] response.data.data:', response.data.data);
      logger.log('🔥 [LEARNING STATS] Type of response.data.data:', typeof response.data.data);
      
      if (response.data.success && response.data.data) {
        // Learning stats success response
        logger.log('🔥 [LEARNING STATS] response.data.data.weekly_hours:', response.data.data.weekly_hours);
        logger.log('🔥 [LEARNING STATS] response.data.data.current_streak:', response.data.data.current_streak);
        logger.log('🔥 [LEARNING STATS] Type of weekly_hours:', typeof response.data.data.weekly_hours);
        logger.log('🔥 [LEARNING STATS] Type of current_streak:', typeof response.data.data.current_streak);
      }
      
      const finalData = response.data.success ? response.data.data : null;
      logger.log('🔥 [LEARNING STATS] Final data to return:', finalData);
      logger.log('🔥 [LEARNING STATS] Final data type:', typeof finalData);
      return finalData;
    } catch (error) {
      logger.error('🔥 [LEARNING STATS] ❌ Error fetching learning stats:', error);
      logger.error('🔥 [LEARNING STATS] ❌ Error response status:', error.response?.status);
      logger.error('🔥 [LEARNING STATS] ❌ Error response data:', error.response?.data);
      return null;
    }
  }

  // Manual activity tracking (for specific actions)
  static async trackMinutes(minutes) {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return false;

      const response = await axios.post(`/courses/track-activity/`, {
        minutes: minutes
      });

  return response.data.success;
    } catch (error) {
  logger.error('Error tracking minutes:', error);
      return false;
    }
  }
}

// Create a singleton instance
const activityTracker = new ActivityTracker();

// Helper functions for easy use
export const startLearningTracking = () => activityTracker.startTracking();
export const stopLearningTracking = () => activityTracker.stopTracking();
export const getLearningStats = () => ActivityTracker.getLearningStats();
export const trackLearningMinutes = (minutes) => ActivityTracker.trackMinutes(minutes);

export default ActivityTracker;
