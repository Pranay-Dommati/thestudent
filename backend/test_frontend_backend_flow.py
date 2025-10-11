"""
Test exactly what happens when frontend calls backend
Simulates frontend → backend → database flow
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import requests
import json
from courses.models import SchoolCourse, EngineeringCourse

print("="*70)
print("FRONTEND → BACKEND → DATABASE FLOW TEST")
print("="*70)

# Get actual course from database
course = SchoolCourse.objects.first()
if not course:
    print("❌ No courses in database!")
    sys.exit(1)

print(f"\n✅ Found course in database:")
print(f"   ID: {course.id}")
print(f"   Title: {course.title}")

print("\n" + "="*70)
print("IMPORTANT: Django server MUST be running on port 8000")
print("="*70)

# Check if server is running
print("\n1️⃣ Checking if Django server is running...")
try:
    response = requests.get('http://127.0.0.1:8000/api/courses/school/', timeout=2)
    print(f"   ✅ Server is responding!")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        courses = response.json()
        print(f"   ✅ Server returned {len(courses)} courses from database")
    else:
        print(f"   ⚠️ Server responded but with status: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("   ❌ SERVER IS NOT RUNNING!")
    print("\n   To fix: Run this in a NEW terminal:")
    print("   cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend")
    print("   python manage.py runserver 0.0.0.0:8000")
    print("\n   Then run this test again.")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# Test 2: Check enrollment-status endpoint (the one causing 404)
print("\n2️⃣ Testing enrollment-status endpoint (WITHOUT authentication)...")
url = f'http://127.0.0.1:8000/api/courses/enrollment-status/{course.id}/'
print(f"   URL: {url}")

try:
    response = requests.get(url, timeout=2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 401:
        print("   ✅ Got 401 Unauthorized - This is CORRECT (endpoint requires auth)")
        print("   ✅ This means URL is registered and backend is working!")
    elif response.status_code == 404:
        print("   ❌ Got 404 Not Found - URL is not registered!")
        print("   ❌ This is the problem your frontend is experiencing")
    elif response.status_code == 200:
        print("   ✅ Got 200 OK - Endpoint working!")
        print(f"   Response: {response.json()}")
    else:
        print(f"   ⚠️ Got {response.status_code}: {response.text[:100]}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Check enroll endpoint
print("\n3️⃣ Testing enroll endpoint (WITHOUT authentication)...")
url = 'http://127.0.0.1:8000/api/courses/enroll/'
print(f"   URL: {url}")

try:
    data = {
        'course_type': 'school',
        'course_id': str(course.id),
        'class_level': '10th',
        'board': 'state',
        'subject': 'mathematics'
    }
    response = requests.post(url, json=data, timeout=2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 401:
        print("   ✅ Got 401 Unauthorized - This is CORRECT (endpoint requires auth)")
        print("   ✅ This means URL is registered and backend is working!")
    elif response.status_code == 404:
        print("   ❌ Got 404 Not Found - URL is not registered!")
        print("   ❌ This is the problem your frontend is experiencing")
    elif response.status_code in [200, 201]:
        print("   ✅ Got success response!")
        print(f"   Response: {response.json()}")
    else:
        print(f"   ⚠️ Got {response.status_code}: {response.text[:100]}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: List all registered URLs
print("\n4️⃣ Checking registered URLs in Django...")
from django.urls import get_resolver
resolver = get_resolver()

def find_urls(patterns, prefix=''):
    urls = []
    for pattern in patterns:
        if hasattr(pattern, 'url_patterns'):
            urls.extend(find_urls(pattern.url_patterns, prefix + str(pattern.pattern)))
        else:
            full_pattern = prefix + str(pattern.pattern)
            if 'enroll' in full_pattern.lower():
                urls.append(full_pattern)
    return urls

enrollment_urls = find_urls(resolver.url_patterns)
print(f"   Found {len(enrollment_urls)} enrollment-related URLs:")
for url in enrollment_urls:
    print(f"   - {url}")

print("\n" + "="*70)
print("DIAGNOSIS:")
print("="*70)

print("\nIf you see:")
print("  401 Unauthorized → ✅ Backend is working, just needs authentication")
print("  404 Not Found → ❌ Backend not running OR URLs not registered")
print("  Connection Error → ❌ Server is not running")

print("\n" + "="*70)
print("SOLUTION:")
print("="*70)
print("If server is NOT running, start it:")
print("  cd c:/Users/Irfan/Desktop/EasyLearnova/thestudent/backend")
print("  python manage.py runserver 0.0.0.0:8000")
print("\nIf server IS running but you get 404:")
print("  1. Restart the server (it might not have loaded URL changes)")
print("  2. Check that courses/urls.py is included in backend/urls.py")
