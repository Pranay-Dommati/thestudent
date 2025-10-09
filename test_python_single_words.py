"""
Test sanitization for technical content with single-word code blocks
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Python fundamentals with single-word code blocks
test_python_content = """
## Python Data Types

### Core Types

```
int
```

,

```
float
```

,

```
str
```

,

```
bool
```

) and a brief mention of collection types (

```
list
```

,

```
tuple
```

### Keywords

Avoid Python Keywords: Do not use Python's reserved keywords (like if, for,

```
class
```

,

```
True
```

,

```
False
```

) as variable names.

### Error Types

```
NameError
```

if you try to use a variable before it's assigned.

### String Examples

```
'Hello'
```

,

```
"Python"
```

### Quotes

```
'
```

) or double (

```
"
```

) quotes.
"""

print("=" * 80)
print("PYTHON FUNDAMENTALS - SINGLE-WORD CODE BLOCK TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_python_content)

print("\n🔍 CODE BLOCK ANALYSIS BEFORE:")
import re
code_blocks = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', test_python_content)
print(f"  Total code blocks: {len(code_blocks)}")
for i, (lang, body) in enumerate(code_blocks, 1):
    body_preview = body.strip()
    lines = len(body.strip().splitlines())
    print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}'")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (TECHNICAL CATEGORY)")
print("=" * 80)

# Apply sanitization with 'technical' category
sanitized, changes = sanitize_ai_content(test_python_content, 'technical')

print(f"\n✅ CHANGES MADE:")
print(f"  • LaTeX removed: {changes['latex_removed']}")
print(f"  • Bold removed: {changes['bold_removed']}")
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
if code_blocks_after:
    print("  ⚠️ Remaining code blocks:")
    for i, (lang, body) in enumerate(code_blocks_after, 1):
        body_preview = body.strip()
        lines = len(body.strip().splitlines())
        print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}'")
else:
    print("  ✅ No code blocks remaining!")

# Check what got converted to inline
inline_code = re.findall(r'`([^`]+)`', sanitized)
single_word_inline = [ic for ic in inline_code if ic in ['int', 'float', 'str', 'bool', 'list', 'tuple', 'class', 'True', 'False', 'NameError', "'", '"', "'Hello'", '"Python"']]
if single_word_inline:
    print(f"\n  ✅ Single-word items converted to inline code:")
    for item in single_word_inline:
        print(f"    - `{item}`")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior:
- Convert single words: ```int``` → `int`, ```float``` → `float`
- Convert keywords: ```class``` → `class`, ```True``` → `True`
- Convert strings: ```'Hello'``` → `'Hello'`, ```"Python"``` → `"Python"`
- Convert quotes: ```'``` → `'`, ```"``` → `"`
- Convert errors: ```NameError``` → `NameError`

Code blocks BEFORE: {len(code_blocks)}
Code blocks AFTER: {len(code_blocks_after)}
Single-word blocks converted: {len(code_blocks) - len(code_blocks_after)}

Expected: All {len(code_blocks)} single-word blocks converted to inline
Actual: {len(code_blocks) - len(code_blocks_after)} blocks converted

Status: {'✅ PERFECT' if len(code_blocks_after) == 0 else '⚠️ NEEDS FIX - Still ' + str(len(code_blocks_after)) + ' blocks remaining'}
""")
