// markdownWorker.js - module worker for async Markdown + KaTeX processing
// Runs CPU-heavy parsing off the main thread

import { processMarkdown } from '../utils/markdownProcessor.js';

self.onmessage = async (e) => {
  const { text = '', options = {}, requestId } = e.data || {};
  try {
    const html = await processMarkdown(text, {
      convertDelimiters: true,
      autoLatex: /\$/.test(text),
      ...options,
    });
    self.postMessage({ html, requestId });
  } catch (error) {
    // Return safe fallback to avoid breaking UI
    const fallback = `<pre class="markdown-error">${text || ''}</pre>`;
    self.postMessage({ html: fallback, error: String(error), requestId });
  }
};
