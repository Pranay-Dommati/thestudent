/**
 * AskService — Handles step-specific questions to SIA
 * ====================================================
 * 
 * Features:
 * - Rate limiting (5 questions per minute)
 * - Context injection for step-scoped answers
 * - Error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/visualizer`
    : 'http://localhost:8000/api/visualizer';

// Rate limiting state
const rateLimitState = {
    timestamps: [],
    maxRequests: 5,
    windowMs: 60000 // 1 minute
};

/**
 * Check if rate limit allows a new request
 */
const checkRateLimit = () => {
    const now = Date.now();
    // Remove old timestamps outside the window
    rateLimitState.timestamps = rateLimitState.timestamps.filter(
        t => now - t < rateLimitState.windowMs
    );

    if (rateLimitState.timestamps.length >= rateLimitState.maxRequests) {
        const oldestTimestamp = rateLimitState.timestamps[0];
        const waitTime = Math.ceil((rateLimitState.windowMs - (now - oldestTimestamp)) / 1000);
        throw new Error(`Rate limit reached. Please wait ${waitTime} seconds.`);
    }

    rateLimitState.timestamps.push(now);
    return true;
};

/**
 * Ask a question about a specific step (ENTERPRISE-GRADE)
 * 
 * Separates chat memory from step context:
 * - stepContext: Swappable per "Understand" click
 * - conversation: Durable across step changes
 * 
 * @param {Object} params
 * @param {string} params.fullCode - Complete source code
 * @param {Object} [params.stepContext] - Current step context {line, code, variables}
 * @param {Object} [params.conversation] - Conversation state {id, messages}
 * @param {string} [params.intent] - 'explain' or 'question'
 * @param {string} params.question - User's question
 * @returns {Promise<string>} - AI answer
 */
export const askStepQuestion = async ({
    fullCode,
    stepContext = null,
    conversation = null,
    intent = 'question',
    question
}) => {
    // Check rate limit first
    checkRateLimit();

    // Smart history truncation: Keep last 10 messages (always include last exchange)
    const truncateHistory = (messages) => {
        if (!messages || messages.length <= 10) return messages || [];
        const recent = messages.slice(-2);  // Last exchange
        const older = messages.slice(0, -2).slice(-8);  // Fill remaining
        return [...older, ...recent];
    };

    const truncatedConversation = conversation ? {
        id: conversation.id,
        messages: truncateHistory(conversation.messages)
    } : { id: null, messages: [] };

    const response = await fetch(`${API_BASE_URL}/ask-step/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullCode,
            stepContext,
            conversation: truncatedConversation,
            intent,
            question
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to get answer');
    }

    // Return full response with blocks for structured rendering
    return {
        answer: data.answer,
        blocks: data.blocks || null  // Structured blocks for enterprise rendering
    };
};

/**
 * Get remaining questions in rate limit window
 */
export const getRateLimitStatus = () => {
    const now = Date.now();
    const validTimestamps = rateLimitState.timestamps.filter(
        t => now - t < rateLimitState.windowMs
    );
    return {
        remaining: rateLimitState.maxRequests - validTimestamps.length,
        total: rateLimitState.maxRequests,
        resetIn: validTimestamps.length > 0
            ? Math.ceil((rateLimitState.windowMs - (now - validTimestamps[0])) / 1000)
            : 0
    };
};

export const askService = {
    askStepQuestion,
    getRateLimitStatus
};
