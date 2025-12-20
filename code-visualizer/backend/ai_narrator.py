"""
AI Narrator Module using Google Gemini 2.5 Pro
===============================================
Generates friendly, educational narrations for each step of code execution.
This is what makes the visualization feel like a guided video tutorial.

The narrator explains:
- What line is being executed
- Current variable states
- Logic decisions being made
- Loop iterations
- Function calls and returns
"""

import os
import json
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Google Gemini API
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# System prompt for the AI narrator
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

EXAMPLES:

Line: `max_val = nums[0]` with nums=[4,6], max_val will be 4:
"Initializing max_val with the first element of nums.

DRY-RUN:
max_val = nums[0]
max_val = 4"

Line: `if n > max_val:` with n=6, max_val=4:
"Checking if current element is greater than our maximum.

DRY-RUN:
n > max_val
6 > 4
True → updating max_val"

Line: `for n in nums:` with n=4, nums=[4,6]:
"Iterating through the list.

DRY-RUN:
n = 4 (first element)"

Line: `return max_val` with max_val=6:
"Returning the maximum value found.

DRY-RUN:
return max_val
return 6 ✓"

NEVER describe the wrong variable. The LEFT side of = is what's being assigned TO."""


class AINarrator:
    """
    Generates AI-powered narrations for code execution steps.
    Uses Google Gemini 2.5 Pro for natural language generation.
    """
    
    def __init__(self):
        self.model = None
        self.is_available = False
        
        if GEMINI_API_KEY:
            try:
                # Use Gemini 2.0 Flash (latest fast model)
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
            print("⚠ GEMINI_API_KEY not found - AI narration disabled")
    
    def _format_variables(self, variables: Dict[str, Any]) -> str:
        """Format variables for the prompt in a readable way."""
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
    
    def _format_changed_vars(self, changed: List[str], variables: Dict[str, Any]) -> str:
        """Format which variables changed and their new values."""
        if not changed:
            return "No variables changed"
        
        parts = []
        for var_name in changed:
            if var_name in variables:
                data = variables[var_name]
                if isinstance(data, dict) and 'value' in data:
                    parts.append(f"{var_name} → {data['value']}")
                else:
                    parts.append(f"{var_name} → {data}")
            else:
                parts.append(f"{var_name} (new)")
        
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
        """
        Generate a friendly narration for a single execution step.
        
        Args:
            step: Step number in execution
            line: Line number being executed
            code: The actual code on this line
            event: Event type (line, call, return, exception)
            variables: Current local variables
            changed_vars: Variables that changed in this step
            function_name: Name of current function (if any)
            return_value: Return value (for return events)
            full_source: Full source code lines for context
            
        Returns:
            A friendly narration string
        """
        if not self.is_available or not self.model:
            # Fallback to basic narration
            print(f"[AI Narrator] Fallback mode - is_available: {self.is_available}, model: {self.model is not None}")
            return self._generate_basic_narration(
                step, line, code, event, variables, 
                changed_vars, function_name, return_value
            )
        
        try:
            # Build the context for Gemini - be very explicit about the code line
            code_line = code.strip()
            
            context_parts = [
                f"CURRENT LINE TO EXPLAIN: {code_line}",
                f"Step {step}, Line {line}",
            ]
            
            if function_name and function_name != '<module>':
                context_parts.append(f"Inside function: {function_name}")
            
            # Format variables clearly
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
            
            print(f"[AI Narrator] Step {step} - Generating AI narration for line {line}: {code_line[:50]}...")
            
            # Call Gemini API
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.5,  # Lower temperature for more consistent output
                    max_output_tokens=200,
                )
            )
            
            narration = response.text.strip()
            print(f"[AI Narrator] Success - Got response: {narration[:80]}...")
            
            # Clean up any markdown or quotes that might slip through
            narration = narration.strip('"\'')
            if narration.startswith('Narration:'):
                narration = narration[10:].strip()
            
            return narration
            
        except Exception as e:
            print(f"[AI Narrator] ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to basic narration on error
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
        """
        Generate a basic narration without AI (fallback).
        Parses the actual code to describe what's happening.
        """
        import re
        code = code.strip()
        
        # Helper to get variable value
        def get_var_value(var_name):
            if var_name in variables:
                data = variables[var_name]
                return data['value'] if isinstance(data, dict) else data
            return None
        
        # Handle different event types
        if event == 'call':
            return f"Calling function '{function_name}'"
        
        if event == 'return':
            if return_value is not None:
                return f"Returning {return_value} from '{function_name}'"
            return f"Returning from '{function_name}'"
        
        if event == 'exception':
            return f"An error occurred at this line"
        
        # Handle for loops - extract loop variable and show current value
        for_match = re.match(r'for\s+(\w+)\s+in\s+(.+):', code)
        if for_match:
            loop_var = for_match.group(1)
            iterable = for_match.group(2).strip()
            val = get_var_value(loop_var)
            if val is not None:
                return f"Loop iteration: {loop_var} is now {val}"
            return f"Starting loop: iterating {loop_var} through {iterable}"
        
        # Handle return statements
        return_match = re.match(r'return\s+(.+)', code)
        if return_match:
            return_expr = return_match.group(1).strip()
            val = get_var_value(return_expr)
            if val is not None:
                return f"Returning {return_expr} which equals {val}"
            return f"Returning {return_expr}"
        
        # Handle if/elif conditions
        if_match = re.match(r'(if|elif)\s+(.+):', code)
        if if_match:
            keyword = if_match.group(1)
            condition = if_match.group(2).strip()
            return f"Checking condition: {condition}"
            
        # Handle else branch
        if code.strip() == 'else:':
            return "Entering else branch"
        
        # Handle assignments (but not ==, !=, <=, >=)
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code and '!=' not in code and '<=' not in code and '>=' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            val = get_var_value(var_name)
            if val is not None:
                return f"Setting {var_name} = {expression} → {val}"
            return f"Assigning {expression} to {var_name}"
        
        # Handle augmented assignments (+=, -=, etc.)
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
    
    def generate_batch_narrations(
        self,
        frames: List[Dict[str, Any]],
        source_lines: List[str]
    ) -> List[str]:
        """
        Generate narrations for multiple frames efficiently.
        Uses batch processing for better performance.
        
        Args:
            frames: List of trace frames
            source_lines: Full source code lines
            
        Returns:
            List of narration strings
        """
        narrations = []
        
        for frame in frames:
            narration = self.generate_narration(
                step=frame.get('step', 0),
                line=frame.get('line', 0),
                code=frame.get('code', ''),
                event=frame.get('event', 'line'),
                variables=frame.get('locals', {}),
                changed_vars=frame.get('changed_vars', []),
                function_name=frame.get('function_name'),
                return_value=frame.get('return_value'),
                full_source=source_lines
            )
            narrations.append(narration)
        
        return narrations


# Singleton instance
_narrator = None

def get_narrator() -> AINarrator:
    """Get the singleton AI narrator instance."""
    global _narrator
    if _narrator is None:
        _narrator = AINarrator()
    return _narrator


def generate_narration(frame: Dict[str, Any], source_lines: List[str] = None) -> str:
    """
    Convenience function to generate narration for a single frame.
    
    Args:
        frame: A trace frame dictionary
        source_lines: Optional full source code
        
    Returns:
        Narration string
    """
    narrator = get_narrator()
    return narrator.generate_narration(
        step=frame.get('step', 0),
        line=frame.get('line', 0),
        code=frame.get('code', ''),
        event=frame.get('event', 'line'),
        variables=frame.get('locals', {}),
        changed_vars=frame.get('changed_vars', []),
        function_name=frame.get('function_name'),
        return_value=frame.get('return_value'),
        full_source=source_lines
    )


# For testing
if __name__ == "__main__":
    narrator = AINarrator()
    
    # Test frame
    test_frame = {
        "step": 5,
        "line": 7,
        "code": "            if num > max_val:",
        "event": "line",
        "locals": {
            "nums": {"value": [3, 1, 4, 1, 5, 9, 2, 6], "type": "list"},
            "max_val": {"value": 3, "type": "int"},
            "num": {"value": 4, "type": "int"}
        },
        "changed_vars": ["num"],
        "function_name": "findMax"
    }
    
    test_source = [
        "from typing import List",
        "",
        "class Solution:",
        "    def findMax(self, nums: List[int]) -> int:",
        "        max_val = nums[0]",
        "        for num in nums:",
        "            if num > max_val:",
        "                max_val = num",
        "        return max_val"
    ]
    
    narration = narrator.generate_narration(
        step=test_frame["step"],
        line=test_frame["line"],
        code=test_frame["code"],
        event=test_frame["event"],
        variables=test_frame["locals"],
        changed_vars=test_frame["changed_vars"],
        function_name=test_frame["function_name"],
        full_source=test_source
    )
    
    print("Test narration:")
    print(narration)
