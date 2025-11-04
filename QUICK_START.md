# 🚀 Quick Start Commands

## Test the New System

### 1. Run Full Test Suite
```bash
cd frontend
node src/utils/test-math-rendering.js
```

**Output:** Creates `test-output.html` with all test cases rendered

### 2. View Test Results
```bash
# On Windows
start test-output.html

# On Mac
open test-output.html

# On Linux
xdg-open test-output.html
```

### 3. Quick Inline Math Test
```bash
node src/utils/debug-inline.js
```

### 4. Check Specific Content
```bash
# Create a test file
cat > test-content.md << 'EOF'
## Test

Given \\(x = 5\\), compute:

\\[
\\begin{bmatrix}
2 & 4\\\\[4pt]
-1 & k
\\end{bmatrix}
\\]
EOF

# Process it
node -e "
import('./src/utils/markdownProcessor.js').then(m => {
  import('fs').then(fs => {
    const content = fs.readFileSync('test-content.md', 'utf-8');
    m.processMarkdown(content).then(html => {
      fs.writeFileSync('output.html', html);
      console.log('✅ Written to output.html');
    });
  });
});
"
```

## Verify Integration

### Check Package Dependencies
```bash
cd frontend
npm list unified remark-parse remark-rehype unist-util-visit
```

Should show:
```
├── unified@11.0.4
├── remark-parse@11.0.0
├── remark-rehype@11.1.0
└── unist-util-visit@5.0.0
```

### Run Development Server
```bash
npm run dev
```

Navigate to a course with math content and verify rendering.

## Debugging

### Enable Debug Mode
```javascript
import { processMarkdown } from './src/utils/markdownProcessor.js';

const html = await processMarkdown(content, { debug: true });
```

### Check for Errors
```bash
# Check console output
npm run dev 2>&1 | grep -i "markdownProcessor"

# Check browser console
# Open DevTools → Console → Filter by "markdown"
```

### Validate Content
```javascript
import { validateMarkdown } from './src/utils/markdownProcessor.js';

const result = validateMarkdown(content);
if (!result.valid) {
  console.error('Validation error:', result.error);
}
```

## Production Build

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Clean Up (if needed)

### Clear Cached Processor
```javascript
import { clearProcessorCache } from './src/utils/markdownProcessor.js';

clearProcessorCache();
```

### Remove Test Files
```bash
rm test-output.html
rm output.html
rm test-content.md
```

## Troubleshooting

### Math Not Rendering

**Check 1:** KaTeX CSS loaded?
```bash
grep -r "katex.min.css" frontend/src/
```

**Check 2:** Test with simple example
```bash
node -e "
import('./src/utils/markdownProcessor.js').then(m => {
  m.processMarkdown('Test: $x = 5$').then(html => {
    console.log(html.includes('katex') ? '✅ Working' : '❌ Not working');
  });
});
"
```

**Check 3:** Check browser console for errors

### Performance Issues

```bash
# Check bundle size
npm run build
ls -lh dist/

# Analyze with source-map-explorer (if installed)
npx source-map-explorer dist/assets/*.js
```

## Documentation

```bash
# Read the full guide
less MATH_RENDERING_SYSTEM.md

# Read implementation notes
less IMPLEMENTATION_COMPLETE.md

# Search for specific topic
grep -i "inline math" MATH_RENDERING_SYSTEM.md
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/enterprise-math-rendering

# Add files
git add frontend/src/utils/markdown*.js
git add frontend/src/utils/remark-*.js
git add frontend/src/components/shared/MarkdownRenderer.jsx
git add *.md

# Commit
git commit -m "feat: Add enterprise-grade AST-based math rendering system

- Replace fragile regex preprocessor with unified/remark/rehype pipeline
- Add custom plugins for LaTeX environment handling
- Support both \(...\) and $...$ delimiters
- Auto-wrap bare LaTeX environments
- Comprehensive test suite with 100% pass rate
- Complete documentation and migration guide"

# Push
git push origin feature/enterprise-math-rendering
```

## Need Help?

- **Documentation:** `MATH_RENDERING_SYSTEM.md`
- **Implementation Notes:** `IMPLEMENTATION_COMPLETE.md`
- **Test Examples:** `frontend/src/utils/test-math-rendering.js`
- **Debug Script:** `frontend/src/utils/debug-inline.js`

---

**Status:** ✅ Ready for production deployment
