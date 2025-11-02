// Tutor Chat Service
// Sends reading-aware chat requests to the AI backend via axiosAi

import logger from '../../../utils/logger';

// Try to normalize common AI response shapes
function extractTextFromAIResponse(result) {
  if (!result) return '';
  // Backend normalized shape
  if (typeof result.text === 'string' && result.text.trim()) return result.text;
  // Preferred flat shape
  if (typeof result.content === 'string' && result.content.trim()) return result.content;
  // Gemini-like shape
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text === 'string' && text.trim()) return text;
  // OpenAI-like
  const openai = result?.choices?.[0]?.message?.content;
  if (typeof openai === 'string' && openai.trim()) return openai;
  return '';
}

export async function askTutor({ readingContent, message, topic, courseId }) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required');
  }

  // Avoid sending megabytes accidentally; keep a sensible cap
  const MAX_READING_CHARS = 120000; // ~120 KB
  const reading = (readingContent || '').slice(0, MAX_READING_CHARS);

  // Let the server enforce the tutoring rules; keep client prompt empty to avoid conflicts
  const systemPrompt = '';

  const payload = {
    topic: topic || null,
    course_id: courseId || null,
    message,
    reading_content: reading,
    system_prompt: systemPrompt,
  };

  try {
    const axiosAi = (await import('../../../utils/axiosAi')).default;
    const { data } = await axiosAi.post('/tutor/', payload);
    const text = extractTextFromAIResponse(data);
    if (!text) throw new Error('Empty tutor response');
    return text;
  } catch (err) {
    // Graceful auth-less shared view handling is already in axiosAi; surface a friendly message
    logger.warn('Tutor request failed:', err?.message || err);
    const status = err?.response?.status;
    const serverError = err?.response?.data?.error;
    if (status === 401) {
      throw new Error('Please sign in to use the Tutor chat.');
    }
    // Show server error when available, else generic fallback
    throw new Error(serverError || err?.message || 'Tutor service unavailable');
  }
}

export default { askTutor };
