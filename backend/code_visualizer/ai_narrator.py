"""
AI Narrator Module using Google Gemini
=======================================
Generates friendly, educational narrations for each step of code execution.
"""

import os
from typing import Dict, List, Any, Optional

# Try to import Google Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

# Get API key from Django settings or environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

NARRATOR_SYSTEM_PROMPT = """You are a coding tutor explaining Python code execution step by step.

CRITICAL: Read the CODE LINE being executed carefully. Explain what THAT specific line does.

For each step, provide:
1. A brief, accurate explanation of what the line does (1-2 sentences)
2. A DRY-RUN showing actual values being used

IMPORTANT RULES:
- Look at the actual code line and explain what IT does
- Use the variable values provided in the context
- For assignments like `x = expression`, explain we're assigning the RESULT to x
- For conditions, show the comparison with actual values and the result (True/False)
- For loops, show the current loop variable value
- Keep explanations SHORT and focused

FORMAT:

For assignments (e.g., max_val = nums[0]):
"[What this line does - assigning to the LEFT side variable]

DRY-RUN:
max_val = nums[0]
max_val = [actual value of nums[0]]"

For conditions (if/elif):
"[What we're checking]

DRY-RUN:
[condition with variable names]
[condition with actual values]
[True/False] → [what happens]"

For loops (for n in items):
"[Loop iteration description]

DRY-RUN:
n = [current value]"

For return:
"[What we're returning]

DRY-RUN:
return [expression]
return [actual value] ✓"

NEVER describe the wrong variable. The LEFT side of = is what's being assigned TO."""


class AINarrator:
    """Generates AI-powered narrations for code execution steps."""
    
    def __init__(self):
        self.model = None
        self.is_available = False
        
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            try:
                self.model = genai.GenerativeModel(
                    model_name='gemini-2.0-flash',
                    system_instruction=NARRATOR_SYSTEM_PROMPT
                )
                self.is_available = True
                print("✓ AI Narrator initialized with Gemini 2.0 Flash")
            except Exception as e:
                print(f"⚠ AI Narrator initialization failed: {e}")
                self.is_available = False
        else:
            print("⚠ GEMINI_API_KEY not found or google-generativeai not installed - AI narration disabled")
    
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
        full_source: Optional[List[str]] = None
    ) -> str:
        if not self.is_available or not self.model:
            return self._generate_basic_narration(
                step, line, code, event, variables, 
                changed_vars, function_name, return_value
            )
        
        try:
            code_line = code.strip()
            context_parts = [
                f"CURRENT LINE TO EXPLAIN: {code_line}",
                f"Step {step}, Line {line}",
            ]
            
            if function_name and function_name != '<module>':
                context_parts.append(f"Inside function: {function_name}")
            
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
            prompt += f"\n\nExplain what the line `{code_line}` does with these values. Include DRY-RUN:"
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.5,
                    max_output_tokens=200,
                )
            )
            
            narration = response.text.strip()
            narration = narration.strip('"\'')
            if narration.startswith('Narration:'):
                narration = narration[10:].strip()
            
            return narration
            
        except Exception as e:
            print(f"[AI Narrator] ERROR: {type(e).__name__}: {e}")
            return self._generate_basic_narration(
                step, line, code, event, variables,
                changed_vars, function_name, return_value
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
        return_value: Any = None
    ) -> str:
        import re
        code = code.strip()
        
        def get_var_value(var_name):
            if var_name in variables:
                data = variables[var_name]
                return data['value'] if isinstance(data, dict) else data
            return None
        
        if event == 'call':
            return f"Calling function '{function_name}'"
        if event == 'return':
            if return_value is not None:
                return f"Returning {return_value} from '{function_name}'"
            return f"Returning from '{function_name}'"
        if event == 'exception':
            return f"An error occurred at this line"
        
        for_match = re.match(r'for\s+(\w+)\s+in\s+(.+):', code)
        if for_match:
            loop_var = for_match.group(1)
            iterable = for_match.group(2).strip()
            val = get_var_value(loop_var)
            if val is not None:
                return f"Loop iteration: {loop_var} is now {val}"
            return f"Starting loop: iterating {loop_var} through {iterable}"
        
        return_match = re.match(r'return\s+(.+)', code)
        if return_match:
            return_expr = return_match.group(1).strip()
            val = get_var_value(return_expr)
            if val is not None:
                return f"Returning {return_expr} which equals {val}"
            return f"Returning {return_expr}"
        
        if_match = re.match(r'(if|elif)\s+(.+):', code)
        if if_match:
            condition = if_match.group(2).strip()
            return f"Checking condition: {condition}"
            
        if code.strip() == 'else:':
            return "Entering else branch"
        
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code and '!=' not in code and '<=' not in code and '>=' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            val = get_var_value(var_name)
            if val is not None:
                return f"Setting {var_name} = {expression} → {val}"
            return f"Assigning {expression} to {var_name}"
        
        aug_match = re.match(r'^(\w+)\s*([+\-*/])=\s*(.+)$', code)
        if aug_match:
            var_name = aug_match.group(1)
            op = aug_match.group(2)
            expression = aug_match.group(3).strip()
            val = get_var_value(var_name)
            if val is not None:
                return f"Updating {var_name} {op}= {expression} → {var_name} is now {val}"
            return f"Updating {var_name} {op}= {expression}"
        
        if code.startswith('while '):
            return "Checking the while loop condition"
        if code.startswith('print('):
            return "Printing output to console"
        if code.startswith('def '):
            return "Defining a function"
        if code.startswith('class '):
            return "Defining a class"
        
        return "Executing this line"


# Singleton instance
_narrator = None

def get_narrator() -> AINarrator:
    """Get the singleton AI narrator instance."""
    global _narrator
    if _narrator is None:
        _narrator = AINarrator()
    return _narrator
