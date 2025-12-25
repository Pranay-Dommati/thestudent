"""
Python Code Tracer Engine
==========================
Uses sys.settrace to capture line-by-line execution of Python code.
"""

import sys
import copy
import ast
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import json


@dataclass
class TraceFrame:
    """Represents a single step/frame in code execution."""
    step: int
    line: int
    code: str
    event: str
    locals: Dict[str, Any]
    changed_vars: List[str]
    function_name: Optional[str] = None
    return_value: Optional[Any] = None
    explanation: Optional[str] = None
    
    def to_dict(self) -> dict:
        return asdict(self)


class PythonTracer:
    """Core tracing engine that hooks into Python's execution."""
    
    SAFE_TYPES = (int, float, str, bool, list, tuple, dict, set, type(None))
    MAX_STEPS = 1000
    MAX_STR_LENGTH = 500
    
    def __init__(self):
        self.frames: List[TraceFrame] = []
        self.step_count: int = 0
        self.source_lines: List[str] = []
        self.previous_locals: Dict[str, Any] = {}
        self.active: bool = False
        self.error: Optional[str] = None
        self.code_structure: Dict[str, Any] = {}
        self.inside_target_function: bool = False
        self.target_function_name: Optional[str] = None
        self.target_class_name: Optional[str] = None
        self.function_start_line: int = 0
        self.function_end_line: int = 0
        self.on_frame = None
        # Track for-loop iterations: {line_no: iteration_count}
        self.loop_iterations: Dict[int, int] = {}
        # Store enriched frame dicts for post-processing
        self.frame_dicts: List[Dict] = []
        # Buffer for streaming look-ahead
        self.pending_frame_dict: Optional[Dict] = None
        
    def _safe_copy(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, (int, float, bool)):
            return value
        if isinstance(value, str):
            if len(value) > self.MAX_STR_LENGTH:
                return value[:self.MAX_STR_LENGTH] + "..."
            return value
        if isinstance(value, (list, tuple)):
            return [self._safe_copy(item) for item in value[:50]]
        if isinstance(value, dict):
            return {str(k): self._safe_copy(v) for k, v in list(value.items())[:20]}
        if isinstance(value, set):
            return list(value)[:50]
        try:
            repr_str = repr(value)
            if len(repr_str) > self.MAX_STR_LENGTH:
                return repr_str[:self.MAX_STR_LENGTH] + "..."
            return repr_str
        except:
            return "<unrepresentable>"
    
    def _get_variable_type(self, value: Any) -> str:
        if value is None:
            return "NoneType"
        return type(value).__name__
    
    def _serialize_locals(self, local_vars: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        result = {}
        for name, value in local_vars.items():
            if name.startswith('_') or name.startswith('@'):
                continue
            if name == 'self':
                continue
            if callable(value) or str(type(value)).startswith("<class 'module"):
                continue
            result[name] = {
                "value": self._safe_copy(value),
                "type": self._get_variable_type(value)
            }
        return result
    
    def _detect_changed_vars(self, current_locals: Dict[str, Any]) -> List[str]:
        """Detect which variables changed since the last step (used internally)."""
        changed = []
        serialized_current = self._serialize_locals(current_locals)
        for name, data in serialized_current.items():
            if name not in self.previous_locals:
                changed.append(name)
            elif self.previous_locals[name] != data:
                changed.append(name)
        self.previous_locals = copy.deepcopy(serialized_current)
        return changed
    
    def _predict_changed_vars(self, code_line: str, current_locals: Dict[str, Any]) -> List[str]:
        """Predict which variables THIS line will modify based on code analysis."""
        code = code_line.strip()
        predicted = []
        
        # For loop: `for x in iterable:` - x is the loop variable being set
        for_match = re.match(r'for\s+(\w+)\s+in\s+', code)
        if for_match:
            loop_var = for_match.group(1)
            predicted.append(loop_var)
            return predicted
        
        # Augmented assignment: `x += y`, `x -= y`, etc.
        aug_match = re.match(r'^(\w+)\s*[+\-*/|&^%@]+=', code)
        if aug_match:
            predicted.append(aug_match.group(1))
            return predicted
        
        # Simple assignment: `x = ...` (not ==, !=, <=, >=)
        # Handle multiple targets: `a = b = c = value`
        if '=' in code and '==' not in code and '!=' not in code and '<=' not in code and '>=' not in code:
            # Split on '=' but be careful with walrus operator ':='
            parts = code.split('=')
            if len(parts) >= 2:
                # All parts except the last one are targets
                for i in range(len(parts) - 1):
                    target = parts[i].strip()
                    # Handle tuple unpacking: `a, b = ...`
                    if ',' in target:
                        for var in target.split(','):
                            var = var.strip().lstrip('(').rstrip(')')
                            if var.isidentifier():
                                predicted.append(var)
                    # Handle subscript assignment: `arr[i] = ...` - the array is modified
                    elif '[' in target:
                        base_var = target.split('[')[0].strip()
                        if base_var.isidentifier():
                            predicted.append(base_var)
                    # Simple variable
                    elif target.isidentifier():
                        predicted.append(target)
        
        # Return statement doesn't change variables (but we could mark the return value)
        # If/elif/while conditions don't change variables
        # Function definitions don't change variables at this line
        
        return predicted
    
    def _compute_expected_values(self, code_line: str, current_locals: Dict[str, Any]) -> Dict[str, Any]:
        """Compute the expected NEW values for variables that will be assigned.
        
        This is crucial for showing the RESULT of an operation, not just the inputs.
        We safely evaluate simple arithmetic/comparison expressions.
        """
        computed = {}
        code = code_line.strip()
        
        # Simple assignment: `var = expression`
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            
            # Create a context with current locals
            eval_context = {}
            for name, data in current_locals.items():
                if name.startswith('_'):
                    continue
                val = data.get('value') if isinstance(data, dict) else data
                eval_context[name] = val
            
            # Case 1: Simple variable copy - `current = dummy`
            if expression in eval_context:
                computed[var_name] = self._safe_copy(eval_context[expression])
            
            # Case 2: Attribute access - `val = node.val`
            elif '.' in expression and '(' not in expression and '[' not in expression:
                parts = expression.split('.')
                if len(parts) == 2:
                    obj_name, attr_name = parts
                    if obj_name in eval_context:
                        obj = eval_context[obj_name]
                        if hasattr(obj, attr_name):
                            computed[var_name] = getattr(obj, attr_name)
            
            # Case 3: Array/list indexing - `max_val = nums[0]`
            elif '[' in expression and ']' in expression and '(' not in expression:
                # Match patterns like: arr[0], arr[i], arr[-1]
                index_match = re.match(r'^(\w+)\[(.+)\]$', expression)
                if index_match:
                    arr_name = index_match.group(1)
                    index_expr = index_match.group(2)
                    if arr_name in eval_context:
                        arr = eval_context[arr_name]
                        try:
                            # Try to evaluate the index
                            if index_expr.lstrip('-').isdigit():
                                idx = int(index_expr)
                            elif index_expr in eval_context:
                                idx = eval_context[index_expr]
                            else:
                                idx = eval(index_expr, {"__builtins__": {}}, eval_context)
                            
                            if isinstance(arr, (list, tuple, str)) and -len(arr) <= idx < len(arr):
                                computed[var_name] = self._safe_copy(arr[idx])
                        except:
                            pass
            
            # Case 4: Safe arithmetic expressions
            elif self._is_safe_expression(expression):
                try:
                    result = eval(expression, {"__builtins__": {}}, eval_context)
                    computed[var_name] = self._safe_copy(result)
                except:
                    pass
            
            # Case 5: If the variable already exists (loop iteration), use current value
            # This handles cases like `dummy = ListNode(0)` in a loop
            elif var_name in eval_context:
                computed[var_name] = self._safe_copy(eval_context[var_name])
        
        # Augmented assignment: `var += expr`, `var -= expr`, etc.
        aug_match = re.match(r'^(\w+)\s*([+\-*/|&^%@])=\s*(.+)$', code)
        if aug_match:
            var_name = aug_match.group(1)
            operator = aug_match.group(2)
            expression = aug_match.group(3).strip()
            
            try:
                eval_context = {}
                for name, data in current_locals.items():
                    if name.startswith('_'):
                        continue
                    val = data.get('value') if isinstance(data, dict) else data
                    eval_context[name] = val
                
                if var_name in eval_context and self._is_safe_expression(expression):
                    current_val = eval_context[var_name]
                    expr_val = eval(expression, {"__builtins__": {}}, eval_context)
                    
                    op_map = {
                        '+': lambda a, b: a + b,
                        '-': lambda a, b: a - b,
                        '*': lambda a, b: a * b,
                        '/': lambda a, b: a / b,
                        '%': lambda a, b: a % b,
                    }
                    if operator in op_map:
                        result = op_map[operator](current_val, expr_val)
                        computed[var_name] = self._safe_copy(result)
            except:
                pass
        
        # Handle ternary expressions: var = value if condition else other_value
        ternary_match = re.match(r'^(\w+)\s*=\s*(.+)\s+if\s+(\w+)\s+else\s+(.+)$', code)
        if ternary_match:
            var_name = ternary_match.group(1)
            true_expr = ternary_match.group(2).strip()
            condition_var = ternary_match.group(3).strip()
            false_expr = ternary_match.group(4).strip()
            
            try:
                # Get the condition value
                if condition_var in current_locals:
                    cond_data = current_locals[condition_var]
                    cond_val = cond_data.get('value') if isinstance(cond_data, dict) else cond_data
                    
                    # Determine if condition is truthy
                    is_truthy = bool(cond_val) if cond_val is not None else False
                    
                    if is_truthy:
                        # Evaluate the true branch
                        # Handle attribute access like l2.val
                        if '.' in true_expr:
                            parts = true_expr.split('.')
                            obj_name = parts[0]
                            attr_name = parts[1]
                            if obj_name in current_locals:
                                obj_data = current_locals[obj_name]
                                obj_val = obj_data.get('value') if isinstance(obj_data, dict) else obj_data
                                if hasattr(obj_val, attr_name):
                                    computed[var_name] = getattr(obj_val, attr_name)
                        else:
                            # Simple variable
                            if true_expr in current_locals:
                                data = current_locals[true_expr]
                                computed[var_name] = data.get('value') if isinstance(data, dict) else data
                    else:
                        # Evaluate the false branch (usually 0 or similar)
                        try:
                            computed[var_name] = eval(false_expr, {"__builtins__": {}}, {})
                        except:
                            pass
            except:
                pass
        
        return computed
    
    def _is_safe_expression(self, expr: str) -> bool:
        """Check if an expression is safe to evaluate (no function calls, imports, etc.)"""
        # Disallow dangerous patterns
        dangerous = ['import', 'exec', 'eval', 'open', 'file', 'input', '__', 
                     'lambda', 'class', 'def', 'global', 'nonlocal']
        expr_lower = expr.lower()
        for d in dangerous:
            if d in expr_lower:
                return False
        
        # Allow simple expressions with arithmetic and comparisons
        # Check for function call patterns like `func(` but allow things like `(a + b)`
        # This is a simple heuristic: if there's a word immediately followed by '(' it's likely a function call
        if re.search(r'\b[a-zA-Z_]\w*\s*\(', expr):
            # Exception: allow things like `(x + y)` but not `foo(x)`
            # Check if it's just a parenthesized expression
            if not re.match(r'^\s*\(', expr):
                return False
        
        return True
    
    def _generate_dry_run(self, code_line: str, locals_data: Dict[str, Any], computed_values: Dict[str, Any]) -> List[str]:
        """Generate a deterministic DRY-RUN breakdown.
        
        This is the enterprise fix - we compute the DRY-RUN ourselves,
        don't rely on AI for computation.
        
        Returns a list of lines for the DRY-RUN section.
        """
        code = code_line.strip()
        lines = [code]  # Always start with original code
        
        def get_val(name):
            """Get the actual value from locals, properly formatted."""
            if name in locals_data:
                data = locals_data[name]
                val = data.get('value') if isinstance(data, dict) else data
                return val
            return None
        
        def format_val(val):
            """Format a value for display."""
            if val is None:
                return "None"
            if isinstance(val, bool):
                return str(val)
            if isinstance(val, str):
                return repr(val)
            return str(val)
        
        def is_truthy(val):
            """Check if a value is truthy."""
            try:
                return bool(val)
            except:
                return val is not None
        
        # Handle while/if conditions with or/and
        condition_match = re.match(r'^(while|if|elif)\s+(.+):', code)
        if condition_match:
            keyword = condition_match.group(1)
            condition = condition_match.group(2).strip()
            
            # Split by 'or' or 'and'
            if ' or ' in condition or ' and ' in condition:
                # Parse the condition parts
                parts = re.split(r'\s+(or|and)\s+', condition)
                condition_lines = []
                
                for part in parts:
                    if part in ('or', 'and'):
                        continue
                    part = part.strip()
                    val = get_val(part)
                    if val is not None:
                        truthy = is_truthy(val)
                        mark = "✓" if truthy else "✗"
                        condition_lines.append(f"  {part} = {format_val(val)} {'(truthy)' if truthy else '(falsy)'} {mark}")
                
                if condition_lines:
                    lines = [f"{keyword.capitalize()} condition:"] + condition_lines
                    # Add result
                    if keyword == 'while':
                        lines.append("→ Loop continues" if any('✓' in l for l in condition_lines) else "→ Loop exits")
                    else:
                        lines.append("→ True ✓" if any('✓' in l for l in condition_lines) else "→ False ✗")
            else:
                # Simple condition
                val = get_val(condition)
                if val is not None:
                    truthy = is_truthy(val)
                    mark = "✓" if truthy else "✗"
                    lines.append(f"{condition} = {format_val(val)} {'(truthy)' if truthy else '(falsy)'} {mark}")
            
            return lines
        
        # Handle simple assignments: var = expr
        assign_match = re.match(r'^(\w+)\s*=\s*(.+)$', code)
        if assign_match and '==' not in code:
            var_name = assign_match.group(1)
            expression = assign_match.group(2).strip()
            
            # Substitute variable values in the expression
            substituted = expression
            for name, data in locals_data.items():
                if name in substituted:
                    val = data.get('value') if isinstance(data, dict) else data
                    # Replace whole word only
                    substituted = re.sub(r'\b' + re.escape(name) + r'\b', format_val(val), substituted)
            
            if substituted != expression:
                lines.append(f"{var_name} = {substituted}")
            
            # Add computed result
            if var_name in computed_values:
                result = computed_values[var_name]
                lines.append(f"→ {var_name} = {format_val(result)}")
            
            return lines
        
        # Handle for loops
        for_match = re.match(r'for\s+(\w+)\s+in\s+(.+):', code)
        if for_match:
            loop_var = for_match.group(1)
            val = get_val(loop_var)
            if val is not None:
                lines.append(f"→ {loop_var} = {format_val(val)}")
            return lines
        
        return lines
    
    def _get_code_line(self, line_no: int) -> str:
        if 0 < line_no <= len(self.source_lines):
            return self.source_lines[line_no - 1].rstrip()
        return ""
    
    def _analyze_code_structure(self, code: str) -> None:
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    class_name = node.name
                    self.code_structure['class'] = {
                        'name': class_name,
                        'start_line': node.lineno,
                        'end_line': node.end_lineno or node.lineno
                    }
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            if not item.name.startswith('__'):
                                self.code_structure['main_function'] = {
                                    'name': item.name,
                                    'class': class_name,
                                    'start_line': item.lineno,
                                    'end_line': item.end_lineno or item.lineno,
                                    'body_start': item.body[0].lineno if item.body else item.lineno
                                }
                                self.target_function_name = item.name
                                self.target_class_name = class_name
                                self.function_start_line = item.body[0].lineno if item.body else item.lineno
                                self.function_end_line = item.end_lineno or item.lineno
                                break
                elif isinstance(node, ast.FunctionDef) and 'main_function' not in self.code_structure:
                    if not node.name.startswith('_'):
                        self.code_structure['main_function'] = {
                            'name': node.name,
                            'class': None,
                            'start_line': node.lineno,
                            'end_line': node.end_lineno or node.lineno,
                            'body_start': node.body[0].lineno if node.body else node.lineno
                        }
                        self.target_function_name = node.name
                        self.function_start_line = node.body[0].lineno if node.body else node.lineno
                        self.function_end_line = node.end_lineno or node.lineno
        except SyntaxError:
            pass
    
    def _is_boilerplate_line(self, line_no: int, func_name: str, event: str) -> bool:
        code = self._get_code_line(line_no).strip()
        if not self.code_structure:
            return False
        if code.startswith('class '):
            return True
        if code.startswith('def '):
            return True
        if '= ' in code and '()' in code:
            if self.target_class_name and self.target_class_name + '()' in code:
                return True
        if self.target_function_name and f'.{self.target_function_name}(' in code:
            return True
        if code.startswith('print(') and '_result' in code:
            return True
        if event in ('call', 'return') and func_name == self.target_class_name:
            return True
        if self.target_function_name:
            main_func = self.code_structure.get('main_function', {})
            func_start = main_func.get('body_start', 0)
            func_end = main_func.get('end_line', 0)
            if func_name == '<module>' and not (func_start <= line_no <= func_end):
                return True
        return False
    
    def _should_include_frame(self, line_no: int, func_name: str, event: str) -> bool:
        if self._is_boilerplate_line(line_no, func_name, event):
            return False
        if self.target_function_name and func_name == self.target_function_name:
            if event in ('call', 'return'):
                return False
            return True
        if not self.target_function_name:
            return True
        return False
    
    def _generate_explanation(self, frame: TraceFrame) -> str:
        code = frame.code.strip()
        locals_data = frame.locals
        
        for_match = re.match(r'for\s+(\w+)\s+in\s+(.+):', code)
        if for_match:
            loop_var = for_match.group(1)
            iterable = for_match.group(2).strip()
            if loop_var in locals_data:
                val = locals_data[loop_var]['value']
                return f"Loop iteration: {loop_var} is now {val}"
            return f"Starting loop: iterating {loop_var} through {iterable}"
        
        return_match = re.match(r'return\s+(.+)', code)
        if return_match:
            return_expr = return_match.group(1).strip()
            if return_expr in locals_data:
                val = locals_data[return_expr]['value']
                return f"Returning {return_expr} which is {val}"
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
            if var_name in locals_data:
                val = locals_data[var_name]['value']
                return f"Setting {var_name} = {expression} → {val}"
            return f"Assigning {expression} to {var_name}"
        
        aug_match = re.match(r'^(\w+)\s*([+\-*/])=\s*(.+)$', code)
        if aug_match:
            var_name = aug_match.group(1)
            op = aug_match.group(2)
            expression = aug_match.group(3).strip()
            if var_name in locals_data:
                val = locals_data[var_name]['value']
                return f"Updating {var_name} {op}= {expression} → {var_name} is now {val}"
            return f"Updating {var_name} {op}= {expression}"
            
        if code.startswith('while '):
            return "Checking while loop condition"
        if code.startswith('print('):
            return "Printing output to console"
        if code.startswith('def '):
            return "Defining a function"
        if code.startswith('class '):
            return "Defining a class"
        if frame.event == 'call':
            return f"Calling function '{frame.function_name}'"
        if frame.event == 'return':
            return f"Returning from function '{frame.function_name}'"
        
        return "Executing this line"
    
    def _trace_callback(self, frame, event, arg):
        if self.step_count >= self.MAX_STEPS:
            self.error = f"Execution stopped: exceeded {self.MAX_STEPS} steps (possible infinite loop)"
            return None
            
        code_filename = frame.f_code.co_filename
        if code_filename != '<user_code>':
            return self._trace_callback
        
        line_no = frame.f_lineno
        func_name = frame.f_code.co_name
        
        if not self._should_include_frame(line_no, func_name, event):
            return self._trace_callback
        
        if event == 'line':
            self.step_count += 1
            current_locals = dict(frame.f_locals)
            code_line = self._get_code_line(line_no)
            
            # For for-loops, compute the NEXT value of the loop variable
            loop_info = None
            for_match = re.match(r'for\s+(\w+)\s+in\s+(\w+)', code_line.strip())
            if for_match:
                loop_var = for_match.group(1)
                iterable_name = for_match.group(2)
                
                # Get the iterable from locals
                iterable = current_locals.get(iterable_name)
                if iterable and hasattr(iterable, '__iter__'):
                    try:
                        iterable_list = list(iterable) if not isinstance(iterable, (list, tuple)) else iterable
                        # Track iteration count for this line
                        if line_no not in self.loop_iterations:
                            self.loop_iterations[line_no] = 0
                        iter_idx = self.loop_iterations[line_no]
                        
                        if iter_idx < len(iterable_list):
                            next_value = iterable_list[iter_idx]
                            # Update the loop variable in our serialized locals to show the NEXT value
                            current_locals[loop_var] = next_value
                            loop_info = {
                                'variable': loop_var,
                                'iteration': iter_idx + 1,
                                'value': next_value,
                                'total': len(iterable_list),
                                'finished': False
                            }
                        else:
                            # Loop is exiting - mark as finished
                            loop_info = {
                                'variable': loop_var,
                                'iteration': iter_idx + 1,
                                'value': None,
                                'total': len(iterable_list),
                                'finished': True
                            }
                        self.loop_iterations[line_no] += 1
                    except (TypeError, ValueError):
                        pass
            
            serialized_locals = self._serialize_locals(current_locals)
            
            # Predict what THIS line will change (based on code analysis)
            predicted_changes = self._predict_changed_vars(code_line, current_locals)
            
            # Also track actual changes for internal state (needed for next comparison)
            self._detect_changed_vars(current_locals)
            
            trace_frame = TraceFrame(
                step=self.step_count,
                line=line_no,
                code=code_line,
                event=event,
                locals=serialized_locals,
                changed_vars=predicted_changes,
                function_name=func_name if func_name != '<module>' else None
            )
            
            # Add loop info if this is a for-loop line
            frame_dict = trace_frame.to_dict()
            if loop_info:
                frame_dict['loop_info'] = loop_info
            
            # Compute expected new values for assignments (architectural fix for showing results)
            computed_values = self._compute_expected_values(code_line, serialized_locals)
            if computed_values:
                frame_dict['computed_values'] = computed_values
            
            # Generate deterministic DRY-RUN (enterprise fix - don't rely on AI for computation)
            dry_run_lines = self._generate_dry_run(code_line, serialized_locals, computed_values)
            if dry_run_lines:
                frame_dict['dry_run'] = dry_run_lines
            
            trace_frame.explanation = self._generate_explanation(trace_frame)
            frame_dict['explanation'] = trace_frame.explanation
            
            self.frames.append(trace_frame)
            self.frame_dicts.append(frame_dict)  # Store enriched dict for post-processing

            
            if self.on_frame:
                try:
                    # STREAMING BUFFER LOGIC:
                    # If we have a pending frame, we can now look ahead at the CURRENT frame's locals
                    # (which represent the state AFTER the pending frame executed).
                    if self.pending_frame_dict:
                        pending = self.pending_frame_dict
                        changed_vars = pending.get('changed_vars', [])
                        computed_vals = pending.get('computed_values', {})
                        if computed_vals is None: computed_vals = {}
                        
                        modified_pending = False
                        
                        for var_name in changed_vars:
                            if var_name not in computed_vals and var_name in serialized_locals:
                                next_val = serialized_locals[var_name]
                                val_to_store = None
                                if isinstance(next_val, dict) and 'value' in next_val:
                                    val_to_store = next_val['value']
                                else:
                                    val_to_store = next_val
                                
                                computed_vals[var_name] = val_to_store
                                modified_pending = True
                        
                        if modified_pending:
                            pending['computed_values'] = computed_vals
                            
                        # Send the pending frame now that it's fully enriched
                        self.on_frame(pending)
                    
                    # Store current frame as pending
                    self.pending_frame_dict = frame_dict
                    
                except Exception:
                    # Never break tracing due to callback errors
                    pass
            
        elif event == 'exception':
            self.step_count += 1
            exc_type, exc_value, _ = arg
            trace_frame = TraceFrame(
                step=self.step_count,
                line=line_no,
                code=self._get_code_line(line_no),
                event=event,
                locals=self._serialize_locals(frame.f_locals),
                changed_vars=[],
                function_name=func_name
            )
            trace_frame.explanation = f"Exception: {exc_type.__name__}: {exc_value}"
            self.frames.append(trace_frame)
            if self.on_frame:
                try:
                    self.on_frame(trace_frame.to_dict())
                except Exception:
                    pass
        
        return self._trace_callback
    
    def trace(self, code: str, input_values: Optional[List[str]] = None, on_frame=None) -> Dict[str, Any]:
        self.frames = []
        self.frame_dicts = []  # Reset enriched dicts
        self.step_count = 0
        self.previous_locals = {}
        self.error = None
        self.code_structure = {}
        self.inside_target_function = False
        self.target_function_name = None
        self.target_class_name = None
        self.loop_iterations = {}  # Reset loop tracking
        self.function_start_line = 0
        self.function_end_line = 0
        self.on_frame = on_frame
        self.pending_frame_dict = None  # Reset buffer
        
        self.source_lines = code.split('\n')
        self._analyze_code_structure(code)
        
        from .sandbox import create_sandbox, capture_output
        
        sandbox_globals, sandbox_locals = create_sandbox(input_values)
        output_capture = capture_output()
        
        result = {
            "success": False,
            "frames": [],
            "output": "",
            "error": None,
            "source_lines": self.source_lines
        }
        
        try:
            compiled_code = compile(code, '<user_code>', 'exec')
            
            with output_capture as captured:
                sys.settrace(self._trace_callback)
                try:
                    exec(compiled_code, sandbox_globals, sandbox_globals)
                finally:
                    sys.settrace(None)
                    # Flush pending frame if any
                    if self.pending_frame_dict and self.on_frame:
                         try:
                             self.on_frame(self.pending_frame_dict)
                         except Exception:
                             pass
                         self.pending_frame_dict = None
            
            result["output"] = captured.getvalue()
            result["success"] = True
            
            # POST-PROCESSING: Look ahead to fill in computed_values for variables we couldn't compute
            # This happens when a line creates a new object (e.g., dummy = ListNode(0))
            for i, frame_dict in enumerate(self.frame_dicts):
                # If there are changed_vars without computed values, look ahead
                changed_vars = frame_dict.get('changed_vars', [])
                computed_values = frame_dict.get('computed_values', {})
                if computed_values is None:
                    computed_values = {}
                
                for var_name in changed_vars:
                    if var_name not in computed_values:
                        # Look at the NEXT frame's locals to get the actual value after execution
                        if i + 1 < len(self.frame_dicts):
                            next_locals = self.frame_dicts[i + 1].get('locals', {})
                            
                            # DEBUG LOGGING
                            print(f"[DEBUG] Step {frame_dict.get('step')} ({frame_dict.get('code', '').strip()}): Look-ahead for '{var_name}'")
                            # print(f"   Next locals keys: {list(next_locals.keys())}")
                            
                            if var_name in next_locals:
                                next_val = next_locals[var_name]
                                val_to_store = None
                                if isinstance(next_val, dict) and 'value' in next_val:
                                    val_to_store = next_val['value']
                                else:
                                    val_to_store = next_val
                                    
                                print(f"   FOUND! Value: {val_to_store}")
                                computed_values[var_name] = val_to_store
                            else:
                                print(f"   NOT FOUND in next frame locals")
                
                frame_dict['computed_values'] = computed_values
            
            result["frames"] = self.frame_dicts
            
            if self.error:
                result["error"] = self.error
                
        except SyntaxError as e:
            result["error"] = f"Syntax Error at line {e.lineno}: {e.msg}"
            result["frames"] = self.frame_dicts if self.frame_dicts else [frame.to_dict() for frame in self.frames]
            
        except Exception as e:
            result["error"] = f"{type(e).__name__}: {str(e)}"
            result["frames"] = self.frame_dicts if self.frame_dicts else [frame.to_dict() for frame in self.frames]
            result["success"] = len(self.frame_dicts) > 0 or len(self.frames) > 0
            
        return result


def trace_code(code: str, input_values: Optional[List[str]] = None) -> Dict[str, Any]:
    """Convenience function to trace Python code."""
    tracer = PythonTracer()
    return tracer.trace(code, input_values)
