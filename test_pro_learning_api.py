#!/usr/bin/env python3
"""
Test script to verify Pro Learning API functionality
"""

import requests
import json

# Test data
test_course_data = {
    "course_id": "test-course-123",
    "title": "Test AI Course",
    "topics": {
        "Introduction to AI": {
            "videos": [
                {"title": "What is AI?", "url": "https://example.com/video1"}
            ],
            "quizQuestions": [
                {
                    "question": "What does AI stand for?",
                    "options": ["Artificial Intelligence", "Automated Intelligence", "Advanced Intelligence", "None"],
                    "correct": 0
                }
            ],
            "resources": [
                {"title": "AI Basics PDF", "url": "https://example.com/pdf1"}
            ]
        }
    }
}

def test_api_endpoints():
    base_url = "http://localhost:8000"
    
    # Test if server is running
    try:
        response = requests.get(f"{base_url}/admin/", timeout=5)
        print(f"✅ Django server is running (status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Django server is not running: {e}")
        return False
    
    # Test Pro Learning API endpoint
    try:
        headers = {
            'Content-Type': 'application/json',
            # Note: This will fail without proper authentication, but we can check if endpoint exists
        }
        
        response = requests.post(
            f"{base_url}/api/courses/pro-learning/save-from-storage/",
            json=test_course_data,
            headers=headers,
            timeout=5
        )
        
        print(f"Pro Learning API endpoint status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 405:
            print("❌ Method not allowed - URL routing issue")
        elif response.status_code == 404:
            print("❌ Endpoint not found - URL pattern issue")
        else:
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API test failed: {e}")
    
    return True

if __name__ == "__main__":
    print("Testing Pro Learning API...")
    test_api_endpoints()
