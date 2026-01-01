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
 * Ask a question about a specific step
 * @param {Object} params
 * @param {string} params.fullCode - Complete source code
 * @param {number} params.lineNumber - Current line number
 * @param {string} params.lineText - Current line code
 * @param {Object} params.variables - Variables at this step
 * @param {string} params.question - User's question
 * @param {string} params.whyExplanation - Existing Why explanation (optional)
 * @returns {Promise<string>} - AI answer
 */
export const askStepQuestion = async ({
    fullCode,
    lineNumber,
    lineText,
    variables = {},
    question,
    whyExplanation = null
}) => {
    // Check rate limit first
    checkRateLimit();

    const response = await fetch(`${API_BASE_URL}/ask-step/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullCode,
            lineNumber,
            lineText,
            variables,
            question,
            whyExplanation
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

    return data.answer;
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
