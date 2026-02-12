// ProLearning Services Index
// Central export file for all ProLearning content generation services

export { 
  generateReadingContent, 
  clearReadingContentCache, 
  getReadingContentCacheInfo 
} from './readingContentService.js';
export { generateSummaryContent } from './summaryContentService.js';
export { generateVideosContent } from './videosContentService.js';
export { generateQuizContent, calculateQuizScore, getQuizResults, resetQuiz } from './quizContentService.js';
export { 
  generateResourcesContent, 
  filterResourcesByCategory, 
  filterResourcesByType, 
  filterResourcesByDifficulty, 
  filterFreeResources, 
  getResourcesByRating, 
  searchResources,
  getResourceIcon,
  addIconsToResources
} from './resourcesContentService.js';

// Re-export utility functions for videos
export { 
  formatDuration, 
  formatViewCount, 
  formatSubscriberCount, 
  filterVideosByDifficulty, 
  getVideosByTopic 
} from './videosContentService.js';

// Tutor chat service
export { askTutor } from './tutorService.js';
