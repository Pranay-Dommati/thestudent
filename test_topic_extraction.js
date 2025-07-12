// Test script to verify topic extraction functionality
// Run this in browser console at http://localhost:5174/chat

// Test topic extraction function
async function testTopicExtraction() {
  // Import the topic classifier (you'll need to adjust import path)
  const testQueries = [
    "I want to learn JavaScript arrays and functions",
    "Teach me Python data structures and algorithms",
    "Create a course for React.js, TypeScript and Node.js",
    "Help me with machine learning and deep learning",
    "I need to understand HTML, CSS and responsive design"
  ];

  console.log('🧪 Testing Topic Extraction...');
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    try {
      // This would normally call classifyTopicsWithGemini
      // For testing, you can call it directly in browser console
      console.log('✅ Expected behavior: Extract learning topics and log them');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Instructions for manual testing
console.log(`
🧪 TOPIC EXTRACTION TEST GUIDE
==============================

1. Go to: http://localhost:5174/chat
2. Enable Pro Mode (toggle)
3. Enter test queries like:
   - "I want to learn JavaScript arrays and functions"
   - "Teach me Python and Django"
   - "Create a course for React, TypeScript and Node.js"

4. Expected behavior:
   ✅ Console should show: "🚀 Starting topic extraction for: [your query]"
   ✅ Console should show: "✅ AI Extracted Topics: [Array of topics]"
   ✅ Console should show: "📝 Topic string for URL: [comma-separated topics]"
   ✅ Bot should respond with extracted topics list
   ✅ Pro Learning card should appear with extracted topics

5. Test AI failure scenario:
   - Enter gibberish like "asdasdasd" or "hello world"
   - Should show error message instead of fallback regex

6. Navigate to Pro Learning:
   - Click the course card
   - Should go to: http://localhost:5174/pro-learning?topic=[extracted-topics]
   - Sidebar should show the AI-extracted topics, not regex-generated ones
`);

testTopicExtraction();
