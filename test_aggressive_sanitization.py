"""
Test aggressive sanitization for academic/math content
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Differential Equations (like in the screenshot)
test_content_ode = """
## First-Order Ordinary Differential Equations

A first-order ODE is `separable` if it can be written in the form where the

code:
x

terms and

code:
dx

are on one side, and the

code:
y

terms and

code:
dy

are on the other side.

The variables `x` and `y` can be separated. For example, if we have `dy/dx = f(x)g(y)`, we can rewrite it as:

- `dy/g(y) = f(x)dx`

This allows us to integrate both sides separately.

### Example

Consider the equation `dy/dx = xy`. This can be separated as:

- `dy/y = x dx`

Integrating both sides gives us the solution.
"""

print("=" * 80)
print("AGGRESSIVE SANITIZATION TEST - Academic Content (Differential Equations)")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_content_ode)

print("\n🔍 BACKTICK ANALYSIS BEFORE:")
print(f"  Total backticks: {test_content_ode.count('`')}")
backticked_items = []
import re
for match in re.finditer(r'`([^`]+)`', test_content_ode):
    backticked_items.append(match.group(1))
print(f"  Items in backticks: {backticked_items}")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (ACADEMIC CATEGORY)")
print("=" * 80)

# Apply sanitization with 'academic' category
sanitized, changes = sanitize_ai_content(test_content_ode, 'academic')

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

print("\n🔍 BACKTICK ANALYSIS AFTER:")
print(f"  Total backticks: {sanitized.count('`')}")
backticked_items_after = []
for match in re.finditer(r'`([^`]+)`', sanitized):
    backticked_items_after.append(match.group(1))
print(f"  Items still in backticks: {backticked_items_after}")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior for ACADEMIC content:
- Remove backticks from: x, y, dx, dy, separable
- Remove from simple expressions: dy/dx, xy, dy/y, x dx
- Result: Natural flowing text without code blocks

Backtick count: {test_content_ode.count('`')} → {sanitized.count('`')}
Reduction: {((test_content_ode.count('`') - sanitized.count('`')) / test_content_ode.count('`') * 100):.1f}%

Expected: ~95-100% reduction (almost all backticks removed for math content)
""")
