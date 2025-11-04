/**
 * remark-latex-delimiters.js
 * ---------------------------
 * Preprocessor plugin to convert LaTeX-style delimiters to KaTeX/remark-math format
 * 
 * Converts:
 * - \(...\) → $...$  (inline math)
 * - \[...\] → $$...$$ (display math)
 * 
 * This must run BEFORE remark-math so that remark-math can parse the $ delimiters.
 */

import { visit } from 'unist-util-visit';

/**
 * Convert LaTeX delimiters in text nodes
 * NOTE: By the time remark-parse gives us the AST, markdown escapes like \( are already
 * converted to literal ( characters. We need to work with the raw markdown string BEFORE parsing.
 * 
 * This plugin operates on the raw string before remarkParse touches it.
 */
function convertDelimiters(text) {
  if (!text) return text;
  
  let result = text;
  
  // Convert display math: \[ ... \] → $$ ... $$
  // Be careful not to match \\[4pt] (line break spacing in matrices)
  result = result.replace(/(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]/g, (_, content) => `$$${content}$$`);
  
  // Convert inline math: \( ... \) → $ ... $
  result = result.replace(/\\\(([^\n]*?)\\\)/g, (_, content) => `$${content}$`);
  
  return result;
}

/**
 * Main plugin
 */
export default function remarkLatexDelimiters() {
  return (tree) => {
    // Process all text nodes
    visit(tree, 'text', (node) => {
      node.value = convertDelimiters(node.value);
    });
    
    // Also process code node values (but not codeblock content)
    visit(tree, 'inlineCode', (node) => {
      // Don't convert delimiters in inline code
      // This preserves literal LaTeX in code examples
    });
  };
}
