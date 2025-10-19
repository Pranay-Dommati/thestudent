/**
 * Course Data Cache Manager
 * Implements client-side caching with TTL for course content
 */

const CACHE_PREFIX = 'course_cache_';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const courseCache = {
  /**
   * Get cached course data
   * @param {string} cacheKey - Unique identifier for the course
   * @returns {object|null} - Cached course data or null if expired/not found
   */
  get(cacheKey) {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp > CACHE_TTL) {
        console.log('🗑️ Cache expired for:', cacheKey);
        this.remove(cacheKey);
        return null;
      }

      console.log('✅ Cache hit for:', cacheKey);
      return data;
    } catch (error) {
      console.error('❌ Error reading cache:', error);
      return null;
    }
  },

  /**
   * Set course data in cache
   * @param {string} cacheKey - Unique identifier for the course
   * @param {object} data - Course data to cache
   */
  set(cacheKey, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify(cacheEntry));
      console.log('💾 Cached course data for:', cacheKey);
    } catch (error) {
      console.error('❌ Error setting cache:', error);
      // If localStorage is full, try to clear old cache entries
      if (error.name === 'QuotaExceededError') {
        this.clearOldEntries();
        // Try again
        try {
          localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (retryError) {
          console.error('❌ Still failed after clearing old entries:', retryError);
        }
      }
    }
  },

  /**
   * Remove specific cache entry
   * @param {string} cacheKey - Unique identifier for the course
   */
  remove(cacheKey) {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
      console.log('🗑️ Removed cache for:', cacheKey);
    } catch (error) {
      console.error('❌ Error removing cache:', error);
    }
  },

  /**
   * Clear all course caches
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Cleared all course caches');
    } catch (error) {
      console.error('❌ Error clearing all caches:', error);
    }
  },

  /**
   * Clear expired cache entries
   */
  clearOldEntries() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      let clearedCount = 0;

      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const { timestamp } = JSON.parse(cached);
              if (now - timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                clearedCount++;
              }
            }
          } catch (error) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
            clearedCount++;
          }
        }
      });

      console.log(`🗑️ Cleared ${clearedCount} expired cache entries`);
    } catch (error) {
      console.error('❌ Error clearing old cache entries:', error);
    }
  },

  /**
   * Invalidate cache for a specific course (e.g., when progress is updated)
   * @param {string} cacheKey - Unique identifier for the course
   */
  invalidate(cacheKey) {
    this.remove(cacheKey);
  },

  /**
   * Generate cache key from URL pathname
   * @param {string} pathname - URL pathname
   * @returns {string} - Cache key
   */
  generateKey(pathname) {
    // Normalize the pathname to create a consistent cache key
    return pathname.replace(/\//g, '_').replace(/^_+|_+$/g, '');
  }
};

export default courseCache;
