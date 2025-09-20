"""
Rate limiting utilities for authentication endpoints
"""
from django.core.cache import cache
from django.http import HttpResponse
from functools import wraps
import time
import hashlib

def rate_limit(max_attempts=5, window_minutes=15, block_minutes=60):
    """
    Rate limiting decorator for views
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Get client IP
            client_ip = get_client_ip(request)
            
            # Create cache keys
            attempt_key = f"auth_attempts_{client_ip}"
            block_key = f"auth_blocked_{client_ip}"
            
            # Check if IP is currently blocked
            if cache.get(block_key):
                return HttpResponse(
                    '{"error": "Too many failed attempts. Please try again later."}',
                    status=429,
                    content_type='application/json'
                )
            
            # Check current attempts
            attempts = cache.get(attempt_key, 0)
            
            if attempts >= max_attempts:
                # Block the IP
                cache.set(block_key, True, block_minutes * 60)
                cache.delete(attempt_key)
                return HttpResponse(
                    '{"error": "Too many failed attempts. Account temporarily blocked."}',
                    status=429,
                    content_type='application/json'
                )
            
            # Execute the view
            response = view_func(request, *args, **kwargs)
            
            # If login failed (401 or 400), increment attempts
            if response.status_code in [400, 401]:
                cache.set(attempt_key, attempts + 1, window_minutes * 60)
            else:
                # Success - clear attempts
                cache.delete(attempt_key)
            
            return response
        
        return wrapper
    return decorator

def get_client_ip(request):
    """Extract client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    # Hash IP for privacy in cache keys
    return hashlib.sha256(ip.encode()).hexdigest()[:16]