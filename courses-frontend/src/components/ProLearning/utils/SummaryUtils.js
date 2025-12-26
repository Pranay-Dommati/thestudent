/**
 * SummaryUtils.js
 * Utility functions for summary content validation, processing, and display
 */

/**
 * Get summary content with fallback to topicSummary
 * @param {Object} content - Content object that may contain summary or topicSummary
 * @returns {string} - Summary content or empty string
 */
export function getSummaryContent(content) {
  if (!content) return '';
  return content.summary || content.topicSummary || '';
}

/**
 * Validate if summary content is present and valid
 * @param {Object} content - Content object to validate
 * @returns {boolean} - True if valid summary exists
 */
export function hasValidSummary(content) {
  if (!content) return false;
  const summary = getSummaryContent(content);
  return typeof summary === 'string' && summary.trim().length > 0;
}

/**
 * Validate summary content for tab availability
 * @param {Object} nextContent - Content object being validated
 * @returns {boolean} - True if summary is valid for display
 */
export function validateSummaryForTab(nextContent) {
  if (!nextContent) return false;
  return typeof nextContent.summary === 'string' && nextContent.summary.trim().length > 0;
}

/**
 * Check if summary content is available (for storage operations)
 * @param {Object} content - Content object to check
 * @returns {boolean} - True if summary exists
 */
export function isSummaryAvailable(content) {
  const summary = getSummaryContent(content);
  return summary && summary.trim().length > 0;
}

/**
 * Get summary metadata
 * @param {Object} content - Content object containing metadata
 * @returns {Object|null} - Summary metadata or null
 */
export function getSummaryMetadata(content) {
  if (!content || !content.metadata) return null;
  return {
    generatedAt: content.metadata.summaryGeneratedAt || null,
    type: content.metadata.summaryType || null,
    length: getSummaryContent(content).length
  };
}

/**
 * Check if summary is ready for display
 * @param {Object} content - Content object to check
 * @param {string} currentTopicName - Current topic name
 * @param {string} contentTopicName - Topic name from content
 * @returns {boolean} - True if summary is ready
 */
export function isSummaryReady(content, currentTopicName, contentTopicName) {
  if (!hasValidSummary(content)) return false;
  // Ensure summary belongs to current topic
  if (currentTopicName && contentTopicName && currentTopicName !== contentTopicName) {
    return false;
  }
  return true;
}

/**
 * Estimate reading time for summary content
 * @param {string} summaryText - Summary text to estimate
 * @returns {number} - Estimated reading time in minutes
 */
export function estimateSummaryReadingTime(summaryText) {
  if (!summaryText || typeof summaryText !== 'string') return 0;
  const wordCount = summaryText.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute, min 1 minute
}

/**
 * Get summary word count
 * @param {Object} content - Content object
 * @returns {number} - Word count
 */
export function getSummaryWordCount(content) {
  const summary = getSummaryContent(content);
  if (!summary) return 0;
  return summary.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if content has summary for empty state
 * @param {Object} content - Content object
 * @returns {boolean} - True if summary exists
 */
export function contentHasSummary(content) {
  return content && (
    (typeof content.summary === 'string' && content.summary.trim().length > 0) ||
    (typeof content.topicSummary === 'string' && content.topicSummary.trim().length > 0)
  );
}

/**
 * Format summary for storage
 * @param {Object} content - Content object containing summary
 * @returns {Object} - Formatted content with summary
 */
export function formatSummaryForStorage(content) {
  if (!content) return {};
  
  const summary = getSummaryContent(content);
  const result = { ...content };
  
  // Normalize to use 'summary' field
  if (summary) {
    result.summary = summary;
    delete result.topicSummary; // Remove deprecated field
  }
  
  return result;
}

/**
 * Merge summary content from multiple sources
 * @param {Object} existingContent - Existing content
 * @param {Object} newContent - New content to merge
 * @returns {string} - Merged summary content
 */
export function mergeSummaryContent(existingContent, newContent) {
  const existingSummary = getSummaryContent(existingContent);
  const newSummary = getSummaryContent(newContent);
  
  // If new content has valid summary, use it
  if (newSummary && newSummary.trim().length > 0) {
    return newSummary;
  }
  
  // Otherwise preserve existing
  return existingSummary || '';
}

/**
 * Validate summary content is not a placeholder
 * @param {string} summaryText - Summary text to validate
 * @returns {boolean} - True if not a placeholder
 */
export function isNotPlaceholder(summaryText) {
  if (!summaryText || typeof summaryText !== 'string') return false;
  
  const placeholders = [
    'content not available',
    'no summary available',
    'summary unavailable',
    'loading',
    'generating'
  ];
  
  const lowerText = summaryText.toLowerCase().trim();
  return !placeholders.some(placeholder => lowerText === placeholder);
}

/**
 * Check if summary needs regeneration
 * @param {Object} content - Content object
 * @param {string} readingContent - Reading content for comparison
 * @returns {boolean} - True if regeneration recommended
 */
export function shouldRegenerateSummary(content, readingContent) {
  if (!hasValidSummary(content)) return true;
  if (!readingContent || readingContent.trim().length === 0) return false;
  
  const summary = getSummaryContent(content);
  const readingWordCount = readingContent.split(/\s+/).length;
  const summaryWordCount = summary.split(/\s+/).length;
  
  // If summary is suspiciously short compared to reading (< 5% of reading length)
  if (readingWordCount > 500 && summaryWordCount < readingWordCount * 0.05) {
    return true;
  }
  
  return false;
}
