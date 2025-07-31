#!/usr/bin/env python3
"""
Test the enrolled courses API directly to debug the Unicode error
"""

import os
import sys
import requests
import json

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth.models import User

BASE_URL = 'http://localhost:8000'

def test_enrolled_courses_api():
    """Test the enrolled courses API to debug Unicode error"""
    print("🧪 Testing Enrolled Courses API")
    print("=" * 40)
    
    # Step 1: Login as test user
    print("\n1️⃣ Logging in...")
    login_data = {
        'email': 'test_learner@example.com',
        'password': 'testpass123'
    }
    
    try:
        login_response = requests.post(f'{BASE_URL}/api/auth/login/', json=login_data)
        if login_response.status_code == 200:
            token = login_response.json()['access']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            print("✅ Login successful")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return False
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False
    
    # Step 2: Test enrolled courses API
    print("\n2️⃣ Testing enrolled courses API...")
    try:
        response = requests.get(f'{BASE_URL}/api/courses/enrolled/', headers=headers)
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("✅ API call successful!")
                print(f"📊 Response data keys: {list(data.keys())}")
                
                if 'success' in data and data['success']:
                    courses = data.get('courses', [])
                    print(f"📚 Found {len(courses)} enrolled courses")
                    
                    for i, course in enumerate(courses, 1):
                        print(f"\n📖 Course {i}:")
                        print(f"   - Enrollment ID: {course.get('id')}")
                        print(f"   - Course Type: {course.get('course_type')}")
                        print(f"   - Progress: {course.get('progress_percentage')}%")
                        
                        school_course = course.get('school_course')
                        engineering_course = course.get('engineering_course')
                        
                        if school_course:
                            print(f"   - School Course: {school_course.get('title')}")
                            print(f"   - Subject: {school_course.get('subject')}")
                            print(f"   - Board: {school_course.get('board')}")
                            print(f"   - Class: {school_course.get('class_level')}")
                        elif engineering_course:
                            print(f"   - Engineering Course: {engineering_course.get('title')}")
                            print(f"   - Subject: {engineering_course.get('subject')}")
                            print(f"   - Proficiency: {engineering_course.get('proficiency')}")
                else:
                    print("❌ API returned success=False")
                    print(f"Error: {data.get('error', 'Unknown error')}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {str(e)}")
                print(f"Raw response: {response.text[:500]}...")
                
        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"❌ Request error: {str(e)}")
        return False
    
    print("\n✅ Test completed!")
    return True

if __name__ == "__main__":
    print("🚀 Starting Enrolled Courses API Test")
    print("=" * 50)
    
    test_enrolled_courses_api()
