import logger from '../utils/logger';
// ProLearningHistoryService.js
// Service to manage ProLearning course history with localStorage-backed persistence (IndexedDB removed)

class ProLearningHistoryService {
  constructor() {
    this.storageKey = 'prolearning_history';
    this.maxHistoryItems = 50; // Limit history to prevent storage bloat
  }

  // Add a new ProLearning course URL to history
  addToHistory(courseData) {
    try {
      const history = this.getHistory();
      
      // Create history item
      const historyItem = {
        id: courseData.courseId || `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId: courseData.courseId,
        topic: courseData.topic || 'Unknown Topic',
        url: courseData.url,
        title: courseData.title || courseData.topic || 'ProLearning Course',
        timestamp: Date.now(),
        dateCreated: new Date().toLocaleDateString(),
        timeCreated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Remove duplicate if exists (based on courseId)
      const filteredHistory = history.filter(item => item.courseId !== historyItem.courseId);
      
      // Add new item to the beginning of the array
      filteredHistory.unshift(historyItem);
      
      // Limit history size
      const limitedHistory = filteredHistory.slice(0, this.maxHistoryItems);
      
  // Save using localStorage
  this._set(limitedHistory);
      
      // Dispatch a custom event to notify other tabs about the history update
      window.dispatchEvent(new CustomEvent('prolearning-history-updated', {
        detail: { historyItem, totalCount: limitedHistory.length }
      }));
      
      return historyItem;
    } catch (error) {
  logger.error('Error adding to ProLearning history:', error);
      return null;
    }
  }

  // Get all history items
  getHistory() {
    try {
      // Synchronous wrapper that returns cached localStorage first, then updates async
      const cached = (typeof localStorage !== 'undefined') ? localStorage.getItem(this.storageKey) : null;
      if (cached) {
        // Async refresh from IndexedDB, but don't block UI
        this._get().then((fresh) => {
          if (fresh) {
            try { localStorage.setItem(this.storageKey, JSON.stringify(fresh)); } catch {}
          }
        });
        const history = JSON.parse(cached);
        return history.sort((a, b) => b.timestamp - a.timestamp);
      }

      // If no cache, try to synchronously return empty and trigger async fetch
      this._get().then((fresh) => {
        if (fresh && typeof localStorage !== 'undefined') {
          try { localStorage.setItem(this.storageKey, JSON.stringify(fresh)); } catch {}
        }
      });
      const history = [];
      
  // Sort by timestamp (newest first)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
  logger.error('Error getting ProLearning history:', error);
      return [];
    }
  }

  // Remove an item from history
  removeFromHistory(courseId) {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.courseId !== courseId);
      
  this._set(filteredHistory);
      return true;
    } catch (error) {
  logger.error('Error removing from ProLearning history:', error);
      return false;
    }
  }

  // Clear all history
  clearHistory() {
    try {
      this._set([]);
      return true;
    } catch (error) {
  logger.error('Error clearing ProLearning history:', error);
      return false;
    }
  }

  // Get recent history (last N items)
  getRecentHistory(limit = 10) {
    const history = this.getHistory();
    return history.slice(0, limit);
  }

  // Search history by topic
  searchHistory(searchTerm) {
    const history = this.getHistory();
    const term = searchTerm.toLowerCase();
    
    return history.filter(item => 
      item.topic.toLowerCase().includes(term) ||
      item.title.toLowerCase().includes(term)
    );
  }

  // Auto-track ProLearning course creation
  trackCourseCreation(courseId, topic, baseUrl = window.location.origin) {
    const url = `${baseUrl}/pro-learning/${courseId}?topic=${encodeURIComponent(topic)}&tab=reading`;
    
    return this.addToHistory({
      courseId,
      topic,
      url,
      title: `ProLearning: ${topic}`
    });
  }

  // Get history statistics
  getHistoryStats() {
    const history = this.getHistory();
    
    return {
      totalCourses: history.length,
      todaysCourses: history.filter(item => {
        const today = new Date().toLocaleDateString();
        return item.dateCreated === today;
      }).length,
      recentCourses: history.slice(0, 5),
      topTopics: this.getTopTopics(history)
    };
  }

  // Get most frequent topics
  getTopTopics(history, limit = 5) {
    const topicCount = {};
    
    history.forEach(item => {
      const topic = item.topic;
      topicCount[topic] = (topicCount[topic] || 0) + 1;
    });

    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }
}

// Create and export a singleton instance
const proLearningHistoryService = new ProLearningHistoryService();
export default proLearningHistoryService;

// Export the class as well for direct instantiation if needed
export { ProLearningHistoryService };

// Private helpers (localStorage only)
ProLearningHistoryService.prototype._get = async function () {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
};

ProLearningHistoryService.prototype._set = async function (value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    }
  } catch {}
};