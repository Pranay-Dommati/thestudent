"""
Test bold markdown removal for academic content (trigonometry)
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Trigonometry content with excessive bold
test_trig_content = """
> > * The slanted side is the **Hypotenuse**. > * The side directly across from 'Angle' is the **Opposite Side**. > * The side next to 'Angle' (but not the hypotenuse) is the **Adjacent Side**. > * The square symbol would be at the top right corner, indicating the 90-degree angle. --- ### The Pythagorean Theorem: A Fundamental Relationship While not strictly trigonometry, the **Pythagorean Theorem** is a foundational concept for right triangles and often works hand-in-hand with trigonometry. It states that in any right triangle, the square of the length of the hypotenuse (c) is equal to the sum of the squares of the lengths of the other two sides (a and b). * a^2 + b^2 = c^2 This theorem allows you to find the length of an unknown side if you know the lengths of the other two sides. Trigonometry, as we'll see, extends this by allowing us to find unknown sides *or* angles using ratios. --- ### The Core of Trigonometry: Sine, Cosine, and Tangent (SOH CAH TOA) Right triangle trigonometry introduces three primary **trigonometric ratios**: **sine**, **cosine**, and **tangent**. These ratios describe the relationship between the angles and the side lengths of a right triangle. They are constant for a given angle, no matter the size of the triangle! A helpful mnemonic to remember these ratios is **SOH CAH TOA**: * **SOH**: **S**ine = **O**pposite / **H**ypotenuse * **CAH**: **C**osine = **A**djacent / **H**ypotenuse * **TOA**: **T**angent = **O**pposite / **A**djacent Let's break down each one: 1. **Sine (sin)**: The sine of an acute angle in a right triangle is the ratio of the length of the side **opposite** the angle to the length of the **hypotenuse**.
"""

print("=" * 80)
print("TRIGONOMETRY - BOLD MARKDOWN REMOVAL TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_trig_content[:500] + "...")

print("\n🔍 BOLD TEXT ANALYSIS BEFORE:")
import re
bold_text = re.findall(r'\*\*([^*\n]+?)\*\*', test_trig_content)
print(f"  Total bold items: {len(bold_text)}")
for i, text in enumerate(bold_text[:15], 1):
    print(f"  {i}. **{text}**")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (ACADEMIC CATEGORY)")
print("=" * 80)

# Apply sanitization with 'academic' category
sanitized, changes = sanitize_ai_content(test_trig_content, 'academic')

print(f"\n✅ CHANGES MADE:")
print(f"  • LaTeX removed: {changes['latex_removed']}")
print(f"  • Bold removed: {changes['bold_removed']}")
print(f"  • Inline code cleaned: {changes['inline_code_cleaned']}")
print(f"  • Code fences sanitized: {changes['fences_sanitized']}")
print(f"  • Indented blocks cleaned: {changes['indents_cleaned']}")
print(f"  • Total changes: {changes['total']}")

print("\n" + "=" * 80)
print("📋 AFTER SANITIZATION (first 500 chars):")
print("-" * 80)
print(sanitized[:500] + "...")

print("\n🔍 BOLD TEXT ANALYSIS AFTER:")
bold_text_after = re.findall(r'\*\*([^*\n]+?)\*\*', sanitized)
print(f"  Total bold items: {len(bold_text_after)}")
if bold_text_after:
    print("  Remaining bold text:")
    for i, text in enumerate(bold_text_after[:10], 1):
        print(f"  {i}. **{text}**")
else:
    print("  ✅ No bold text remaining!")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior:
- Remove bold from: Hypotenuse, Opposite Side, Adjacent Side
- Remove bold from: Pythagorean Theorem, trigonometric ratios
- Remove bold from: sine, cosine, tangent, SOH CAH TOA
- Remove bold from: opposite, hypotenuse (in descriptions)

Bold items BEFORE: {len(bold_text)}
Bold items AFTER: {len(bold_text_after)}
Bold items removed: {len(bold_text) - len(bold_text_after)}

Expected: Most/all bold removed (target: 15+ removals)
Actual: {changes['bold_removed']} bold items removed

Status: {'✅ EXCELLENT' if changes['bold_removed'] >= 15 else '⚠️ NEEDS MORE'}
""")
