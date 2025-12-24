"""
Code Visualizer Views
=====================
Django views for code execution tracing and visualization.
Migrated from FastAPI backend.
"""

import json
import ast
import re
import time
import threading
import queue
from typing import List, Optional

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .tracer import trace_code
from .sandbox import validate_code
from .ai_narrator import get_narrator


# Initialize narrator
narrator = get_narrator()


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint."""
    return JsonResponse({
        "status": "healthy",
        "service": "Code Visualizer API (Django)",
        "version": "3.0.0",
        "ai_narrator": narrator.is_available if narrator else False
    })


@csrf_exempt
@require_http_methods(["POST"])
def execute_code(request):
    """Execute and trace Python code."""
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        inputs = data.get('inputs', [])
        code_type = data.get('codeType', 'script')
        function_name = data.get('functionName')
        class_name = data.get('className')
        input_types = data.get('inputTypes', [])
        
        final_code = prepare_execution_code(code, code_type, function_name, class_name, inputs, input_types)
        result = trace_code(final_code, inputs if code_type == "script" else [])
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def detect_inputs(request):
    """Detect inputs required by the code."""
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        
        if not code.strip():
            return JsonResponse({"hasInputs": False, "inputs": [], "count": 0})
        
        inputs = []
        lines = code.split('\n')
        code_type = "script"
        function_name = None
        class_name = None
        method_params = []
        
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return JsonResponse({
                "hasInputs": False, 
                "inputs": [], 
                "count": 0, 
                "error": f"Syntax error: {e.msg}"
            })
        
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.ClassDef):
                class_name = node.name
                code_type = "class"
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and not item.name.startswith('__'):
                        function_name = item.name
                        for arg in item.args.args:
                            if arg.arg != 'self':
                                param_type, param_label = detect_param_type(arg)
                                method_params.append({
                                    "name": arg.arg, 
                                    "type": param_type, 
                                    "label": param_label, 
                                    "line": item.lineno
                                })
                        break
                break
            elif isinstance(node, ast.FunctionDef) and not node.name.startswith('__'):
                function_name = node.name
                code_type = "function"
                for arg in node.args.args:
                    param_type, param_label = detect_param_type(arg)
                    method_params.append({
                        "name": arg.arg, 
                        "type": param_type, 
                        "label": param_label, 
                        "line": node.lineno
                    })
                break
        
        if method_params:
            for param in method_params:
                inputs.append({
                    "id": len(inputs), 
                    "line": param["line"], 
                    "prompt": "", 
                    "variable": param["name"], 
                    "label": param["label"], 
                    "type": param["type"], 
                    "isParameter": True
                })
        
        # Also detect input() calls
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
                line_no = node.lineno
                prompt = ""
                variable = None
                
                if node.args:
                    arg = node.args[0]
                    if isinstance(arg, ast.Constant):
                        prompt = str(arg.value)
                    elif hasattr(ast, 'Str') and isinstance(arg, ast.Str):
                        prompt = arg.s
                
                if line_no <= len(lines):
                    line_text = lines[line_no - 1].strip()
                    match = re.match(r'^(\w+)\s*=\s*(?:int|float|str)?\s*\(?\s*input', line_text)
                    if match:
                        variable = match.group(1)
                
                if prompt:
                    label = prompt.rstrip(': ')
                elif variable:
                    label = f"Value for '{variable}'"
                else:
                    label = f"Input {len(inputs) + 1}"
                
                inputs.append({
                    "id": len(inputs), 
                    "line": line_no, 
                    "prompt": prompt, 
                    "variable": variable, 
                    "label": label, 
                    "type": detect_input_type(lines[line_no - 1] if line_no <= len(lines) else ""), 
                    "isParameter": False
                })
        
        return JsonResponse({
            "hasInputs": len(inputs) > 0, 
            "inputs": inputs, 
            "count": len(inputs), 
            "codeType": code_type, 
            "functionName": function_name, 
            "className": class_name
        })
    except Exception as e:
        return JsonResponse({"hasInputs": False, "inputs": [], "count": 0, "error": str(e)})


def detect_param_type(arg):
    """Detect parameter type from AST annotation."""
    param_type = "any"
    param_label = arg.arg
    
    if arg.annotation:
        annotation = ast.unparse(arg.annotation) if hasattr(ast, 'unparse') else str(arg.annotation)
        if 'List[int]' in annotation or 'list' in annotation.lower():
            param_type = "list_int"
            param_label = f"{arg.arg} (List of integers, e.g., 1,2,3,4,5)"
        elif 'List[str]' in annotation:
            param_type = "list_str"
            param_label = f"{arg.arg} (List of strings)"
        elif 'int' in annotation.lower():
            param_type = "integer"
            param_label = f"{arg.arg} (Integer)"
        elif 'str' in annotation.lower():
            param_type = "text"
            param_label = f"{arg.arg} (String)"
        elif 'float' in annotation.lower():
            param_type = "float"
            param_label = f"{arg.arg} (Float)"
    
    return param_type, param_label


def detect_input_type(line):
    """Detect input type from code line."""
    line_lower = line.lower()
    if 'int(input' in line_lower:
        return 'integer'
    elif 'float(input' in line_lower:
        return 'float'
    elif 'eval(input' in line_lower:
        return 'expression'
    elif 'list' in line_lower or 'split' in line_lower:
        return 'list'
    else:
        return 'text'


def parse_input_values(input_values, input_types):
    """Parse input values based on their types.
    
    Handles both:
    - String values (from manual input modal)
    - Native Python types (from auto-generation)
    """
    parsed = []
    for i, value in enumerate(input_values):
        input_type = input_types[i] if i < len(input_types) else "any"
        
        # If value is already a native Python type (from auto-generator), format it directly
        if isinstance(value, list):
            # Already a list - format for Python
            if all(isinstance(x, (int, float)) for x in value):
                parsed.append(f"[{', '.join(map(str, value))}]")
            else:
                # List of strings or mixed
                formatted_items = []
                for item in value:
                    if isinstance(item, str):
                        formatted_items.append(f'"{item}"')
                    else:
                        formatted_items.append(str(item))
                parsed.append(f"[{', '.join(formatted_items)}]")
            continue
        elif isinstance(value, bool):
            parsed.append("True" if value else "False")
            continue
        elif isinstance(value, int):
            parsed.append(str(value))
            continue
        elif isinstance(value, float):
            parsed.append(str(value))
            continue
        elif isinstance(value, dict):
            # Format dict for Python
            items = []
            for k, v in value.items():
                k_str = f'"{k}"' if isinstance(k, str) else str(k)
                v_str = f'"{v}"' if isinstance(v, str) else str(v)
                items.append(f"{k_str}: {v_str}")
            parsed.append("{" + ", ".join(items) + "}")
            continue
        elif value is None:
            parsed.append("None")
            continue
        
        # String value (from manual input) - parse based on type
        if not isinstance(value, str):
            # Fallback: convert to string
            value = str(value)
            
        if input_type in ["list_int", "list"]:
            value = value.strip()
            items = value.split(',') if ',' in value else value.split()
            try:
                int_items = [int(x) for x in items if x]
                parsed.append(f"[{', '.join(map(str, int_items))}]")
            except ValueError:
                str_items = [f'\"{x}\"' for x in items if x]
                parsed.append(f"[{', '.join(str_items)}]")
        elif input_type == "list_str":
            value = value.strip()
            items = value.split(',') if ',' in value else value.split()
            str_items = [f'\"{x}\"' for x in items if x]
            parsed.append(f"[{', '.join(str_items)}]")
        elif input_type == "integer":
            try:
                parsed.append(str(int(value)))
            except ValueError:
                parsed.append("0")
        elif input_type == "float":
            try:
                parsed.append(str(float(value)))
            except ValueError:
                parsed.append("0.0")
        elif input_type == "text":
            parsed.append(f'\"{value}\"')
        else:
            value = value.strip()
            try:
                int(value)
                parsed.append(value)
            except ValueError:
                try:
                    float(value)
                    parsed.append(value)
                except ValueError:
                    if ',' in value or (value and value[0].isdigit() and ' ' in value):
                        items = [v.strip() for v in value.replace(',', ' ').split()]
                        try:
                            int_items = [int(x) for x in items if x]
                            parsed.append(f"[{', '.join(map(str, int_items))}]")
                        except ValueError:
                            parsed.append(f'\"{value}\"')
                    else:
                        parsed.append(f'\"{value}\"')
    return parsed


def prepare_execution_code(code, code_type, function_name, class_name, inputs, input_types):
    """Append driver code to execute functions/classes with inputs."""
    if code_type == "script":
        return code
    
    param_values = parse_input_values(inputs, input_types)
    args = ", ".join(param_values)
    driver = ""
    
    if code_type == "class" and class_name and function_name:
        driver = f"\n\n# Driver Code\n_solution_instance = {class_name}()\n_result = _solution_instance.{function_name}({args})\nprint(_result)"
    elif code_type == "function" and function_name:
        driver = f"\n\n# Driver Code\n_result = {function_name}({args})\nprint(_result)"
    
    if driver:
        return code + driver
    return code


@csrf_exempt
@require_http_methods(["POST"])
def trace_endpoint(request):
    """Trace code execution (non-streaming)."""
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        inputs = data.get('inputs', [])
        code_type = data.get('codeType', 'script')
        function_name = data.get('functionName')
        class_name = data.get('className')
        input_types = data.get('inputTypes', [])
        
        executable_code = prepare_execution_code(code, code_type, function_name, class_name, inputs, input_types)
        result = trace_code(executable_code, inputs if code_type == "script" else [])
        
        if narrator and narrator.is_available and result.get('success') and result.get('frames'):
            source_lines = result.get('source_lines', [])
            for frame in result['frames']:
                ai_narration = narrator.generate_narration(
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
                frame['explanation'] = ai_narration
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def trace_stream(request):
    """Stream trace frames as Server-Sent Events."""
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        inputs = data.get('inputs', [])
        code_type = data.get('codeType', 'script')
        function_name = data.get('functionName')
        class_name = data.get('className')
        input_types = data.get('inputTypes', [])
        
        def generate_frames():
            """Generator that yields SSE messages as frames are produced."""
            executable_code = prepare_execution_code(code, code_type, function_name, class_name, inputs, input_types)
            source_lines = executable_code.splitlines()
            frame_queue: "queue.Queue" = queue.Queue()
            done_event = threading.Event()

            # Send metadata immediately so the frontend can show "starting" state
            yield f"data: {json.dumps({'type': 'metadata', 'codeType': code_type, 'functionName': function_name, 'className': class_name, 'aiNarrator': (narrator.is_available if narrator else False)})}\n\n"

            def maybe_add_ai_narration(frame_dict):
                if not (narrator and narrator.is_available):
                    return
                try:
                    ai_narration = narrator.generate_narration(
                        step=frame_dict.get('step', 0),
                        line=frame_dict.get('line', 0),
                        code=frame_dict.get('code', ''),
                        event=frame_dict.get('event', 'line'),
                        variables=frame_dict.get('locals', {}),
                        changed_vars=frame_dict.get('changed_vars', []),
                        function_name=frame_dict.get('function_name'),
                        return_value=frame_dict.get('return_value'),
                        full_source=source_lines,
                        loop_info=frame_dict.get('loop_info')
                    )
                    if ai_narration:
                        frame_dict['explanation'] = ai_narration
                except Exception:
                    # If narration fails, keep the tracer's existing explanation.
                    return

            def on_frame(frame_dict):
                # frame_dict is already JSON-serializable
                maybe_add_ai_narration(frame_dict)
                frame_queue.put({'type': 'frame', 'frame': frame_dict})

            result_holder = {'result': None, 'error': None}

            def worker():
                try:
                    from .tracer import PythonTracer
                    tracer = PythonTracer()

                    result = tracer.trace(
                        executable_code,
                        inputs if code_type == "script" else [],
                        on_frame=on_frame
                    )
                    result_holder['result'] = result
                except Exception as e:
                    result_holder['error'] = str(e)
                finally:
                    done_event.set()

            t = threading.Thread(target=worker, daemon=True)
            t.start()

            frame_index = 0
            while True:
                try:
                    item = frame_queue.get(timeout=0.25)
                except queue.Empty:
                    if done_event.is_set():
                        break
                    continue

                if item.get('type') == 'frame':
                    frame = item['frame']
                    yield f"data: {json.dumps({'type': 'frame', 'index': frame_index, 'frame': frame})}\n\n"
                    frame_index += 1

            if result_holder['error']:
                yield f"data: {json.dumps({'type': 'error', 'error': result_holder['error']})}\n\n"
                return

            result = result_holder['result'] or {}
            if not result.get('success'):
                yield f"data: {json.dumps({'type': 'error', 'error': result.get('error', 'Unknown error')})}\n\n"
                return

            # Send completion message with output (if any)
            yield f"data: {json.dumps({'type': 'complete', 'totalFrames': frame_index, 'output': result.get('output', '')})}\n\n"
        
        response = StreamingHttpResponse(
            generate_frames(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_code_endpoint(request):
    """Validate code for security issues."""
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        is_valid, error = validate_code(code)
        return JsonResponse({"valid": is_valid, "error": error})
    except Exception as e:
        return JsonResponse({"valid": False, "error": str(e)})


@csrf_exempt
@require_http_methods(["POST"])
def generate_smart_inputs(request):
    """
    Generate minimal, educational inputs for code visualization using AI.
    
    This endpoint uses Gemini AI to analyze the code and generate the smallest
    meaningful inputs that will demonstrate the algorithm effectively.
    """
    try:
        data = json.loads(request.body)
        code = data.get('code', '')
        inputs_metadata = data.get('inputs', [])
        
        if not code.strip():
            return JsonResponse({"success": False, "error": "No code provided"})
        
        if not inputs_metadata:
            return JsonResponse({"success": True, "inputs": []})
        
        # Build the prompt for Gemini
        input_descriptions = []
        for inp in inputs_metadata:
            var_name = inp.get('variable') or inp.get('name', f'param{inp.get("id", 0)}')
            var_type = inp.get('type', 'any')
            input_descriptions.append(f"- {var_name}: {var_type}")
        
        prompt = f"""You are an expert at creating minimal test inputs for code visualization and education.

Analyze this Python code and generate the SMALLEST, SIMPLEST inputs that will effectively demonstrate how the algorithm works.

CODE:
```python
{code}
```

REQUIRED INPUTS:
{chr(10).join(input_descriptions)}

RULES:
1. Keep arrays/lists to 3-6 elements maximum - enough to show the pattern, not more
2. Use simple, small numbers (single or double digits preferred)
3. Choose values that will exercise the main logic paths
4. For string inputs, use 3-6 characters
5. Ensure the inputs are valid and won't cause errors
6. Make inputs that create an interesting execution (not trivial cases)

Respond with ONLY a valid JSON object in this exact format:
{{"inputs": {{{", ".join([f'"{inp.get("variable") or inp.get("name", f"param{inp.get("id", 0)}")}": <value>' for inp in inputs_metadata])}}}}}

Examples of good minimal inputs:
- For findMax([List[int]]): {{"inputs": {{"nums": [3, 7, 2, 9, 1]}}}}
- For isIsomorphic(s, t): {{"inputs": {{"s": "egg", "t": "add"}}}}
- For twoSum(nums, target): {{"inputs": {{"nums": [2, 7, 11, 15], "target": 9}}}}
- For reverseString(s): {{"inputs": {{"s": "hello"}}}}

Your response (JSON only):"""

        try:
            # Import and call Gemini API
            from backend.ai.ai_service import call_gemini_api
            
            response = call_gemini_api(prompt, max_retries=2)
            
            if response and 'candidates' in response:
                text = response['candidates'][0]['content']['parts'][0]['text']
                
                # Clean up the response - extract JSON
                text = text.strip()
                if text.startswith('```json'):
                    text = text[7:]
                if text.startswith('```'):
                    text = text[3:]
                if text.endswith('```'):
                    text = text[:-3]
                text = text.strip()
                
                # Parse the JSON
                result = json.loads(text)
                
                if 'inputs' in result:
                    # Convert to list format matching input order
                    input_values = []
                    for inp in inputs_metadata:
                        var_name = inp.get('variable') or inp.get('name', f'param{inp.get("id", 0)}')
                        value = result['inputs'].get(var_name)
                        if value is not None:
                            input_values.append(value)
                        else:
                            # Fallback for missing values
                            input_values.append(None)
                    
                    return JsonResponse({
                        "success": True,
                        "inputs": input_values,
                        "raw": result['inputs'],
                        "source": "ai"
                    })
            
            return JsonResponse({
                "success": False,
                "error": "AI response parsing failed",
                "source": "ai"
            })
            
        except Exception as ai_error:
            print(f"❌ AI input generation failed: {ai_error}")
            return JsonResponse({
                "success": False,
                "error": str(ai_error),
                "source": "ai"
            })
            
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
