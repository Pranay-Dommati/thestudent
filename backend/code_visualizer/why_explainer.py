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
# SYSTEM PROMPT — "THE WHY" (STRUCTURED BLOCKS - ENTERPRISE GRADE)
# =============================================================================
WHY_SYSTEM_PROMPT = """You are a senior computer science instructor.

Your task is to explain WHY a specific line of code exists in an algorithm.

RESPONSE FORMAT:
You MUST respond with a valid JSON object containing an array of "blocks".
Each block has a "type" and "content" field.

Block types:
- "heading": Section headers (e.g., "Why this step matters")
- "text": Plain explanatory text (NO code syntax, NO variables, NO operators)
- "code": Any code, variable names, conditions, operators (e.g., "while i <= 5", "max_val", "n > 0")
- "list": Array of bullet points

EXAMPLE RESPONSE:
{
  "blocks": [
    {"type": "heading", "content": "💡 Why this step matters"},
    {"type": "text", "content": "This line controls how long the loop runs."},
    {"type": "code", "content": "while i <= 5"},
    {"type": "text", "content": "The loop continues as long as the condition is true."},
    {"type": "list", "items": ["Initializes at 1", "Increments each iteration", "Stops when exceeding 5"]}
  ]
}

CRITICAL RULES:
1. ALL major code logic/conditions MUST go in type="code" blocks
   - Examples: "while i <= 5", "max_val = 0"
2. "text" blocks contain plain English explanations
   - You MAY use **bold** for emphasis
   - You MAY use `backticks` for inline variable mentions (e.g. "The variable `i` is...")
   - Do NOT use LaTeX or math notation
3. Keep blocks granular - do not put huge paragraphs in one text block
4. Keep responses concise - 3-6 blocks maximum for simple lines

RESPONSE DEPTH BY LINE TYPE:
- Simple assignments: 2-3 blocks (heading + 1-2 text/code)
- Simple loops: 3-4 blocks 
- Conditions with if/elif: 4-6 blocks with success/failure explanation
- Compound conditions: 5-8 blocks explaining each part

Always start with: {"type": "heading", "content": "💡 Why this step matters"}

Respond with ONLY the JSON object, no other text."""


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
            # Note: Cached responses are legacy markdown format, so blocks is empty/null
            return {
                'blocks': None,  # Indicates frontend should use legacy 'explanation'
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
                    max_output_tokens=2500,
                )
            )
            
            elapsed = time.time() - start_time
            raw_response = response.text.strip()
            
            print(f"[Why #{request_id}] ✓ AI responded in {elapsed:.2f}s")
            print(f"[Why #{request_id}] Response length: {len(raw_response)} chars")
            
            # Parse JSON response
            blocks = None
            try:
                # Try to extract JSON from response (handle potential markdown wrapping)
                json_text = raw_response
                if '```json' in json_text:
                    json_text = json_text.split('```json')[1].split('```')[0].strip()
                elif '```' in json_text:
                    json_text = json_text.split('```')[1].split('```')[0].strip()
                
                import json
                try:
                    # Attempt 1: Standard parsers
                    parsed = json.loads(json_text)
                    if isinstance(parsed, dict) and 'blocks' in parsed:
                        blocks = parsed['blocks']
                    elif isinstance(parsed, list):
                        blocks = parsed
                    else:
                        # Valid JSON but not what we expected
                        blocks = [parsed] if 'content' in parsed else []
                    print(f"[Why #{request_id}] ✓ Parsed {len(blocks)} structured blocks")
                except json.JSONDecodeError:
                    # Attempt 2: Handle NDJSON (JSON Lines) or multiple objects
                    blocks = []
                    lines = json_text.splitlines()
                    for line in lines:
                        line = line.strip()
                        if line.startswith('{') and line.endswith('}'):
                            try:
                                blocks.append(json.loads(line))
                            except:
                                continue
                    
                    if not blocks:
                         raise ValueError("Could not extract blocks from JSON")

            except (json.JSONDecodeError, IndexError, KeyError, ValueError) as parse_error:
                print(f"[Why #{request_id}] ⚠️ JSON parse failed: {parse_error}")
                print(f"[Why #{request_id}] Falling back to legacy text format")
                # Fallback: wrap raw response as a single text block
                blocks = [
                    {"type": "heading", "content": "💡 Why this step matters"},
                    {"type": "text", "content": raw_response}
                ]
            
            # Build result with both structured blocks AND legacy explanation for backwards compatibility
            legacy_explanation = self._blocks_to_markdown(blocks)
            
            # Cache the result
            self.cache.set(full_code, line_number, legacy_explanation)
            
            print(f"[Why #{request_id}] ========== REQUEST COMPLETE ==========\n")
            
            return {
                'blocks': blocks,  # NEW: Structured blocks for enterprise rendering
                'explanation': legacy_explanation,  # LEGACY: For backwards compatibility
                'cached': False,
                'line_number': line_number,
                'complexity': complexity
            }
            
        except Exception as e:
            elapsed = time.time() - start_time if 'start_time' in dir() else 0
            print(f"[Why #{request_id}] ✗ ERROR after {elapsed:.2f}s: {type(e).__name__}: {str(e)}")
            print(f"[Why #{request_id}] ========== REQUEST FAILED ==========\n")
            error_blocks = [
                {"type": "heading", "content": "💡 Why this step matters"},
                {"type": "text", "content": f"❌ Error generating explanation: {str(e)}"}
            ]
            return {
                'blocks': error_blocks,
                'explanation': f"💡 Why this step matters\n\n❌ Error generating explanation: {str(e)}",
                'cached': False,
                'line_number': line_number,
                'complexity': 'error'
            }
    
    def _blocks_to_markdown(self, blocks: list) -> str:
        """Convert structured blocks to legacy markdown for backwards compatibility."""
        if not blocks:
            return ""
        
        parts = []
        for block in blocks:
            block_type = block.get('type', 'text')
            content = block.get('content', '')
            
            if block_type == 'heading':
                parts.append(content)
                parts.append("")  # Empty line after heading
            elif block_type == 'text':
                parts.append(content)
            elif block_type == 'code':
                # Wrap code in backticks for legacy markdown
                parts.append(f"`{content}`")
            elif block_type == 'list':
                items = block.get('items', [])
                for item in items:
                    parts.append(f"• {item}")
            elif block_type == 'math':
                # Wrap math in dollar signs for KaTeX
                parts.append(f"${content}$")
        
        return "\n".join(parts)
    
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
