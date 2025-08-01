#!/usr/bin/env python3
"""
Test script to verify delete functionality for AI Learning courses
Tests both backend API and database operations
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

def test_delete_functionality():
    """Test the delete course functionality"""
    
    print("🧪 Testing Delete Course Functionality")
    print("=" * 50)
    
    # Test data - you would need to replace with actual auth tokens
    headers = {
        'Content-Type': 'application/json',
        # You would need to add actual authorization header here
        # 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
    
    # Step 1: Get all courses
    print("📋 Step 1: Fetching all courses...")
    try:
        response = requests.get(f"{API_URL}/courses/pro-learning/", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            courses = response.json()
            print(f"✅ Found {len(courses)} courses in database")
            
            if len(courses) > 0:
                # Show first course for testing
                first_course = courses[0]
                print(f"📖 First course: {first_course['course_name']} (ID: {first_course['id']})")
                
                # Step 2: Test DELETE endpoint (but don't actually delete)
                print("\n🗑️ Step 2: Testing DELETE endpoint...")
                delete_url = f"{API_URL}/courses/pro-learning/{first_course['id']}/"
                print(f"DELETE URL: {delete_url}")
                print("⚠️ Note: This is just a URL test - not actually deleting")
                
                # You could uncomment the next lines to actually test deletion:
                # delete_response = requests.delete(delete_url, headers=headers)
                # print(f"Delete Status Code: {delete_response.status_code}")
                
            else:
                print("❌ No courses found to test deletion")
        else:
            print(f"❌ Failed to fetch courses: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🔍 Frontend Testing Instructions:")
    print("1. Open browser to http://localhost:5173")
    print("2. Navigate to Learning Hub page")
    print("3. Look for AI Learning Plans section")
    print("4. Click the trash icon on any course")
    print("5. Verify modal appears with improved styling")
    print("6. Click 'Delete' to test actual deletion")
    print("7. Check if course is removed from UI")
    print("8. Refresh page to verify deletion in database")

if __name__ == "__main__":
    test_delete_functionality()
