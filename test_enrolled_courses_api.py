#!/usr/bin/env python3
"""
Test the enrolled courses API endpoint to debug the Unicode issue
"""

import requests
import json

BASE_URL = 'http://localhost:8000'

def test_enrolled_courses_api():
    """Test the enrolled courses API directly"""
    print("🧪 Testing Enrolled Courses API")
    print("=" * 40)
    
    # Step 1: Login to get token
    print("\n1️⃣ Logging in...")
    login_data = {
        'username': 'test_learner',
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
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ API call successful")
            data = response.json()
            print(f"Response data keys: {list(data.keys())}")
            
            if 'courses' in data:
                print(f"Number of enrolled courses: {len(data['courses'])}")
                
                for i, course in enumerate(data['courses']):
                    print(f"\nCourse {i+1}:")
                    print(f"  - Enrollment ID: {course.get('id')}")
                    print(f"  - Course Type: {course.get('course_type')}")
                    print(f"  - Progress: {course.get('progress_percentage')}%")
                    
                    if course.get('school_course'):
                        sc = course['school_course']
                        print(f"  - School Course: {sc.get('title')}")
                        print(f"  - Subject: {sc.get('subject')}")
                        print(f"  - Class: {sc.get('class_level')}")
                        print(f"  - Board: {sc.get('board')}")
                        print(f"  - Thumbnail: {sc.get('thumbnail', 'None')}")
                    
                    if course.get('engineering_course'):
                        ec = course['engineering_course']
                        print(f"  - Engineering Course: {ec.get('title')}")
                        print(f"  - Subject: {ec.get('subject')}")
                        print(f"  - Proficiency: {ec.get('proficiency')}")
                        print(f"  - Thumbnail: {ec.get('thumbnail', 'None')}")
            else:
                print("❌ No 'courses' key in response")
                print(f"Response: {json.dumps(data, indent=2)}")
                
        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"Response text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        print(f"Raw response: {response.text}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    test_enrolled_courses_api()
