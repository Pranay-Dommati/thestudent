/**
 * ContentSanitization.jsx
 * 
 * Handles content sanitization and merging logic for Pro Learning content.
 * Extracted from ProLearningPage.jsx for better modularity.
 * 
 * Key responsibilities:
 * - Sanitize markdown content for safe rendering
 * - Preserve first reading to prevent visual flips
 * - Merge content updates intelligently (avoid overwriting existing tabs)
 * - Track content topic ownership to prevent cross-topic leaks
 */

import { preSanitizeMarkdown, debugHash as _debugHash, shortDebugString as _short } from '../utils/ReadingUtils';
import { quizHasItems } from '../utils/QuizUtils.jsx';

/**
 * Creates the setContentWithSanitization function with all necessary dependencies
 * 
 * @param {Object} dependencies - All required dependencies from parent component
 * @returns {Function} - The setContentWithSanitization function
 */
export const createSetContentWithSanitization = (dependencies) => {
  const {
    contentTopicName,
    selectedTopic,
    content,
    topicParam,
    setSanitizedReading,
    setReadingRenderReady,
    getCurrentTopicFromParam,
    setSanitizedReadingTopicName,
    sanitizedReading,
    debugLog,
    setContent
  } = dependencies;

  return (incoming, sourceLabel = 'unknown') => {
    // Only consider an existing reading if it belongs to the CURRENT selected topic
    const belongsToCurrentTopic = !!(contentTopicName && selectedTopic?.name && contentTopicName === selectedTopic.name);
    const hasExistingReading = !!(belongsToCurrentTopic && content && typeof content.reading === 'string' && content.reading.trim().length);

    // Normalize incoming object (clone so we can safely adjust fields)
    const newContent = incoming ? { ...incoming } : incoming;

    if (newContent && typeof newContent.reading === 'string') {
      // If we already have a reading shown, never overwrite it with a later variant
      if (hasExistingReading) {
        const oldHash = _debugHash(content.reading);
        const newHash = _debugHash(newContent.reading);
        if (newContent.reading !== content.reading) {
          console.warn('🔒 [READING-PRESERVE] Incoming reading ignored to preserve first render', {
            source: sourceLabel,
            topicParam,
            contentTopicName,
            selectedTopic: selectedTopic?.name,
            oldLen: content.reading?.length || 0,
            newLen: newContent.reading?.length || 0,
            oldHash,
            newHash,
            newPreview: _short(newContent.reading)
          });
          // Preserve existing reading and do NOT re-sanitize
          newContent.reading = content.reading;
        } else {
          console.log('ℹ️ [READING-SAME] Incoming reading equals existing', { source: sourceLabel, hash: oldHash });
        }
        // Keep current sanitizedReading and readiness as-is
      } else if (newContent.reading.trim()) {
        // First time reading is arriving
        console.log('✨ [READING-FIRST] Accepting first reading from', {
          source: sourceLabel,
          topicParam,
          contentTopicName,
          selectedTopic: selectedTopic?.name,
          len: newContent.reading.length,
          hash: _debugHash(newContent.reading),
          preview: _short(newContent.reading)
        });
        
        // ALWAYS sanitize reading content IMMEDIATELY when it arrives (for ALL topics)
        // This ensures proper markup from first render and prevents broken code blocks
        // The sanitized version is stored and will never be re-sanitized (first reading wins)
        const sanitized = preSanitizeMarkdown(newContent.reading);
        console.log('🧹 [SANITIZE] Pre-sanitized reading content', {
          source: sourceLabel,
          originalLen: newContent.reading.length,
          sanitizedLen: sanitized.length,
          originalHash: _debugHash(newContent.reading),
          sanitizedHash: _debugHash(sanitized)
        });
        setSanitizedReading(sanitized);
        setReadingRenderReady(true);
        try {
          const currentTopic = selectedTopic?.name || getCurrentTopicFromParam(topicParam) || null;
          setSanitizedReadingTopicName(currentTopic);
        } catch {}
      } else {
        // Empty reading coming in: preserve existing sanitized reading if present
        console.log('⚪ [READING-EMPTY] No reading in payload', { 
          source: sourceLabel,
          readingType: typeof newContent.reading,
          readingLength: newContent.reading?.length || 0,
          readingTrimLength: newContent.reading?.trim()?.length || 0,
          readingPreview: newContent.reading ? newContent.reading.substring(0, 100) : 'N/A'
        });
        if (!(sanitizedReading && String(sanitizedReading).trim().length > 0)) {
          setSanitizedReading('');
          setReadingRenderReady(false);
          setSanitizedReadingTopicName(null);
        } else {
          // Keep current sanitized reading as-is
          debugLog('🛡️ [READING-PRESERVE-EMPTY] Keeping existing sanitized reading');
        }
      }
    } else {
      // No reading field provided: do not clear existing sanitized reading
      // This can happen when other tabs update (videos/resources/quiz). Preserve reading UI.
      debugLog('🛡️ [READING-PRESERVE-NONE] No reading field provided; preserving existing sanitized state');
    }
    
    // Merge strategy: do NOT wipe existing non-empty tabs when partial updates arrive
    const prev = content || {};
    const merged = { ...prev };

    const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;
    const isNonEmptyArray = (a) => Array.isArray(a) && a.length > 0;

    // Reading: if provided, keep the adjusted newContent.reading; else preserve previous
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'reading')) {
      merged.reading = newContent.reading;
    }

    // Summary: only overwrite if new has non-empty; else keep existing if it has content
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'summary')) {
      merged.summary = isNonEmptyString(newContent.summary)
        ? newContent.summary
        : (isNonEmptyString(prev.summary) ? prev.summary : (newContent.summary || ''));
    }

    // Videos: only overwrite if new has items; else keep existing if it has items
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'videos')) {
      merged.videos = isNonEmptyArray(newContent.videos)
        ? newContent.videos
        : (isNonEmptyArray(prev.videos) ? prev.videos : (newContent.videos || []));
    }

    // Quiz: support both array and object-with-questions; avoid wiping non-empty with empty
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'quiz')) {
      merged.quiz = quizHasItems(newContent.quiz)
        ? newContent.quiz
        : (quizHasItems(prev.quiz) ? prev.quiz : (newContent.quiz || (prev.quiz || [])));
    }

    // Resources: reflect current state even if empty (so empty-state can render), and always keep metadata if provided
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'resources')) {
      merged.resources = Array.isArray(newContent.resources) ? newContent.resources : (prev.resources || []);
    }
    if (Object.prototype.hasOwnProperty.call(newContent || {}, 'resourcesMetadata')) {
      merged.resourcesMetadata = newContent.resourcesMetadata || prev.resourcesMetadata || null;
    }

    // If newContent contains other keys (stats, metadata, etc.), shallow-merge them without clobbering known ones
    if (newContent) {
      for (const k of Object.keys(newContent)) {
        if (!(k in merged)) merged[k] = newContent[k];
      }
    }

    // Log non-reading tabs lengths for traceability
    try {
      debugLog('🧩 [CONTENT-SET]', {
        source: sourceLabel,
        topicParam,
        contentTopicName,
        selectedTopic: selectedTopic?.name,
        readingLen: (merged?.reading || '').length,
        summaryLen: (merged?.summary || '').length,
        quizCount: Array.isArray(merged?.quiz) ? merged.quiz.length : (merged?.quiz?.questions?.length || 0),
        videosCount: Array.isArray(merged?.videos) ? merged.videos.length : 0,
        resourcesCount: Array.isArray(merged?.resources) ? merged.resources.length : 0
      });
    } catch {}

    setContent(merged);
  };
};
