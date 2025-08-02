#!/usr/bin/env python3
"""
Test script to check course image URLs from the API
"""

import requests
import json

def test_course_images():
    # Replace with your actual API URL and token
    API_URL = "http://localhost:8000"
    
    # You'll need to get a valid token from your browser's localStorage
    # For now, we'll test without authentication to see the structure
    print("🧪 Testing Course Images API")
    print("=" * 50)
    
    try:
        # Test the enrolled courses endpoint
        response = requests.get(f"{API_URL}/api/courses/enrolled/")
        
        if response.status_code == 401:
            print("❌ Authentication required. Please check your token.")
            print("💡 To get your token:")
            print("   1. Open browser dev tools (F12)")
            print("   2. Go to Application/Local Storage")
            print("   3. Find 'accessToken' value")
            return
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response Status: {response.status_code}")
            print(f"📊 Response keys: {list(data.keys())}")
            
            if 'courses' in data:
                courses = data['courses']
                print(f"📚 Found {len(courses)} enrolled courses")
                
                for i, enrollment in enumerate(courses):
                    print(f"\n📖 Course {i+1}:")
                    print(f"   Enrollment ID: {enrollment.get('id')}")
                    
                    # Check for school course
                    if 'school_course' in enrollment and enrollment['school_course']:
                        course = enrollment['school_course']
                        print(f"   Type: School Course")
                        print(f"   Title: {course.get('title')}")
                        print(f"   Thumbnail: {course.get('thumbnail')}")
                    
                    # Check for engineering course
                    elif 'engineering_course' in enrollment and enrollment['engineering_course']:
                        course = enrollment['engineering_course']
                        print(f"   Type: Engineering Course")
                        print(f"   Title: {course.get('title')}")
                        print(f"   Thumbnail: {course.get('thumbnail')}")
            else:
                print("❌ No 'courses' key found in response")
                print(f"📄 Full response: {json.dumps(data, indent=2)}")
        
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_course_images()
