"""
Test script to verify the new sanitization module correctly removes excessive inline code
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case 1: Math content with excessive backticks around standalone numbers
test_content_1 = """
## Understanding Angles

An angle is formed when two rays meet at a common point. Angles are measured in degrees. 

- A right angle is `90` degrees
- A straight line is `180` degrees  
- An acute angle is less than `90` degrees
- An obtuse angle is more than `90` but less than `180` degrees

### Circle Measurements

A full circle has `360` degrees. If you divide a circle into equal parts:
- Half circle: `180` degrees
- Quarter circle: `90` degrees
- One-sixth: `60` degrees
- One-eighth: `45` degrees

The angle at the center is `5` degrees when there are `8` equal divisions.
"""

# Test case 2: Content with LaTeX and backticks
test_content_2 = """
## Trigonometry Basics

The sine function is written as $sin(theta)$ where theta is the angle.

For a right triangle:
- $sin(30) = 0.5$
- $cos(60) = 0.5$ 
- $tan(45) = 1$

$$sin^2(x) + cos^2(x) = 1$$

When the angle is `30` degrees, the ratio is `0.5`.
When the angle is `60` degrees, the ratio is also `0.5`.
"""

# Test case 3: Content with actual math expressions (should KEEP backticks)
test_content_3 = """
## Mathematical Operations

Calculate the value using: `x + 5 = 10`

The formula is: `calculateAngle(theta, radius)`

Variables: `theta`, `alpha`, `beta`

Code example: `function sin(x) { return Math.sin(x); }`
"""

# Test case 4: Mixed content
test_content_4 = """
The angle is `60` degrees and the sine of `30` degrees is `0.5`.

But the equation `x + y = 10` should keep backticks.

The function `Math.sin(theta)` also keeps backticks.

Simple numbers like `5`, `10`, `15` should lose backticks.
"""

print("=" * 80)
print("SANITIZATION TEST - Removing Excessive Inline Code")
print("=" * 80)

# Test 1
print("\n📋 TEST 1: Angles with excessive backticks around numbers")
print("-" * 80)
print("BEFORE:")
print(test_content_1[:300] + "...")
sanitized_1, changes_1 = sanitize_ai_content(test_content_1, 'academic')
print("\nCHANGES:")
print(f"  • LaTeX removed: {changes_1['latex_removed']}")
print(f"  • Inline code cleaned: {changes_1['inline_code_cleaned']}")
print(f"  • Total changes: {changes_1['total']}")
print("\nAFTER (first 300 chars):")
print(sanitized_1[:300] + "...")
print("\nBACKTICK COUNT:")
print(f"  Before: {test_content_1.count('`')} backticks")
print(f"  After: {sanitized_1.count('`')} backticks")

# Test 2
print("\n" + "=" * 80)
print("📋 TEST 2: LaTeX + backticks (Trigonometry)")
print("-" * 80)
print("BEFORE:")
print(test_content_2[:400] + "...")
sanitized_2, changes_2 = sanitize_ai_content(test_content_2, 'academic')
print("\nCHANGES:")
print(f"  • LaTeX removed: {changes_2['latex_removed']}")
print(f"  • Inline code cleaned: {changes_2['inline_code_cleaned']}")
print(f"  • Total changes: {changes_2['total']}")
print("\nAFTER (first 400 chars):")
print(sanitized_2[:400] + "...")
print("\nSYMBOL COUNT:")
print(f"  $ symbols before: {test_content_2.count('$')} | after: {sanitized_2.count('$')}")
print(f"  Backticks before: {test_content_2.count('`')} | after: {sanitized_2.count('`')}")

# Test 3
print("\n" + "=" * 80)
print("📋 TEST 3: Actual math expressions (SHOULD KEEP backticks)")
print("-" * 80)
print("BEFORE:")
print(test_content_3)
sanitized_3, changes_3 = sanitize_ai_content(test_content_3, 'technical')
print("\nCHANGES:")
print(f"  • Inline code cleaned: {changes_3['inline_code_cleaned']}")
print("\nAFTER:")
print(sanitized_3)
print("\nBACKTICK COUNT (should stay same or similar):")
print(f"  Before: {test_content_3.count('`')} backticks")
print(f"  After: {sanitized_3.count('`')} backticks")

# Test 4
print("\n" + "=" * 80)
print("📋 TEST 4: Mixed content (remove from numbers, keep from math/code)")
print("-" * 80)
print("BEFORE:")
print(test_content_4)
sanitized_4, changes_4 = sanitize_ai_content(test_content_4, 'general')
print("\nCHANGES:")
print(f"  • Inline code cleaned: {changes_4['inline_code_cleaned']}")
print("\nAFTER:")
print(sanitized_4)
print("\nBACKTICK COUNT:")
print(f"  Before: {test_content_4.count('`')} backticks")
print(f"  After: {sanitized_4.count('`')} backticks")

# Summary
print("\n" + "=" * 80)
print("✅ SUMMARY")
print("=" * 80)
print("""
Expected Results:
✓ Test 1: Many backticks removed (90, 180, 360, 60, 45, 5, 8 should lose backticks)
✓ Test 2: All $ symbols removed, excessive backticks removed (30, 60, 0.5 should lose backticks)
✓ Test 3: Backticks PRESERVED (math expressions, function calls, variables)
✓ Test 4: Smart filtering (remove from 60, 30, 0.5, 5, 10, 15 but keep in x + y = 10, Math.sin)

Total backtick reduction expected: ~70-80% for Test 1-2, minimal for Test 3, ~60% for Test 4
""")
