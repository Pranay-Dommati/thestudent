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
from . import execution_store


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
        
        # LeetCode data structure types
        if 'ListNode' in annotation:
            param_type = "listnode"
            param_label = f"{arg.arg} (Linked List, e.g., 1,2,3)"
        elif 'TreeNode' in annotation:
            param_type = "treenode"
            param_label = f"{arg.arg} (Binary Tree, e.g., 1,2,3,null,4)"
        elif 'List[int]' in annotation or 'list' in annotation.lower():
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
        
        # Handle ListNode type - convert list to linked list creation code
        if input_type == "listnode":
            # Parse the value to a list of integers
            if isinstance(value, list):
                items = value
            elif isinstance(value, str):
                value = value.strip()
                items_str = value.split(',') if ',' in value else value.split()
                try:
                    items = [int(x.strip()) for x in items_str if x.strip()]
                except ValueError:
                    items = []
            else:
                items = []
            
            if not items:
                parsed.append("None")
            else:
                # Use the helper function from sandbox
                parsed.append(f"_list_to_listnode({items})")
            continue
        
        # Handle TreeNode type
        if input_type == "treenode":
            # For now, just pass None - tree construction is more complex
            parsed.append("None")
            continue
        
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
    """Trace code execution (non-streaming).
    
    Only generates AI explanations for the first BATCH_SIZE steps to save resources.
    Use /generate-explanations endpoint to get more explanations on-demand.
    """
    BATCH_SIZE = 6  # Only generate AI explanations for first 6 steps
    
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
        
        # Only generate AI explanations for first BATCH_SIZE steps
        if narrator and narrator.is_available and result.get('success') and result.get('frames'):
            source_lines = result.get('source_lines', [])
            frames = result['frames']
            
            for i, frame in enumerate(frames[:BATCH_SIZE]):
                ai_narration = narrator.generate_narration(
                    step=frame.get('step', 0),
                    line=frame.get('line', 0),
                    code=frame.get('code', ''),
                    event=frame.get('event', 'line'),
                    variables=frame.get('locals', {}),
                    changed_vars=frame.get('changed_vars', []),
                    function_name=frame.get('function_name'),
                    return_value=frame.get('return_value'),
                    full_source=source_lines,
                    std_inputs=inputs
                )
                frame['explanation'] = ai_narration
            
            # Mark remaining frames as not yet generated
            for frame in frames[BATCH_SIZE:]:
                frame['explanation'] = None  # Will be generated on-demand
        
        # Add metadata for progressive loading
        result['totalSteps'] = len(result.get('frames', []))
        result['generatedUpTo'] = min(BATCH_SIZE, len(result.get('frames', [])))
        result['batchSize'] = BATCH_SIZE
        
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def generate_explanations(request):
    """Generate AI explanations for a batch of frames on-demand.
    
    This endpoint is used for progressive/lazy loading of explanations.
    Frontend sends frames that need explanations, and we generate them.
    """
    BATCH_SIZE = 6
    
    try:
        data = json.loads(request.body)
        frames = data.get('frames', [])  # Frames without explanations
        source_lines = data.get('sourceLines', [])
        start_index = data.get('startIndex', 0)
        previous_frame = data.get('previousFrame')  # Optional: for computing state_before of first frame
        
        if not narrator or not narrator.is_available:
            return JsonResponse({
                "error": "AI narrator not available",
                "explanations": []
            })
        
        # print(f"[On-Demand] 🔄 Generating AI explanations for steps {start_index + 1} to {start_index + min(BATCH_SIZE, len(frames))}")
        
        explanations = []
        
        for i, frame in enumerate(frames[:BATCH_SIZE]):
            step_num = start_index + i + 1
            code_line = frame.get('code', '')[:50]
            # print(f"[On-Demand] Step {step_num}: 🤖 Generating AI for: {code_line}")
            
            # Frontend sends 'variables' but original frame uses 'locals'
            variables = frame.get('locals') or frame.get('variables', {})
            changed_vars = frame.get('changed_vars') or frame.get('changedVars', [])
            
            # Get loop_info and state info from frame
            loop_info = frame.get('loop_info')
            state_before = frame.get('state_before')
            state_after = frame.get('state_after')
            
            # CRITICAL FIX: Compute state_before/state_after from frame sequence if not provided
            if state_before is None:
                prev_frame_to_use = None
                if i > 0:
                    prev_frame_to_use = frames[i - 1]
                elif previous_frame:
                    prev_frame_to_use = previous_frame
                
                if prev_frame_to_use:
                    prev_locals = prev_frame_to_use.get('locals') or prev_frame_to_use.get('variables', {})
                    if prev_locals:
                        state_before = {}
                        for var_name, data_val in prev_locals.items():
                            val = data_val.get('value') if isinstance(data_val, dict) else data_val
                            state_before[var_name] = val
            
            if state_after is None and variables:
                state_after = {}
                for var_name, data_val in variables.items():
                    val = data_val.get('value') if isinstance(data_val, dict) else data_val
                    state_after[var_name] = val
            
            ai_narration = narrator.generate_narration(
                step=frame.get('step', start_index + i),
                line=frame.get('line') or frame.get('lineNumber', 0),
                code=frame.get('code', ''),
                event=frame.get('event', 'line'),
                variables=variables,
                changed_vars=changed_vars,
                function_name=frame.get('function_name') or frame.get('functionName'),
                return_value=frame.get('return_value'),
                full_source=source_lines,
                loop_info=loop_info,
                state_before=state_before,
                state_after=state_after
            )
            explanations.append({
                'index': start_index + i,
                'explanation': ai_narration
            })
        
        # print(f"[On-Demand] ✅ Completed {len(explanations)} explanations")
        
        return JsonResponse({
            "success": True,
            "explanations": explanations,
            "generatedCount": len(explanations)
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def generate_explanations_stream(request):
    """Stream AI explanations one-by-one via Server-Sent Events.
    
    ENTERPRISE-GRADE: Uses execution_store as Single Source of Truth.
    Frontend sends execution_id + frame_indices, NOT frame data.
    Backend retrieves canonical frames with complete state.
    
    Fallback: Still supports legacy mode where frontend sends frames directly.
    """
    BATCH_SIZE = 6
    
    try:
        data = json.loads(request.body)
        
        # ENTERPRISE MODE: Use execution_id to retrieve canonical frames
        execution_id = data.get('executionId')
        frame_indices = data.get('frameIndices', [])
        
        # LEGACY MODE: Frontend sends frames directly (fallback)
        legacy_frames = data.get('frames', [])
        legacy_source_lines = data.get('sourceLines', [])
        start_index = data.get('startIndex', 0)
        previous_frame = data.get('previousFrame')
        
        def generate():
            nonlocal frame_indices, legacy_frames, start_index
            
            if not narrator or not narrator.is_available:
                yield "data: " + json.dumps({'type': 'error', 'error': 'AI narrator not available'}) + "\n\n"
                return
            
            # Determine which mode to use
            frames_to_process = []
            source_lines = []
            
            print(f"[ON-DEMAND DEBUG] execution_id={execution_id}, frame_indices={frame_indices}, start_index={start_index}")
            print(f"[ON-DEMAND DEBUG] legacy_frames count={len(legacy_frames)}")
            
            if execution_id:
                # ENTERPRISE MODE: Retrieve frames from execution store (SSOT)
                print(f"[ON-DEMAND DEBUG] Using ENTERPRISE MODE with execution_id={execution_id}")
                execution = execution_store.get_execution(execution_id)
                if not execution:
                    print(f"[ON-DEMAND DEBUG] ERROR: Execution not found!")
                    yield "data: " + json.dumps({'type': 'error', 'error': f'Execution {execution_id} not found or expired'}) + "\n\n"
                    return
                
                all_frames = execution.get('frames', [])
                source_lines = execution.get('source_lines', [])
                print(f"[ON-DEMAND DEBUG] Retrieved {len(all_frames)} frames from store")
                
                # If frame_indices provided, use them; otherwise use start_index
                if frame_indices:
                    for idx in frame_indices[:BATCH_SIZE]:
                        if 0 <= idx < len(all_frames):
                            frames_to_process.append((idx, all_frames[idx]))
                else:
                    # Use start_index for backwards compatibility
                    for i in range(BATCH_SIZE):
                        idx = start_index + i
                        if idx < len(all_frames):
                            frames_to_process.append((idx, all_frames[idx]))
                
                # Log what we got
                for idx, frame in frames_to_process[:2]:
                    print(f"[ON-DEMAND DEBUG] Frame {idx}: state_before={frame.get('state_before') is not None}, state_after={frame.get('state_after') is not None}")
            else:
                # LEGACY MODE: Use frames sent by frontend (with state computation fallback)
                print(f"[ON-DEMAND DEBUG] Using LEGACY MODE - frontend sent frames directly")
                source_lines = legacy_source_lines
                for i, frame in enumerate(legacy_frames[:BATCH_SIZE]):
                    frames_to_process.append((start_index + i, frame))
            
            # Generate explanations for each frame
            for frame_idx, frame in frames_to_process:
                code_line = frame.get('code', '')[:50]
                
                # Get data from the canonical frame
                variables = frame.get('locals', {})
                changed_vars = frame.get('changed_vars', [])
                loop_info = frame.get('loop_info')
                state_before = frame.get('state_before')
                state_after = frame.get('state_after')
                
                # FALLBACK: If still no state_before (legacy mode), compute from sequence
                if state_before is None and not execution_id:
                    # Find previous frame
                    current_idx_in_batch = next((i for i, (idx, _) in enumerate(frames_to_process) if idx == frame_idx), -1)
                    if current_idx_in_batch > 0:
                        _, prev_frame = frames_to_process[current_idx_in_batch - 1]
                        prev_locals = prev_frame.get('locals', {})
                        if prev_locals:
                            state_before = {}
                            for var_name, d in prev_locals.items():
                                val = d.get('value') if isinstance(d, dict) else d
                                state_before[var_name] = val
                    elif previous_frame:
                        prev_locals = previous_frame.get('locals', {})
                        if prev_locals:
                            state_before = {}
                            for var_name, d in prev_locals.items():
                                val = d.get('value') if isinstance(d, dict) else d
                                state_before[var_name] = val
                
                if state_after is None and not execution_id:
                    if variables:
                        state_after = {}
                        for var_name, d in variables.items():
                            val = d.get('value') if isinstance(d, dict) else d
                            state_after[var_name] = val
                
                ai_narration = narrator.generate_narration(
                    step=frame.get('step', frame_idx),
                    line=frame.get('line', 0),
                    code=frame.get('code', ''),
                    event=frame.get('event', 'line'),
                    variables=variables,
                    changed_vars=changed_vars,
                    function_name=frame.get('function_name'),
                    return_value=frame.get('return_value'),
                    full_source=source_lines,
                    loop_info=loop_info,
                    state_before=state_before,
                    state_after=state_after
                )
                
                # Stream each explanation immediately
                yield "data: " + json.dumps({'type': 'explanation', 'index': frame_idx, 'explanation': ai_narration}) + "\n\n"
            
            yield "data: " + json.dumps({'type': 'complete', 'count': len(frames_to_process)}) + "\n\n"
        
        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
        
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
                        loop_info=frame_dict.get('loop_info'),
                        std_inputs=inputs,
                        state_before=frame_dict.get('state_before'),
                        state_after=frame_dict.get('state_after')
                    )
                    if ai_narration:
                        frame_dict['explanation'] = ai_narration
                except Exception:
                    # If narration fails, keep the tracer's existing explanation.
                    return

            frame_counter = [0]  # Use list to allow mutation in nested function
            BATCH_SIZE = 6  # Only generate AI for first 6 frames
            
            def on_frame(frame_dict):
                # frame_dict is already JSON-serializable
                step_num = frame_counter[0] + 1
                code_line = frame_dict.get('code', '')[:50]
                
                # Only generate AI explanations for first BATCH_SIZE frames
                if frame_counter[0] < BATCH_SIZE:
                    # print(f"[Stream] Step {step_num}: 🤖 Generating AI explanation for: {code_line}")
                    maybe_add_ai_narration(frame_dict)
                else:

                    frame_dict['explanation'] = None  # Will be generated on-demand
                
                frame_counter[0] += 1
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

            # ENTERPRISE-GRADE: Store execution in backend session store
            # Backend is the SINGLE SOURCE OF TRUTH for all execution state
            all_frames = result.get('frames', [])
            
            # DEBUG: Log what we're storing
            print(f"[EXEC STORE] Storing {len(all_frames)} frames")
            for idx, frame in enumerate(all_frames[:3]):  # Log first 3 frames
                print(f"[EXEC STORE] Frame {idx}: keys={list(frame.keys())}")
                print(f"[EXEC STORE] Frame {idx}: state_before={frame.get('state_before') is not None}, state_after={frame.get('state_after') is not None}")
            if len(all_frames) > 3:
                print(f"[EXEC STORE] ... and {len(all_frames) - 3} more frames")
            
            exec_id = execution_store.store_execution(
                frames=all_frames,
                source_lines=source_lines,
                metadata={
                    'code_type': code_type,
                    'function_name': function_name,
                    'class_name': class_name,
                }
            )
            print(f"[EXEC STORE] Stored execution with id={exec_id}")
            # Send completion message with executionId for future reference
            yield f"data: {json.dumps({'type': 'complete', 'totalFrames': frame_index, 'output': result.get('output', ''), 'executionId': exec_id})}\n\n"
        
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


# =============================================================================
# "THE WHY" — LINE-SPECIFIC EXPLANATION ENDPOINT
# =============================================================================
@csrf_exempt
@require_http_methods(["POST"])
def generate_why_explanation(request):
    """
    Generate a deterministic 'Why' explanation for a specific line.
    
    This is PHASE 1 of "The Why" feature - a teaching engine that explains
    WHY a line of code exists, not just WHAT it does.
    
    Request body:
    {
        "full_code": "...",           # Full source code
        "line_number": 9,             # Line number (1-indexed)
        "line_text": "...",           # Exact line text
        "phase": "pre-merge",         # Execution phase (optional)
        "sample_input": {...},        # Sample input used (optional)
        "problem_type": "...",        # Type of problem (optional)
        "function_purpose": "..."     # Purpose of the function (optional)
    }
    
    Response:
    {
        "success": true,
        "explanation": "...",         # Structured explanation
        "cached": true/false,         # Whether from cache
        "line_number": 9,
        "complexity": "compound_control"
    }
    """
    try:
        data = json.loads(request.body)
        
        # Required fields
        full_code = data.get('full_code', '')
        line_number = data.get('line_number', 0)
        line_text = data.get('line_text', '')
        
        # Validation
        if not full_code or not line_number:
            return JsonResponse({
                "success": False,
                "error": "Missing required fields: full_code, line_number"
            }, status=400)
        
        # Optional fields
        phase = data.get('phase', 'execution')
        sample_input = data.get('sample_input')
        problem_type = data.get('problem_type', 'algorithm')
        function_purpose = data.get('function_purpose', '')
        
        # Get the Why Explainer instance
        from .why_explainer import get_why_explainer
        why_explainer = get_why_explainer()
        
        # Generate explanation
        result = why_explainer.generate_why_explanation(
            full_code=full_code,
            line_number=line_number,
            line_text=line_text,
            phase=phase,
            sample_input=sample_input,
            problem_type=problem_type,
            function_purpose=function_purpose
        )
        
        return JsonResponse({
            "success": True,
            **result
        })
        
    except Exception as e:
        print(f"[WhyEndpoint] ERROR: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


# =============================================================================
# "ASK STEP" — CONTEXTUAL QUESTION ANSWERING ENDPOINT
# =============================================================================
@csrf_exempt
@require_http_methods(["POST"])
def ask_step(request):
    """
    Answer a user question about a specific step/line of code.
    
    ENTERPRISE-GRADE: Separates chat memory from step context.
    - Chat memory: Durable across step changes
    - Step context: Swappable per "Understand" click
    
    Request body (NEW format):
    {
        "fullCode": "...",
        "stepContext": {                 # Swappable per step (optional)
            "line": 6,
            "code": "if n > max_val:",
            "variables": {"n": 5, "max_val": 10}
        },
        "conversation": {                # Durable across steps
            "id": "chat_abc123",
            "messages": [
                {"role": "assistant", "content": "..."},
                {"role": "user", "content": "..."}
            ]
        },
        "intent": "explain | question",
        "question": "..."
    }
    
    Also supports LEGACY format for backwards compatibility:
    {
        "fullCode": "...",
        "lineNumber": 5,
        "lineText": "...",
        "variables": {...},
        "question": "...",
        "whyExplanation": "..."
    }
    
    Response:
    {
        "success": true,
        "answer": "..."
    }
    """
    try:
        data = json.loads(request.body)
        
        # Detect API format: NEW (stepContext) or LEGACY (lineNumber)
        step_context = data.get('stepContext')
        conversation = data.get('conversation', {})
        
        if step_context is not None:
            # NEW FORMAT: Enterprise-grade with separated layers
            full_code = data.get('fullCode', '')
            line_number = step_context.get('line', 0) if step_context else 0
            line_text = step_context.get('code', '') if step_context else ''
            variables = step_context.get('variables', {}) if step_context else {}
            question = data.get('question', '')
            intent = data.get('intent', 'question')
            messages = conversation.get('messages', [])
        else:
            # LEGACY FORMAT: Backwards compatibility
            full_code = data.get('fullCode', '')
            line_number = data.get('lineNumber', 0)
            line_text = data.get('lineText', '')
            variables = data.get('variables', {})
            question = data.get('question', '')
            intent = 'question'
            messages = []
            # Convert whyExplanation to a message if present
            why_explanation = data.get('whyExplanation', '')
            if why_explanation:
                messages = [{'role': 'assistant', 'content': why_explanation}]
        
        # Validation
        if not full_code or not question:
            return JsonResponse({
                "success": False,
                "error": "Missing required fields: fullCode, question"
            }, status=400)
        
        if len(question) > 500:
            return JsonResponse({
                "success": False,
                "error": "Question too long (max 500 characters)"
            }, status=400)
        
        # Determine mode: step-scoped or general
        is_step_scoped = line_number > 0 and line_text
        
        # Format variables for context (only for step-scoped mode)
        vars_str = "No variables yet"
        if is_step_scoped and variables:
            var_items = []
            for name, val in variables.items():
                if isinstance(val, dict) and 'value' in val:
                    var_items.append(f"{name} = {val['value']}")
                else:
                    var_items.append(f"{name} = {val}")
            vars_str = ", ".join(var_items) if var_items else "No variables yet"
        
        # Smart history truncation: Always keep last exchange + older context
        def truncate_history(msgs, max_messages=10):
            if len(msgs) <= max_messages:
                return msgs
            # Always include last 2 messages (latest exchange)
            recent = msgs[-2:]
            # Fill remaining budget with older context
            older = msgs[:-2][-(max_messages-2):]
            return older + recent
        
        truncated_messages = truncate_history(messages, max_messages=10)
        
        # Format conversation history with clear labeling
        history_str = ""
        if truncated_messages:
            history_lines = []
            for msg in truncated_messages:
                role = "User" if msg.get('role') == 'user' else "Assistant"
                content = msg.get('content', '')[:500]  # Cap each message
                history_lines.append(f"{role}: {content}")
            history_str = "\n".join(history_lines)
        
        # Build the context-injected prompt with CLEAR SEPARATION
        if is_step_scoped:
            system_prompt = """You are a senior DSA mentor.

RULES:
- Keep answers concise (3-6 bullet points max)
- Reference the specific line when explaining
- Refer to conversation history when relevant
- Do NOT provide complete solutions
- If asked about something outside the current step, politely redirect"""

            prompt_parts = [
                f"CODE:\n```python\n{full_code}\n```",
                f"\nSTEP CONTEXT:\nLine: {line_number}\nCode: `{line_text}`\nVariables: {vars_str}"
            ]
            
            if history_str:
                prompt_parts.append(f"\nCONVERSATION HISTORY:\n{history_str}")
            
            prompt_parts.append(f"\nUSER QUESTION:\n{question}")
            prompt_parts.append("\nProvide a focused, educational answer about this specific line of code.")
            
            user_prompt = "\n".join(prompt_parts)

        else:
            # General mode - no step context
            system_prompt = """You are a DSA teaching assistant.

RULES:
- Keep answers concise and educational
- Refer to conversation history when relevant
- You may discuss complexity, edge cases, and alternatives
- Do NOT provide complete different solutions unless asked"""

            prompt_parts = [
                f"CODE:\n```python\n{full_code}\n```"
            ]
            
            if history_str:
                prompt_parts.append(f"\nCONVERSATION HISTORY:\n{history_str}")
            
            prompt_parts.append(f"\nUSER QUESTION:\n{question}")
            prompt_parts.append("\nProvide a helpful, educational answer about this code.")
            
            user_prompt = "\n".join(prompt_parts)
        
        print(f"[AskStep] Mode: {'STEP-SCOPED' if is_step_scoped else 'GENERAL'}, History: {len(truncated_messages)} msgs, Q: {question[:50]}...")

        # Use the narrator's AI client directly
        if not narrator or not narrator.is_available:
            return JsonResponse({
                "success": False,
                "error": "AI service not available"
            }, status=503)
        
        # Generate answer using Google Generative AI
        import google.generativeai as genai
        
        # Configure the model (using same setup as narrator)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        response = model.generate_content(
            full_prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=600,  # Slightly higher for context-aware answers
                temperature=0.3,
            )
        )
        
        answer = response.text.strip() if response.text else "I couldn't generate an answer. Please try rephrasing your question."
        
        print(f"[AskStep] Line {line_number}: Q='{question[:50]}...' -> Generated answer")
        
        return JsonResponse({
            "success": True,
            "answer": answer
        })
        
    except Exception as e:
        print(f"[AskStep] ERROR: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)
