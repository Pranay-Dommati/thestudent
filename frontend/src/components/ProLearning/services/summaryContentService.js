// Summary Content Generation Service
// Handles generating concise summaries and key points from reading content

/**
 * Generate summary content based on user input and reading material
 * @param {function} setContent - React setContent function
 * @param {string} topic - The user input topic to generate summary for
 * @param {string} readingContent - The main reading content to summarize (optional)
 */
export async function generateSummaryContent(setContent, topic = '', readingContent = '') {
  console.log(`🧠 Generating summary content for topic: "${topic}", with ${readingContent?.length || 0} chars of reading content...`);
  
  try {
    let summary;
    let metadata = {
      generatedAt: new Date().toISOString(),
      topic: topic
    };

    // Prioritize reading content for actual summaries
    if (readingContent && readingContent.length > 100) {
      // Generate content-based summary from actual reading material
      console.log('📚 Generating content-based summary from reading material...');
      summary = await generateAISummary(readingContent, topic);
      metadata.type = 'content-based';
      metadata.sourceLength = readingContent.length;
      metadata.topic = topic;
    } else if (topic && topic.length > 0) {
      // Generate topic-based summary only when no reading content
      console.log('🎯 Generating topic-based summary...');
      summary = await generateTopicBasedSummary(topic, readingContent);
      metadata.type = 'topic-based';
      metadata.hasReadingContent = false;
    } else {
      // Use fallback summary
      console.log('⚠️ Using fallback summary...');
      throw new Error('No summary content available');
    }

    if (summary) {
      metadata.summaryLength = summary.length;
      if (readingContent) {
        metadata.compressionRatio = Math.round((summary.length / readingContent.length) * 100) + '%';
      }
    }

    setContent((prev) => ({
      ...prev,
      summary: summary,
      summaryMetadata: metadata
    }));
    
    console.log('✅ Summary content generated successfully');
    
  } catch (error) {
    console.error('🚨 Summary generation failed:', error);
    
    // Throw error instead of using fallback
    throw new Error('Summary generation failed');
  }
}

// Generate topic-based summary with optional reading content context
async function generateTopicBasedSummary(topic, readingContent = '') {
  try {
    const response = await fetch('/ai/summary/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, reading_content: readingContent })
    });
    if (!response.ok) throw new Error('Backend AI summary endpoint failed');
    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    throw new Error('Summary generation failed');
  }
}

// Generate AI-powered summary from reading content
async function generateAISummary(readingContent, topic = '') {
  try {
    const response = await fetch('/ai/summary/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, reading_content: readingContent })
    });
    if (!response.ok) throw new Error('Backend AI summary endpoint failed');
    const result = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    throw new Error('Summary generation failed');
  }
}

// Extract key topics from reading content for smart summary generation
function extractKeyTopics(content) {
  if (!content || typeof content !== 'string') return [];
  
  // Look for markdown headers
  const headers = content.match(/#{1,6}\s+(.+)/g) || [];
  const topics = headers
    .map(header => header.replace(/#{1,6}\s+/, '').trim())
    .filter(topic => topic.length > 0)
    .slice(0, 10); // Limit to prevent overloading
  
  return topics;
}

// Create topic-specific summary points
function createTopicSummary(topics) {
  if (!topics || topics.length === 0) return '';
  
  let summary = '### 🎯 Topic Overview\n\n';
  
  topics.forEach((topic, index) => {
    summary += `${index + 1}. **${topic}**: Key concepts and practical applications\n`;
  });
  
  return summary + '\n';
}

// Generate reading time estimate for summary
function estimateReadingTime(content) {
  if (!content) return 0;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / 200); // Average reading speed: 200 WPM
}

// Create metadata for summary content
function createSummaryMetadata(originalContent, summaryContent) {
  return {
    originalWordCount: originalContent ? originalContent.split(/\s+/).length : 0,
    summaryWordCount: summaryContent ? summaryContent.split(/\s+/).length : 0,
    compressionRatio: originalContent && summaryContent ? 
      Math.round((summaryContent.length / originalContent.length) * 100) : 0,
    estimatedReadTime: estimateReadingTime(summaryContent),
    generatedAt: new Date().toISOString()
  };
}
