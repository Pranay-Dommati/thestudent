// debug-preproc.mjs
// Usage: node frontend/src/utils/debug-preproc.mjs

import * as pre from './latexPreprocessor.js';

const preprocessLatex = pre.preprocessLatex || pre.default;

const samples = [
  {
    title: 'vmatrix with equals',
    text: '$$\\begin{vmatrix} 1 & a & a^2\\\\ 1 & b & b^2\\\\ 1 & c & c^2 \\end{vmatrix}$$ = (a-b)(b-c)(c-a)'
  },
  {
    title: 'A= bmatrix #1',
    text: 'A= $$\\begin{bmatrix} 1 & 2 & 1\\\\ 3 & 2 & 3\\\\ 1 & 1 & 2 \\end{bmatrix}$$'
  },
  {
    title: 'A= bmatrix #2',
    text: 'A= $$\\begin{bmatrix} 2 & 1 & 2\\\\ 1 & 0 & 1\\\\ 2 & 2 & 1 \\end{bmatrix}$$'
  }
];

for (const s of samples) {
  console.log(`\n=== SAMPLE: ${s.title} ===`);
  console.log('\n--- INPUT ---');
  console.log(s.text);
  const out = preprocessLatex(s.text);
  console.log('\n--- OUTPUT ---');
  console.log(out);
  console.log('\n--- OUTPUT with line numbers ---');
  console.log(out.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
  console.log('\n--- OUTPUT CHARS (first 300) ---');
  const chars = Array.from(out.slice(0, 300)).map((c) => `${c}(${c.charCodeAt(0)})`).join(' ');
  console.log(chars);
}
