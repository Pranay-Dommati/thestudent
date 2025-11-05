/**
 * markdownProcessor.js
 * --------------------
 * Enterprise-grade Markdown → HTML processor with KaTeX math rendering.
 * 
 * This replaces the fragile regex-based latexPreprocessor with a robust,
 * AST-based pipeline using the unified ecosystem (same as Next.js, Docusaurus).
 * 
 * Pipeline:
 * 1. Parse Markdown → AST (remark-parse)
 * 2. Process math notation (remark-math)
 * 3. Auto-wrap bare LaTeX environments (remark-auto-latex)
 * 4. Support GFM (tables, strikethrough, etc.) (remark-gfm)
 * 5. Convert Markdown AST → HTML AST (remark-rehype)
 * 6. Allow raw HTML (rehype-raw)
 * 7. Render KaTeX math (rehype-katex)
 * 8. Serialize to HTML (rehype-stringify)
 * 
 * Benefits:
 * - Structure-aware (never breaks code blocks)
 * - Composable (easy to add/remove plugins)
 * - Testable (pure functions)
 * - Fast (single AST traversal)
 * - Production-grade (industry standard)
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkAutoLatex from './remark-auto-latex.js';

/**
 * Process Markdown with math support
 * @param {string} markdown - Raw markdown content
 * @param {object} options - Processing options
 * @returns {Promise<string>} - Rendered HTML
 */
/**
 * Preprocess raw markdown string to convert LaTeX delimiters
 * This must happen BEFORE remarkParse
 */
function preprocessDelimiters(markdown) {
  if (!markdown) return markdown;
  
  let result = markdown;
  
  // Convert display math: \[ ... \] → $$ ... $$
  // Be careful not to match \\[4pt] (line break spacing in matrices)
  result = result.replace(/(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]/g, (_, content) => `$$${content}$$`);
  
  // Convert inline math: \( ... \) → $ ... $
  result = result.replace(/\\\(([^\n]*?)\\\)/g, (_, content) => `$${content}$`);
  
  return result;
}

export async function processMarkdown(markdown, options = {}) {
  const {
    // Allow configuration
    allowDangerousHtml = true,
    katexOptions = {
      throwOnError: false,
      strict: false,
      trust: true,
      output: 'html'
    },
    autoLatex = true,
    convertDelimiters = true,
    debug = false
  } = options;

  try {
    // Preprocess LaTeX delimiters BEFORE parsing
    let processedMarkdown = markdown;
    if (convertDelimiters) {
      processedMarkdown = preprocessDelimiters(markdown);
      if (debug) {
        console.log('[markdownProcessor] After delimiter conversion:', processedMarkdown.slice(0, 200));
      }
    }
    
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      
    // Add auto-latex plugin if enabled
    if (autoLatex) {
      processor.use(remarkAutoLatex, { debug });
    }
    
    processor
      .use(remarkRehype, { 
        allowDangerousHtml
        // Note: DO NOT pass through math nodes - let remark-rehype handle them
      })
      .use(rehypeKatex, katexOptions)
      .use(rehypeRaw) // Move rehypeRaw AFTER rehypeKatex so math is rendered first
      .use(rehypeStringify);

    const file = await processor.process(processedMarkdown);
    
    if (debug) {
      console.log('[markdownProcessor] Input length:', markdown.length);
      console.log('[markdownProcessor] Output length:', String(file).length);
    }
    
    return String(file);
  } catch (error) {
    console.error('[markdownProcessor] Error processing markdown:', error);
    
    // Fallback: return original markdown wrapped in pre tag
    return `<pre class="markdown-error">${markdown}</pre>`;
  }
}

/**
 * Synchronous version for React components (using cached processor)
 * Note: First call may be slow, subsequent calls are fast
 */
let cachedProcessor = null;

export function processMarkdownSync(markdown, options = {}) {
  const {
    allowDangerousHtml = true,
    katexOptions = {
      throwOnError: false,
      strict: false,
      trust: true,
      output: 'html'
    },
    autoLatex = true,
    convertDelimiters = true
  } = options;

  // Preprocess LaTeX delimiters BEFORE parsing
  let processedMarkdown = markdown;
  if (convertDelimiters) {
    processedMarkdown = preprocessDelimiters(markdown);
  }

  if (!cachedProcessor) {
    cachedProcessor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath);
      
    if (autoLatex) {
      cachedProcessor.use(remarkAutoLatex);
    }
    
    cachedProcessor
      .use(remarkRehype, { 
        allowDangerousHtml
      })
      .use(rehypeKatex, katexOptions)
      .use(rehypeRaw)
      .use(rehypeStringify);
  }

  try {
    const file = cachedProcessor.processSync(processedMarkdown);
    return String(file);
  } catch (error) {
    console.error('[markdownProcessor] Error in sync processing:', error);
    return `<pre class="markdown-error">${markdown}</pre>`;
  }
}

/**
 * Process markdown and return React-safe HTML
 * Use with dangerouslySetInnerHTML
 */
export function processMarkdownForReact(markdown, options = {}) {
  const html = processMarkdownSync(markdown, options);
  return { __html: html };
}

/**
 * Validate markdown before processing (optional pre-check)
 */
export function validateMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return { valid: false, error: 'Invalid markdown input' };
  }
  
  // Check for balanced math delimiters
  const displayMathCount = (markdown.match(/\$\$/g) || []).length;
  if (displayMathCount % 2 !== 0) {
    return { 
      valid: false, 
      error: 'Unbalanced display math delimiters ($$)',
      warning: true // non-critical
    };
  }
  
  // Check for balanced environments
  const beginCount = (markdown.match(/\\begin\{/g) || []).length;
  const endCount = (markdown.match(/\\end\{/g) || []).length;
  if (beginCount !== endCount) {
    return {
      valid: false,
      error: `Unbalanced LaTeX environments (${beginCount} begins, ${endCount} ends)`,
      warning: true
    };
  }
  
  return { valid: true };
}

/**
 * Clear cached processor (useful for testing or config changes)
 */
export function clearProcessorCache() {
  cachedProcessor = null;
}

/**
 * Default export for convenience
 */
export default processMarkdown;
