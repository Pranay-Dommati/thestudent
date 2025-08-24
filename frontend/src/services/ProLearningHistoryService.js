// ProLearningHistoryService.js
// Service to manage ProLearning course history in session storage

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
        status: courseData.status || 'generating', // generating | ready | error
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
      
      // Save to local storage (persists across tabs)
      localStorage.setItem(this.storageKey, JSON.stringify(limitedHistory));
      
      // Dispatch a custom event to notify other tabs about the history update
      window.dispatchEvent(new CustomEvent('prolearning-history-updated', {
        detail: { historyItem, totalCount: limitedHistory.length }
      }));
      
      return historyItem;
    } catch (error) {
      console.error('Error adding to ProLearning history:', error);
      return null;
    }
  }

  // Update status of a history item
  updateStatus(courseId, status) {
    try {
      const history = this.getHistory();
      let updated = false;
      const newHistory = history.map(item => {
        if (item.courseId === courseId) {
          updated = true;
          return { ...item, status, updatedAt: Date.now() };
        }
        return item;
      });
      if (updated) {
        localStorage.setItem(this.storageKey, JSON.stringify(newHistory));
        window.dispatchEvent(new CustomEvent('prolearning-history-updated', { detail: { courseId, status } }));
      }
      return updated;
    } catch (e) {
      console.error('Failed to update ProLearning history status', e);
      return false;
    }
  }

  // Get all history items
  getHistory() {
    try {
      const historyData = localStorage.getItem(this.storageKey);
      if (!historyData) return [];
      
      const history = JSON.parse(historyData);
      
      // Sort by timestamp (newest first)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting ProLearning history:', error);
      return [];
    }
  }

  // Remove an item from history
  removeFromHistory(courseId) {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.courseId !== courseId);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('Error removing from ProLearning history:', error);
      return false;
    }
  }

  // Clear all history
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing ProLearning history:', error);
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
      title: `ProLearning: ${topic}`,
      status: 'generating'
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

  // Clean up error status items from history
  cleanupErrorItems() {
    try {
      const history = this.getHistory();
      const cleanedHistory = history.filter(item => item.status !== 'error');
      
      // Only update storage if we actually removed items
      if (cleanedHistory.length !== history.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(cleanedHistory));
        console.log(`🧹 Cleaned up ${history.length - cleanedHistory.length} error items from ProLearning history`);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('prolearning-history-updated', {
          detail: { action: 'cleanup', removedCount: history.length - cleanedHistory.length }
        }));
        
        return history.length - cleanedHistory.length; // Return count of removed items
      }
      
      return 0; // No items removed
    } catch (error) {
      console.error('Error cleaning up ProLearning history:', error);
      return 0;
    }
  }

  // Get filtered history (excluding error items)
  getValidHistory() {
    const history = this.getHistory();
    return history.filter(item => item.status !== 'error');
  }

  // Validate and clean course data - remove courses that have invalid URLs or data
  validateAndCleanHistory() {
    try {
      const history = this.getHistory();
      const validHistory = history.filter(item => {
        // Basic validation - must have required fields
        if (!item.courseId || !item.topic || !item.url) {
          console.log(`🧹 Removing invalid history item missing required fields:`, item);
          return false;
        }
        
        // Check if URL is properly formatted
        try {
          new URL(item.url);
        } catch {
          console.log(`🧹 Removing history item with invalid URL:`, item);
          return false;
        }
        
        // Don't include error status items
        if (item.status === 'error') {
          console.log(`🧹 Removing error status item:`, item);
          return false;
        }
        
        return true;
      });
      
      // Update storage if we removed any items
      if (validHistory.length !== history.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(validHistory));
        console.log(`🧹 Cleaned up ${history.length - validHistory.length} invalid items from ProLearning history`);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('prolearning-history-updated', {
          detail: { action: 'validation-cleanup', removedCount: history.length - validHistory.length }
        }));
        
        return history.length - validHistory.length;
      }
      
      return 0;
    } catch (error) {
      console.error('Error validating ProLearning history:', error);
      return 0;
    }
  }
}

// Create and export a singleton instance
const proLearningHistoryService = new ProLearningHistoryService();
export default proLearningHistoryService;

// Export the class as well for direct instantiation if needed
export { ProLearningHistoryService };
