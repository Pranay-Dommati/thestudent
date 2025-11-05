/**
 * test-math-rendering.js
 * ----------------------
 * Validation script for the failing markup example
 * 
 * Run with: node frontend/src/utils/test-math-rendering.js
 */

import { processMarkdown, validateMarkdown } from './markdownProcessor.js';
import fs from 'fs';

// The exact failing content from the user
const FAILING_EXAMPLE = `**Compute \\(MN\\).**

(1,1) entry:

\\[
\\cos^2\\theta \\cos^2\\phi + (\\cos\\theta \\sin\\theta)(\\cos\\phi \\sin\\phi)
= \\cos\\theta \\cos\\phi (\\cos\\theta \\cos\\phi + \\sin\\theta \\sin\\phi)
\\]

Similarly, other entries give:

\\[
MN = (\\cos\\theta \\cos\\phi + \\sin\\theta \\sin\\phi)
\\begin{bmatrix}
\\cos\\theta \\cos\\phi & \\cos\\theta \\sin\\phi\\\\[4pt]
\\sin\\theta \\cos\\phi & \\sin\\theta \\sin\\phi
\\end{bmatrix}
\\]

But

\\[
\\cos(\\theta - \\phi) = \\cos\\theta \\cos\\phi + \\sin\\theta \\sin\\phi
\\]

Given \\(\\theta - \\phi = \\dfrac{\\pi}{2}\\), so \\(\\cos(\\theta - \\phi) = 0.\\)

---

### **Conclusion**

\\[
MN =
\\begin{bmatrix}
0 & 0\\\\[4pt]
0 & 0
\\end{bmatrix}
\\]`;

// Test cases
const TEST_CASES = [
  {
    name: 'Original failing example',
    markdown: FAILING_EXAMPLE
  },
  {
    name: 'Simple matrix',
    markdown: `A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}`
  },
  {
    name: 'Matrix with spacing',
    markdown: `\\[
\\begin{bmatrix}
2 & 4\\\\[4pt]
-1 & k
\\end{bmatrix}
\\]`
  },
  {
    name: 'Inline math',
    markdown: `Given \\(\\theta - \\phi = \\dfrac{\\pi}{2}\\), we have \\(\\cos(\\theta-\\phi) = 0\\).`
  },
  {
    name: 'Mixed inline and display',
    markdown: `Let \\(x = 5\\). Then:

\\[
x^2 + 2x + 1 = 36
\\]

Therefore \\(x+1 = 6\\).`
  },
  {
    name: 'Code block should not be touched',
    markdown: `Here's some code:

\`\`\`python
# This \\begin{bmatrix} should stay as-is
matrix = [[1, 2], [3, 4]]
\`\`\`

But this math should render:

\\[
\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
\\]`
  }
];

async function runTests() {
  console.log('🧪 Testing Enterprise Math Rendering Pipeline\n');
  console.log('='.repeat(60));
  
  for (const testCase of TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(60));
    
    // Validate
    const validation = validateMarkdown(testCase.markdown);
    if (!validation.valid) {
      console.log(`⚠️  Validation warning: ${validation.error}`);
    } else {
      console.log('✅ Validation passed');
    }
    
    // Process
    try {
      const html = await processMarkdown(testCase.markdown, { debug: false });
      
      // Check if output contains KaTeX classes
      const hasKatex = html.includes('katex');
      const hasMatrix = html.includes('begin{bmatrix}') || html.includes('begin{pmatrix}');
      
      console.log(`📊 Output length: ${html.length} chars`);
      console.log(`🎨 Contains KaTeX: ${hasKatex ? '✅' : '❌'}`);
      
      if (testCase.markdown.includes('begin{')) {
        console.log(`📐 Matrix rendered: ${hasKatex ? '✅' : '❌'}`);
      }
      
      // Check for common issues
      if (html.includes('\\[4pt]') && !html.includes('<code>')) {
        console.log('⚠️  Warning: \\\\[4pt] might not be properly escaped');
      }
      
      if (html.includes('\\begin{') && !hasKatex) {
        console.log('❌ Error: LaTeX environment not rendered!');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📄 Generating full HTML output file...\n');
  
  // Generate complete HTML file
  const fullHtml = await generateCompleteHtml();
  const outputPath = './test-output.html';
  fs.writeFileSync(outputPath, fullHtml);
  
  console.log(`✅ Complete HTML written to: ${outputPath}`);
  console.log('   Open this file in a browser to see rendered output.\n');
}

async function generateCompleteHtml() {
  const processedSections = await Promise.all(
    TEST_CASES.map(async (testCase) => {
      const html = await processMarkdown(testCase.markdown);
      return `
        <section class="test-case">
          <h2>${testCase.name}</h2>
          <div class="markdown-input">
            <h3>Input:</h3>
            <pre><code>${testCase.markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
          <div class="rendered-output">
            <h3>Rendered Output:</h3>
            <div class="content">
              ${html}
            </div>
          </div>
        </section>
      `;
    })
  );
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math Rendering Test Results</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #2563eb;
    }
    .test-case {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-case h2 {
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .test-case h3 {
      color: #4b5563;
      margin: 15px 0 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .markdown-input {
      background: #f9fafb;
      border-left: 3px solid #9ca3af;
      padding: 15px;
      margin-bottom: 20px;
    }
    .markdown-input pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }
    .rendered-output {
      border-left: 3px solid #10b981;
      padding: 15px;
    }
    .rendered-output .content {
      font-size: 16px;
      line-height: 1.8;
    }
    .math-display {
      margin: 20px 0;
      overflow-x: auto;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    hr {
      margin: 30px 0;
      border: none;
      border-top: 2px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <h1>🧮 Math Rendering Test Results</h1>
  <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
    Enterprise-grade AST-based pipeline with unified + remark + rehype + KaTeX
  </p>
  ${processedSections.join('\n')}
  <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;">
    <p>Generated by markdownProcessor.js • Powered by unified ecosystem</p>
  </footer>
</body>
</html>`;
}

// Run tests
runTests().catch(console.error);
