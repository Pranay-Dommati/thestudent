/**
 * ProLearning Module Entry Point
 * 
 * This module provides AI-powered learning experiences with:
 * - Progressive content generation
 * - Interactive learning materials
 * - Video resources and quizzes
 * - Personalized learning paths
 * 
 * Directory Structure:
 * - /core        - Main page component (will remain here)
 * - /features    - Extracted feature modules (modularization in progress)
 * - /services    - Utility services and helpers
 * 
 * Modularization Status:
 * ✅ Folder structure created
 * 🔄 Feature extraction in progress
 * 
 * Import Options:
 * import ProLearningPage from './components/ProLearning/ProLearningPage';  // Legacy (works)
 * import ProLearningPage from './components/ProLearning';                  // Clean (works)
 * import { ProLearningPage } from './components/ProLearning/core';         // Direct (works)
 */

// Main component export (default)
export { default } from './core/ProLearningPage';

// Named exports for flexibility
export { default as ProLearningPage } from './core/ProLearningPage';

// Future feature exports will be added here as they are extracted:
// export { useVideoPlayer, VideoPlayerModal } from './features/VideoFeature';
// export { useContentSanitization } from './features/ContentSanitization';
// export { useTopicManagement } from './features/TopicManagement';
// ... etc
