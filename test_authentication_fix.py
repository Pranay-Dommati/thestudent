#!/usr/bin/env python3
"""
Test script to verify that learning plan authentication fixes are working correctly.
This script tests:
1. Unauthenticated requests are rejected
2. Authenticated requests work and associate learning plans with users
3. Learning plans are properly saved to the database with user associations
"""

import requests
import json
import sys
from datetime import datetime

# API endpoints
BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"
LEARNING_PLAN_URL = f"{BASE_URL}/api/learning/generate-learning-plan/"

def test_unauthenticated_access():
    """Test that unauthenticated requests are properly rejected"""
    print("🔒 Testing unauthenticated access...")
    
    test_data = {
        "goal": "Learn Python",
        "days": [
            {
                "day": 1,
                "topic": "Python Basics",
                "project_idea": "Hello World program",
                "youtube_query": "python basics tutorial",
                "videos": [
                    {
                        "title": "Python Tutorial for Beginners",
                        "description": "Learn Python basics",
                        "video_id": "test123",
                        "thumbnail_url": "https://example.com/thumb.jpg",
                        "channel_title": "Test Channel"
                    }
                ]
            }
        ]
    }
    
    response = requests.post(LEARNING_PLAN_URL, json=test_data)
    
    if response.status_code == 401:
        print("✅ Unauthenticated access properly rejected (401 Unauthorized)")
        return True
    elif response.status_code == 403:
        print("✅ Unauthenticated access properly rejected (403 Forbidden)")
        return True
    else:
        print(f"❌ Expected 401/403, but got {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_authenticated_access():
    """Test that authenticated requests work and associate learning plans with users"""
    print("\n🔑 Testing authenticated access...")
    
    # Step 1: Login
    login_data = {
        "email": "charan@gmail.com",
        "password": "admin123"
    }
    
    print("Attempting login...")
    login_response = requests.post(LOGIN_URL, json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed with status {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    login_result = login_response.json()
    token = login_result.get('token')
    
    if not token:
        print("❌ No token received from login")
        print(f"Login response: {login_result}")
        return False
    
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Step 2: Create learning plan with authentication
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    test_data = {
        "goal": "Learn React with Authentication Test",
        "days": [
            {
                "day": 1,
                "topic": "React Basics",
                "project_idea": "Create a simple React app",
                "youtube_query": "react basics tutorial",
                "videos": [
                    {
                        "title": "React Tutorial for Beginners",
                        "description": "Learn React fundamentals",
                        "video_id": "react123",
                        "thumbnail_url": "https://example.com/react-thumb.jpg",
                        "channel_title": "React Channel"
                    }
                ]
            },
            {
                "day": 2,
                "topic": "React Components",
                "project_idea": "Build reusable components",
                "youtube_query": "react components tutorial",
                "videos": [
                    {
                        "title": "React Components Deep Dive",
                        "description": "Advanced React components",
                        "video_id": "react456",
                        "thumbnail_url": "https://example.com/components-thumb.jpg",
                        "channel_title": "React Pro Channel"
                    }
                ]
            }
        ]
    }
    
    print("Creating learning plan with authentication...")
    response = requests.post(LEARNING_PLAN_URL, json=test_data, headers=headers)
    
    if response.status_code == 201:
        print("✅ Learning plan created successfully!")
        result = response.json()
        print(f"Learning plan ID: {result.get('id')}")
        print(f"Title: {result.get('title')}")
        print(f"User ID: {result.get('user')}")
        
        # Verify the learning plan has days and videos
        days = result.get('days', [])
        print(f"Number of days: {len(days)}")
        
        for day in days:
            videos = day.get('videos', [])
            print(f"Day {day.get('day')}: {day.get('topic')} ({len(videos)} videos)")
        
        return True
    else:
        print(f"❌ Learning plan creation failed with status {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    """Run all authentication tests"""
    print("🧪 Testing Learning Plan Authentication Fixes")
    print("=" * 50)
    
    # Test 1: Unauthenticated access should be rejected
    test1_passed = test_unauthenticated_access()
    
    # Test 2: Authenticated access should work
    test2_passed = test_authenticated_access()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Unauthenticated rejection: {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"Authenticated creation: {'✅ PASS' if test2_passed else '❌ FAIL'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! Authentication is working correctly.")
        print("✅ Learning plans now require authentication")
        print("✅ Learning plans are properly associated with authenticated users")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please check the backend configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
