#!/usr/bin/env python3

import requests
import json

# Test the course enrollment API endpoint
API_URL = 'http://localhost:8000'

# Test data for enrolling in a school course
test_enrollment_data = {
    "course_type": "school",
    "course_id": "5f78d0bd-f492-488c-b369-00c84c55d8ef",  # Hindi course ID from our test
    "class_level": "10th",
    "board": "state", 
    "subject": "Hindi"
}

print("=== Testing Course Enrollment API ===")
print(f"Target URL: {API_URL}/api/courses/enroll/")
print(f"Test data: {json.dumps(test_enrollment_data, indent=2)}")

# You would need a valid JWT token for this to work
# For now, let's just test if the endpoint exists
try:
    response = requests.post(
        f"{API_URL}/api/courses/enroll/",
        json=test_enrollment_data,
        headers={
            'Content-Type': 'application/json',
            # 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'  # Would need real token
        }
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 401:
        print("✅ Endpoint exists but requires authentication (expected)")
        print("Response:", response.json())
    else:
        print("Response:", response.json())
        
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to server. Make sure Django server is running on port 8000")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n=== API Test Complete ===")
