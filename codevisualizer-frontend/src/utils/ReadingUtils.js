/**
 * ReadingUtils.js
 * 
 * Comprehensive utilities for reading content management in ProLearning
 * Handles sanitization, parsing, validation, and rendering helpers
 */

import React from 'react';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const MAX_CONTENT_LENGTH = 500000; // 500KB max content size
const MAX_LINE_LENGTH = 10000; // Maximum characters per line
const REAL_CODE_LANGUAGES = new Set([
    'python', 'py', 'javascript', 'js', 'typescript', 'ts', 'java', 'c', 'cpp',
    'c++', 'c#', 'cs', 'csharp', 'go', 'rust', 'rb', 'ruby', 'swift', 'kotlin',
    'php', 'r', 'matlab', 'octave', 'bash', 'sh', 'shell', 'powershell', 'ps1',
    'sql', 'html', 'xml', 'json', 'yaml', 'yml', 'toml', 'css', 'scss', 'less',
    'jsx', 'tsx'
]);

const MATH_RELATED_KEYWORDS = [
    'math', 'mathematics', 'algebra', 'calculus', 'trigonometry', 'trigonometric',
    'geometry', 'statistics', 'probability', 'unit circle', 'sine', 'cosine',
    'tangent', 'derivative', 'integral', 'limits', 'vectors', 'matrices',
    'matrix', 'linear algebra'
];

// ============================================================================
// DETECTION HELPERS
// ============================================================================

/**
 * Checks if content looks like programming code
 * @param {string} s - Content to check
 * @returns {boolean}
 */
export const isLikelyProgramming = (s) => {
    if (!s || typeof s !== 'string') return false;
    return /[{;}]|<\w|<\/|=>|\bdef\b|\bclass\b|\bfunction\b|\bconst\b|\blet\b|\bvar\b|#include|\bimport\b\s|\bfrom\b\s|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bBEGIN\b|\bEND\b|^\s{2,}\S/m.test(s);
};

/**
 * Checks if content looks like mathematical notation
 * @param {string} s - Content to check
 * @returns {boolean}
 */
export const isMathLike = (s) => {
    const t = (s || '').trim();
    if (!t) return false;

    // Strong math tokens or LaTeX commands/symbols
    if (/\\(frac|sum|int|sqrt|alpha|beta|gamma|theta|lambda|pi|mu|sigma|Delta|nabla|partial)\b|[∑∫√∞≤≥≠≈→⇔∂∇]/.test(t)) {
        return true;
    }

    // Derivatives and powers
    if (/(d[xyzt]|dx|dy|dt)\s*\/(d[xyzt]|dx|dy|dt)\b/.test(t)) {
        return true; // dy/dx
    }

    // Powers and equations without typical programming syntax
    if (/[\^_]/.test(t) && /[=+\-*/]/.test(t) && !isLikelyProgramming(t)) {
        return true; // x^2 + y
    }

    // Equations comprised of mostly math-friendly chars (avoid braces/semicolons typical of code)
    if (/=/.test(t) && /^[\sA-Za-z0-9.,:+\-*/^_|=()\\{}\[\]<>%]+$/.test(t) && !/[;]{1}|\bconst\b|\bfunction\b|<\/?\w/.test(t)) {
        return true;
    }

    // Trig/log common names
    if (/\b(sin|cos|tan|log|ln)\b/.test(t) && !isLikelyProgramming(t)) {
        return true;
    }

    return false;
};

/**
 * Checks if topic name is math-related
 * @param {string} name - Topic name to check
 * @returns {boolean}
 */
export const isMathTopicName = (name) => {
    try {
        if (!name) return false;
        const s = String(name).toLowerCase();
        return MATH_RELATED_KEYWORDS.some(keyword => s.includes(keyword));
    } catch {
        return false;
    }
};

/**
 * Detects if content looks like ASCII diagram
 * @param {string} s - Content to check
 * @returns {boolean}
 */
export const looksLikeAsciiDiagram = (s) => {
    const str = String(s || "");
    const lines = str.split(/\n/);

    if (lines.length === 0 || lines.length > 30) return false;

    // Should contain typical ascii diagram characters
    const hasAsciiArtChars = /[\\/|_\-+]/.test(str);

    // Avoid typical programming signatures
    const looksLikeCode = /[{;}]|<\/?\w|\b(function|class|const|let|var|import|from|#include)\b/.test(str);

    // Many lines are short and composed of ascii-art chars and spaces
    const asciiLine = /^[\s\\\/\|_\-+.`'()\[\]<>]+$/;
    const asciiRatio = lines.reduce((acc, l) => acc + (asciiLine.test(l) ? 1 : 0), 0) / lines.length;

    return hasAsciiArtChars && !looksLikeCode && asciiRatio > 0.6;
};

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Pre-sanitizes markdown content to fix common formatting issues
 * Converts malformed fenced blocks, handles math expressions, and normalizes content
 * 
 * @param {string} md - Raw markdown content
 * @returns {string} - Sanitized markdown
 */
export const preSanitizeMarkdown = (md) => {
    if (!md || typeof md !== 'string') return '';

    // Validate input size
    if (md.length > MAX_CONTENT_LENGTH) {
        console.warn(`⚠️ Content too large: ${md.length} chars (max ${MAX_CONTENT_LENGTH})`);
        return md.substring(0, MAX_CONTENT_LENGTH) + '\n\n... [Content truncated for safety]';
    }

    // Check for extremely long lines
    const lines = md.split('\n');
    const hasExtremelyLongLine = lines.some(line => line.length > MAX_LINE_LENGTH);
    if (hasExtremelyLongLine) {
        console.warn('⚠️ Detected extremely long line in content');
    }

    let out = md;

    try {
        // Normalize Windows newlines
        out = out.replace(/\r\n?/g, '\n');

        // Handle triple-fenced blocks
        out = out.replace(/```([^\n]*)\n([\s\S]*?)```/g, (m, langRaw, body) => {
            const lang = (langRaw || '').trim();
            const content = (body || '').trim();
            const langLower = lang.toLowerCase();

            const mathLang = /^(math|latex|tex|katex|equation|formula)$/i.test(langLower);
            const likelyProg = isLikelyProgramming(content);
            const realLang = REAL_CODE_LANGUAGES.has(langLower);
            const likelyMath = mathLang || isMathLike(content) ||
                (!likelyProg && /^(code|text)?$/.test(langLower) && isMathLike(content));

            // Convert math-like fenced content (even if labeled 'code') to KaTeX-friendly math
            if (likelyMath) {
                const isMulti = /\n/.test(content) || content.length > 40 || /\\(frac|sum|int|sqrt)/.test(content);
                return isMulti ? `$$\n${content}\n$$` : `$${content}$`;
            }

            // Keep real programming code as-is (only for real languages or strong code patterns)
            if (likelyProg || realLang) return m;

            // Otherwise, treat as non-code educational content
            const contentLines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);

            if (contentLines.length === 1) {
                const token = contentLines[0];
                // Single short token -> inline code
                if (token.length <= 80 && !/\n/.test(token)) {
                    return `\`${token}\``;
                }
                // Fallback: blockquote single line
                return `> ${token}`;
            }

            // 2-3 very short lines -> simple bullet list
            if (contentLines.length <= 3 && contentLines.every(l => l.length <= 80)) {
                return contentLines.map(l =>
                    (/^[-A-Za-z0-9_]+$/.test(l) ? `- \`${l}\`` : `- ${l}`)
                ).join('\n');
            }

            // Default: blockquote
            return contentLines.map(l => `> ${l}`).join('\n');
        });

        // Handle inline backticks - keep as code unless clearly math
        out = out.replace(/`([^`]+)`/g, (m, tok) => {
            const t = tok.trim();
            if (isMathLike(t)) {
                return /\s|\n/.test(t) ? `$$${t}$$` : `$${t}$`;
            }
            return m; // keep regular inline code
        });

        return out;
    } catch (e) {
        console.error('❌ Error in preSanitizeMarkdown:', e);
        // On any error, return original content to avoid breaking
        return md;
    }
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parses reading content into navigable sections based on H2 headers
 * @param {string} readingContent - Raw reading content
 * @returns {Array<{header: string, content: string}>} - Array of sections
 */
export const parseReadingSections = (readingContent) => {
    if (!readingContent || typeof readingContent !== 'string') {
        return [{ header: 'Reading Material', content: readingContent || '' }];
    }

    // Split by ## headers (markdown H2)
    const sections = readingContent.split(/^## /m).filter(section => section.trim());

    if (sections.length <= 1) {
        // No clear sections, return as single section
        return [{ header: 'Reading Material', content: readingContent }];
    }

    return sections.map((section, index) => {
        const lines = section.trim().split('\n');
        const header = index === 0 ? 'Introduction' : lines[0].trim();
        const content = index === 0 ? section : lines.slice(1).join('\n').trim();

        return {
            header: header || `Section ${index + 1}`,
            content: content || ''
        };
    });
};

// ============================================================================
// REACT HELPERS
// ============================================================================

/**
 * Recursively flattens React children to extract text content
 * Useful for code blocks to avoid [object Object] rendering
 * 
 * @param {*} ch - React children (can be string, number, element, or array)
 * @returns {string} - Flattened text content
 */
export const flattenReactChildren = (ch) => {
    if (Array.isArray(ch)) {
        return ch.map(flattenReactChildren).join("");
    }
    if (typeof ch === 'string' || typeof ch === 'number') {
        return String(ch);
    }
    if (React.isValidElement(ch)) {
        return flattenReactChildren(ch.props?.children);
    }
    if (ch && typeof ch === 'object' && 'props' in ch) {
        return flattenReactChildren(ch.props.children);
    }
    return '';
};

// ============================================================================
// VALIDATION & UTILITY FUNCTIONS
// ============================================================================

/**
 * Debug hash function for content tracking
 * @param {string} str - String to hash
 * @returns {string} - Hex hash string
 */
export const debugHash = (str) => {
    try {
        const s = String(str || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return (h >>> 0).toString(16);
    } catch {
        return '0';
    }
};

/**
 * Truncates string for debug output
 * @param {string} s - String to truncate
 * @param {number} n - Maximum length (default 80)
 * @returns {string} - Truncated string
 */
export const shortDebugString = (s, n = 80) => {
    try {
        return String(s || '').replace(/\s+/g, ' ').slice(0, n);
    } catch {
        return '';
    }
};

/**
 * Checks if content should be rendered as inline code vs block
 * @param {string} codeString - Code content
 * @param {string} lang - Language identifier
 * @returns {boolean}
 */
export const shouldRenderAsInlineCode = (codeString, lang) => {
    const singleLine = !/\n/.test(codeString);
    const isShort = codeString.trim().length <= 80;
    const hasNoLanguage = !lang;
    const notProgramming = !isLikelyProgramming(codeString);

    return singleLine && isShort && hasNoLanguage && notProgramming;
};

/**
 * Determines if code should be rendered as plain text (for math topics)
 * @param {string} topicName - Current topic name
 * @param {string} codeString - Code content
 * @returns {boolean}
 */
export const shouldRenderAsPlainText = (topicName, codeString) => {
    const isMathTopic = isMathTopicName(topicName);
    const notProgramming = !isLikelyProgramming(codeString);

    return isMathTopic && notProgramming;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Detection
    isLikelyProgramming,
    isMathLike,
    isMathTopicName,
    looksLikeAsciiDiagram,

    // Sanitization
    preSanitizeMarkdown,

    // Parsing
    parseReadingSections,

    // React helpers
    flattenReactChildren,

    // Validation
    shouldRenderAsInlineCode,
    shouldRenderAsPlainText,

    // Debug utilities
    debugHash,
    shortDebugString,

    // Constants
    REAL_CODE_LANGUAGES,
    MATH_RELATED_KEYWORDS,
    MAX_CONTENT_LENGTH,
    MAX_LINE_LENGTH
};
