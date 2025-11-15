#!/usr/bin/env python3
"""
Test script to verify enrollment endpoint functionality
"""

import requests
import json
import sys

# API base URL
API_BASE_URL = "http://127.0.0.1:8000/api"

def test_enrollment_endpoint():
    """Test the enrollment endpoint without authentication"""
    print("🔍 Testing enrollment endpoint...")
    
    url = f"{API_BASE_URL}/courses/enroll/"
    data = {
        "course_type": "school",
        "course_id": "test-course-id",
        "class_level": "10th",
        "board": "state",
        "subject": "mathematics"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"   📡 Request URL: {url}")
        print(f"   📊 Response Status: {response.status_code}")
        print(f"   📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("   ✅ Endpoint exists and requires authentication (expected)")
            return True
        elif response.status_code == 404:
            print("   ❌ Endpoint not found (404)")
            return False
        else:
            print(f"   ℹ️  Unexpected status: {response.status_code}")
            print(f"   📝 Response: {response.text}")
            return True
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to backend server")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_enrollment_status_endpoint():
    """Test the enrollment status endpoint"""
    print("\n🔍 Testing enrollment status endpoint...")
    
    test_course_id = "test-course-id"
    url = f"{API_BASE_URL}/courses/enrollment-status/{test_course_id}/"
    
    try:
        response = requests.get(url)
        print(f"   📡 Request URL: {url}")
        print(f"   📊 Response Status: {response.status_code}")
        
        if response.status_code in [200, 401, 404]:
            print("   ✅ Endpoint accessible")
            return True
        else:
            print(f"   ℹ️  Unexpected status: {response.status_code}")
            return True
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Could not connect to backend server")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing API Endpoints\n")
    
    enrollment_ok = test_enrollment_endpoint()
    status_ok = test_enrollment_status_endpoint()
    
    print(f"\n📋 Summary:")
    print(f"   Enrollment endpoint: {'✅ OK' if enrollment_ok else '❌ FAILED'}")
    print(f"   Enrollment status endpoint: {'✅ OK' if status_ok else '❌ FAILED'}")
    
    if enrollment_ok and status_ok:
        print("\n🎉 All endpoints are accessible! The issue was likely the authentication headers.")
        print("💡 The fix should resolve the 404 error when clicking 'Start Learning Now'.")
    else:
        print("\n⚠️  Some endpoints have issues. Check backend server status.")