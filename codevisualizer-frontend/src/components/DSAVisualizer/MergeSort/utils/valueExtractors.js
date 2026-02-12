/**
 * Value Extraction Utilities
 * Helpers to extract values from backend variable formats
 */

/**
 * Extract actual value from backend variable format
 * Backend may return {value: 5, type: 'int'} or just 5
 * @param {any} v - Variable from backend
 * @returns {any} Extracted value
 */
export const getValue = (v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'object' && v !== null && 'value' in v) {
        return v.value;
    }
    return v;
};

/**
 * Extract array from variable
 * @param {any} v - Variable from backend
 * @returns {Array|undefined} Extracted array
 */
export const getArray = (v) => {
    const value = getValue(v);
    if (Array.isArray(value)) return value;
    return undefined;
};

/**
 * Parse explanation to extract computed values
 * Example: "... mid = 7 // 2 → mid = 3" → extract 3
 * @param {string} explanation - The explanation text
 * @param {string} name - The variable name to extract
 * @returns {number|undefined} Extracted value
 */
export const parseResultFromExplanation = (explanation, name) => {
    if (!explanation) return undefined;

    // Look for patterns like "mid = 3" or "→ mid = 3"
    const patterns = [
        new RegExp(`→\\s*${name}\\s*=\\s*(\\d+)`),
        new RegExp(`${name}\\s*=\\s*(\\d+)\\s*$`),
    ];

    for (const pattern of patterns) {
        const match = explanation.match(pattern);
        if (match) return parseInt(match[1], 10);
    }

    return undefined;
};

/**
 * Get the "predicted" value - either from explanation or next step's variables
 * @param {string} name - Variable name
 * @param {string} explanation - Current step explanation
 * @param {object} nextVars - Next step's variables
 * @returns {any} Predicted value
 */
export const getPredictedValue = (name, explanation, nextVars) => {
    const fromExplanation = parseResultFromExplanation(explanation, name);
    if (fromExplanation !== undefined) return fromExplanation;

    if (nextVars && nextVars[name]) {
        return getValue(nextVars[name]);
    }
    return undefined;
};

/**
 * Get predicted array value
 * @param {string} name - Variable name
 * @param {object} nextVars - Next step's variables
 * @returns {Array|undefined} Predicted array
 */
export const getPredictedArray = (name, nextVars) => {
    if (nextVars && nextVars[name]) {
        return getArray(nextVars[name]);
    }
    return undefined;
};

export default {
    getValue,
    getArray,
    parseResultFromExplanation,
    getPredictedValue,
    getPredictedArray
};
