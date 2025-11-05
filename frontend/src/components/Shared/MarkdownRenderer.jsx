/**
 * MarkdownRenderer.jsx
 * --------------------
 * React component wrapper for the enterprise-grade markdown processor
 * 
 * This component processes markdown with math support and renders it safely.
 * Uses the unified/remark/rehype pipeline for robust, production-grade rendering.
 */

import React, { useMemo } from 'react';
import { processMarkdownSync } from '../../../utils/markdownProcessor';
import 'katex/dist/katex.min.css';

const MarkdownRenderer = ({ 
  content, 
  className = '', 
  options = {},
  fallback = null 
}) => {
  // Memoize the processed HTML to avoid re-processing on every render
  const html = useMemo(() => {
    if (!content) return null;
    
    try {
      return processMarkdownSync(content, {
        convertDelimiters: true,
        autoLatex: true,
        ...options
      });
    } catch (error) {
      console.error('[MarkdownRenderer] Failed to process markdown:', error);
      return `<pre class="text-red-500 bg-red-50 p-4 rounded">${error.message}</pre>`;
    }
  }, [content, options]);

  if (!html && fallback) {
    return fallback;
  }

  if (!html) {
    return null;
  }

  return (
    <div 
      className={`markdown-content prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
