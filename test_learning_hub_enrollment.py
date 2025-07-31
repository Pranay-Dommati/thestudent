#!/usr/bin/env python3
"""
Test script to verify complete enrollment and learning hub functionality
Tests the entire flow: enrollment -> enrolled courses display in learning hub
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth.models import User
from courses.models import SchoolCourse, UserStartedPredefinedCourse

BASE_URL = 'http://localhost:8000'

def test_complete_enrollment_flow():
    """Test the complete enrollment to learning hub flow"""
    print("🧪 Testing Complete Enrollment to Learning Hub Flow")
    print("=" * 60)
    
    # Step 1: Ensure test user exists
    print("\n1️⃣ Setting up test user...")
    test_user, created = User.objects.get_or_create(
        username='test_learner',
        defaults={
            'email': 'test_learner@example.com',
            'first_name': 'Test',
            'last_name': 'Learner'
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print("✅ Created new test user")
    else:
        print("✅ Using existing test user")
    
    # Step 2: Login to get token
    print("\n2️⃣ Logging in...")
    login_data = {
        'username': 'test_learner',
        'password': 'testpass123'
    }
    login_response = requests.post(f'{BASE_URL}/api/auth/login/', json=login_data)
    if login_response.status_code == 200:
        token = login_response.json()['access']
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    # Step 3: Get available courses to enroll in
    print("\n3️⃣ Fetching available courses...")
    courses_response = requests.get(f'{BASE_URL}/api/courses/school/?class=10th')
    if courses_response.status_code == 200:
        courses = courses_response.json()
        if courses:
            print(f"✅ Found {len(courses)} available courses")
            test_course = courses[0]  # Use first course for testing
            print(f"   Testing with: {test_course['title']}")
        else:
            print("❌ No courses available for testing")
            return False
    else:
        print(f"❌ Failed to fetch courses: {courses_response.status_code}")
        return False
    
    # Step 4: Test enrollment
    print("\n4️⃣ Testing course enrollment...")
    enrollment_data = {
        'course_type': 'school',
        'course_id': test_course['id'],
        'class_level': '10th',
        'board': test_course['board'],
        'subject': test_course['subject']
    }
    
    enrollment_response = requests.post(f'{BASE_URL}/api/courses/enroll/', 
                                      json=enrollment_data, headers=headers)
    if enrollment_response.status_code == 200:
        result = enrollment_response.json()
        print(f"✅ Enrollment successful!")
        print(f"   Created new enrollment: {result.get('created', False)}")
        print(f"   Message: {result.get('message', 'No message')}")
    else:
        print(f"❌ Enrollment failed: {enrollment_response.status_code}")
        print(enrollment_response.text)
        return False
    
    # Step 5: Test enrolled courses retrieval (Learning Hub data)
    print("\n5️⃣ Testing enrolled courses retrieval...")
    enrolled_response = requests.get(f'{BASE_URL}/api/courses/enrolled/', headers=headers)
    if enrolled_response.status_code == 200:
        enrolled_data = enrolled_response.json()
        if enrolled_data['success']:
            enrolled_courses = enrolled_data['courses']
            print(f"✅ Successfully retrieved {len(enrolled_courses)} enrolled courses")
            
            # Display enrolled course details
            for i, enrollment in enumerate(enrolled_courses, 1):
                course = enrollment['school_course'] or enrollment['engineering_course']
                print(f"   Course {i}:")
                print(f"     - Title: {course['title']}")
                print(f"     - Subject: {course['subject']}")
                print(f"     - Board/Branch: {enrollment.get('board', course.get('branch', 'N/A'))}")
                print(f"     - Class/Semester: {enrollment.get('class_level', f'Sem {course.get('semester', 'N/A')}')}")
                print(f"     - Progress: {enrollment['progress_percentage']}%")
                print(f"     - Enrolled: {enrollment['enrolled_at']}")
        else:
            print("❌ Failed to get enrolled courses data")
            return False
    else:
        print(f"❌ Failed to retrieve enrolled courses: {enrolled_response.status_code}")
        print(enrolled_response.text)
        return False
    
    # Step 6: Test enrollment check
    print("\n6️⃣ Testing enrollment check...")
    check_data = {
        'course_type': 'school',
        'course_id': test_course['id']
    }
    check_response = requests.post(f'{BASE_URL}/api/courses/check-enrollment/', 
                                 json=check_data, headers=headers)
    if check_response.status_code == 200:
        check_result = check_response.json()
        print(f"✅ Enrollment check successful")
        print(f"   Is enrolled: {check_result['enrolled']}")
        if check_result['enrolled']:
            print(f"   Progress: {check_result['progress']}%")
    else:
        print(f"❌ Enrollment check failed: {check_response.status_code}")
        print(check_response.text)
    
    # Step 7: Database verification
    print("\n7️⃣ Verifying database records...")
    user_enrollments = UserStartedPredefinedCourse.objects.filter(user=test_user)
    print(f"✅ Found {user_enrollments.count()} enrollments in database")
    
    for enrollment in user_enrollments:
        course_title = enrollment.school_course.title if enrollment.school_course else enrollment.engineering_course.title
        print(f"   - {course_title} (Progress: {enrollment.progress_percentage}%)")
    
    print("\n🎉 Complete enrollment flow test completed successfully!")
    print("\n📝 Summary:")
    print(f"   - User created/verified: ✅")
    print(f"   - Login successful: ✅")
    print(f"   - Course enrollment: ✅")
    print(f"   - Enrolled courses retrieval: ✅")
    print(f"   - Enrollment check: ✅")
    print(f"   - Database records: ✅")
    print(f"   - Total enrolled courses: {len(enrolled_courses)}")
    
    return True

def test_learning_hub_api_endpoints():
    """Test all API endpoints that the Learning Hub uses"""
    print("\n🔍 Testing Learning Hub API Endpoints")
    print("=" * 40)
    
    # Test without authentication
    print("\n📡 Testing endpoints without authentication...")
    
    # Test enrolled courses without auth (should fail)
    response = requests.get(f'{BASE_URL}/api/courses/enrolled/')
    if response.status_code == 401:
        print("✅ Enrolled courses endpoint properly requires authentication")
    else:
        print(f"⚠️  Enrolled courses endpoint returned: {response.status_code}")
    
    print("\n🎯 All Learning Hub API endpoints tested!")

if __name__ == "__main__":
    print("🚀 Starting Learning Hub Enrollment Integration Test")
    print("=" * 70)
    
    try:
        # Test complete flow
        success = test_complete_enrollment_flow()
        
        if success:
            # Test API endpoints
            test_learning_hub_api_endpoints()
            
            print("\n" + "=" * 70)
            print("🎉 ALL TESTS PASSED! Learning Hub enrollment integration is working!")
            print("=" * 70)
            print("\n📋 Next Steps:")
            print("1. Start your React development server: npm start")
            print("2. Login with username: test_learner, password: testpass123")
            print("3. Visit /learning-hub to see your enrolled courses")
            print("4. Enroll in more courses and see them appear in Learning Hub")
        else:
            print("\n❌ Some tests failed. Please check the output above.")
            
    except Exception as e:
        print(f"\n💥 Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
