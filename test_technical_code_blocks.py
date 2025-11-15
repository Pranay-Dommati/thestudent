"""
Test sanitization for technical content with single-word code blocks
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Node.js content with single-word code blocks (like in screenshot)
test_technical_content = """
## Core Modules in Node.js

Node.js includes several built-in modules for common tasks:

### File System Operations

The File System module provides methods for working with files:

```
fs.existsSync
```

Check if a file or directory exists.

### Path Manipulation

Utilizing the

```code
path
```

module to construct platform-independent file paths:

```
path.join
```

Extract file extensions:

```
path.extname
```

Or get directory names.

### HTTP Server

Create a basic server using:

```
http.createServer
```

### Example Code

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});
```
"""

print("=" * 80)
print("TECHNICAL CODE BLOCK SANITIZATION TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_technical_content)

print("\n🔍 CODE BLOCK ANALYSIS BEFORE:")
import re
code_blocks = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', test_technical_content)
print(f"  Total code blocks: {len(code_blocks)}")
for i, (lang, body) in enumerate(code_blocks, 1):
    body_preview = body.strip()[:50]
    print(f"  {i}. Language: '{lang}' | Content: '{body_preview}...'")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (TECHNICAL CATEGORY)")
print("=" * 80)

# Apply sanitization with 'technical' category
sanitized, changes = sanitize_ai_content(test_technical_content, 'technical')

print(f"\n✅ CHANGES MADE:")
print(f"  • LaTeX removed: {changes['latex_removed']}")
print(f"  • Inline code cleaned: {changes['inline_code_cleaned']}")
print(f"  • Code fences sanitized: {changes['fences_sanitized']}")
print(f"  • Indented blocks cleaned: {changes['indents_cleaned']}")
print(f"  • Total changes: {changes['total']}")

print("\n" + "=" * 80)
print("📋 AFTER SANITIZATION:")
print("-" * 80)
print(sanitized)

print("\n🔍 CODE BLOCK ANALYSIS AFTER:")
code_blocks_after = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', sanitized)
print(f"  Total code blocks: {len(code_blocks_after)}")
for i, (lang, body) in enumerate(code_blocks_after, 1):
    body_preview = body.strip()[:50]
    print(f"  {i}. Language: '{lang}' | Content: '{body_preview}...'")

# Check inline code
inline_code = re.findall(r'`([^`]+)`', sanitized)
technical_inline = [ic for ic in inline_code if any(term in ic for term in ['fs.', 'path.', 'http.'])]
print(f"\n  Inline code with technical terms: {len(technical_inline)}")
for ic in technical_inline[:5]:
    print(f"    - `{ic}`")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior for TECHNICAL content:
- Convert single-word code blocks to inline code: ```fs.existsSync``` → `fs.existsSync`
- Convert single-line code blocks to inline code: ```path``` → `path`
- Keep multi-line code blocks: ```javascript ... ``` (actual code)

Code blocks BEFORE: {len(code_blocks)}
Code blocks AFTER: {len(code_blocks_after)}
Single-word blocks converted: {len(code_blocks) - len(code_blocks_after)}

Expected: 5-6 code blocks removed (fs.existsSync, path, path.join, path.extname, http.createServer)
Actual: {len(code_blocks) - len(code_blocks_after)} code blocks removed

Status: {'✅ WORKING' if (len(code_blocks) - len(code_blocks_after)) >= 4 else '⚠️ NEEDS FIX'}
""")
