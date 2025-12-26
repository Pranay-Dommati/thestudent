// PendingCourseNotificationService.js
// Service to manage pending course completion notifications
// Shows notifications when user returns to site after course generation completed in background

import universalToast from '../utils/universalToast';
import logger from '../utils/logger';

const STORAGE_KEYS = {
  SHOWN_NOTIFICATIONS: 'pendingCourseNotifications_shown',
  PENDING_NOTIFICATIONS: 'bgGen_pendingNotifications', // Shared with BackgroundGenerationService
};

class PendingCourseNotificationService {
  constructor() {
    this.initialized = false;
    this.eventListenersAttached = false;
    
    // Bind methods
    this._handleCourseComplete = this._handleCourseComplete.bind(this);
    this._handleShowNotification = this._handleShowNotification.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
  }

  /**
   * Initialize the notification service
   * Call this when the app starts
   */
  initialize() {
    if (this.initialized) return;
    
    logger.log('🔔 [NotificationService] Initializing...');
    
    this._attachEventListeners();
    
    // Check for pending notifications after a short delay
    // This allows the auth context and other services to initialize
    setTimeout(() => {
      this._checkAndShowPendingNotifications();
    }, 2500);
    
    this.initialized = true;
  }

  /**
   * Attach event listeners for notification events
   */
  _attachEventListeners() {
    if (this.eventListenersAttached || typeof window === 'undefined') return;

    // Listen for course completion events from BackgroundGenerationService
    window.addEventListener('bgGen:courseComplete', this._handleCourseComplete);
    window.addEventListener('bgGen:showNotification', this._handleShowNotification);
    
    // Listen for visibility changes to show notifications when user returns
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
    
    // Listen for when user logs in - check for pending notifications
    window.addEventListener('user:loggedIn', () => {
      logger.log('🔔 [NotificationService] User logged in - checking notifications');
      setTimeout(() => this._checkAndShowPendingNotifications(), 1000);
    });

    this.eventListenersAttached = true;
    logger.log('🔔 [NotificationService] Event listeners attached');
  }

  /**
   * Handle course completion event
   */
  _handleCourseComplete(event) {
    const notification = event.detail;
    logger.log('🔔 [NotificationService] Course complete event received:', notification);
    
    // Show notification immediately if page is visible
    if (document.visibilityState === 'visible') {
      this._showNotification(notification);
    }
  }

  /**
   * Handle show notification event
   */
  _handleShowNotification(event) {
    const notification = event.detail;
    logger.log('🔔 [NotificationService] Show notification event received:', notification);
    this._showNotification(notification);
  }

  /**
   * Handle visibility change - show pending notifications when user returns
   */
  _handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      logger.log('🔔 [NotificationService] Page visible - checking pending notifications');
      // Slight delay to avoid overwhelming the user
      setTimeout(() => this._checkAndShowPendingNotifications(), 500);
    }
  }

  /**
   * Check for and show any pending notifications
   */
  _checkAndShowPendingNotifications() {
    try {
      const pendingStr = localStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      if (!pendingStr) return;

      const pending = JSON.parse(pendingStr);
      if (!Array.isArray(pending) || pending.length === 0) return;

      const shown = this._getShownNotifications();
      
      // Filter out already shown notifications
      const toShow = pending.filter(n => !shown.includes(n.courseId));
      
      if (toShow.length === 0) {
        logger.log('🔔 [NotificationService] All notifications already shown');
        return;
      }

      logger.log(`🔔 [NotificationService] Showing ${toShow.length} pending notifications`);
      
      // Show notifications with staggered timing
      toShow.forEach((notification, index) => {
        setTimeout(() => {
          this._showNotification(notification);
        }, index * 1500); // 1.5 second delay between notifications
      });

    } catch (error) {
      logger.error('❌ [NotificationService] Error checking pending notifications:', error);
    }
  }

  /**
   * Show a single notification
   */
  _showNotification(notification) {
    if (!notification || !notification.courseId) return;

    // Check if already shown recently
    if (this._wasRecentlyShown(notification.courseId)) {
      logger.log('🔔 [NotificationService] Notification already shown recently:', notification.courseId);
      return;
    }

    const { courseTitle, topicsCount } = notification;
    const message = `🎉 "${courseTitle}" course is ready! ${topicsCount} topics generated and saved to your Learning Hub.`;

    // Show toast notification
    universalToast.success(message, {
      duration: 6000,
      dedupeKey: `course_complete_${notification.courseId}`,
    });

    // Mark as shown
    this._markAsShown(notification.courseId);

    // Clear from pending notifications
    this._removeFromPending(notification.courseId);

    logger.log('🔔 [NotificationService] Notification shown:', notification.courseTitle);
  }

  /**
   * Get list of shown notification courseIds
   */
  _getShownNotifications() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      
      // Clean up old entries (older than 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return Object.entries(data)
        .filter(([_, timestamp]) => timestamp > oneDayAgo)
        .map(([courseId]) => courseId);
    } catch {
      return [];
    }
  }

  /**
   * Check if notification was shown recently (within last 30 minutes)
   */
  _wasRecentlyShown(courseId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS);
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      const timestamp = data[courseId];
      
      if (!timestamp) return false;
      
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return timestamp > thirtyMinutesAgo;
    } catch {
      return false;
    }
  }

  /**
   * Mark a notification as shown
   */
  _markAsShown(courseId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS);
      const data = stored ? JSON.parse(stored) : {};
      
      data[courseId] = Date.now();
      
      // Keep only last 50 entries to prevent storage bloat
      const entries = Object.entries(data);
      if (entries.length > 50) {
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        const trimmed = Object.fromEntries(sorted.slice(0, 50));
        localStorage.setItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS, JSON.stringify(trimmed));
      } else {
        localStorage.setItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS, JSON.stringify(data));
      }
    } catch (error) {
      logger.error('❌ [NotificationService] Error marking notification shown:', error);
    }
  }

  /**
   * Remove a notification from pending list
   */
  _removeFromPending(courseId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      if (!stored) return;
      
      const pending = JSON.parse(stored);
      const filtered = pending.filter(n => n.courseId !== courseId);
      
      if (filtered.length === 0) {
        localStorage.removeItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      } else {
        localStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATIONS, JSON.stringify(filtered));
      }
    } catch (error) {
      logger.error('❌ [NotificationService] Error removing from pending:', error);
    }
  }

  /**
   * Manually trigger a course completion notification
   * Use this when auto-save completes in the background
   */
  notifyCourseComplete(courseId, courseTitle, options = {}) {
    const notification = {
      courseId,
      courseTitle,
      topicsCount: options.topicsCount || 0,
      userId: options.userId || null,
      completedAt: Date.now(),
      type: 'course_generation_complete',
    };

    // If page is visible, show immediately
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this._showNotification(notification);
    } else {
      // Queue for later
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
        const pending = stored ? JSON.parse(stored) : [];
        
        // Check if already exists
        if (!pending.some(n => n.courseId === courseId)) {
          pending.push(notification);
          localStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATIONS, JSON.stringify(pending));
          logger.log('🔔 [NotificationService] Notification queued for later:', courseTitle);
        }
      } catch (error) {
        logger.error('❌ [NotificationService] Error queuing notification:', error);
      }
    }
  }

  /**
   * Clear all notifications for cleanup
   */
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.PENDING_NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.SHOWN_NOTIFICATIONS);
      logger.log('🔔 [NotificationService] All notifications cleared');
    } catch (error) {
      logger.error('❌ [NotificationService] Error clearing notifications:', error);
    }
  }

  /**
   * Cleanup service
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('bgGen:courseComplete', this._handleCourseComplete);
      window.removeEventListener('bgGen:showNotification', this._handleShowNotification);
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    }
    this.eventListenersAttached = false;
    this.initialized = false;
  }
}

// Create singleton instance
const pendingCourseNotificationService = new PendingCourseNotificationService();

export default pendingCourseNotificationService;

// Export utility functions
export const initializeNotificationService = () => pendingCourseNotificationService.initialize();
export const notifyCourseComplete = (courseId, courseTitle, options) => 
  pendingCourseNotificationService.notifyCourseComplete(courseId, courseTitle, options);
export const clearAllNotifications = () => pendingCourseNotificationService.clearAll();
