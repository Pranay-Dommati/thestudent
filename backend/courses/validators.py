"""
Input validation utilities for course creation
"""
import re
from django.core.exceptions import ValidationError
from django.utils.html import escape

def validate_course_title(title):
    """Validate course title"""
    if not title or len(title.strip()) < 3:
        raise ValidationError("Course title must be at least 3 characters long")
    
    if len(title) > 255:
        raise ValidationError("Course title cannot exceed 255 characters")
    
    # Check for potential XSS
    if '<' in title or '>' in title or 'script' in title.lower():
        raise ValidationError("Course title contains invalid characters")
    
    return escape(title.strip())

def validate_description(description):
    """Validate course description"""
    if description and len(description) > 5000:
        raise ValidationError("Description cannot exceed 5000 characters")
    
    # Basic XSS prevention
    if description and ('<script' in description.lower() or 'javascript:' in description.lower()):
        raise ValidationError("Description contains potentially dangerous content")
    
    return escape(description.strip()) if description else ""

def validate_url(url):
    """Validate URLs"""
    if not url:
        return ""
    
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    if not url_pattern.match(url):
        raise ValidationError("Invalid URL format")
    
    # Block dangerous schemes
    if url.lower().startswith(('javascript:', 'data:', 'vbscript:')):
        raise ValidationError("URL scheme not allowed")
    
    return url

def sanitize_filename(filename):
    """Sanitize uploaded filenames"""
    if not filename:
        return "upload"
    
    # Remove path components and dangerous characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    filename = filename.strip('._')
    
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:90] + ('.' + ext if ext else '')
    
    return filename or "upload"