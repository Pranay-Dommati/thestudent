// Test script for dynamic course generation
import { generateLearningPlan } from './frontend/src/components/Chatbot/ChatbotAPI.js';

async function testDynamicCourseGeneration() {
  console.log("🧪 Testing dynamic course generation...");
  
  const testQuery = "create me a python course that should be beginner friendly";
  
  try {
    const result = await generateLearningPlan(testQuery);
    
    if (result.success) {
      console.log("✅ Dynamic course generation successful!");
      console.log("📊 Result summary:");
      console.log(`- Course Title: ${result.data.title}`);
      console.log(`- Total Days: ${result.data.totalDays}`);
      console.log(`- Total Videos: ${result.data.days.reduce((acc, day) => acc + day.videos.length, 0)}`);
      console.log(`- Generation Method: ${result.data.generationMethod}`);
      
      // Check each day structure
      result.data.days.forEach((day, index) => {
        console.log(`\nDay ${day.day}: ${day.topic}`);
        console.log(`- Topics: ${day.topicsInSection?.join(', ') || 'N/A'}`);
        console.log(`- Project: ${day.project_idea}`);
        console.log(`- Videos: ${day.videos.length}`);
      });
      
    } else {
      console.log("❌ Dynamic course generation failed");
      console.log("Error:", result.error || "Unknown error");
    }
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testDynamicCourseGeneration();
