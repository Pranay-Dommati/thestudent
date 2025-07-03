// Test script to verify YouTube video service returns top-quality results
// This should match what users see when searching "BJT" on YouTube directly

import { generateVideosContent } from './src/components/ProLearning/services/videosContentService.js';

// Test function
async function testVideoService() {
  console.log('🧪 Testing enhanced YouTube video service...');
  console.log('🔍 Searching for: BJT (Bipolar Junction Transistor)');
  console.log('📊 Expected: High-quality educational videos with real view counts\n');
  
  const testContent = {
    videos: [],
    videosMetadata: {}
  };
  
  const setContent = (updateFn) => {
    const updated = updateFn(testContent);
    testContent.videos = updated.videos;
    testContent.videosMetadata = updated.videosMetadata;
  };
  
  try {
    await generateVideosContent(setContent, 'BJT');
    
    console.log('\n📋 RESULTS SUMMARY:');
    console.log(`✅ Total videos found: ${testContent.videos.length}`);
    console.log(`🎯 Source: ${testContent.videosMetadata.source}`);
    console.log(`📊 Average views: ${testContent.videosMetadata.avgViewCount?.toLocaleString() || 'N/A'}`);
    console.log(`⏱️ Total duration: ${testContent.videosMetadata.totalDuration || 0} minutes`);
    
    if (testContent.videos.length > 0) {
      console.log('\n🏆 TOP RESULTS (should match YouTube search):');
      testContent.videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   📺 Channel: ${video.channel}`);
        console.log(`   👀 Views: ${video.formattedViewCount || formatViewCount(video.viewCount || 0)}`);
        console.log(`   👥 Subscribers: ${video.formattedSubscriberCount || formatSubscriberCount(video.subscriberCount || 0)}`);
        console.log(`   ⏱️ Duration: ${video.formattedDuration || video.duration + ' min'}`);
        console.log(`   🎯 Difficulty: ${video.difficulty}`);
        console.log(`   🔗 URL: ${video.url}`);
      });
      
      console.log('\n✅ SUCCESS: Enhanced video service is working!');
      console.log('💡 These videos should match the quality you see on YouTube search');
    } else {
      console.log('\n❌ No videos found - check API configuration');
    }
    
  } catch (error) {
    console.error('\n🚨 Test failed:', error.message);
    console.log('🔧 Possible issues:');
    console.log('   - YouTube API key not configured');
    console.log('   - API quota exceeded');
    console.log('   - Network connectivity issues');
  }
}

// Helper functions for fallback formatting
function formatViewCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatSubscriberCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M subscribers`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K subscribers`;
  return `${count} subscribers`;
}

// Run the test
testVideoService();
