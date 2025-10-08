"""
Test summary sanitization with academic category (like trigonometry)
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Trigonometry summary (like in the screenshot)
test_summary_trig = """
## 📋 Right Triangle Trigonometry: Content Summary

### 🎯 Main Topics Covered
- Inverse trigonometric functions for finding angles
- Three main inverse functions: `sin^-1`, `cos^-1`, `tan^-1`
- Converting between ratios and angles

### 💡 Key Information & Facts
- To find an angle from a ratio, use inverse trig functions:
  - `sin^-1(ratio)` gives the angle whose sine is the ratio
  - `angle = arccos(ratio)` gives the angle whose cosine is the ratio  
  - `cos^-1(ratio)` is another notation for arccos
  - `angle = arctan(ratio)` gives the angle whose tangent is the ratio
  - `tan^-1(ratio)` is another notation for arctan

### 🔧 Practical Examples
- If `sin(angle) = 0.5`, then `angle = sin^-1(0.5) = 30°`
- If `cos(angle) = 0.866`, then `angle = cos^-1(0.866) = 30°`
- If `tan(angle) = 1`, then `angle = tan^-1(1) = 45°`

### ⚡ Important Points
- Inverse functions "undo" the original trig function
- Calculator must be in correct mode (degrees or radians)
- Angle values are typically between `0°` and `90°` for right triangles
"""

print("=" * 80)
print("SUMMARY SANITIZATION TEST - Academic Category (Trigonometry)")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION (Summary Tab Content):")
print("-" * 80)
print(test_summary_trig)

print("\n🔍 BACKTICK ANALYSIS BEFORE:")
backtick_count = test_summary_trig.count('`')
print(f"  Total backticks: {backtick_count}")

import re
backticked_items = []
for match in re.finditer(r'`([^`]+)`', test_summary_trig):
    backticked_items.append(match.group(1))
print(f"  Items in backticks ({len(backticked_items)}):")
for item in backticked_items:
    print(f"    - `{item}`")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (ACADEMIC CATEGORY - like summary.py does)")
print("=" * 80)

# Apply sanitization with 'academic' category (same as summary.py default)
sanitized, changes = sanitize_ai_content(test_summary_trig, 'academic')

print(f"\n✅ CHANGES MADE:")
print(f"  • LaTeX removed: {changes['latex_removed']}")
print(f"  • Inline code cleaned: {changes['inline_code_cleaned']}")
print(f"  • Code fences sanitized: {changes['fences_sanitized']}")
print(f"  • Indented blocks cleaned: {changes['indents_cleaned']}")
print(f"  • Total changes: {changes['total']}")

print("\n" + "=" * 80)
print("📋 AFTER SANITIZATION (What User Should See):")
print("-" * 80)
print(sanitized)

print("\n🔍 BACKTICK ANALYSIS AFTER:")
backtick_count_after = sanitized.count('`')
print(f"  Total backticks: {backtick_count_after}")

backticked_items_after = []
for match in re.finditer(r'`([^`]+)`', sanitized):
    backticked_items_after.append(match.group(1))
if backticked_items_after:
    print(f"  Items still in backticks ({len(backticked_items_after)}):")
    for item in backticked_items_after:
        print(f"    - `{item}`")
else:
    print(f"  ✅ NO items in backticks - all removed!")

print("\n" + "=" * 80)
print("📊 SUMMARY COMPARISON")
print("=" * 80)

reduction = ((backtick_count - backtick_count_after) / backtick_count * 100) if backtick_count > 0 else 0

print(f"""
BEFORE: {backtick_count} backticks
- sin^-1, cos^-1, tan^-1
- sin^-1(ratio), arccos(ratio), cos^-1(ratio)
- angle = arctan(ratio), tan^-1(ratio)
- sin(angle) = 0.5, angle = sin^-1(0.5) = 30°
- cos(angle) = 0.866, angle = cos^-1(0.866) = 30°
- tan(angle) = 1, angle = tan^-1(1) = 45°
- 0°, 90°

AFTER: {backtick_count_after} backticks
Reduction: {reduction:.1f}%

Expected: ~95-100% reduction for academic content
Status: {'✅ PERFECT' if reduction >= 95 else '⚠️ NEEDS IMPROVEMENT'}
""")
