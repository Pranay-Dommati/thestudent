"""
Shared sanitization utilities for AI-generated content
Handles LaTeX, code fences, and excessive inline code formatting
"""

import re

def sanitize_ai_content(text: str, category: str = 'general'):
    """
    Professional sanitization of AI-generated educational content.
    Removes LaTeX, cleans up code fences, and removes excessive inline code formatting.
    
    Args:
        text: The content to sanitize
        category: Content category (technical, academic, etc.)
    
    Returns:
        tuple: (sanitized_text, changes_dict)
        where changes_dict contains:
            - latex_removed: number of LaTeX removals
            - bold_removed: number of excessive bold removals
            - inline_code_cleaned: number of excessive inline code removals
            - fences_sanitized: number of code fence conversions
            - indents_cleaned: number of indented blocks cleaned
            - total: total number of changes
    """
    if not isinstance(text, str) or not text.strip():
        return text, {
            'latex_removed': 0,
            'bold_removed': 0,
            'inline_code_cleaned': 0,
            'fences_sanitized': 0,
            'indents_cleaned': 0,
            'total': 0
        }
    
    # Step 1: Remove LaTeX syntax
    text, latex_changes = _strip_latex_syntax(text)
    
    # Step 2: Remove excessive bold markdown for academic content
    text, bold_changes = _remove_excessive_bold(text, category)
    
    # Step 3: Remove excessive inline code (backticks around simple numbers/words)
    # For academic content, be VERY aggressive - remove almost all backticks
    text, inline_changes = _remove_excessive_inline_code(text, category)
    
    # Step 4: Sanitize code fences
    text, fence_changes = _sanitize_code_fences(text, category)
    
    # Step 5: Clean indented blocks
    text, indent_changes = _clean_indented_blocks(text)
    
    # Step 6: Final safety - remove any remaining stray dollar signs
    remaining_dollars = text.count('$')
    if remaining_dollars > 0:
        text = text.replace('$', '')
        latex_changes += 1
    
    total_changes = latex_changes + bold_changes + inline_changes + fence_changes + indent_changes
    
    changes_dict = {
        'latex_removed': latex_changes,
        'bold_removed': bold_changes,
        'inline_code_cleaned': inline_changes,
        'fences_sanitized': fence_changes,
        'indents_cleaned': indent_changes,
        'total': total_changes
    }
    
    return text, changes_dict


def _strip_latex_syntax(text: str):
    """Remove ALL LaTeX syntax and convert to plain text/inline code."""
    if not isinstance(text, str):
        return text, 0
    
    replacements = 0
    
    # Remove display math blocks $$...$$
    display_math_pattern = re.compile(r'\$\$([^\$]+?)\$\$', re.DOTALL)
    def _convert_display_math(m):
        nonlocal replacements
        replacements += 1
        content = m.group(1).strip()
        content = _clean_latex_commands(content)
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if len(lines) == 1:
            return f"\n- `{lines[0]}`\n"
        else:
            return "\n" + "\n".join([f"- `{line}`" for line in lines]) + "\n"
    text = display_math_pattern.sub(_convert_display_math, text)
    
    # Remove inline LaTeX math $...$
    inline_math_pattern = re.compile(r'\$([^\$\n]+?)\$')
    def _convert_inline_math(m):
        nonlocal replacements
        replacements += 1
        content = m.group(1).strip()
        content = _clean_latex_commands(content)
        return f"`{content}`"
    text = inline_math_pattern.sub(_convert_inline_math, text)
    
    # Clean up remaining LaTeX commands
    text = re.sub(r'\\(left|right|big|Big)\s*', '', text)
    text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    
    return text, replacements


def _clean_latex_commands(content: str):
    """Clean LaTeX commands from a string."""
    # Greek letters
    content = re.sub(
        r'\\(theta|pi|alpha|beta|gamma|delta|sigma|omega|Theta|Pi|Alpha|Beta|Gamma|Delta|Sigma|Omega)',
        lambda x: x.group(1), content
    )
    # Math functions
    content = re.sub(
        r'\\(frac|sqrt|sum|int|lim|cos|sin|tan|arccos|arcsin|arctan|cosh|sinh|tanh)',
        r'\1', content
    )
    # Superscripts
    content = re.sub(r'\^-1', '⁻¹', content)
    content = content.replace('\\', '').replace('{', '').replace('}', '')
    return content


def _remove_excessive_bold(text: str, category: str = 'general'):
    """
    Remove excessive bold markdown (**text**) for academic content.
    
    For ACADEMIC/MATH content: Remove bold from:
    - Single words/terms (Hypotenuse, Opposite, Adjacent)
    - Short phrases (SOH CAH TOA, sine, cosine, tangent)
    - Ratios, formulas, theorem names
    
    Keep bold ONLY for:
    - Important section emphasis (very sparingly)
    - Critical warnings/notes
    """
    if not isinstance(text, str) or '**' not in text:
        return text, 0
    
    replacements = 0
    
    # FOR ACADEMIC CONTENT - Remove most bold formatting
    if category in ['academic', 'skills']:
        # Pattern to match **text**
        pattern = re.compile(r'\*\*([^*\n]+?)\*\*')
        
        def _should_keep_bold(content: str) -> bool:
            """Determine if bold should be kept."""
            content = content.strip()
            
            # Keep if empty
            if not content:
                return True
            
            # Remove bold from:
            # - Single words (Hypotenuse, sine, cosine, tangent)
            if len(content.split()) <= 3:
                return False
            
            # - Common terms and ratios
            math_terms = [
                'opposite side', 'adjacent side', 'hypotenuse',
                'sine', 'cosine', 'tangent', 'soh cah toa',
                'pythagorean theorem', 'trigonometric ratios',
                'right triangle', 'acute angle'
            ]
            if content.lower() in math_terms:
                return False
            
            # Keep for longer important statements only
            return True
        
        def _replace_bold(m):
            nonlocal replacements
            content = m.group(1)
            
            if not _should_keep_bold(content):
                replacements += 1
                return content  # Remove bold, keep text
            return m.group(0)  # Keep bold
        
        text = pattern.sub(_replace_bold, text)
    
    return text, replacements


def _remove_excessive_inline_code(text: str, category: str = 'general'):
    """
    Remove backticks from simple standalone numbers and single words in prose.
    
    For ACADEMIC/MATH content: Remove ALMOST ALL backticks (very aggressive)
    - Single letters (x, y, dx, dy) → NO backticks
    - Numbers → NO backticks  
    - Simple variables → NO backticks
    - Only keep for actual programming code (if any)
    
    For TECHNICAL content: More permissive
    - Keep for code examples, functions, syntax
    - Remove from plain numbers and common words
    """
    if not isinstance(text, str) or '`' not in text:
        return text, 0
    
    replacements = 0
    
    # Pattern to match inline code `...`
    pattern = re.compile(r'`([^`\n]+?)`')
    
    def _should_keep_backticks(content: str, before: str = '', after: str = '') -> bool:
        """Determine if backticks should be kept around content."""
        content = content.strip()
        
        # Keep if empty
        if not content:
            return True
        
        # FOR ACADEMIC/MATH CONTENT - BE VERY AGGRESSIVE (remove almost everything)
        if category in ['academic', 'skills']:
            # Only keep if it's clearly programming code:
            # - Contains keywords: function, def, class, return, if, for, while
            programming_keywords = r'\b(function|def|class|return|if|else|for|while|import|const|let|var|public|private)\b'
            if re.search(programming_keywords, content, re.IGNORECASE):
                return True
            
            # - Has programming syntax: function calls with parameters
            if re.search(r'\w+\([^)]*,', content):  # functionName(param, param)
                return True
            
            # - Has array/object access
            if re.search(r'\w+\[\w+\]|\w+\.\w+\(', content):
                return True
            
            # REMOVE EVERYTHING ELSE for academic content:
            # - Single letters (x, y, dx, dy, theta, alpha) → NO backticks
            # - Numbers → NO backticks
            # - Simple math expressions → NO backticks (let the text flow naturally)
            # - Variables → NO backticks
            return False
        
        # FOR TECHNICAL CONTENT - Be selective but not too aggressive
        # Keep if it's a math expression (contains operators)
        if re.search(r'[+\-*/=<>]', content) and len(content) > 3:
            return True
        
        # Keep if it's code-like (function calls with params)
        if re.search(r'\w+\([^)]*,', content):
            return True
        
        # Keep if it's a technical identifier (camelCase, snake_case, dot notation)
        if re.search(r'[a-z][A-Z]|_[a-z]|[a-z]_|\.[a-z]', content):
            return True
        
        # Keep if it's ALL_CAPS (likely a constant)
        if content.isupper() and len(content) > 1:
            return True
        
        # REMOVE if it's just a standalone number
        if re.match(r'^\d{1,5}$', content):
            return False
        
        # REMOVE if it's a simple decimal
        if re.match(r'^\d+\.\d+$', content):
            return False
        
        # REMOVE if it's a single letter or few letters (variables)
        if len(content) <= 3 and content.isalpha():
            return False
        
        # REMOVE if it's a single common word
        common_words = {
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'down', 'out', 'into', 'over', 'under',
            'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
            'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
            'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
            'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just'
        }
        if content.lower() in common_words:
            return False
        
        # Default: keep backticks for everything else
        return True
    
    def _replace(m):
        nonlocal replacements
        content = m.group(1)
        
        # Get surrounding context
        start = max(0, m.start() - 50)
        end = min(len(text), m.end() + 50)
        before = text[start:m.start()]
        after = text[m.end():end]
        
        if not _should_keep_backticks(content, before, after):
            replacements += 1
            return content
        return m.group(0)
    
    text = pattern.sub(_replace, text)
    return text, replacements


def _sanitize_code_fences(text: str, category_hint: str):
    """
    Convert non-code fenced blocks to appropriate format.
    AGGRESSIVE: Convert single-line code blocks to inline code for ALL categories.
    """
    if not isinstance(text, str) or '```' not in text:
        return text, 0

    fence_pattern = re.compile(r'```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```', re.MULTILINE)

    code_keywords = re.compile(
        r'\b(def |class |function |var |let |const |import |export |public |private |'
        r'protected |return |for |while |if\s*\(|else|elif|switch|case|break|continue|'
        r'=>|#include|using namespace|printf\(|System\.|console\.|print\()\b',
        re.IGNORECASE
    )
    
    real_code_langs = {
        "python", "py", "javascript", "js", "typescript", "ts", "java", "c", "cpp", "c++",
        "c#", "cs", "csharp", "go", "rust", "rb", "ruby", "swift", "kotlin", "php", "r",
        "matlab", "octave", "bash", "sh", "shell", "powershell", "ps1", "sql", "html",
        "xml", "json", "yaml", "yml", "toml", "css", "scss", "less", "jsx", "tsx"
    }

    replacements = 0
    
    def _replace(m):
        nonlocal replacements
        lang = (m.group(1) or '').strip().lower()
        body = m.group(2).strip()
        
        lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
        
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
        
        # Keep if language specified and is a real programming language
        if lang and lang in real_code_langs:
            return m.group(0)
        
        # Keep if likely programming code by keywords
        if code_keywords.search(body):
            return m.group(0)
        
        # Otherwise transform to appropriate format
        replacements += 1
        lines = [ln.rstrip() for ln in body.splitlines() if ln.strip()]
        
        if not lines:
            return ""
        
        # Check if content is mathematical/academic
        math_pattern = re.compile(r'^[A-Za-z0-9_θπαβγδεζηλμρσωΔΣΩ().,+\-*/=<>^%\s\\≈°≤≥±√∞∫∑∏]+$')
        is_math = all(math_pattern.match(l) for l in lines if l.strip())
        
        # For ACADEMIC/MATH content: Convert to plain text (no boxes, no backticks)
        if category_hint in ['academic', 'skills'] and is_math:
            # Single line: just return as plain text
            if len(lines) == 1:
                return f"\n{lines[0]}\n"
            # Multiple lines: return as plain text lines
            else:
                return '\n' + '\n'.join(lines) + '\n'
        
        # For other content: use list format if math, blockquotes otherwise
        if is_math and len(lines) <= 5:
            return '\n' + '\n'.join([f"- `{l}`" for l in lines]) + '\n'
        else:
            return '\n' + '\n'.join([f"> {l}" if l.strip() else ">" for l in body.splitlines()]) + '\n'

    new_text = fence_pattern.sub(_replace, text)
    return new_text, replacements


def _clean_indented_blocks(text: str):
    """Handle 4-space/tab indented blocks that aren't meant to be code."""
    if not isinstance(text, str):
        return text, 0
    
    lines = text.splitlines()
    out = []
    i = 0
    reps = 0
    math_pattern = re.compile(r'^[A-Za-z0-9_().,+\-*/=<>^%\s\\]+$')
    
    while i < len(lines):
        line = lines[i]
        
        if line.startswith('    ') or line.startswith('\t'):
            block = []
            while i < len(lines) and (lines[i].startswith('    ') or lines[i].startswith('\t')):
                block.append(lines[i].lstrip(' \t'))
                i += 1
            
            trimmed = [b for b in block if b.strip()]
            
            if trimmed and len(trimmed) <= 10 and all(len(b) <= 60 and math_pattern.match(b) for b in trimmed):
                reps += 1
                out.extend([f"- `{b}`" for b in trimmed])
            else:
                out.extend(['    ' + b for b in block])
            continue
        else:
            out.append(line)
            i += 1
    
    return "\n".join(out), reps
