// ProLearning Services Index
// Central export file for all ProLearning content generation services

export { generateReadingContent } from './readingContentService.js';
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
  searchResources 
} from './resourcesContentService.js';

// Re-export utility functions for videos
export { formatDuration, filterVideosByDifficulty, getVideosByTopic } from './videosContentService.js';
