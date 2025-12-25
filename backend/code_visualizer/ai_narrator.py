"""
AI Narrator Module using Google Gemini
=======================================
Generates friendly, educational narrations for each step of code execution.
"""

import os
from typing import Dict, List, Any, Optional

# Try to import Google Gemini (new package)
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    types = None

# Get API key from Django settings or environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

NARRATOR_SYSTEM_PROMPT = """You are a coding tutor explaining code execution step-by-step.

FORMAT (follow EXACTLY - no deviations):

[One clear sentence explaining what happens with ACTUAL VALUES]

🔍 DRY-RUN:
[original code line]
[substitute ALL variables with their actual values]
→ [final result with computed value]

CRITICAL RULES:
1. ALWAYS substitute variable names with their ACTUAL values
2. ALWAYS compute and show the final result with → arrow
3. For truthy/falsy checks, show the actual value and whether it's truthy/falsy
4. NO markdown (no ```, no **, no code blocks)
5. Be concise but complete

═══════════════════════════════════════════════════════════
EXAMPLE 1: Simple Assignment
═══════════════════════════════════════════════════════════
Code: `total = val1 + val2 + carry`
Variables: val1=2, val2=5, carry=0

OUTPUT:
Computing total by adding val1 (2), val2 (5), and carry (0).

🔍 DRY-RUN:
total = val1 + val2 + carry
total = 2 + 5 + 0
→ total = 7

═══════════════════════════════════════════════════════════
EXAMPLE 2: Integer Division
═══════════════════════════════════════════════════════════
Code: `carry = total // 10`
Variables: total=7

OUTPUT:
Computing carry as 7 integer-divided by 10.

🔍 DRY-RUN:
carry = total // 10
carry = 7 // 10
→ carry = 0

═══════════════════════════════════════════════════════════
EXAMPLE 3: While Loop with OR Conditions
═══════════════════════════════════════════════════════════
Code: `while l1 or l2 or carry:`
Variables: l1=[2→4→3], l2=[5→6→4], carry=0

OUTPUT:
Checking loop condition: at least one of l1, l2, or carry must be truthy.

🔍 DRY-RUN:
while l1 or l2 or carry:
  l1 = [2→4→3] (truthy) ✓
  l2 = [5→6→4] (truthy) ✓  
  carry = 0 (falsy) ✗
→ Condition is True (l1 and l2 are truthy), loop continues

═══════════════════════════════════════════════════════════
EXAMPLE 4: Ternary/Conditional Expression
═══════════════════════════════════════════════════════════
Code: `val1 = l1.val if l1 else 0`
Variables: l1=[2→4→3] (with l1.val=2)

OUTPUT:
Since l1 is truthy, val1 gets l1.val which is 2.

🔍 DRY-RUN:
val1 = l1.val if l1 else 0
l1 = [2→4→3] (truthy) ✓
→ Taking 'if' branch: val1 = 2

═══════════════════════════════════════════════════════════
EXAMPLE 5: If Condition
═══════════════════════════════════════════════════════════
Code: `if n > max_val:`
Variables: n=8, max_val=5

OUTPUT:
Checking if 8 > 5, which is True, so we enter the if-block.

🔍 DRY-RUN:
if n > max_val:
if 8 > 5:
→ True ✓ (entering if-block)

═══════════════════════════════════════════════════════════
EXAMPLE 6: For Loop
═══════════════════════════════════════════════════════════
Code: `for n in nums:`
Variables: n=2, nums=[5,2,8,1]

OUTPUT:
Loop iteration: n takes the value 2.

🔍 DRY-RUN:
for n in nums:
→ n = 2

═══════════════════════════════════════════════════════════

CRITICAL - DO NOT:
- Say "I cannot execute" or "I don't have" - you ALWAYS have the variables!
- Skip the DRY-RUN section
- Skip the → result line
- Use markdown code blocks
- Refuse or explain limitations

YOU MUST ALWAYS:
1. Write one explanation sentence
2. Include 🔍 DRY-RUN: header
3. Show the code with values substituted
4. End with → and the computed result

The variables are provided to you - USE THEM to compute the result."""


class AINarrator:
    """Generates AI-powered narrations for code execution steps."""
    
    def __init__(self):
        self.client = None
        self.is_available = False
        
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                self.is_available = True
                print("✓ AI Narrator initialized with Gemini 2.5 Flash")
            except Exception as e:
                print(f"⚠ AI Narrator initialization failed: {e}")
                self.is_available = False
        else:
            print("⚠ GEMINI_API_KEY not found or google-genai not installed - AI narration disabled")
    
    def _format_variables(self, variables: Dict[str, Any]) -> str:
        if not variables:
            return "No variables yet"
        parts = []
        for name, data in variables.items():
            if isinstance(data, dict) and 'value' in data:
                value = data['value']
                var_type = data.get('type', 'unknown')
                parts.append(f"{name} = {value} ({var_type})")
            else:
                parts.append(f"{name} = {data}")
        return ", ".join(parts)
    
    def generate_narration(
        self,
        step: int,
        line: int,
        code: str,
        event: str,
        variables: Dict[str, Any],
        changed_vars: List[str],
        function_name: Optional[str] = None,
        return_value: Any = None,
        full_source: Optional[List[str]] = None,
        loop_info: Optional[Dict[str, Any]] = None,
        std_inputs: Optional[List[str]] = None
    ) -> str:
        """Generate AI narration. NO FALLBACKS - errors are shown clearly."""
        import re
        code_line = code.strip()
        
        # ===== CHECK 1: Is AI available? =====
        if not self.is_available:
            error_msg = f"❌ AI UNAVAILABLE: Gemini client not initialized. Check GEMINI_API_KEY."
            print(f"[AI Narrator] {error_msg}")
            return f"{error_msg}\n\n🔍 DRY-RUN:\n{code_line}\n→ [AI unavailable]"
        
        if not self.client:
            error_msg = f"❌ AI CLIENT NULL: Gemini client is None."
            print(f"[AI Narrator] {error_msg}")
            return f"{error_msg}\n\n🔍 DRY-RUN:\n{code_line}\n→ [AI client null]"
        
        # ===== BUILD CONTEXT =====
        context_parts = [
            f"CODE TO EXPLAIN: `{code_line}`",
            f"Step {step}, Line {line}",
        ]
        
        # Add Full Source context
        if full_source and len(full_source) > 0:
            # Show a few lines around the current line for better context
            start = max(0, line - 3)
            end = min(len(full_source), line + 2)
            context_code = []
            for i in range(start, end):
                prefix = "->" if i + 1 == line else "  "
                context_code.append(f"{prefix} {i+1}: {full_source[i]}")
            context_parts.append("CONTEXT:\n" + "\n".join(context_code))
            
        if function_name and function_name != '<module>':
            context_parts.append(f"Inside function: {function_name}")
        
        # Add loop info if present
        if loop_info:
            iter_num = loop_info.get('iteration')
            total = loop_info.get('total')
            val = loop_info.get('value')
            var = loop_info.get('variable')
            context_parts.append(f"LOOP STATUS: Iteration {iter_num}/{total}. Loop variable '{var}' = {val}.")

        # Add User Inputs info
        if std_inputs and len(std_inputs) > 0:
            context_parts.append(f"Available User Inputs (stdin): {std_inputs}")
            if "input(" in code_line:
                 context_parts.append("NOTE: This line calls input(). Use the provided User Inputs for the value.")
        
        # Build detailed variable context
        if variables:
            var_list = []
            for name, data in variables.items():
                if isinstance(data, dict) and 'value' in data:
                    val = data['value']
                    var_type = data.get('type', 'unknown')
                    # Determine truthy/falsy
                    try:
                        is_truthy = bool(val) if val is not None else False
                    except:
                        is_truthy = val is not None
                    truthy_str = "truthy" if is_truthy else "falsy"
                    var_list.append(f"  {name} = {val} (type: {var_type}, {truthy_str})")
                else:
                    var_list.append(f"  {name} = {data}")
            context_parts.append("CURRENT VARIABLES:\n" + "\n".join(var_list))
        else:
            context_parts.append("CURRENT VARIABLES: (none)")
        
        if event == 'return' and return_value is not None:
            context_parts.append(f"RETURN VALUE: {return_value}")
        
        prompt = "\n".join(context_parts)
        prompt += f"\n\n=== TASK: Explain this code line ===\nCode: `{code_line}`"
        prompt += "\n\n=== INSTRUCTIONS ==="
        prompt += "\nWrite ONE clear sentence explaining what this line does."
        prompt += "\n- Use the actual variable values provided above."
        prompt += "\n- For LOOPS: State 'Iteration X/Y' and the loop variable value from LOOP STATUS."
        prompt += "\n- Do NOT generate a dry-run section (it's handled separately)."
        prompt += "\n- Keep it simple and educational."
        
        # ===== DETAILED LOGGING =====
        print("=" * 60)
        print(f"[AI Narrator] STEP {step} | LINE {line}")
        print(f"[AI Narrator] CODE: {code_line}")
        print(f"[AI Narrator] VARIABLES: {list(variables.keys()) if variables else 'none'}")
        print(f"[AI Narrator] FULL PROMPT:\n{prompt}")
        print("=" * 60)
        
        # ===== CALL AI - NO TRY/EXCEPT =====
        # If this fails, we WANT to see the error
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=NARRATOR_SYSTEM_PROMPT,
                temperature=0.1,  # Very low for consistent format
                max_output_tokens=500,
            )
        )
        
        narration = response.text.strip()
        
        # ===== LOG RESPONSE =====
        print(f"[AI Narrator] RESPONSE:\n{narration}")
        print("=" * 60)
        
        # Clean up response
        narration = narration.strip('"\'')
        if narration.startswith('Narration:'):
            narration = narration[10:].strip()
        
        # NOTE: DRY-RUN is now generated by tracer (SSOT architecture)
        # AI only provides explanation text, no validation needed
        
        return narration


# Singleton instance
_narrator = None

def get_narrator() -> AINarrator:
    """Get the singleton AI narrator instance."""
    global _narrator
    if _narrator is None:
        _narrator = AINarrator()
    return _narrator
