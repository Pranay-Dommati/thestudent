#!/usr/bin/env python
"""
Test script for AI Course API endpoints
This tests the REST API endpoints for the AI course system
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_ai_course_api():
    """Test the AI course API endpoints"""
    print("=== Testing AI Course API Endpoints ===\n")
    
    # Test 1: Get all AI learning courses
    print("1. Testing GET /api/courses/ai-learning-courses/")
    try:
        response = requests.get(f"{BASE_URL}/api/courses/ai-learning-courses/")
        print(f"   Status: {response.status_code}")  
        if response.status_code == 200:
            courses = response.json()
            print(f"   Found {len(courses)} AI courses")
            for course in courses:
                print(f"   - {course['course_title']} (ID: {course['course_identifier']})")
        else:
            print(f"   Error: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Error: Could not connect to Django server")
        return
    
    # Test 2: Get AI topic content
    print("\n2. Testing GET /api/courses/ai-topic-content/")
    try:
        response = requests.get(f"{BASE_URL}/api/courses/ai-topic-content/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            topics = response.json()
            print(f"   Found {len(topics)} AI topic contents")
            for topic in topics:
                print(f"   - {topic['topic_name']} (Course: {topic.get('ai_course', 'None')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Test create_or_get_ai_course endpoint
    print("\n3. Testing POST /api/courses/create-or-get-ai-course/")
    test_course_data = {
        'course_identifier': 'test-ai-course-api',
        'course_title': 'Test AI Course via API',
        'description': 'Testing the course creation endpoint',
        'topics_list': ['Topic A', 'Topic B', 'Topic C']
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/courses/create-or-get-ai-course/",
            json=test_course_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            result = response.json()
            course = result['course']
            created = result['created']
            print(f"   ✅ Course {'created' if created else 'retrieved'}: {course['course_title']}")
            print(f"   Course ID: {course['id']}")
            print(f"   URL: {course['course_url']}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n=== API Testing Complete ===")

if __name__ == '__main__':
    test_ai_course_api()
