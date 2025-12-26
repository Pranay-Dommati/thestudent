// Summary Content Generation Service
// Handles generating concise summaries and key points from reading content

import storage from '../../../utils/storage';

/**
 * Generate summary content based on user input and reading material
 * @param {function} setContent - React setContent function
 * @param {string} topic - The user input topic to generate summary for
 * @param {string} readingContent - The main reading content to summarize (optional)
 */
export async function generateSummaryContent(setContent, topic = '', readingContent = '') {
  // Generating summary content for topic
  // Reading content available and preview
  
  try {
    let metadata = {
      generatedAt: new Date().toISOString(),
      topic: topic,
      type: readingContent && readingContent.length > 100 ? 'content-based' : 'topic-based'
    };

    if (readingContent) {
        metadata.sourceLength = readingContent.length;
    }

    const token = storage.getItem('accessToken');
    const baseURL = (import.meta.env.VITE_AI_BASE_URL || '/ai');

    const response = await fetch(`${baseURL}/summary/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify({
            topic,
            reading_content: readingContent,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let completeReceived = false;

    while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
            // Flush any remaining text in decoder
            buffer += decoder.decode();
            if (buffer.trim()) {
                // Process final buffer content
                const lines = buffer.split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'chunk') {
                            fullText += data.text;
                            setContent({
                                summary: fullText,
                                summaryMetadata: metadata
                            });
                        } else if (data.type === 'complete') {
                            completeReceived = true;
                            fullText = data.full_text;
                            if (data.sanitization_changes) {
                                metadata.sanitization = data.sanitization_changes;
                            }
                            setContent({
                                summary: fullText,
                                summaryMetadata: metadata
                            });
                        }
                    } catch (e) {
                        console.warn('Error parsing final stream line:', line, e);
                    }
                }
            }
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const data = JSON.parse(line);
                if (data.type === 'chunk') {
                    fullText += data.text;
                    setContent({
                        summary: fullText,
                        summaryMetadata: metadata
                    });
                } else if (data.type === 'complete') {
                    completeReceived = true;
                    // Final sanitized text
                    fullText = data.full_text;
                    if (data.sanitization_changes) {
                        metadata.sanitization = data.sanitization_changes;
                    }
                    setContent({
                        summary: fullText,
                        summaryMetadata: metadata
                    });
                } else if (data.type === 'error') {
                    console.error('Stream error:', data.error);
                    throw new Error(data.error);
                }
            } catch (e) {
                console.warn('Error parsing stream line:', line, e);
            }
        }
    }

    if (!completeReceived) {
        throw new Error('Stream ended unexpectedly without completion signal');
    }

    if (fullText) {
      metadata.summaryLength = fullText.length;
      if (readingContent) {
        metadata.compressionRatio = Math.round((fullText.length / readingContent.length) * 100) + '%';
      }
      metadata.estimatedReadTime = estimateReadingTime(fullText);
      
      // Final update
      setContent({
        summary: fullText,
        summaryMetadata: metadata
      });
      
      return fullText;
    }
    
  } catch (error) {
    console.error('🚨 Summary generation failed:', error);
    
    // Throw error instead of using fallback
    throw new Error('Summary generation failed');
  }
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
