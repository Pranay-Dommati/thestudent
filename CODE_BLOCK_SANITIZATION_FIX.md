# Code Block Sanitization Fix

## Problem Description

The AI-generated reading materials and summaries were showing code blocks for simple single-word items that should be inline code instead. This created a poor reading experience with large code panels for things like:

- Single words: `Python`, `"123"`, `"Hello"`
- Data types: `int`, `str`, `bool`, `float`
- Boolean values: `True`, `False`
- Single operators or symbols

**Expected**: These should render as inline code (with single backticks)
**Actual**: They were rendering as full code blocks (triple backticks)

## Root Cause

1. **AI Prompt Issue**: The AI prompts didn't explicitly instruct the model to avoid creating code blocks for single words/values
2. **Sanitization Issue**: The `_sanitize_code_fences` function only converted single-line code blocks to inline code for "technical" category content, not for all content

## Solution

### 1. Improved AI Prompts (`backend/backend/ai/reading.py`)

Updated the formatting instructions in the prompts to be VERY explicit:

#### Technical Prompt:
```markdown
**FORMATTING** (CRITICAL):
- **Code Blocks (```language)**: ONLY for complete, multi-line, runnable code examples (5+ lines minimum)
  - ❌ DO NOT use code blocks for: single words like `Python`, `True`, `False`, data types like `int`, `str`, `bool`
  - ❌ DO NOT use code blocks for: single function names, single values, single operators
- **Inline Code (`text`)**: For ALL single keywords, data types, function names, variables, values, expressions
  - ✅ Example: "The `int` data type stores integers"
  - ✅ Example: "Use `True` and `False` for boolean values"
  - ✅ Example: "The `str` type represents strings like `"Hello"`"
  - ✅ Example: "Call the `print()` function"
  - ❌ NEVER create a code block for these - ALWAYS use inline code
```

#### General/Fallback Prompt:
Added similar explicit instructions about when to use code blocks vs inline code.

### 2. Aggressive Sanitization (`backend/backend/ai/sanitization.py`)

Updated `_sanitize_code_fences()` function to be AGGRESSIVE about converting single-line code blocks:

**Before**:
- Only converted for `category_hint == 'technical'`
- Only converted if under 150 chars and no programming keywords

**After**:
```python
# AGGRESSIVE: Convert ALL single-line code blocks to inline code unless they're real code
if len(lines) == 1:
    content = lines[0]
    
    # Keep as code block ONLY if it has real programming keywords
    has_real_code = code_keywords.search(content) or (lang and lang in real_code_langs and len(content) > 50)
    
    if not has_real_code:
        # Convert to inline code for single words, function names, data types, etc.
        replacements += 1
        return f"`{content}`"

# For 2-5 line code blocks without keywords, also convert to inline if simple
if 2 <= len(lines) <= 5:
    all_simple = all(len(ln) <= 30 and not code_keywords.search(ln) for ln in lines)
    if all_simple and not (lang and lang in real_code_langs):
        # Convert to comma-separated inline code
        replacements += 1
        inline_items = ", ".join([f"`{ln}`" for ln in lines])
        return inline_items
```

## What Changed

### Files Modified:
1. `backend/backend/ai/reading.py`
   - Updated technical prompt formatting section
   - Updated general/fallback prompt formatting section
   - Added explicit examples of what NOT to do with code blocks

2. `backend/backend/ai/sanitization.py`
   - Made `_sanitize_code_fences()` aggressive for ALL categories (not just technical)
   - Converts single-line code blocks to inline code unless they contain programming keywords
   - Converts 2-5 line simple code blocks to comma-separated inline code

## Expected Results

### Before:
```markdown
## Data Types

```
Python
```

```
int
```

```
str
```

```
True
```

```
False
```
```

### After:
```markdown
## Data Types

`Python`, `int`, `str`, `True`, `False`

Or in context:
- The `int` data type stores whole numbers
- Use `True` and `False` for boolean values
- Strings use the `str` type like `"Hello"`
```

## Testing Checklist

- [ ] Single-word code blocks are converted to inline code
- [ ] Data type names (`int`, `str`, `bool`, etc.) render as inline code
- [ ] Boolean values (`True`, `False`) render as inline code
- [ ] Multi-line actual code blocks are preserved
- [ ] Function definitions with `def`, `class`, etc. remain as code blocks
- [ ] Academic/math content works correctly
- [ ] Reading tab displays correctly
- [ ] Summary tab displays correctly

## Benefits

✅ **Improved Reading Experience**:
- No more large code panels for single words
- Content flows naturally with inline code
- Better visual hierarchy

✅ **Cleaner Content**:
- Inline code for what should be inline
- Code blocks only for actual multi-line code examples
- More professional presentation

✅ **AI Instruction**:
- AI now has clear, explicit examples
- Reduced ambiguity in formatting instructions
- Better prompt engineering

## Impact

- Affects all new content generated after this fix
- Existing content in database will continue to show old formatting until regenerated
- Backend sanitization will clean up any AI mistakes automatically
