#!/usr/bin/env python3
"""
Test script to simulate what the frontend sends in auto-save
"""
import json
import requests

# Simulate the payload that would be sent by frontend auto-save
test_payload = {
    "course_name": "test_course_debug_789_latest",
    "title": "Debug Test Course New",
    "topics": {
        "Test Topic 1": {
            "content": {
                "reading": "This is test reading material for topic 1. It contains detailed information about the subject matter.",
                "summary": "This is a test summary for topic 1. It summarizes the key points.",
                "videos": [],
                "quiz": [],
                "resources": []
            }
        },
        "Test Topic 2": {
            "content": {
                "reading": "This is test reading material for topic 2. Another comprehensive section.",
                "summary": "This is a test summary for topic 2. Key takeaways listed here.",
                "videos": [],
                "quiz": [],
                "resources": []
            }
        }
    }
}

print("🧪 Testing auto-save payload...")
print("📦 Payload structure:")
print(json.dumps(test_payload, indent=2))

# Send to backend
try:
    response = requests.post(
        'http://localhost:8000/api/courses/pro-learning/save-course/',
        json=test_payload,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"\n📡 Response Status: {response.status_code}")
    print(f"📡 Response Data: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Test payload successfully saved!")
    else:
        print("❌ Test payload failed to save")
        
except Exception as e:
    print(f"❌ Error sending test payload: {e}")
