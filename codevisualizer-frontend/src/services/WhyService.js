/**
 * WhyService — Frontend service for "The Why" API
 * ================================================
 * 
 * Handles communication with the backend Why Explainer service
 * and provides client-side caching for determinism.
 * 
 * Key features:
 * - Client-side caching (hash-based)
 * - API integration
 * - Error handling
 */

// Simple hash function for cache keys
function hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString(36);
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

class WhyService {
    constructor() {
        // Client-side cache for instant repeat requests
        this.cache = new Map();

        // Get API base URL from environment
        this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    }

    /**
     * Generate cache key from code hash + line number
     */
    getCacheKey(fullCode, lineNumber) {
        const codeHash = hashCode(fullCode);
        return `${codeHash}_${lineNumber}`;
    }

    /**
     * Get a "Why" explanation for a specific line
     * 
     * @param {Object} params
     * @param {string} params.fullCode - Complete source code
     * @param {number} params.lineNumber - Target line number (1-indexed)
     * @param {string} params.lineText - Exact text of the line
     * @param {string} [params.phase] - Execution phase (e.g., 'initialization', 'filtering')
     * @param {Object} [params.sampleInput] - Sample input used in the session
     * @param {string} [params.problemType] - Type of problem (e.g., 'Insert Interval')
     * @param {string} [params.functionPurpose] - Purpose of the function
     * 
     * @returns {Promise<{explanation: string, cached: boolean, lineNumber: number, complexity: string}>}
     */
    async getWhyExplanation({
        fullCode,
        lineNumber,
        lineText,
        phase = 'execution',
        sampleInput = null,
        problemType = 'algorithm',
        functionPurpose = ''
    }) {
        const cacheKey = this.getCacheKey(fullCode, lineNumber);

        // Check client-side cache first
        if (this.cache.has(cacheKey)) {
            console.log(`[WhyService] Cache HIT for line ${lineNumber}`);
            return {
                ...this.cache.get(cacheKey),
                cached: true
            };
        }

        console.log(`[WhyService] Cache MISS for line ${lineNumber}, fetching from backend...`);

        try {
            const response = await fetch(`${this.apiBaseUrl}/visualizer/generate-why/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_code: fullCode,
                    line_number: lineNumber,
                    line_text: lineText,
                    phase: phase,
                    sample_input: sampleInput,
                    problem_type: problemType,
                    function_purpose: functionPurpose
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error from Why API');
            }

            // Store in client cache
            const result = {
                explanation: data.explanation,
                lineNumber: data.line_number,
                complexity: data.complexity,
                cached: data.cached || false
            };

            this.cache.set(cacheKey, result);
            console.log(`[WhyService] Cached explanation for line ${lineNumber}`);

            return result;

        } catch (error) {
            console.error(`[WhyService] Error fetching explanation:`, error);

            // Return error explanation
            return {
                explanation: `💡 Why this step matters\n\n❌ Error: ${error.message}`,
                lineNumber: lineNumber,
                complexity: 'error',
                cached: false
            };
        }
    }

    /**
     * Clear the client-side cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[WhyService] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export const whyService = new WhyService();
export default whyService;
