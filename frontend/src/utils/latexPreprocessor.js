/**
 * Preprocesses LaTeX syntax in markdown content to ensure compatibility
 * with remark-math and rehype-katex
 * 
 * Converts:
 * - \[ ... \] to $$ ... $$ (display math)
 * - \( ... \) to $ ... $ (inline math)
 * - Handles aligned environments
 * - Preserves existing $$ and $ syntax
 */
export function preprocessLatex(content) {
  if (!content) return content;

  let processed = content;

    // Conservative conversions only:
    // 1) Convert \[ ... \] (display math) to $$ ... $$ across multiline
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`);

    // 2) Convert \( ... \) (inline math) to $ ... $
    processed = processed.replace(/\\\(([^\n]*?)\\\)/g, (_, inner) => `$${inner}$`);

  return processed;
}

// Minimal aggressive version kept for future toggles; currently identical to preprocessLatex
export function preprocessLatexAggressive(content) {
  return preprocessLatex(content);
}

export default preprocessLatex;
