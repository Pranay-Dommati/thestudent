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
    MAX_STR_LENGTH = 100
    
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
            
            trace_frame.explanation = self._generate_explanation(trace_frame)
            frame_dict['explanation'] = trace_frame.explanation
            
            self.frames.append(trace_frame)
            if self.on_frame:
                try:
                    self.on_frame(frame_dict)
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
            
            result["output"] = captured.getvalue()
            result["success"] = True
            result["frames"] = [frame.to_dict() for frame in self.frames]
            
            if self.error:
                result["error"] = self.error
                
        except SyntaxError as e:
            result["error"] = f"Syntax Error at line {e.lineno}: {e.msg}"
            result["frames"] = [frame.to_dict() for frame in self.frames]
            
        except Exception as e:
            result["error"] = f"{type(e).__name__}: {str(e)}"
            result["frames"] = [frame.to_dict() for frame in self.frames]
            result["success"] = len(self.frames) > 0
            
        return result


def trace_code(code: str, input_values: Optional[List[str]] = None) -> Dict[str, Any]:
    """Convenience function to trace Python code."""
    tracer = PythonTracer()
    return tracer.trace(code, input_values)
