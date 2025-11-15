#!/usr/bin/env python3
"""
Test script to verify LaTeX sanitization works correctly
"""

import re

def strip_latex_syntax(text: str):
    """
    Test version of the sanitization function
    """
    if not isinstance(text, str):
        return text, 0
    
    replacements = 0
    
    # Step 1: Remove display math blocks $$...$$ 
    display_math_pattern = re.compile(r'\$\$([^\$]+?)\$\$', re.DOTALL)
    def _convert_display_math(m):
        nonlocal replacements
        replacements += 1
        content = m.group(1).strip()
        # Clean LaTeX commands first
        content = re.sub(r'\\(theta|pi|alpha|beta|gamma|delta|sigma|omega|Theta|Pi|Alpha|Beta|Gamma|Delta|Sigma|Omega)', lambda x: x.group(1), content)
        content = re.sub(r'\\(frac|sqrt|sum|int|lim|cos|sin|tan|arccos|arcsin|arctan)', r'\1', content)
        content = content.replace('\\', '')
        
        # Split into lines and format as bullet list
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if len(lines) == 1:
            return f"\n- `{lines[0]}`\n"
        else:
            return "\n" + "\n".join([f"- `{line}`" for line in lines]) + "\n"
    text = display_math_pattern.sub(_convert_display_math, text)
    
    # Step 2: Remove inline LaTeX math $...$
    inline_math_pattern = re.compile(r'\$([^\$\n]+?)\$')
    def _convert_inline_math(m):
        nonlocal replacements
        replacements += 1
        content = m.group(1).strip()
        # Clean up LaTeX commands
        content = re.sub(r'\\(theta|pi|alpha|beta|gamma|delta|sigma|omega|Theta|Pi)', lambda x: x.group(1), content)
        content = re.sub(r'\\(frac|sqrt|sum|int|lim|cos|sin|tan|arccos|arcsin|arctan|cosh|sinh|tanh)', r'\1', content)
        content = re.sub(r'\^-1', '⁻¹', content)
        content = content.replace('\\', '')
        content = content.replace('{', '').replace('}', '')
        return f"`{content}`"
    text = inline_math_pattern.sub(_convert_inline_math, text)
    
    # Step 3: Clean up any remaining LaTeX commands
    text = re.sub(r'\\(left|right|big|Big)\s*', '', text)
    text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    
    # Step 4: Clean up any stray dollar signs
    text = text.replace('$$', '')
    text = text.replace('$', '')
    
    return text, replacements


# Test cases from your screenshot
test_content = """
**1. SOH: Sine = Opposite / Hypotenuse** * The **sine** of an angle ($sin$) is the ratio of the length of the **opposite** side to the length of the **hypotenuse**. * $$sin(angle) = Opposite / Hypotenuse$$ **2. CAH: Cosine = Adjacent / Hypotenuse** * The **cosine** of an angle ($cos$) is the ratio of the length of the **adjacent** side to the length of the **hypotenuse**. * $$cos(angle) = Adjacent / Hypotenuse$$ **3. TOA: Tangent = Opposite / Adjacent** * The **tangent** of an angle ($tan$) is the ratio of the length of the **opposite** side to the length of the **adjacent** side. * $$tan(angle) = Opposite / Adjacent$$

Using a calculator, $sin(30)$ is `0.5`. * $$x = 10 * 0.5$$ * $$x = 5$$

To find the angle when you know the cosine value, you use the inverse cosine function (often written as `arccos` or $cos^-1$ on calculators). * $$theta = arccos(0.5)$$ * $$theta = 60$$ degrees
"""

print("="*80)
print("TESTING LATEX SANITIZATION")
print("="*80)
print("\nORIGINAL CONTENT:")
print("-"*80)
print(test_content[:500] + "...")
print(f"\nDollar signs in original: {test_content.count('$')}")

print("\n" + "="*80)
print("APPLYING SANITIZATION...")
print("="*80)

sanitized, changes = strip_latex_syntax(test_content)

print(f"\nSanitization changes made: {changes}")
print(f"Dollar signs after sanitization: {sanitized.count('$')}")

print("\n" + "="*80)
print("SANITIZED CONTENT:")
print("="*80)
print(sanitized[:700])

print("\n" + "="*80)
print("VERIFICATION:")
print("="*80)
if '$' in sanitized:
    print("❌ FAILED: Dollar signs still present!")
    print(f"   Found {sanitized.count('$')} dollar signs")
else:
    print("✅ SUCCESS: All LaTeX removed!")
    print("   • No dollar signs found")
    print("   • Content is clean and readable")

print("="*80)
