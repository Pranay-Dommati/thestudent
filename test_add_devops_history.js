// Test script to manually add your DevOps course to history
// Run this in browser console on /chat page

import proLearningHistoryService from './frontend/src/services/ProLearningHistoryService.js';

// Add your existing DevOps course
const devopsCourse = {
  courseId: 'course_1755977854843_mdl2ifaz1',
  topic: 'DevOps',
  url: 'http://localhost:5173/pro-learning/course_1755977854843_mdl2ifaz1?topic=DevOps&tab=reading',
  title: 'ProLearning: DevOps'
};

proLearningHistoryService.addToHistory(devopsCourse);

console.log('DevOps course added to history!');
console.log('Current history:', proLearningHistoryService.getHistory());
