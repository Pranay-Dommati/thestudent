#!/usr/bin/env python3

import requests
import json

# Test the complete enrollment flow with authentication
API_URL = 'http://localhost:8000'

def test_enrollment_flow():
    print("=== Testing Complete Enrollment Flow ===")
    
    # Step 1: Test login to get a valid JWT token
    print("\n1. Testing user authentication...")
    
    login_data = {
        "email": "test@example.com",  # Using the test user we just created
        "password": "testpass123"
    }
    
    try:
        # Try to login
        login_response = requests.post(
            f"{API_URL}/api/auth/login/",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login Response Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print("✅ Login successful!")
            print(f"User: {login_result.get('user', {}).get('email', 'Unknown')}")
            
            # Extract the token
            token = login_result.get('access')
            if not token:
                print("❌ No access token in response")
                print(f"Available keys: {list(login_result.keys())}")
                return False
            
            print(f"🔑 Token received: {token[:20]}...")
            
            # Step 2: Test enrollment with valid token
            print("\n2. Testing course enrollment...")
            
            enrollment_data = {
                "course_type": "school",
                "course_id": "5f78d0bd-f492-488c-b369-00c84c55d8ef",  # Hindi course ID
                "class_level": "10th",
                "board": "state",
                "subject": "Hindi"
            }
            
            enrollment_response = requests.post(
                f"{API_URL}/api/courses/enroll/",
                json=enrollment_data,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            
            print(f"Enrollment Response Status: {enrollment_response.status_code}")
            
            if enrollment_response.status_code in [200, 201]:
                enrollment_result = enrollment_response.json()
                print("✅ Enrollment successful!")
                print(f"Result: {json.dumps(enrollment_result, indent=2)}")
                return True
            else:
                print(f"❌ Enrollment failed: {enrollment_response.text}")
                return False
                
        elif login_response.status_code == 401:
            print("❌ Invalid credentials - need to check user password")
            return False
        else:
            print(f"❌ Login failed: {login_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_enrollment_in_db():
    """Check if enrollment was actually saved to database"""
    print("\n3. Checking database for enrollment record...")
    
    import os
    import sys
    import django
    
    # Add the backend directory to the Python path
    backend_path = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(backend_path)
    
    # Set up Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    
    from courses.models import UserStartedPredefinedCourse
    from authentication.models import User
    
    try:
        # Get the user
        user = User.objects.get(email="test@example.com")
        print(f"✅ Found user: {user.email}")
        
        # Check enrollments
        enrollments = UserStartedPredefinedCourse.objects.filter(user=user)
        print(f"📊 User has {enrollments.count()} course enrollments:")
        
        for enrollment in enrollments:
            print(f"- Course: {enrollment.get_course_title()}")
            print(f"  Type: {enrollment.course_type}")
            print(f"  Progress: {enrollment.progress_percentage}%")
            print(f"  Started: {enrollment.started_at}")
        
        if enrollments.count() > 0:
            print("✅ Enrollment records found in database!")
            return True
        else:
            print("⚠️ No enrollment records found")
            return False
            
    except User.DoesNotExist:
        print("❌ User not found in database")
        return False
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    # Test the API flow
    api_success = test_enrollment_flow()
    
    # Check database
    if api_success:
        db_success = check_enrollment_in_db()
        
        if api_success and db_success:
            print("\n🎉 COMPLETE SUCCESS! Enrollment system is working correctly!")
        else:
            print("\n⚠️ API worked but database check failed")
    else:
        print("\n❌ API test failed")
    
    print("\n=== Test Complete ===")
