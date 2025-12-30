"""
Why Explainer Module — "The Why" Explanation Service
=====================================================
A deterministic, line-specific explanation system that explains
WHY a line of code exists in an algorithm.

This is NOT a chatbot. This is a teaching engine.

Key Features:
- Deterministic: Same line → Same explanation (via caching)
- Full code context internally, but explains ONLY the target line
- Structured, non-conversational output
- Production-ready prompts
"""

import os
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime

# Try to import Google Gemini
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    types = None

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# =============================================================================
# SYSTEM PROMPT — "THE WHY" (PRODUCTION READY)
# =============================================================================
WHY_SYSTEM_PROMPT = """You are a senior computer science instructor.

Your task is to explain WHY a specific line of code exists in an algorithm.

Strict rules:
- Explain ONLY the given line.
- Use full code context internally but do NOT explain other lines.
- Match explanation depth to line complexity.
- For simple assignments, give brief, direct intent (1-2 sentences max).
- For simple loops (for/while without AND/OR), give brief purpose (1-2 sentences).
- For control-flow or compound conditions, explain each condition separately.
- Use concrete success and failure examples when relevant.
- Do NOT be conversational or wordy.
- Do NOT ask questions.
- Do NOT mention AI, prompts, or models.
- Output must be structured and concise.

OUTPUT FORMAT:

For SIMPLE lines (assignments, simple operations):
💡 Why this step matters

[1-2 SHORT sentences. Be direct. Example: "This initializes result with the first element, giving the algorithm a starting maximum to compare against."]

For SIMPLE LOOPS (for/while WITHOUT 'and'/'or' in the condition):
💡 Why this step matters

[1-2 SHORT sentences explaining the loop's purpose. Example: "This loop iterates through each element in nums, allowing comparison against the current maximum."]

For SINGLE CONDITION lines (if/elif with one check):
💡 Why this step matters

This line contains a single condition, and it is necessary.

**Condition:** **[exact condition text]**
[What this condition checks]

**Why this condition is required:**
[Brief explanation]

**Failure case:**
Check condition:
```python
[var] [op] [var] → [evaluated] → ❌
```

This means:
- [algorithm decision]
- [what action happens (e.g. skip/continue)]
- [what happens next]

**Success case:**
Check condition:
```python
[var] [op] [var] → [evaluated] → ✅
```

This means:
- [algorithm decision]
- [what action happens]
- [what happens next]

For COMPOUND lines (loops or conditions with multiple checks using 'and'/'or'):
💡 Why this step matters

This line contains [N] conditions, and all are necessary.

**Condition 1:** **[exact condition text]**
[Explain what this condition checks]

**Condition 2:** **[exact condition text]**
[Explain what this condition checks]

**Why all conditions together are required:**
[Explain why they work together]

**Failure case:**
Check condition:
```python
[var] [op] [var] → [evaluated] → ❌
```

This means:
- [algorithm decision]
- [what action happens]
- [what happens next]

**Success case:**
Check condition:
```python
[var] [op] [var] → [evaluated] → ✅
```

This means:
- [algorithm decision]
- [what action happens]
- [what happens next]

RULES:
- Start with "💡 Why this step matters" header
- Use **bold** for condition labels
- Be educational but CONCISE — no fluff
- For simple lines AND simple loops, keep it to 1-2 direct sentences
- ONLY use the compound format when the line has 'and' or 'or' keywords
- Focus on the WHY, not the WHAT
- For Failure/Success cases:
    - ALWAYS start with "**Failure case:**" or "**Success case:**"
    - ALWAYS put "Check condition:" on its own line
    - ALWAYS put the expression inside TRIPLE backticks (```python ... ```) to make it a code block
    - ALWAYS use the bullet list for "This means:"
- NEVER write Failure/Success as paragraphs or essay form
- NEVER use single backticks (`) for individual variables like `n` or `result`
- ONLY use triple backticks for the Check condition code block
- For inline variable mentions in explanations, use plain text or **bold** for emphasis
- Show HOW the algorithm THINKS, not just describe it"""


# =============================================================================
# CACHING LAYER
# =============================================================================
class WhyExplanationCache:
    """
    Hash-based caching for deterministic explanations.
    
    Cache key: hash(source_code + line_number)
    
    This ensures:
    - Same code + same line → same explanation
    - Saves API costs
    - Prevents hallucination drift
    """
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def _generate_key(self, full_code: str, line_number: int) -> str:
        """Generate cache key from code hash + line number."""
        code_hash = hashlib.sha256(full_code.encode('utf-8')).hexdigest()[:16]
        return f"{code_hash}_{line_number}"
    
    def get(self, full_code: str, line_number: int) -> Optional[str]:
        """Get cached explanation if exists."""
        key = self._generate_key(full_code, line_number)
        entry = self._cache.get(key)
        if entry:
            print(f"[WhyCache] HIT: Line {line_number} (key={key[:8]}...)")
            return entry['explanation']
        print(f"[WhyCache] MISS: Line {line_number} (key={key[:8]}...)")
        return None
    
    def set(self, full_code: str, line_number: int, explanation: str) -> None:
        """Cache an explanation only if it's complete (not truncated)."""
        # Don't cache truncated/incomplete responses
        if not explanation or len(explanation) < 200:
            print(f"[WhyCache] SKIPPED (too short - {len(explanation) if explanation else 0} chars): Line {line_number}")
            return
        
        key = self._generate_key(full_code, line_number)
        self._cache[key] = {
            'explanation': explanation,
            'created_at': datetime.utcnow().isoformat(),
            'line_number': line_number
        }
        print(f"[WhyCache] STORED: Line {line_number} ({len(explanation)} chars, key={key[:8]}...)")
    
    def clear(self) -> None:
        """Clear all cached explanations."""
        self._cache.clear()
        print("[WhyCache] CLEARED")


# =============================================================================
# WHY EXPLAINER CLASS
# =============================================================================
class WhyExplainer:
    """
    Generates deterministic 'Why' explanations for specific code lines.
    
    This is the core teaching engine for Phase 1.
    """
    
    def __init__(self):
        self.client = None
        self.is_available = False
        self.cache = WhyExplanationCache()
        
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                self.is_available = True
                print("✓ Why Explainer initialized with Gemini 2.5 Flash")
            except Exception as e:
                print(f"⚠ Why Explainer initialization failed: {e}")
                self.is_available = False
        else:
            print("⚠ GEMINI_API_KEY not found - Why Explainer disabled")
    
    def _detect_line_complexity(self, line_text: str) -> str:
        """
        Detect the complexity type of a line.
        
        Returns: 'simple', 'compound_control', 'loop', 'conditional', 'return'
        """
        line = line_text.strip()
        
        # Compound control flow (while/for with 'and'/'or')
        if ('while ' in line or 'for ' in line) and (' and ' in line or ' or ' in line):
            return 'compound_control'
        
        # Simple loops
        if line.startswith('while ') or line.startswith('for '):
            return 'loop'
        
        # Compound conditionals
        if line.startswith('if ') or line.startswith('elif '):
            if ' and ' in line or ' or ' in line:
                return 'compound_control'
            return 'conditional'
        
        # Return statements
        if line.startswith('return '):
            return 'return'
        
        # Default: simple line
        return 'simple'
    
    def generate_why_explanation(
        self,
        full_code: str,
        line_number: int,
        line_text: str,
        phase: str = "execution",
        sample_input: Optional[Dict[str, Any]] = None,
        problem_type: str = "algorithm",
        function_purpose: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a 'Why' explanation for a specific line.
        
        Args:
            full_code: Complete source code
            line_number: Target line number (1-indexed)
            line_text: Exact text of the line
            phase: Execution phase (e.g., 'initialization', 'filtering', 'merging')
            sample_input: Sample input used in the session
            problem_type: Type of problem (e.g., 'Insert Interval')
            function_purpose: Purpose of the function
        
        Returns:
            {
                'explanation': str,
                'cached': bool,
                'line_number': int,
                'complexity': str
            }
        """
        import time
        request_id = f"{line_number}_{int(time.time() * 1000) % 10000}"
        print(f"\n[Why #{request_id}] ========== REQUEST START ==========")
        print(f"[Why #{request_id}] Line {line_number}: '{line_text[:50]}...' " if len(line_text) > 50 else f"[Why #{request_id}] Line {line_number}: '{line_text}'")
        
        # Check cache first
        cached_explanation = self.cache.get(full_code, line_number)
        if cached_explanation:
            print(f"[Why #{request_id}] ✓ CACHE HIT - returning {len(cached_explanation)} chars")
            return {
                'explanation': cached_explanation,
                'cached': True,
                'line_number': line_number,
                'complexity': self._detect_line_complexity(line_text)
            }
        
        print(f"[Why #{request_id}] CACHE MISS - generating fresh explanation")
        
        # Check if AI is available
        if not self.is_available or not self.client:
            print(f"[Why #{request_id}] ✗ ERROR: AI service unavailable")
            error_msg = "💡 Why this step matters\n\n❌ AI service unavailable. Please check API configuration."
            return {
                'explanation': error_msg,
                'cached': False,
                'line_number': line_number,
                'complexity': 'error'
            }
        
        # Detect complexity
        complexity = self._detect_line_complexity(line_text)
        print(f"[Why #{request_id}] Detected complexity: {complexity}")
        
        # Build user prompt
        prompt = self._build_prompt(
            full_code=full_code,
            line_number=line_number,
            line_text=line_text,
            phase=phase,
            sample_input=sample_input,
            problem_type=problem_type,
            function_purpose=function_purpose,
            complexity=complexity
        )
        
        try:
            # Call Gemini AI
            print(f"[Why #{request_id}] Calling Gemini AI (max_tokens=2500)...")
            start_time = time.time()
            
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=WHY_SYSTEM_PROMPT,
                    temperature=0.1,  # Very low for determinism
                    max_output_tokens=2500,  # Increased for complex multi-condition explanations
                )
            )
            
            elapsed = time.time() - start_time
            explanation = response.text.strip()
            
            print(f"[Why #{request_id}] ✓ AI responded in {elapsed:.2f}s")
            print(f"[Why #{request_id}] Response length: {len(explanation)} chars")
            
            # Warn if response seems truncated
            if len(explanation) < 200:
                print(f"[Why #{request_id}] ⚠️ WARNING: Response seems truncated! Only {len(explanation)} chars")
            
            # Ensure it starts with the header
            if not explanation.startswith('💡'):
                explanation = f"💡 Why this step matters\n\n{explanation}"
            
            # Cache the result (will skip if too short)
            self.cache.set(full_code, line_number, explanation)
            
            print(f"[Why #{request_id}] ========== REQUEST COMPLETE ==========\n")
            
            return {
                'explanation': explanation,
                'cached': False,
                'line_number': line_number,
                'complexity': complexity
            }
            
        except Exception as e:
            elapsed = time.time() - start_time if 'start_time' in dir() else 0
            print(f"[Why #{request_id}] ✗ ERROR after {elapsed:.2f}s: {type(e).__name__}: {str(e)}")
            print(f"[Why #{request_id}] ========== REQUEST FAILED ==========\n")
            error_msg = f"💡 Why this step matters\n\n❌ Error generating explanation: {str(e)}"
            return {
                'explanation': error_msg,
                'cached': False,
                'line_number': line_number,
                'complexity': 'error'
            }
    
    def _build_prompt(
        self,
        full_code: str,
        line_number: int,
        line_text: str,
        phase: str,
        sample_input: Optional[Dict[str, Any]],
        problem_type: str,
        function_purpose: str,
        complexity: str
    ) -> str:
        """Build the user prompt for the AI."""
        
        # Format sample input
        sample_input_str = ""
        if sample_input:
            sample_input_str = "\n".join([f"{k} = {v}" for k, v in sample_input.items()])
        else:
            sample_input_str = "(not provided)"
        
        prompt = f"""Programming language: Python

Problem type: {problem_type}

Function purpose:
{function_purpose if function_purpose else "(Analyze from code)"}

Full source code:
```python
{full_code}
```

Current line:
```python
{line_text}
```

Line number: {line_number}

Execution phase: {phase}

Line complexity: {complexity}

Sample input used in this session:
{sample_input_str}

Explain why this line exists."""
        
        return prompt


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================
_why_explainer = None

def get_why_explainer() -> WhyExplainer:
    """Get the singleton Why Explainer instance."""
    global _why_explainer
    if _why_explainer is None:
        _why_explainer = WhyExplainer()
    return _why_explainer
