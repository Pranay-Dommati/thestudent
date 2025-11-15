"""
Test sanitization for operators in code blocks
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: JavaScript operators (like in screenshot)
test_operators = """
## JavaScript Operators

JavaScript supports various types of operators:

### Arithmetic Operators

Multiplication:

```
*
```

Division:

```
/
```

### Comparison Operators

Greater than:

```
>
```

Less than:

```
<
```

### Logical Operators

AND operator:

```
&&
```

OR operator:

```
||
```

### Assignment

Simple assignment (=, +=, -=), comparison (==, ===, !=, !==), and logical (&&, ||).

### Complete Example

```javascript
let x = 10;
let y = 20;

if (x > 5 && y < 30) {
  console.log('Both conditions true');
}
```
"""

print("=" * 80)
print("OPERATOR CODE BLOCK SANITIZATION TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_operators)

print("\n🔍 CODE BLOCK ANALYSIS BEFORE:")
import re
code_blocks = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', test_operators)
print(f"  Total code blocks: {len(code_blocks)}")
for i, (lang, body) in enumerate(code_blocks, 1):
    body_preview = body.strip()
    print(f"  {i}. Language: '{lang}' | Content: '{body_preview}'")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (TECHNICAL CATEGORY)")
print("=" * 80)

# Apply sanitization with 'technical' category
sanitized, changes = sanitize_ai_content(test_operators, 'technical')

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

# Check inline code for operators
inline_code = re.findall(r'`([^`]+)`', sanitized)
operator_inline = [ic for ic in inline_code if ic in ['*', '/', '>', '<', '&&', '||']]
print(f"\n  Operators as inline code: {operator_inline}")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior for OPERATORS in TECHNICAL content:
- Convert single-operator code blocks to inline: ```*``` → `*`
- Convert ```/``` → `/`
- Convert ```>``` → `>`
- Convert ```<``` → `<`
- Convert ```&&``` → `&&`
- Keep actual code: ```javascript ... ``` (preserved)

Code blocks BEFORE: {len(code_blocks)}
Code blocks AFTER: {len(code_blocks_after)}
Operator blocks converted: {len(code_blocks) - len(code_blocks_after)}

Expected: 6 operator blocks removed (*, /, >, <, &&, ||)
Actual: {len(code_blocks) - len(code_blocks_after)} blocks removed

Operators found as inline code: {len(operator_inline)}/6

Status: {'✅ WORKING' if len(operator_inline) >= 5 else '⚠️ NEEDS FIX'}
""")
