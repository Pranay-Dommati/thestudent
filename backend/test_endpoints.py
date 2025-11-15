"""
Diagnostic script to test backend endpoints and identify issues
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from courses.views import list_engineering_courses, enrollment_status, start_predefined_course
from backend.ai.views import create_course_topics
import json

User = get_user_model()
factory = RequestFactory()

def test_engineering_courses():
    """Test the engineering courses endpoint"""
    print("\n" + "="*60)
    print("Testing /api/courses/engineering/?category=all")
    print("="*60)
    try:
        request = factory.get('/api/courses/engineering/', {'category': 'all'})
        # Mock DRF request object
        from rest_framework.request import Request
        drf_request = Request(request)
        response = list_engineering_courses(drf_request)
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.data
            print(f"✅ Returned {len(data)} courses")
        else:
            print(f"❌ Error: {response.data}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()

def test_enrollment_status():
    """Test enrollment status endpoint"""
    print("\n" + "="*60)
    print("Testing /api/courses/enrollment-status/<course_id>/")
    print("="*60)
    try:
        # Get a test user
        user = User.objects.first()
        if not user:
            print("❌ No users found in database")
            return
        
        # Get a test course ID
        from courses.models import SchoolCourse
        course = SchoolCourse.objects.first()
        if not course:
            print("❌ No courses found in database")
            return
        
        request = factory.get(f'/api/courses/enrollment-status/{course.id}/')
        request.user = user
        from rest_framework.request import Request
        drf_request = Request(request)
        drf_request.user = user
        
        response = enrollment_status(drf_request, str(course.id))
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Response: {response.data}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()

def test_create_course_topics():
    """Test create course topics endpoint"""
    print("\n" + "="*60)
    print("Testing /ai/create-course-topics/")
    print("="*60)
    try:
        user = User.objects.first()
        if not user:
            print("❌ No users found in database")
            return
        
        test_data = {
            'topics': [
                {'id': 1, 'name': 'Introduction to Python', 'isActive': True},
                {'id': 2, 'name': 'Python Data Types', 'isActive': True}
            ]
        }
        
        request = factory.post(
            '/ai/create-course-topics/',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        request.user = user
        
        response = create_course_topics(request)
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Response: {json.loads(response.content)}")
        else:
            print(f"❌ Error: {json.loads(response.content)}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()

def test_database_connectivity():
    """Test database connectivity and models"""
    print("\n" + "="*60)
    print("Testing Database Connectivity")
    print("="*60)
    try:
        from courses.models import EngineeringCourse, SchoolCourse
        eng_count = EngineeringCourse.objects.count()
        school_count = SchoolCourse.objects.count()
        user_count = User.objects.count()
        
        print(f"✅ Engineering Courses: {eng_count}")
        print(f"✅ School Courses: {school_count}")
        print(f"✅ Users: {user_count}")
        
        if eng_count > 0:
            course = EngineeringCourse.objects.first()
            print(f"\nSample Engineering Course:")
            print(f"  - ID: {course.id}")
            print(f"  - Title: {course.title}")
            print(f"  - Category: {course.category}")
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n🔍 BACKEND DIAGNOSTIC TEST")
    print("="*60)
    
    test_database_connectivity()
    test_engineering_courses()
    test_enrollment_status()
    test_create_course_topics()
    
    print("\n" + "="*60)
    print("✅ Diagnostic tests completed!")
    print("="*60)
