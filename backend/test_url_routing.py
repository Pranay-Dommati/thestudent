"""
Test script to verify URL routing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.urls import resolve, reverse
from django.test import RequestFactory

print("="*60)
print("URL ROUTING TEST")
print("="*60)

# Test 1: Can we reverse the URLs?
print("\n1. Testing URL reverse:")
try:
    url = reverse('enrollment-status', kwargs={'course_id': '95aff5e7-89b4-4aaf-8b05-eedc816a501b'})
    print(f"✅ enrollment-status reverse: {url}")
except Exception as e:
    print(f"❌ enrollment-status reverse failed: {e}")

try:
    url = reverse('start-predefined-course')
    print(f"✅ start-predefined-course reverse: {url}")
except Exception as e:
    print(f"❌ start-predefined-course reverse failed: {e}")

# Test 2: Can we resolve the URLs?
print("\n2. Testing URL resolution:")
try:
    match = resolve('/api/courses/enrollment-status/95aff5e7-89b4-4aaf-8b05-eedc816a501b/')
    print(f"✅ Resolved to view: {match.func.__name__}")
    print(f"   kwargs: {match.kwargs}")
except Exception as e:
    print(f"❌ Resolution failed: {e}")

try:
    match = resolve('/api/courses/enroll/')
    print(f"✅ Resolved to view: {match.func.__name__}")
except Exception as e:
    print(f"❌ Resolution failed: {e}")

# Test 3: List all matching URL patterns
print("\n3. Checking all registered URL patterns:")
from django.urls import get_resolver
resolver = get_resolver()

def print_urls(patterns, prefix=''):
    for pattern in patterns:
        if hasattr(pattern, 'url_patterns'):
            # It's an include
            print_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            # It's a url pattern
            full_pattern = prefix + str(pattern.pattern)
            if 'enroll' in full_pattern.lower():
                print(f"   {full_pattern}")

print_urls(resolver.url_patterns)

print("\n" + "="*60)
print("Test completed!")
print("="*60)
