"""
Test sanitization for summary mathematical expressions
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Summary with mathematical expressions in code blocks
test_summary = """
The content provides several practical examples:

• **Finding the Height of a Tree**: Calculates the height (opposite side) using the tangent ratio, given the distance from the tree (adjacent side) and the angle of elevation. (e.g.,

```
h = 20 * tan(35°) ≈ 14.004 feet
```

)

• **Finding the Length of a Ramp**: Determines the ramp's length (hypotenuse) using the sine ratio, given the platform height (opposite side) and the angle the ramp makes with the ground. (e.g.,

```
L = 3 / sin(15°) ≈ 11.59 feet
```

)

• **Determining an Angle of Elevation**: Finds the angle of elevation using the inverse tangent function, given the building's height (opposite side) and the distance from the building (adjacent side). (e.g.,

```
θ = arctan(75/50) ≈ 56.31 degrees
```

)
"""

print("=" * 80)
print("SUMMARY MATHEMATICAL EXPRESSIONS - SANITIZATION TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_summary)

print("\n🔍 CODE BLOCK ANALYSIS BEFORE:")
import re
code_blocks = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', test_summary)
print(f"  Total code blocks: {len(code_blocks)}")
for i, (lang, body) in enumerate(code_blocks, 1):
    body_preview = body.strip()
    lines = len(body.strip().splitlines())
    print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}'")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (ACADEMIC CATEGORY)")
print("=" * 80)

# Apply sanitization with 'academic' category (same as summary uses)
sanitized, changes = sanitize_ai_content(test_summary, 'academic')

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
    print("  Remaining code blocks:")
    for i, (lang, body) in enumerate(code_blocks_after, 1):
        body_preview = body.strip()
        lines = len(body.strip().splitlines())
        print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}'")
else:
    print("  ✅ No code blocks remaining!")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior:
- Convert ```h = 20 * tan(35°) ≈ 14.004 feet``` → plain text
- Convert ```L = 3 / sin(15°) ≈ 11.59 feet``` → plain text
- Convert ```θ = arctan(75/50) ≈ 56.31 degrees``` → plain text

Code blocks BEFORE: {len(code_blocks)}
Code blocks AFTER: {len(code_blocks_after)}
Code blocks removed: {len(code_blocks) - len(code_blocks_after)}

Expected: 3 math expressions converted to plain text
Actual: {changes['fences_sanitized']} code blocks sanitized

Status: {'✅ PERFECT' if len(code_blocks_after) == 0 else '⚠️ NEEDS FIX'}
""")
