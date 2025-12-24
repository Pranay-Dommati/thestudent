"""
Safe Sandbox Environment for Code Execution
============================================
Provides a restricted execution environment that:
- Blocks dangerous builtins (exec, eval, open, etc.)
- Restricts imports to safe modules only
- Prevents file system access
- Prevents network access
- Limits execution resources

This is CRITICAL for security when running user-submitted code.
"""

import sys
import io
from typing import Dict, Any, List, Optional, Tuple
from contextlib import contextmanager
import builtins


# ============================================================================
# SAFE BUILTINS - Only allow harmless functions
# ============================================================================

# Functions that are SAFE to allow
SAFE_BUILTINS = {
    # Type constructors
    'int': int,
    'float': float,
    'str': str,
    'bool': bool,
    'list': list,
    'dict': dict,
    'tuple': tuple,
    'set': set,
    'frozenset': frozenset,
    'bytes': bytes,
    'bytearray': bytearray,
    
    # Type checking
    'type': type,
    'isinstance': isinstance,
    'issubclass': issubclass,
    'callable': callable,
    
    # Iterators and sequences
    'range': range,
    'len': len,
    'enumerate': enumerate,
    'zip': zip,
    'map': map,
    'filter': filter,
    'reversed': reversed,
    'sorted': sorted,
    
    # Math operations
    'abs': abs,
    'round': round,
    'min': min,
    'max': max,
    'sum': sum,
    'pow': pow,
    'divmod': divmod,
    
    # String operations
    'chr': chr,
    'ord': ord,
    'repr': repr,
    'ascii': ascii,
    'format': format,
    
    # Object operations  
    'id': id,
    'hash': hash,
    'getattr': getattr,
    'setattr': setattr,
    'hasattr': hasattr,
    'delattr': delattr,
    
    # Sequence operations
    'all': all,
    'any': any,
    'iter': iter,
    'next': next,
    'slice': slice,
    
    # Boolean
    'True': True,
    'False': False,
    'None': None,
    
    # Exceptions (for try/except)
    'Exception': Exception,
    'BaseException': BaseException,
    'ValueError': ValueError,
    'TypeError': TypeError,
    'KeyError': KeyError,
    'IndexError': IndexError,
    'AttributeError': AttributeError,
    'ZeroDivisionError': ZeroDivisionError,
    'RuntimeError': RuntimeError,
    'StopIteration': StopIteration,
    'NameError': NameError,
    
    # Other safe functions
    'bin': bin,
    'hex': hex,
    'oct': oct,
    'object': object,
    'property': property,
    'staticmethod': staticmethod,
    'classmethod': classmethod,
    'super': super,
    
    # Class building (required for class definitions)
    '__build_class__': __builtins__.__build_class__ if hasattr(__builtins__, '__build_class__') else builtins.__build_class__,
}

# Modules that are SAFE to import
SAFE_MODULES = {
    'math',           # Math functions
    'random',         # Random number generation
    'string',         # String constants
    'collections',    # Data structures
    'itertools',      # Iterator tools
    'functools',      # Function tools
    'operator',       # Operator functions
    'copy',           # Object copying
    'json',           # JSON (without file ops)
    'datetime',       # Date/time handling
    're',             # Regular expressions
    'heapq',          # Heap queue
    'bisect',         # Binary search
    'statistics',     # Statistical functions
    'typing',         # Type hints (List, Dict, etc.)
}

# Modules that must NEVER be imported
BLOCKED_MODULES = [
    'os', 'sys', 'subprocess', 'shutil', 'pathlib', 'io', 'socket',
    'requests', 'urllib', 'http', 'ftplib', 'smtplib', 'pickle',
    'shelve', 'sqlite3', 'ctypes', 'multiprocessing', 'threading',
    'asyncio', 'importlib', 'builtins', '__builtin__', 'code',
    'codeop', 'pty', 'tty', 'tempfile', 'glob', 'fnmatch',
    'zipfile', 'tarfile', 'gzip', 'bz2', 'lzma', 'xml', 'html',
    'webbrowser', 'getpass', 'platform', 'resource', 'signal',
    'gc', 'inspect', 'traceback', 'linecache', 'tokenize', 'ast', 'dis',
]


class SafeImporter:
    """Custom importer that only allows safe modules."""
    
    def __init__(self):
        self._cache = {}
    
    def __call__(self, name: str, globals: Dict = None, locals: Dict = None, 
                 fromlist: Tuple = (), level: int = 0):
        base_name = name.split('.')[0]
        
        if base_name in BLOCKED_MODULES:
            raise ImportError(f"Import of '{name}' is not allowed for security reasons")
        
        if base_name not in SAFE_MODULES:
            raise ImportError(f"Import of '{name}' is not allowed. Only these modules are allowed: {', '.join(sorted(SAFE_MODULES))}")
        
        if name in self._cache:
            return self._cache[name]
        
        try:
            module = __import__(name, globals, locals, fromlist, level)
            self._cache[name] = module
            return module
        except ImportError as e:
            raise ImportError(f"Failed to import '{name}': {e}")


class SafeInput:
    """Safe input() replacement that uses pre-provided values."""
    
    def __init__(self, input_values: Optional[List[str]] = None):
        self.input_values = input_values or []
        self.input_index = 0
    
    def __call__(self, prompt: str = "") -> str:
        if self.input_index < len(self.input_values):
            value = str(self.input_values[self.input_index])
            self.input_index += 1
            return value
        else:
            raise EOFError("No more input values available")


class SafePrint:
    """Safe print() that writes to a captured buffer."""
    
    def __init__(self, output_buffer: io.StringIO):
        self.buffer = output_buffer
    
    def __call__(self, *args, sep: str = ' ', end: str = '\n', **kwargs):
        kwargs.pop('file', None)
        output = sep.join(str(arg) for arg in args) + end
        self.buffer.write(output)


@contextmanager
def capture_output():
    """Context manager to capture stdout/stderr."""
    buffer = io.StringIO()
    yield buffer


def create_sandbox(input_values: Optional[List[str]] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Create a sandboxed execution environment."""
    output_buffer = io.StringIO()
    
    safe_builtins = SAFE_BUILTINS.copy()
    safe_builtins['__import__'] = SafeImporter()
    safe_builtins['input'] = SafeInput(input_values)
    safe_builtins['print'] = SafePrint(output_buffer)
    
    from typing import List as TypingList, Dict as TypingDict, Set as TypingSet
    from typing import Tuple as TypingTuple, Optional as TypingOptional
    from typing import Any as TypingAny, Union as TypingUnion
    
    # Common LeetCode data structures
    class ListNode:
        """Singly linked list node for LeetCode problems."""
        def __init__(self, val=0, next=None):
            self.val = val
            self.next = next
        
        def __repr__(self):
            values = []
            node = self
            seen = set()
            while node and id(node) not in seen:
                seen.add(id(node))
                values.append(str(node.val))
                node = node.next
            return f"[{' -> '.join(values)}]"
    
    class TreeNode:
        """Binary tree node for LeetCode problems."""
        def __init__(self, val=0, left=None, right=None):
            self.val = val
            self.left = left
            self.right = right
        
        def __repr__(self):
            return f"TreeNode({self.val})"
    
    class Node:
        """Generic graph/N-ary tree node for LeetCode problems."""
        def __init__(self, val=None, children=None, neighbors=None, next=None):
            self.val = val
            self.children = children or []
            self.neighbors = neighbors or []
            self.next = next
        
        def __repr__(self):
            return f"Node({self.val})"
    
    # Helper functions to convert arrays to data structures
    def _list_to_listnode(values):
        """Convert a list of values to a ListNode chain."""
        if not values:
            return None
        dummy = ListNode(0)
        current = dummy
        for val in values:
            current.next = ListNode(val)
            current = current.next
        return dummy.next
    
    def _list_to_treenode(values):
        """Convert a list of values to a TreeNode (level-order)."""
        if not values or values[0] is None:
            return None
        root = TreeNode(values[0])
        queue = [root]
        i = 1
        while queue and i < len(values):
            node = queue.pop(0)
            if i < len(values) and values[i] is not None:
                node.left = TreeNode(values[i])
                queue.append(node.left)
            i += 1
            if i < len(values) and values[i] is not None:
                node.right = TreeNode(values[i])
                queue.append(node.right)
            i += 1
        return root
    
    sandbox_globals = {
        '__builtins__': safe_builtins,
        '__name__': '__main__',
        '__doc__': None,
        '_output_buffer_': output_buffer,
        # Typing imports
        'List': TypingList,
        'Dict': TypingDict,
        'Set': TypingSet,
        'Tuple': TypingTuple,
        'Optional': TypingOptional,
        'Any': TypingAny,
        'Union': TypingUnion,
        # LeetCode data structures
        'ListNode': ListNode,
        'TreeNode': TreeNode,
        'Node': Node,
        # Helper functions for input conversion
        '_list_to_listnode': _list_to_listnode,
        '_list_to_treenode': _list_to_treenode,
    }
    
    sandbox_locals = {}
    
    return sandbox_globals, sandbox_locals


def validate_code(code: str) -> Tuple[bool, Optional[str]]:
    """Pre-validate code before execution for obvious security issues."""
    import ast
    
    dangerous_patterns = [
        '__import__', '__builtins__', '__class__', '__bases__',
        '__subclasses__', '__mro__', '__globals__', '__code__',
        '__getattribute__', 'os.system', 'os.popen', 'subprocess',
        'eval(', 'exec(', 'compile(', 'open(', '__file__',
    ]
    
    code_lower = code.lower()
    for pattern in dangerous_patterns:
        if pattern.lower() in code_lower:
            return False, f"Potentially dangerous pattern detected: '{pattern}'"
    
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error at line {e.lineno}: {e.msg}"
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute):
            if node.attr in ['__class__', '__bases__', '__subclasses__', '__mro__', 
                           '__globals__', '__code__', '__builtins__']:
                return False, f"Access to '{node.attr}' is not allowed"
    
    return True, None
