"""
Test sanitization for Django URL naming content (like in user's screenshot)
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.ai.sanitization import sanitize_ai_content

# Test case: Django URL content (exactly like in screenshot)
test_django_urls = """
## Clear URL Naming

Use the

```
name
```

argument in

```
path()
```

functions within your

```
urls.py
```

file. This allows you to refer to URLs by name (e.g.,

```
{% url 'hello_django' %}
```

in templates) rather than hardcoding URLs.

### Example URLs Configuration

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
]
```

### Using Named URLs in Templates

```html
<a href="{% url 'home' %}">Home</a>
<a href="{% url 'about' %}">About</a>
```
"""

print("=" * 80)
print("DJANGO URL NAMING - CODE BLOCK SANITIZATION TEST")
print("=" * 80)

print("\n📋 BEFORE SANITIZATION:")
print("-" * 80)
print(test_django_urls)

print("\n🔍 CODE BLOCK ANALYSIS BEFORE:")
import re
code_blocks = re.findall(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', test_django_urls)
print(f"  Total code blocks: {len(code_blocks)}")
for i, (lang, body) in enumerate(code_blocks, 1):
    body_preview = body.strip()[:60]
    lines = len(body.strip().splitlines())
    print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}...'")

print("\n" + "=" * 80)
print("🧹 APPLYING SANITIZATION (TECHNICAL CATEGORY)")
print("=" * 80)

# Apply sanitization with 'technical' category
sanitized, changes = sanitize_ai_content(test_django_urls, 'technical')

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
    body_preview = body.strip()[:60]
    lines = len(body.strip().splitlines())
    print(f"  {i}. Lang: '{lang}' | Lines: {lines} | Content: '{body_preview}...'")

# Check what got converted to inline
inline_code = re.findall(r'`([^`]+)`', sanitized)
single_word_inline = [ic for ic in inline_code if ic in ['name', 'path()', 'urls.py'] or 'url' in ic.lower()]
print(f"\n  Single-word items as inline code:")
for item in single_word_inline[:10]:
    print(f"    - `{item}`")

print("\n" + "=" * 80)
print("📊 SUMMARY")
print("=" * 80)
print(f"""
Expected behavior:
- Convert single-word blocks to inline: ```name``` → `name`
- Convert ```path()``` → `path()`
- Convert ```urls.py``` → `urls.py`
- Convert ```{{% url 'hello_django' %}}``` → `{{% url 'hello_django' %}}`
- Keep multi-line code: ```python ... ``` and ```html ... ```

Code blocks BEFORE: {len(code_blocks)}
Code blocks AFTER: {len(code_blocks_after)}
Single-line blocks converted: {len(code_blocks) - len(code_blocks_after)}

Expected: 4 single-line blocks removed (name, path(), urls.py, template tag)
Actual: {len(code_blocks) - len(code_blocks_after)} blocks removed

Status: {'✅ PERFECT' if len(code_blocks_after) == 2 else '⚠️ NEEDS CHECK'}
""")
