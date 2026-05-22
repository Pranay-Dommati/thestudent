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
3. For empty strings, EXPLICITLY show "" (e.g., return "", s = "")
4. For comparisons (like i < n), show the evaluated result (True/False), NOT truthy/falsy of individual variables
5. NO markdown (no ```, no **, no code blocks)
6. Be concise but complete

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
                print("[SUCCESS] AI Narrator initialized with Gemini 2.5 Flash")
            except Exception as e:
                print(f"[WARNING] AI Narrator initialization failed: {e}")
                self.is_available = False
        else:
            print("[INFO] GEMINI_API_KEY not found or google-genai not installed - AI narration disabled")
    
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
        std_inputs: Optional[List[str]] = None,
        state_before: Optional[Dict[str, Any]] = None,
        state_after: Optional[Dict[str, Any]] = None
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
            finished = loop_info.get('finished', False)
            
            # print(f"[AI DEBUG] Step {step}: loop_info received = {loop_info}")
            # print(f"[AI DEBUG]   finished = {finished}")
            
            if finished:
                context_parts.append(f"LOOP STATUS: Loop COMPLETE after {total} iterations. This is the exit check - loop is ending.")
            else:
                context_parts.append(f"LOOP STATUS: Iteration {iter_num}/{total}. Loop variable '{var}' = {val}.")

        # Add User Inputs info
        if std_inputs and len(std_inputs) > 0:
            context_parts.append(f"Available User Inputs (stdin): {std_inputs}")
            if "input(" in code_line:
                 context_parts.append("NOTE: This line calls input(). Use the provided User Inputs for the value.")
        
        # Build detailed variable context for DRY-RUN substitution
        # CRITICAL: Use state_before if available - these are the values BEFORE this line executes
        # This ensures dry-run shows correct substitution (e.g., k=2 for "k += 1" → "k = 2 + 1 → 3")
        
        # DEBUG: Log what we received
        print(f"[AI NARRATOR] Step {step}, Code: {code_line[:40]}")
        print(f"[AI NARRATOR]   state_before: {state_before is not None} ({len(state_before) if state_before else 0} vars)")
        print(f"[AI NARRATOR]   state_after: {state_after is not None} ({len(state_after) if state_after else 0} vars)")
        
        substitution_vars = state_before if state_before else {}
        
        # Fall back to variables if state_before is empty (first frame or non-streaming)
        if not substitution_vars and variables:
            print(f"[AI NARRATOR]   FALLBACK to variables!")
            # Extract values from variables dict
            for name, data in variables.items():
                if isinstance(data, dict) and 'value' in data:
                    substitution_vars[name] = data['value']
                else:
                    substitution_vars[name] = data
        
        if substitution_vars:
            var_list = []
            for name, val in substitution_vars.items():
                var_type = type(val).__name__ if val is not None else "NoneType"
                # Simplified: just show the value and type, no truthy/falsy (often misleading)
                var_list.append(f"  {name} = {val} (type: {var_type})")
            context_parts.append("VARIABLES FOR SUBSTITUTION (before this line executes):\n" + "\n".join(var_list))
        else:
            context_parts.append("VARIABLES FOR SUBSTITUTION: (none)")
        
        if event == 'return' and return_value is not None:
            context_parts.append(f"RETURN VALUE: {return_value}")
        
        # Add STATE TRANSITION context (deterministic data from tracer)
        if state_before or state_after:
            context_parts.append("\n=== STATE TRANSITION (VERIFIED BY RUNTIME) ===")
            if state_before:
                before_str = ", ".join([f"{k}={v}" for k, v in state_before.items()])
                context_parts.append(f"BEFORE: {before_str}")
            if state_after:
                after_str = ", ".join([f"{k}={v}" for k, v in state_after.items()])
                context_parts.append(f"AFTER: {after_str}")
            # Show what changed
            if state_before and state_after:
                changes = []
                for var, after_val in state_after.items():
                    before_val = state_before.get(var)
                    if before_val != after_val:
                        if before_val is None:
                            changes.append(f"{var}: (new) → {after_val}")
                        else:
                            changes.append(f"{var}: {before_val} → {after_val}")
                if changes:
                    context_parts.append(f"CHANGES: {'; '.join(changes)}")
        
        prompt = "\n".join(context_parts)
        prompt += f"\n\n=== TASK: Explain this code line ===\nCode: `{code_line}`"
        prompt += "\n\n=== INSTRUCTIONS ==="
        prompt += "\n1. Write ONE clear sentence explaining what this line does."
        prompt += "\n2. Then write a DRY-RUN section that shows:"
        prompt += "\n   - Original code"
        prompt += "\n   - Substitution of variables with actual values"
        prompt += "\n   - Final result with → arrow"
        prompt += "\n"
        prompt += "\nFORMAT:"
        prompt += "\n[Explanation sentence]"
        prompt += "\n"
        prompt += "\n🔍 DRY-RUN:"
        prompt += "\n[code with variables substituted]"
        prompt += "\n→ [result]"
        prompt += "\n"
        prompt += "\nRULES:"
        prompt += "\n- Use ONLY the values from 'VARIABLES FOR SUBSTITUTION' for substitution - these are the BEFORE values!"
        prompt += "\n- The STATE TRANSITION shows BEFORE → AFTER, use BEFORE values in your substitution"
        prompt += "\n- Show clear step-by-step substitution"
        prompt += "\n- For loops: If LOOP STATUS says 'COMPLETE', say 'Loop has completed - exiting' (NOT 'continuing to next iteration')"
        prompt += "\n- For loops: If LOOP STATUS shows iteration X/Y, say 'Iteration X of Y'"
        prompt += "\n- For conditionals: show 'condition → True/False'"
        
        # ===== DETAILED LOGGING =====
        # print("=" * 60)
        # print(f"[AI Narrator] STEP {step} | LINE {line}")
        # print(f"[AI Narrator] CODE: {code_line}")
        # print(f"[AI Narrator] VARIABLES: {list(variables.keys()) if variables else 'none'}")
        # print(f"[AI Narrator] FULL PROMPT:\n{prompt}")
        # print("=" * 60)
        
        # ===== CALL AI - NO TRY/EXCEPT =====
        # If this fails, we WANT to see the error
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=NARRATOR_SYSTEM_PROMPT,
                temperature=0.1,  # Very low for consistent format
                max_output_tokens=1000,  # Increased for complex dry-runs
            )
        )
        
        narration = response.text.strip()
        
        # ===== LOG RESPONSE =====
        # print(f"[AI Narrator] RESPONSE:\n{narration}")
        # print("=" * 60)
        
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
