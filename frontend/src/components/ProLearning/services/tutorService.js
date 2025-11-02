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

export async function askTutor({ readingContent, message, topic, courseId, history }) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required');
  }

  // Avoid sending megabytes accidentally; keep a sensible cap
  const MAX_READING_CHARS = 120000; // ~120 KB
  const reading = (readingContent || '').slice(0, MAX_READING_CHARS);

  // Let the server enforce the tutoring rules; keep client prompt empty to avoid conflicts
  const systemPrompt = '';

  // Prepare a compact chat history (last 6 turns max) to maintain context
  let compactHistory = [];
  try {
    const raw = Array.isArray(history) ? history : [];
    // Map to {role, content} and trim content length
    const mapped = raw
      .filter(h => h && typeof h.content === 'string' && (h.role === 'user' || h.role === 'assistant'))
      .map(h => ({ role: h.role, content: h.content.slice(0, 1000) }));
    // Keep only last 6 messages to limit size
    compactHistory = mapped.slice(-6);
  } catch (_) {
    compactHistory = [];
  }

  const payload = {
    topic: topic || null,
    course_id: courseId || null,
    message,
    reading_content: reading,
    system_prompt: systemPrompt,
    history: compactHistory,
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
