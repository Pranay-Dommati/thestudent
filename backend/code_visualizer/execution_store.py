"""
Execution Session Store
========================
Enterprise-grade execution state management.

The backend is the SINGLE SOURCE OF TRUTH for all execution state.
Frontend NEVER owns or round-trips execution data.

Architecture:
- When code is traced, all frames with complete state are stored here
- An execution_id is returned to the frontend
- Frontend requests more explanations by execution_id + frame indices
- Backend retrieves canonical frames from this store

This eliminates data ownership issues and ensures consistent dry-run generation.
"""

import uuid
import time
from typing import Dict, List, Any, Optional
from threading import Lock
from django.core.cache import cache

# Configuration
EXECUTION_TTL_SECONDS = 3600  # 1 hour
MAX_EXECUTIONS_IN_MEMORY = 100  # Fallback limit for in-memory store

# In-memory fallback store (used if cache is not available)
_memory_store: Dict[str, Dict[str, Any]] = {}
_memory_store_lock = Lock()


# Cache the decision about whether to use Django cache
_cache_available = None

def _use_cache() -> bool:
    """Check if Django cache is available and working."""
    global _cache_available
    
    # Only check once
    if _cache_available is not None:
        return _cache_available
    
    try:
        cache.set('__execution_store_test__', 'test', 1)
        result = cache.get('__execution_store_test__')
        _cache_available = (result == 'test')
        print(f"[EXEC STORE] Cache check result: {_cache_available}")
    except Exception as e:
        print(f"[EXEC STORE] Cache check failed: {e}")
        _cache_available = False
    
    return _cache_available


def store_execution(frames: List[Dict[str, Any]], source_lines: List[str], metadata: Optional[Dict[str, Any]] = None) -> str:
    """
    Store an execution session with all frames.
    
    Args:
        frames: Complete list of trace frames with state_before, state_after, etc.
        source_lines: Original source code lines
        metadata: Optional metadata (code_type, function_name, etc.)
    
    Returns:
        execution_id: Unique identifier for this execution session
    """
    execution_id = str(uuid.uuid4())
    
    execution_data = {
        'execution_id': execution_id,
        'frames': frames,
        'source_lines': source_lines,
        'metadata': metadata or {},
        'created_at': time.time(),
        'total_frames': len(frames),
    }
    
    use_cache = _use_cache()
    print(f"[EXEC STORE] Storing execution {execution_id}, use_cache={use_cache}, frames={len(frames)}")
    
    if use_cache:
        # Use Django cache (Redis, Memcached, etc.)
        cache.set(f'execution:{execution_id}', execution_data, EXECUTION_TTL_SECONDS)
    else:
        # Fallback to in-memory store
        with _memory_store_lock:
            # Cleanup old executions if limit reached
            if len(_memory_store) >= MAX_EXECUTIONS_IN_MEMORY:
                _cleanup_old_executions()
            _memory_store[execution_id] = execution_data
            print(f"[EXEC STORE] Memory store now has {len(_memory_store)} executions")
    
    return execution_id


def get_execution(execution_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve an execution session by ID.
    
    Returns None if execution not found or expired.
    """
    use_cache = _use_cache()
    print(f"[EXEC STORE] Getting execution {execution_id}, use_cache={use_cache}")
    
    if use_cache:
        result = cache.get(f'execution:{execution_id}')
        print(f"[EXEC STORE] Cache get result: {result is not None}")
        return result
    else:
        with _memory_store_lock:
            result = _memory_store.get(execution_id)
            print(f"[EXEC STORE] Memory get result: {result is not None}, store has {len(_memory_store)} executions, keys={list(_memory_store.keys())[:3]}")
            return result


def get_frames(execution_id: str, indices: Optional[List[int]] = None) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieve specific frames from an execution session.
    
    Args:
        execution_id: The execution session ID
        indices: Optional list of frame indices to retrieve. If None, returns all frames.
    
    Returns:
        List of frames, or None if execution not found
    """
    execution = get_execution(execution_id)
    if not execution:
        return None
    
    frames = execution.get('frames', [])
    
    if indices is None:
        return frames
    
    # Return only requested frames (with bounds checking)
    result = []
    for idx in indices:
        if 0 <= idx < len(frames):
            result.append(frames[idx])
    
    return result


def get_frame(execution_id: str, index: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single frame from an execution session.
    """
    frames = get_frames(execution_id, [index])
    if frames and len(frames) > 0:
        return frames[0]
    return None


def get_source_lines(execution_id: str) -> Optional[List[str]]:
    """
    Retrieve source code lines for an execution session.
    """
    execution = get_execution(execution_id)
    if not execution:
        return None
    return execution.get('source_lines', [])


def delete_execution(execution_id: str) -> bool:
    """
    Delete an execution session.
    """
    if _use_cache():
        cache.delete(f'execution:{execution_id}')
        return True
    else:
        with _memory_store_lock:
            if execution_id in _memory_store:
                del _memory_store[execution_id]
                return True
    return False


def _cleanup_old_executions():
    """
    Remove oldest executions when memory limit is reached.
    Only used for in-memory store fallback.
    """
    if not _memory_store:
        return
    
    # Sort by creation time and remove oldest 20%
    sorted_executions = sorted(
        _memory_store.items(),
        key=lambda x: x[1].get('created_at', 0)
    )
    
    remove_count = max(1, len(sorted_executions) // 5)  # Remove 20%
    for execution_id, _ in sorted_executions[:remove_count]:
        del _memory_store[execution_id]


def get_store_stats() -> Dict[str, Any]:
    """
    Get statistics about the execution store (for debugging/monitoring).
    """
    using_cache = _use_cache()
    
    if using_cache:
        return {
            'backend': 'cache',
            'status': 'active',
        }
    else:
        with _memory_store_lock:
            return {
                'backend': 'memory',
                'status': 'active',
                'count': len(_memory_store),
                'max': MAX_EXECUTIONS_IN_MEMORY,
            }
