// Test file for resourcesContentService.js
// Run this to verify the improvements work correctly

import { 
  generateResourcesContent,
  filterResourcesByCategory,
  filterResourcesByType,
  searchResources,
  analyzeResourceDistribution,
  exportResourcesData,
  importResourcesData,
  getPersonalizedResources,
  clearResourcesCache,
  getCacheStats
} from './resourcesContentService.js';

// Mock setContent function for testing
const mockSetContent = (updateFn) => {
  console.log('Content would be updated:', updateFn);
};

// Test data
const sampleResources = [
  {
    id: 'test_1',
    title: 'React Documentation',
    type: 'Documentation',
    description: 'Official React documentation with comprehensive guides and API references.',
    url: 'https://react.dev',
    difficulty: 'All Levels',
    free: true,
    rating: 'High',
    tags: ['react', 'documentation', 'official'],
    category: 'Documentation'
  },
  {
    id: 'test_2',
    title: 'React Tutorial',
    type: 'Tutorial',
    description: 'Step-by-step tutorial for learning React from basics to advanced concepts.',
    url: 'https://react.dev/learn',
    difficulty: 'Beginner',
    free: true,
    rating: 'High',
    tags: ['react', 'tutorial', 'beginner'],
    category: 'Learning'
  }
];

// Test functions
console.log('🧪 Testing resourcesContentService improvements...\n');

// Test filtering functions
console.log('1. Testing filtering functions:');
console.log('Filter by Documentation:', filterResourcesByCategory(sampleResources, 'Documentation'));
console.log('Filter by Tutorial type:', filterResourcesByType(sampleResources, 'Tutorial'));
console.log('Search for "react":', searchResources(sampleResources, 'react'));

// Test analysis
console.log('\n2. Testing resource analysis:');
const analysis = analyzeResourceDistribution(sampleResources);
console.log('Resource analysis:', analysis);

// Test export/import
console.log('\n3. Testing export/import:');
const exportedData = exportResourcesData(sampleResources, { test: true });
console.log('Exported data length:', exportedData.length);

const importResult = importResourcesData(exportedData);
console.log('Import success:', importResult.success);
console.log('Imported resources count:', importResult.resources?.length);

// Test personalization
console.log('\n4. Testing personalization:');
const personalizedResources = getPersonalizedResources(sampleResources, {
  preferredDifficulty: 'Beginner',
  onlyFree: true
});
console.log('Personalized resources:', personalizedResources.length);

// Test cache functions
console.log('\n5. Testing cache functions:');
console.log('Cache stats before:', getCacheStats());
clearResourcesCache();
console.log('Cache stats after clear:', getCacheStats());

// Test resource generation (comment out if no API key)
console.log('\n6. Testing resource generation:');
console.log('Note: This will use fallback resources if no API key is available');

// Uncomment to test actual generation:
// generateResourcesContent(mockSetContent, 'JavaScript', {
//   difficulty: 'beginner',
//   resourceCount: 10,
//   includeFreePaid: 'free',
//   focus: 'practical'
// });

console.log('\n✅ All tests completed! Check the console output above for results.');
