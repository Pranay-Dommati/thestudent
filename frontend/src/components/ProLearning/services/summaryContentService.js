// Summary Content Generation Service
// Handles generating concise summaries and key points from reading content

/**
 * Generate summary content based on user input and reading material
 * @param {function} setContent - React setContent function
 * @param {string} topic - The user input topic to generate summary for
 * @param {string} readingContent - The main reading content to summarize (optional)
 */
export async function generateSummaryContent(setContent, topic = '', readingContent = '') {
  console.log(`🧠 Generating summary content for: ${topic}...`);
  
  try {
    let summary;
    let metadata = {
      generatedAt: new Date().toISOString(),
      topic: topic
    };

    // Prioritize user input over reading content
    if (topic && topic.length > 0) {
      // Generate topic-based summary
      summary = await generateTopicBasedSummary(topic, readingContent);
      metadata.type = 'topic-based';
      metadata.hasReadingContent = readingContent.length > 100;
    } else if (readingContent && readingContent.length > 100) {
      // Fallback to content-based summary if no topic
      summary = await generateAISummary(readingContent);
      metadata.type = 'content-based';
      metadata.sourceLength = readingContent.length;
    } else {
      // Use fallback summary
      summary = generateFallbackSummary(topic || 'General Learning');
      metadata.type = 'fallback';
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
    
    // Use fallback summary on error
    const fallbackSummary = generateFallbackSummary(topic || 'General Learning');
    setContent((prev) => ({
      ...prev,
      summary: fallbackSummary,
      summaryMetadata: {
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        topic: topic,
        error: error.message
      }
    }));
  }
}

// Generate topic-based summary with optional reading content context
async function generateTopicBasedSummary(topic, readingContent = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackSummary(topic);
  }

  try {
    const prompt = createTopicSummaryPrompt(topic, readingContent);
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1536,
        stopSequences: []
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Topic summary API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid topic summary API response');
    }

    return result.candidates[0].content.parts[0].text.trim();
    
  } catch (error) {
    console.warn('Topic-based summary generation failed, using fallback:', error.message);
    return generateFallbackSummary(topic);
  }
}

// Generate AI-powered summary from reading content (legacy function for content-based summary)
async function generateAISummary(readingContent) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('No API key available for summary generation');
  }

  const prompt = createContentSummaryPrompt(readingContent);
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3, // Lower temperature for more focused summaries
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024,
      stopSequences: []
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Summary API request failed: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid summary API response');
  }

  return result.candidates[0].content.parts[0].text.trim();
}

// Create prompt for content-based summary (legacy)
function createContentSummaryPrompt(readingContent) {
  return `
You are an expert educational content summarizer. Create a comprehensive but concise summary of the following learning material.

**Source Content:**
${readingContent}

**Requirements:**
Create a well-structured summary that includes:

## 📋 Key Points Summary

### 🎯 Main Concepts
- List the 5-7 most important concepts covered
- Use bullet points with brief explanations
- Focus on fundamental understanding

### 💡 Essential Takeaways
- Highlight the critical information learners must remember
- Include any important formulas, commands, or syntax
- Mention key terminology and definitions

### 🔧 Practical Applications
- Summarize real-world uses and implementations
- Include the most relevant examples
- Focus on actionable insights

### ⚡ Quick Reference
- Create a rapid-access section for key information
- Include important code snippets or commands
- Provide essential facts and figures

### 📚 Study Tips
- Suggest the best way to approach learning this topic
- Recommend what to focus on first
- Include common pitfalls to avoid

**Formatting Guidelines:**
- Use clear, concise language
- Keep bullet points short but informative
- Use markdown formatting for structure
- Maintain professional tone
- No unnecessary explanations or filler content
- Focus on actionable, memorable information

Generate only the markdown summary content. Be comprehensive yet concise.
`;
}

// Create optimized prompt for topic-based summary generation
function createTopicSummaryPrompt(topic, readingContent = '') {
  let prompt = `
You are an expert educational content summarizer. Create a comprehensive learning summary for the topic: "${topic}"

**Topic Focus**: ${topic}`;

  if (readingContent && readingContent.length > 100) {
    prompt += `

**Additional Context from Reading Material:**
${readingContent.substring(0, 2000)} // Limit to prevent token overflow`;
  }

  prompt += `

**Requirements:**
Create a well-structured summary specifically focused on "${topic}" that includes:

## 📋 ${topic}: Key Learning Summary

### 🎯 Core Concepts
- List the 5-7 most essential concepts for understanding ${topic}
- Focus on fundamental principles that define ${topic}
- Include key terminology and definitions specific to ${topic}
- Explain why ${topic} is important and relevant

### 💡 Essential Knowledge Points
- Critical information every ${topic} learner must know
- Important formulas, commands, or syntax related to ${topic}
- Key features and capabilities of ${topic}
- Common use cases and applications

### 🔧 Practical Implementation
- How ${topic} is used in real-world scenarios
- Step-by-step approach to getting started with ${topic}
- Best practices for working with ${topic}
- Common tools and technologies used with ${topic}

### ⚡ Quick Reference Guide
- Essential ${topic} commands or syntax (if applicable)
- Key facts and figures about ${topic}
- Important concepts for quick recall
- Troubleshooting tips and common solutions

### 📚 Learning Roadmap
- Recommended learning sequence for ${topic}
- Prerequisites needed before studying ${topic}
- Next steps after mastering ${topic} basics
- Resources for continued learning

### 🚨 Common Pitfalls & Solutions
- Typical mistakes beginners make with ${topic}
- How to avoid common problems
- Debugging strategies specific to ${topic}
- Expert tips for mastering ${topic}

**Formatting Guidelines:**
- Use clear, topic-focused language
- Keep explanations concise but comprehensive
- Use markdown formatting for structure
- Include actionable insights
- Focus specifically on ${topic} throughout
- Make it a practical learning reference

Generate only the markdown summary content focused on "${topic}". Be comprehensive yet concise.
`;

  return prompt;
}

// Generate fallback summary when AI is not available
function generateFallbackSummary(topic = 'General Learning') {
  const sanitizedTopic = topic.replace(/[^\w\s-]/g, '').trim();
  
  return `
## 📋 ${sanitizedTopic}: Key Learning Summary

### 🎯 Core Concepts
- **Foundation Understanding**: Master the fundamental principles of ${sanitizedTopic}
- **Key Components**: Learn the essential building blocks and elements
- **Terminology**: Understand important terms and definitions in ${sanitizedTopic}
- **Principles**: Grasp the underlying concepts that drive ${sanitizedTopic}
- **Context**: Know where ${sanitizedTopic} fits in the broader landscape

### 💡 Essential Knowledge Points
- **Purpose & Benefits**: Why ${sanitizedTopic} is important and valuable
- **Core Features**: Main capabilities and functionalities of ${sanitizedTopic}
- **Best Practices**: Industry-standard approaches for ${sanitizedTopic}
- **Common Patterns**: Frequently used techniques and methodologies
- **Quality Standards**: What constitutes good ${sanitizedTopic} implementation

### 🔧 Practical Implementation
- **Getting Started**: Step-by-step approach to begin with ${sanitizedTopic}
- **Basic Setup**: Initial configuration and environment preparation
- **First Steps**: Simple examples and introductory exercises
- **Development Workflow**: Typical process for working with ${sanitizedTopic}
- **Tool Integration**: How ${sanitizedTopic} works with other technologies

### ⚡ Quick Reference Guide
- **Essential Commands**: Key operations you'll use frequently
- **Syntax Basics**: Fundamental structure and formatting rules
- **Common Operations**: Most frequently performed tasks
- **Troubleshooting**: Quick solutions for typical problems
- **Performance Tips**: Ways to optimize your ${sanitizedTopic} work

### 📚 Learning Roadmap
- **Prerequisites**: What you should know before starting ${sanitizedTopic}
- **Learning Sequence**: Recommended order for studying concepts
- **Practice Projects**: Hands-on exercises to build skills
- **Advanced Topics**: Next-level concepts to explore later
- **Continuous Learning**: How to stay updated with ${sanitizedTopic}

### � Common Pitfalls & Solutions
- **Beginner Mistakes**: Typical errors when starting with ${sanitizedTopic}
- **Debugging Strategies**: How to identify and fix problems
- **Performance Issues**: Common bottlenecks and optimization tips
- **Best Practice Violations**: What to avoid in ${sanitizedTopic}
- **Expert Recommendations**: Professional insights for success

### 🎯 Success Indicators
- **Milestone Markers**: How to know you're making progress
- **Skill Assessment**: Ways to evaluate your ${sanitizedTopic} proficiency
- **Project Readiness**: When you're ready for real applications
- **Professional Level**: Indicators of advanced ${sanitizedTopic} mastery
- **Community Contribution**: How to give back to the ${sanitizedTopic} community

**Next Steps**: Continue with hands-on practice, join ${sanitizedTopic} communities, and work on real projects to solidify your understanding.
`;
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
