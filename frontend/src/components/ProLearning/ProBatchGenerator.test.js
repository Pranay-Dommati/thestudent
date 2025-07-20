// Test file for ProBatchGenerator functionality
// This can be used to verify that the batch generation works correctly

import { 
  batchGenerateAllTopics, 
  isTopicContentGenerated, 
  getGenerationProgress 
} from '../ProBatchGenerator.js';

// Mock function for testing
const mockGenerateProContent = ({ topic, setContent }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate content generation
      const mockContent = {
        reading: `Reading content for ${topic}`,
        summary: `Summary for ${topic}`,
        videos: [
          { title: `Video 1 for ${topic}`, url: `https://example.com/video1` },
          { title: `Video 2 for ${topic}`, url: `https://example.com/video2` }
        ],
        quiz: [
          { id: 1, question: `What is ${topic}?`, options: ['A', 'B', 'C', 'D'], correct: 0 }
        ],
        resources: [
          { title: `Resource 1 for ${topic}`, url: `https://example.com/resource1` }
        ]
      };
      setContent(mockContent);
      resolve();
    }, 100); // Simulate 100ms generation time
  });
};

// Test function
export const testBatchGeneration = async () => {
  console.log('🧪 Testing ProBatchGenerator functionality');
  
  // Test topics
  const testTopics = [
    { name: 'JavaScript Arrays', isActive: true },
    { name: 'String Manipulation', isActive: false },
    { name: 'Functions', isActive: false }
  ];
  
  // Mock state setters
  let contentCache = new Map();
  let loadingStatus = '';
  let isGenerating = false;
  let generationProgress = 0;
  
  const setContentCache = (newCache) => { contentCache = newCache; };
  const setLoadingStatus = (status) => { loadingStatus = status; console.log('📋 Status:', status); };
  const setIsGenerating = (generating) => { isGenerating = generating; console.log('🔄 Generating:', generating); };
  const setGenerationProgress = (progress) => { generationProgress = progress; console.log('📊 Progress:', progress + '%'); };
  
  console.log('🚀 Starting batch generation test...');
  
  try {
    // Test batch generation
    const result = await batchGenerateAllTopics(
      testTopics,
      mockGenerateProContent,
      setContentCache,
      setLoadingStatus,
      setIsGenerating,
      setGenerationProgress,
      new Map()
    );
    
    console.log('✅ Batch generation completed!');
    console.log('📊 Final content cache size:', contentCache.size);
    console.log('📋 Final status:', loadingStatus);
    console.log('🔄 Final generating state:', isGenerating);
    console.log('📊 Final progress:', generationProgress + '%');
    
    // Test helper functions
    console.log('\n🧪 Testing helper functions...');
    
    // Test isTopicContentGenerated
    const isArraysGenerated = isTopicContentGenerated('JavaScript Arrays', contentCache);
    console.log('📋 JavaScript Arrays generated:', isArraysGenerated);
    
    // Test getGenerationProgress
    const progress = getGenerationProgress(testTopics, contentCache);
    console.log('📊 Generation progress:', progress);
    
    console.log('\n✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  testBatchGeneration();
}
