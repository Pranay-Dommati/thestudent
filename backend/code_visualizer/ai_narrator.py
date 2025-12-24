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
            
            # For while loops with compound conditions, skip AI for clean formatting
            if code.strip().startswith('while ') and (' or ' in code or ' and ' in code):
                return self._generate_basic_narration(
                    step, line, code, event, variables,
                    changed_vars, function_name, return_value, loop_info
                )
            
            # For ternary expressions, skip AI for clean formatting
            if ' if ' in code and ' else ' in code:
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
        
        # While loops - special handling for compound conditions
        while_match = re.match(r'while\s+(.+):', code)
        if while_match:
            condition = while_match.group(1).strip()
            
            # Check if it's a compound condition (contains 'or' or 'and')
            if ' or ' in condition or ' and ' in condition:
                # Parse individual conditions
                if ' or ' in condition:
                    parts = [p.strip() for p in condition.split(' or ')]
                    connector = 'or'
                else:
                    parts = [p.strip() for p in condition.split(' and ')]
                    connector = 'and'
                
                dry_run_lines = ["Loop condition:"]
                any_true = False
                all_true = True
                
                for part in parts:
                    # Evaluate the part
                    val = get_var_value(part)
                    if val is not None:
                        # Direct variable reference
                        if val is None or val == 0 or val == False or val == '' or val == []:
                            dry_run_lines.append(f"  {part} is falsy ✗")
                            all_true = False
                        else:
                            # For ListNode-like objects, show meaningful info
                            if 'ListNode' in str(type(val).__name__) or hasattr(val, 'val'):
                                dry_run_lines.append(f"  {part} is not None ✔")
                            else:
                                dry_run_lines.append(f"  {part} = {val} ✔")
                            any_true = True
                    else:
                        # Check for common patterns like "var != 0" or just variable name
                        if '!=' in part:
                            var, check_val = part.split('!=')
                            var = var.strip()
                            check_val = check_val.strip()
                            actual = get_var_value(var)
                            if actual is not None:
                                is_true = str(actual) != check_val
                                if is_true:
                                    dry_run_lines.append(f"  {var} ≠ {check_val} ✔ ({var}={actual})")
                                    any_true = True
                                else:
                                    dry_run_lines.append(f"  {var} ≠ {check_val} ✗ ({var}={actual})")
                                    all_true = False
                            else:
                                dry_run_lines.append(f"  {part} (unknown)")
                        else:
                            # Assume it's a variable that should be truthy
                            actual = get_var_value(part)
                            if actual is not None:
                                if actual:
                                    if hasattr(actual, 'val'):
                                        dry_run_lines.append(f"  {part} is not None ✔")
                                    else:
                                        dry_run_lines.append(f"  {part} = {actual} ✔")
                                    any_true = True
                                else:
                                    dry_run_lines.append(f"  {part} = {actual} ✗")
                                    all_true = False
                            else:
                                dry_run_lines.append(f"  {part} (checking...)")
                
                # Determine loop outcome
                if connector == 'or':
                    continues = any_true
                else:  # 'and'
                    continues = all_true
                
                if continues:
                    dry_run_lines.append("→ Loop continues")
                    explanation = "At least one condition is true, so the loop continues."
                else:
                    dry_run_lines.append("→ Loop exits")
                    explanation = "All conditions are false, so the loop exits."
                
                return fmt(explanation, dry_run_lines)
            else:
                # Simple while condition
                val = get_var_value(condition)
                if val is not None:
                    if val:
                        return fmt(
                            f"Condition `{condition}` is true, loop continues.",
                            [f"while {condition}:", f"{condition} = {val} → continues"],
                        )
                    else:
                        return fmt(
                            f"Condition `{condition}` is false, loop exits.",
                            [f"while {condition}:", f"{condition} = {val} → exits"],
                        )
                return fmt(
                    f"Checking while loop condition.",
                    [f"while {condition}:"],
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
        
        # Ternary/conditional expression: var = true_val if condition else false_val
        ternary_match = re.match(r'^(\w+)\s*=\s*(.+)\s+if\s+(\w+)\s+else\s+(.+)$', code)
        if ternary_match:
            var_name = ternary_match.group(1)
            true_expr = ternary_match.group(2).strip()
            condition_var = ternary_match.group(3).strip()
            false_expr = ternary_match.group(4).strip()
            
            condition_val = get_var_value(condition_var)
            result_val = get_var_value(var_name)
            
            dry_run_lines = [f"{var_name} = {true_expr} if {condition_var} else {false_expr}"]
            
            if condition_val is not None:
                # Check if it's a ListNode or similar
                if hasattr(condition_val, 'val'):
                    dry_run_lines.append(f"{condition_var} = ListNode (not None)")
                    is_truthy = True
                else:
                    dry_run_lines.append(f"{condition_var} = {repr(condition_val)}")
                    is_truthy = bool(condition_val)
                
                if is_truthy:
                    dry_run_lines.append(f"→ {condition_var} is truthy ✔")
                    dry_run_lines.append(f"→ Taking the 'if' branch: {true_expr}")
                    # Try to get the value of the true expression
                    if '.' in true_expr:
                        # e.g., l1.val
                        parts = true_expr.split('.')
                        obj = get_var_value(parts[0])
                        if obj and hasattr(obj, parts[1]):
                            true_val = getattr(obj, parts[1])
                            dry_run_lines.append(f"→ {true_expr} = {true_val}")
                else:
                    dry_run_lines.append(f"→ {condition_var} is falsy ✗")
                    dry_run_lines.append(f"→ Taking the 'else' branch: {false_expr}")
                
                if result_val is not None:
                    dry_run_lines.append(f"∴ {var_name} = {repr(result_val)}")
                
                explanation = f"`{condition_var}` is {'truthy' if is_truthy else 'falsy'}, so {var_name} gets {'the ' + true_expr if is_truthy else false_expr}."
                return fmt(explanation, dry_run_lines)
            
            if result_val is not None:
                return fmt(
                    f"Conditional assignment to `{var_name}`.",
                    [f"{var_name} = {true_expr} if {condition_var} else {false_expr}", f"{var_name} = {repr(result_val)}"],
                )
            return fmt(
                f"Conditional assignment to `{var_name}`.",
                [f"{var_name} = {true_expr} if {condition_var} else {false_expr}"],
            )
        
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code and '!=' not in code and '<=' not in code and '>=' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            
            # Try to substitute variable values into the expression
            substituted = expression
            for v_name in re.findall(r'\b([a-zA-Z_]\w*)\b', expression):
                v_val = get_var_value(v_name)
                if v_val is not None and isinstance(v_val, (int, float)):
                    substituted = re.sub(rf'\b{v_name}\b', str(v_val), substituted)
            
            # Try to evaluate the substituted expression
            evaluated = None
            if substituted != expression:
                try:
                    # Only evaluate if it's a safe arithmetic expression
                    if re.match(r'^[\d\s\+\-\*\/\%\(\)\.]+$', substituted):
                        evaluated = eval(substituted)
                except:
                    pass
            
            dry_run_lines = [f"{var_name} = {expression}"]
            
            if substituted != expression:
                dry_run_lines.append(f"{var_name} = {substituted}")
            
            if evaluated is not None:
                dry_run_lines.append(f"{var_name} = {evaluated}")
                return fmt(
                    f"Computing `{expression}` and assigning result to `{var_name}`.",
                    dry_run_lines,
                )
            
            val = get_var_value(var_name)
            if val is not None:
                dry_run_lines.append(f"{var_name} = {repr(val)}")
                return fmt(
                    f"Assigning the result of `{expression}` to `{var_name}`.",
                    dry_run_lines,
                )
            return fmt(
                f"Assigning a value to `{var_name}`.",
                dry_run_lines,
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
