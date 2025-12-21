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
    """Parse input values based on their types."""
    parsed = []
    for i, value in enumerate(input_values):
        input_type = input_types[i] if i < len(input_types) else "any"
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
            try:
                executable_code = prepare_execution_code(code, code_type, function_name, class_name, inputs, input_types)
                result = trace_code(executable_code, inputs if code_type == "script" else [])
                
                if result.get('success'):
                    frames = result.get('frames', [])
                    source_lines = result.get('source_lines', [])
                    
                    for i, frame in enumerate(frames):
                        if narrator and narrator.is_available:
                            frame['explanation'] = narrator.generate_narration(
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
                        yield f"data: {json.dumps({'type': 'frame', 'index': i, 'frame': frame})}\n\n"
                        time.sleep(0.05)
                    
                    yield f"data: {json.dumps({'type': 'complete', 'totalFrames': len(frames)})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'error', 'error': result.get('error', 'Unknown error')})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
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
