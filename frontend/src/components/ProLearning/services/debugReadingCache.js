/**
 * Debug utilities for reading content cache
 * Import this in browser console to debug caching issues
 */

import { clearReadingContentCache, getReadingContentCacheInfo } from './readingContentService';

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  window.debugReadingCache = {
    clear: () => {
      clearReadingContentCache();
      console.log('✅ Reading cache cleared successfully');
    },
    info: () => {
      const entries = getReadingContentCacheInfo();
      console.log(`📊 Cache has ${entries.length} entries`);
      return entries;
    },
    help: () => {
      console.log(`
🔧 Reading Cache Debug Utilities:

Available commands:
  debugReadingCache.clear()  - Clear all cached reading content
  debugReadingCache.info()   - Show all cached entries with details
  debugReadingCache.help()   - Show this help message

Examples:
  > debugReadingCache.info()    // See what's cached
  > debugReadingCache.clear()   // Clear everything
  > debugReadingCache.info()    // Verify it's empty
      `);
    }
  };
  
  console.log('🔧 Debug utilities loaded! Type "debugReadingCache.help()" for available commands');
}

export { clearReadingContentCache, getReadingContentCacheInfo };
