import { processMarkdown } from './markdownProcessor.js';

const testCases = [
  {
    name: 'Inline with \\( \\)',
    input: 'Given \\(x = 5\\) we have \\(x^2 = 25\\).'
  },
  {
    name: 'Inline with $',
    input: 'Given $x = 5$ we have $x^2 = 25$.'
  },
  {
    name: 'Display with \\[ \\]',
    input: '\\[\nx^2 + y^2 = z^2\n\\]'
  },
  {
    name: 'Display with $$',
    input: '$$\nx^2 + y^2 = z^2\n$$'
  }
];

for (const test of testCases) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test: ${test.name}`);
  console.log(`Input: ${JSON.stringify(test.input)}`);
  
  const html = await processMarkdown(test.input);
  console.log(`Output length: ${html.length}`);
  console.log(`Has katex: ${html.includes('katex')}`);
  console.log(`Output: ${html.slice(0, 200)}...`);
}
