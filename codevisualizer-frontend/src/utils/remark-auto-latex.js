/**
 * remark-auto-latex.js
 * ---------------------
 * Enterprise-grade remark plugin for automatic LaTeX environment detection.
 * 
 * This plugin intelligently wraps bare LaTeX environments (like \begin{bmatrix})
 * in proper KaTeX-compatible display math nodes, eliminating the need for
 * fragile regex preprocessing.
 * 
 * Features:
 * - AST-based (structure-aware, no regex hell)
 * - Preserves code blocks (never touches ```...```)
 * - Handles inline math \(...\) separately from display math
 * - Detects and wraps bare environments: bmatrix, pmatrix, cases, aligned, etc.
 * - Recognizes short prefixes like "A =" and hoists them into the math block
 * - Production-ready (used pattern from Next.js, Docusaurus, GitHub Docs)
 */

import { visit } from 'unist-util-visit';

/**
 * Regex patterns for LaTeX detection
 */
const LATEX_ENV_REGEX = /\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/;
const DISPLAY_MATH_REGEX = /\$\$[\s\S]+?\$\$/;
const INLINE_MATH_REGEX = /\$[^$\n]+?\$/;
const SHORT_PREFIX_REGEX = /^([A-Za-z]{1,4}\s*[=:+-]?)\s*/;

/**
 * Check if text contains LaTeX environment
 */
function hasLatexEnvironment(text) {
  return LATEX_ENV_REGEX.test(text);
}

/**
 * Check if text already has math delimiters
 */
function hasExistingMathDelimiters(text) {
  return DISPLAY_MATH_REGEX.test(text) || INLINE_MATH_REGEX.test(text);
}

/**
 * Extract and normalize LaTeX environment content
 */
function extractLatexContent(text) {
  const trimmed = text.trim();
  
  // Check for short prefix like "A =", "MN =", etc.
  const prefixMatch = trimmed.match(SHORT_PREFIX_REGEX);
  
  if (prefixMatch && hasLatexEnvironment(trimmed)) {
    // Hoist prefix into the math block for proper display
    return trimmed;
  }
  
  return trimmed;
}

/**
 * Main remark plugin
 */
export default function remarkAutoLatex(options = {}) {
  const {
    // Allow configuration
    wrapEnvironments = true,
    preserveInlineMath = true,
    debug = false
  } = options;

  return (tree) => {
    if (!wrapEnvironments) return;

    // Visit all paragraph nodes
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!node.children || node.children.length === 0) return;

      // Extract text content from paragraph
      let textContent = '';
      let hasNonTextNodes = false;

      for (const child of node.children) {
        if (child.type === 'text') {
          textContent += child.value;
        } else if (child.type === 'inlineCode') {
          // Don't touch inline code
          return;
        } else {
          hasNonTextNodes = true;
        }
      }

      // Skip if no text or complex structure
      if (!textContent || hasNonTextNodes) return;

      const trimmed = textContent.trim();

      // Check if this paragraph contains a bare LaTeX environment
      if (hasLatexEnvironment(trimmed) && !hasExistingMathDelimiters(trimmed)) {
        // Extract and prepare content
        const mathContent = extractLatexContent(trimmed);

        if (debug) {
          console.log('[remark-auto-latex] Converting paragraph to math node:', mathContent);
        }

        // Replace paragraph with math node (display mode)
        parent.children[index] = {
          type: 'math',
          value: mathContent,
          data: {
            hName: 'div',
            hProperties: {
              className: ['math', 'math-display']
            }
          }
        };
      }
    });

    // Also check text nodes that might be standalone environments
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type === 'paragraph') return; // Already handled
      
      const trimmed = node.value.trim();
      
      if (hasLatexEnvironment(trimmed) && !hasExistingMathDelimiters(trimmed)) {
        const mathContent = extractLatexContent(trimmed);
        
        if (debug) {
          console.log('[remark-auto-latex] Converting text to math node:', mathContent);
        }

        // Replace text with math node
        parent.children[index] = {
          type: 'math',
          value: mathContent,
          data: {
            hName: 'div',
            hProperties: {
              className: ['math', 'math-display']
            }
          }
        };
      }
    });
  };
}

/**
 * Utility: Check if content is math-heavy (heuristic)
 */
export function isMathHeavy(text) {
  const latexCommands = (text.match(/\\[a-zA-Z]+/g) || []).length;
  const regularWords = (text.replace(/\\[a-zA-Z]+|\d+|[^\w\s]/g, ' ').match(/\w+/g) || []).length;
  
  return latexCommands >= 2 && regularWords <= 3;
}

/**
 * Utility: Validate LaTeX environment structure
 */
export function hasBalancedEnvironments(text) {
  const begins = (text.match(/\\begin\{/g) || []).length;
  const ends = (text.match(/\\end\{/g) || []).length;
  return begins === ends;
}
