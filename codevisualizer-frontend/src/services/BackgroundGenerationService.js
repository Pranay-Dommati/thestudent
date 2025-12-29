// BackgroundGenerationService.js
// Robust service for managing background course generation that continues even when:
// - User switches tabs
// - User navigates away from the ProLearning page
// - User closes the browser (persists state for resumption)
// Works on both mobile and desktop browsers

import contentStorageService from './ContentStorageService.js';
import logger from '../utils/logger';

const STORAGE_KEYS = {
  ACTIVE_GENERATION: 'bgGen_activeGeneration',
  PENDING_NOTIFICATIONS: 'bgGen_pendingNotifications',
  GENERATION_QUEUE: 'bgGen_generationQueue',
  LAST_HEARTBEAT: 'bgGen_lastHeartbeat',
};

// Heartbeat interval to track if generation is still active
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds - consider stale if no heartbeat

class BackgroundGenerationService {
  constructor() {
    this.isGenerating = false;
    this.currentGeneration = null;
    this.heartbeatInterval = null;
    this.callbacks = {};
    this.isPageVisible = true;
    
    // Bind methods for event handlers
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
    this._handlePageHide = this._handlePageHide.bind(this);
    
    // Initialize visibility tracking
    this._initVisibilityTracking();
    
    // Check for any pending notifications on initialization
    this._checkPendingNotificationsOnInit();
  }

  /**
   * Initialize visibility tracking for background operation
   */
  _initVisibilityTracking() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._handleVisibilityChange);
      window.addEventListener('beforeunload', this._handleBeforeUnload);
      window.addEventListener('pagehide', this._handlePageHide);
    }
  }

  /**
   * Handle page visibility changes - CRITICAL for background generation
   */
  _handleVisibilityChange() {
    const wasVisible = this.isPageVisible;
    this.isPageVisible = !document.hidden;
    
    logger.log(`👁️ [BackgroundGen] Visibility changed: ${wasVisible ? 'visible' : 'hidden'} -> ${this.isPageVisible ? 'visible' : 'hidden'}`);
    
    if (!this.isPageVisible) {
      // Page is now hidden - ensure generation continues
      this._persistCurrentState();
      logger.log('🔄 [BackgroundGen] Page hidden - generation will continue in background');
    } else {
      // Page is now visible - check if there were any completions
      this._checkForCompletedGenerations();
    }
  }

  /**
   * Handle before unload - save state for potential resumption
   */
  _handleBeforeUnload() {
    if (this.isGenerating && this.currentGeneration) {
      this._persistCurrentState();
      logger.log('💾 [BackgroundGen] State persisted before unload');
    }
  }

  /**
   * Handle page hide (mobile browsers)
   */
  _handlePageHide() {
    if (this.isGenerating && this.currentGeneration) {
      this._persistCurrentState();
      logger.log('💾 [BackgroundGen] State persisted on page hide (mobile)');
    }
  }

  /**
   * Start background generation for a course
   * @param {Object} config - Generation configuration
   * @param {string} config.courseId - Course ID
   * @param {string} config.courseTitle - Course title
   * @param {Array} config.topics - Topics list
   * @param {boolean} config.isLoggedIn - Whether user is logged in
   * @param {string} config.userId - User ID (if logged in)
   * @param {Function} config.generatorFn - The actual generation function to call
   * @param {Object} config.callbacks - Callbacks for progress updates
   */
  startBackgroundGeneration(config) {
    const {
      courseId,
      courseTitle,
      topics,
      isLoggedIn,
      userId,
      callbacks = {}
    } = config;

    logger.log('🚀 [BackgroundGen] Starting background generation:', { courseId, courseTitle, topicsCount: topics?.length });

    this.isGenerating = true;
    this.callbacks = callbacks;
    
    this.currentGeneration = {
      courseId,
      courseTitle,
      topics,
      isLoggedIn,
      userId,
      startedAt: Date.now(),
      status: 'generating',
      completedTopics: 0,
      totalTopics: topics?.length || 0,
    };

    // Persist the active generation state
    this._persistCurrentState();
    
    // Start heartbeat to track generation is alive
    this._startHeartbeat();

    return this.currentGeneration;
  }

  /**
   * Update generation progress - called by the actual generator
   */
  updateProgress(progress) {
    if (!this.currentGeneration) return;

    this.currentGeneration = {
      ...this.currentGeneration,
      ...progress,
      lastUpdated: Date.now(),
    };

    // Persist updated state
    this._persistCurrentState();
    
    // Notify callbacks if page is visible
    if (this.isPageVisible && this.callbacks.onProgress) {
      this.callbacks.onProgress(progress);
    }

    logger.log('📊 [BackgroundGen] Progress updated:', progress);
  }

  /**
   * Mark generation as complete
   */
  async markComplete() {
    if (!this.currentGeneration) return;

    logger.log('✅ [BackgroundGen] Generation completed for course:', this.currentGeneration.courseTitle);

    const completedGeneration = {
      ...this.currentGeneration,
      status: 'completed',
      completedAt: Date.now(),
    };

    // Stop heartbeat
    this._stopHeartbeat();

    // If user is logged in, queue notification
    if (completedGeneration.isLoggedIn) {
      this._queueNotification(completedGeneration);
    }

    // Clear active generation
    this._clearActiveGeneration();
    this.isGenerating = false;

    // Notify callbacks
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(completedGeneration);
    }

    // If page was hidden during completion, mark for notification on return
    if (!this.isPageVisible) {
      logger.log('📬 [BackgroundGen] Page hidden - queuing notification for when user returns');
    }

    return completedGeneration;
  }

  /**
   * Mark generation as failed
   */
  markFailed(error) {
    if (!this.currentGeneration) return;

    logger.log('❌ [BackgroundGen] Generation failed:', error);

    this._stopHeartbeat();
    this._clearActiveGeneration();
    this.isGenerating = false;

    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Get current generation status
   */
  getStatus() {
    return {
      isGenerating: this.isGenerating,
      isPageVisible: this.isPageVisible,
      currentGeneration: this.currentGeneration,
    };
  }

  /**
   * Check if there's an active generation for a specific course
   */
  isGeneratingCourse(courseId) {
    return this.isGenerating && this.currentGeneration?.courseId === courseId;
  }

  /**
   * Get pending notifications for a user
   */
  getPendingNotifications(userId = null) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      
      // Filter by userId if provided
      if (userId) {
        return notifications.filter(n => n.userId === userId);
      }
      
      return notifications;
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error reading notifications:', error);
      return [];
    }
  }

  /**
   * Clear a pending notification
   */
  clearNotification(courseId) {
    try {
      const notifications = this.getPendingNotifications();
      const filtered = notifications.filter(n => n.courseId !== courseId);
      localStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATIONS, JSON.stringify(filtered));
      logger.log('🧹 [BackgroundGen] Cleared notification for course:', courseId);
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error clearing notification:', error);
    }
  }

  /**
   * Clear all pending notifications for a user
   */
  clearAllNotifications(userId = null) {
    try {
      if (userId) {
        const notifications = this.getPendingNotifications();
        const filtered = notifications.filter(n => n.userId !== userId);
        localStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATIONS, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      }
      logger.log('🧹 [BackgroundGen] Cleared all notifications');
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error clearing all notifications:', error);
    }
  }

  /**
   * Resume a stale generation (e.g., after browser restart)
   * Returns the stale generation info if found, or null
   */
  checkForStaleGeneration() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_GENERATION);
      if (!stored) return null;

      const generation = JSON.parse(stored);
      const lastHeartbeat = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_HEARTBEAT) || '0');
      const now = Date.now();

      // Check if the generation is stale (no heartbeat for too long)
      if (now - lastHeartbeat > HEARTBEAT_TIMEOUT && generation.status === 'generating') {
        logger.log('⚠️ [BackgroundGen] Found stale generation:', generation.courseTitle);
        return generation;
      }

      return null;
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error checking stale generation:', error);
      return null;
    }
  }

  /**
   * Cleanup/destroy service
   */
  destroy() {
    this._stopHeartbeat();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
      window.removeEventListener('beforeunload', this._handleBeforeUnload);
      window.removeEventListener('pagehide', this._handlePageHide);
    }
  }

  // Private methods

  _persistCurrentState() {
    if (!this.currentGeneration) return;

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GENERATION, JSON.stringify(this.currentGeneration));
      localStorage.setItem(STORAGE_KEYS.LAST_HEARTBEAT, String(Date.now()));
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error persisting state:', error);
    }
  }

  _clearActiveGeneration() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GENERATION);
      localStorage.removeItem(STORAGE_KEYS.LAST_HEARTBEAT);
      this.currentGeneration = null;
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error clearing generation:', error);
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isGenerating) {
        localStorage.setItem(STORAGE_KEYS.LAST_HEARTBEAT, String(Date.now()));
      }
    }, HEARTBEAT_INTERVAL);
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  _queueNotification(completedGeneration) {
    try {
      const notifications = this.getPendingNotifications();
      
      // Check if already exists
      const exists = notifications.some(n => n.courseId === completedGeneration.courseId);
      if (exists) {
        logger.log('ℹ️ [BackgroundGen] Notification already queued for course:', completedGeneration.courseId);
        return;
      }

      const notification = {
        courseId: completedGeneration.courseId,
        courseTitle: completedGeneration.courseTitle,
        userId: completedGeneration.userId,
        completedAt: completedGeneration.completedAt,
        topicsCount: completedGeneration.totalTopics,
        type: 'course_generation_complete',
      };

      notifications.push(notification);
      localStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATIONS, JSON.stringify(notifications));
      
      logger.log('📬 [BackgroundGen] Notification queued:', notification);

      // Dispatch event for immediate notification if user is on site
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bgGen:courseComplete', { detail: notification }));
      }
    } catch (error) {
      logger.error('❌ [BackgroundGen] Error queuing notification:', error);
    }
  }

  _checkForCompletedGenerations() {
    // This is called when page becomes visible
    // Check if there are any notifications to show
    const notifications = this.getPendingNotifications();
    
    if (notifications.length > 0) {
      logger.log('📬 [BackgroundGen] Found pending notifications on visibility:', notifications.length);
      
      // Dispatch event for each notification
      notifications.forEach(notification => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bgGen:showNotification', { detail: notification }));
        }
      });
    }
  }

  _checkPendingNotificationsOnInit() {
    // Called during service initialization
    // Slight delay to allow app to fully initialize
    setTimeout(() => {
      this._checkForCompletedGenerations();
    }, 2000);
  }
}

// Create singleton instance
const backgroundGenerationService = new BackgroundGenerationService();

export default backgroundGenerationService;

// Export utility functions
export const startBackgroundGeneration = (config) => backgroundGenerationService.startBackgroundGeneration(config);
export const updateBackgroundProgress = (progress) => backgroundGenerationService.updateProgress(progress);
export const markBackgroundComplete = () => backgroundGenerationService.markComplete();
export const markBackgroundFailed = (error) => backgroundGenerationService.markFailed(error);
export const getBackgroundStatus = () => backgroundGenerationService.getStatus();
export const isGeneratingCourse = (courseId) => backgroundGenerationService.isGeneratingCourse(courseId);
export const getPendingNotifications = (userId) => backgroundGenerationService.getPendingNotifications(userId);
export const clearNotification = (courseId) => backgroundGenerationService.clearNotification(courseId);
export const clearAllNotifications = (userId) => backgroundGenerationService.clearAllNotifications(userId);
export const checkForStaleGeneration = () => backgroundGenerationService.checkForStaleGeneration();
