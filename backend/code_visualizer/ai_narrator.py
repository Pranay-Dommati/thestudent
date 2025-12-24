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

NARRATOR_SYSTEM_PROMPT = """You are a coding tutor giving MINIMAL, value-specific explanations.

FORMAT (follow EXACTLY):

[One short sentence with actual values]

🔍 DRY-RUN:
[original code]
[code with values substituted]

RULES:
1. Explanation is ONE sentence only - short and clear
2. Use ACTUAL VALUES from the variables provided (e.g., "8 > 5" not "n > max_val")
3. NO markdown formatting (no ```, no **, no code blocks)
4. The DRY-RUN section has ONLY the code lines, nothing else after
5. Keep it minimal - students should understand in 2 seconds

EXAMPLES:

For `max_val = nums[0]` with nums=[5,2,8,1]:
"Setting max_val to nums[0], which is 5.

🔍 DRY-RUN:
max_val = nums[0]
max_val = 5"

For `if n > max_val:` with n=8, max_val=5:
"Checking if 8 > 5. True, so we enter the if-block.

🔍 DRY-RUN:
if n > max_val:
if 8 > 5: True"

For `for n in nums:` with n=2, nums=[5,2,8,1]:
"Loop iteration: n takes value 2.

🔍 DRY-RUN:
for n in nums:
n = 2"

NEVER add text after the DRY-RUN code lines. Keep everything minimal."""


class AINarrator:
    """Generates AI-powered narrations for code execution steps."""
    
    def __init__(self):
        self.client = None
        self.is_available = False
        
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                self.is_available = True
                print("✓ AI Narrator initialized with Gemini 2.0 Flash")
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
        loop_info: Optional[Dict[str, Any]] = None
    ) -> str:
        if not self.is_available or not self.client:
            return self._generate_basic_narration(
                step, line, code, event, variables, 
                changed_vars, function_name, return_value, loop_info
            )
        
        try:
            code_line = code.strip()
            context_parts = [
                f"CURRENT LINE TO EXPLAIN: {code_line}",
                f"Step {step}, Line {line}",
            ]
            
            if function_name and function_name != '<module>':
                context_parts.append(f"Inside function: {function_name}")
            
            # For for-loops, skip AI entirely - use our visual pointer format
            if loop_info:
                # Use the basic narration which now has the visual pointer
                return self._generate_basic_narration(
                    step, line, code, event, variables,
                    changed_vars, function_name, return_value, loop_info
                )
            
            if variables:
                var_list = []
                for name, data in variables.items():
                    if isinstance(data, dict) and 'value' in data:
                        var_list.append(f"  {name} = {data['value']} ({data.get('type', 'unknown')})")
                    else:
                        var_list.append(f"  {name} = {data}")
                context_parts.append("Current variable values:\n" + "\n".join(var_list))
            
            if event == 'return' and return_value is not None:
                context_parts.append(f"Return value: {return_value}")
            
            prompt = "\n".join(context_parts)
            prompt += f"\n\nExplain `{code_line}` in ONE sentence using the values above. No markdown. Include DRY-RUN with code substitution:"
            
            # Debug logging - shows exactly what we send and receive
            print(f"[AI Narrator] PROMPT:\n{prompt[:200]}...")
            
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=NARRATOR_SYSTEM_PROMPT,
                    temperature=0.5,
                    max_output_tokens=200,
                )
            )
            
            narration = response.text.strip()
            print(f"[AI Narrator] RESPONSE:\n{narration[:200]}...")
            
            narration = narration.strip('"\'')
            if narration.startswith('Narration:'):
                narration = narration[10:].strip()

            # Check if response has proper DRY-RUN format
            import re
            if not re.search(r"DRY\s*-?\s*RUN\s*:", narration, re.IGNORECASE):
                print(f"[AI Narrator] WARNING: Response missing DRY-RUN, using template")
                return self._generate_basic_narration(
                    step, line, code, event, variables,
                    changed_vars, function_name, return_value, loop_info
                )
            
            return narration
            
        except Exception as e:
            print(f"[AI Narrator] ERROR: {type(e).__name__}: {e}")
            return self._generate_basic_narration(
                step, line, code, event, variables,
                changed_vars, function_name, return_value, loop_info
            )
    
    def _generate_basic_narration(
        self,
        step: int,
        line: int,
        code: str,
        event: str,
        variables: Dict[str, Any],
        changed_vars: List[str],
        function_name: Optional[str] = None,
        return_value: Any = None,
        loop_info: Optional[Dict[str, Any]] = None
    ) -> str:
        import re
        code = code.strip()

        def fmt(explanation: str, dry_run_lines: List[str]) -> str:
            dry_run = "\n".join(dry_run_lines).strip()
            if dry_run:
                return f"{explanation}\n\nDRY-RUN:\n{dry_run}"
            return f"{explanation}\n\nDRY-RUN:\n"
        
        def get_var_value(var_name):
            if var_name in variables:
                data = variables[var_name]
                return data['value'] if isinstance(data, dict) else data
            return None
        
        if event == 'call':
            name = function_name or "<function>"
            return fmt(
                f"Calling function `{name}`.",
                [f"{name}(...)"],
            )
        if event == 'return':
            if return_value is not None:
                name = function_name or "<function>"
                return fmt(
                    f"Returning from `{name}`.",
                    [f"return {repr(return_value)} ✓"],
                )
            name = function_name or "<function>"
            return fmt(
                f"Returning from `{name}`.",
                ["return ..."],
            )
        if event == 'exception':
            return fmt(
                "An error occurred while executing this line.",
                [code],
            )
        
        # For loops - use loop_info if available for accurate values
        for_match = re.match(r'for\s+(\w+)\s+in\s+(.+):', code)
        if for_match:
            loop_var = for_match.group(1)
            iterable_name = for_match.group(2).strip()
            
            if loop_info:
                finished = loop_info.get('finished', False)
                if finished:
                    total = loop_info.get('total', '?')
                    return fmt(
                        f"Loop complete - processed all {total} elements.",
                        [f"for {loop_var} in {iterable_name}: ✓ done"],
                    )
                
                iteration = loop_info.get('iteration', 1)
                total = loop_info.get('total', '?')
                val = loop_info.get('value')
                
                # Try to get the iterable to create a visual pointer
                iterable_val = get_var_value(iterable_name)
                if iterable_val and isinstance(iterable_val, (list, tuple)):
                    # Create visual representation with pointer
                    # Format: [5, 2, 8, 1]
                    #             ^
                    #             n = 2
                    elements = [str(x) for x in iterable_val]
                    arr_str = "[" + ", ".join(elements) + "]"
                    
                    # Calculate pointer position (iteration is 1-indexed)
                    idx = iteration - 1
                    if 0 <= idx < len(elements):
                        # Calculate position: "[" + elements before + ", " separators
                        pos = 1  # Start after "["
                        for i in range(idx):
                            pos += len(elements[i]) + 2  # element + ", "
                        # Pointer should be at start of element
                        
                        pointer_line = " " * pos + "↑"
                        var_line = " " * pos + f"{loop_var}={val}"
                        
                        return fmt(
                            f"Iteration {iteration}/{total}: {loop_var} takes value {val}.",
                            [arr_str, pointer_line, var_line],
                        )
                
                # Fallback if we can't get the iterable
                return fmt(
                    f"Iteration {iteration}/{total}: {loop_var} = {val}.",
                    [f"for {loop_var} in {iterable_name}:", f"{loop_var} = {val}"],
                )
            
            val = get_var_value(loop_var)
            if val is not None:
                return fmt(
                    f"Loop iteration: {loop_var} = {val}.",
                    [f"for {loop_var} in {iterable_name}:", f"{loop_var} = {val}"],
                )
            return fmt(
                f"Starting loop over `{iterable_name}`.",
                [f"for {loop_var} in {iterable_name}:"],
            )
        
        return_match = re.match(r'return\s+(.+)', code)
        if return_match:
            return_expr = return_match.group(1).strip()
            val = get_var_value(return_expr)
            if val is not None:
                return fmt(
                    "Returning a value from this function.",
                    [f"return {return_expr}", f"return {repr(val)} ✓"],
                )
            return fmt(
                "Returning a value from this function.",
                [f"return {return_expr}"],
            )
        
        if_match = re.match(r'(if|elif)\s+(.+):', code)
        if if_match:
            condition = if_match.group(2).strip()
            return fmt(
                "Checking whether the condition is true.",
                [condition, "(evaluated by Python)"],
            )
            
        if code.strip() == 'else:':
            return fmt(
                "Entering the else branch.",
                ["else:"],
            )
        
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code and '!=' not in code and '<=' not in code and '>=' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            val = get_var_value(var_name)
            if val is not None:
                return fmt(
                    f"Assigning the result of `{expression}` to `{var_name}`.",
                    [f"{var_name} = {expression}", f"{var_name} = {repr(val)}"],
                )
            return fmt(
                f"Assigning a value to `{var_name}`.",
                [f"{var_name} = {expression}"],
            )
        
        aug_match = re.match(r'^(\w+)\s*([+\-*/])=\s*(.+)$', code)
        if aug_match:
            var_name = aug_match.group(1)
            op = aug_match.group(2)
            expression = aug_match.group(3).strip()
            val = get_var_value(var_name)
            if val is not None:
                return fmt(
                    f"Updating `{var_name}` using `{op}=`.",
                    [f"{var_name} {op}= {expression}", f"{var_name} = {repr(val)}"],
                )
            return fmt(
                f"Updating `{var_name}` using `{op}=`.",
                [f"{var_name} {op}= {expression}"],
            )
        
        if code.startswith('while '):
            return fmt(
                "Checking the while-loop condition.",
                [code],
            )
        if code.startswith('print('):
            return fmt(
                "Printing output to the console.",
                [code],
            )
        if code.startswith('def '):
            return fmt(
                "Defining a function.",
                [code],
            )
        if code.startswith('class '):
            return fmt(
                "Defining a class.",
                [code],
            )
        
        return fmt(
            "Executing this line.",
            [code] if code else [],
        )


# Singleton instance
_narrator = None

def get_narrator() -> AINarrator:
    """Get the singleton AI narrator instance."""
    global _narrator
    if _narrator is None:
        _narrator = AINarrator()
    return _narrator
