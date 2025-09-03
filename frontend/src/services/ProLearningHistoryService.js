// Deprecated: ProLearningHistoryService (DB-only migration)
// This service previously managed local/IndexedDB history. It is now a no-op.
// All history should be loaded from the backend via GET /api/courses/pro-learning/.

const noop = () => undefined;

const proLearningHistoryService = {
  addToHistory: noop,
  getHistory: () => [],
  removeFromHistory: noop,
  clearHistory: noop,
  getRecentHistory: () => [],
  searchHistory: () => [],
  trackCourseCreation: noop,
  getHistoryStats: () => ({ totalCourses: 0, todaysCourses: 0, recentCourses: [], topTopics: [] }),
};

export default proLearningHistoryService;
export class ProLearningHistoryService {}
