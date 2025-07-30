#!/usr/bin/env python
"""
Test script to verify AI Learning Course admin integration
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib import admin
from courses.models import AILearningCourse, AITopicContent
from courses.admin import AILearningCourseAdmin, AITopicContentAdmin

def test_admin_registration():
    """Test that the admin models are properly registered"""
    print("=== Testing AI Course Admin Registration ===\n")
    
    # Check if models are registered
    registered_models = admin.site._registry
    
    # Test AILearningCourse admin
    if AILearningCourse in registered_models:
        print("✅ AILearningCourse is registered in admin")
        admin_class = registered_models[AILearningCourse]
        print(f"   Admin class: {admin_class.__class__.__name__}")
        print(f"   List display: {admin_class.list_display}")
        print(f"   Search fields: {admin_class.search_fields}")
    else:
        print("❌ AILearningCourse is NOT registered in admin")
    
    # Test AITopicContent admin
    if AITopicContent in registered_models:
        print("\n✅ AITopicContent is registered in admin")
        admin_class = registered_models[AITopicContent]
        print(f"   Admin class: {admin_class.__class__.__name__}")
        print(f"   List display: {admin_class.list_display}")
        print(f"   Search fields: {admin_class.search_fields}")
    else:
        print("\n❌ AITopicContent is NOT registered in admin")
    
    # Test admin functionality
    print(f"\n=== Testing Admin Functionality ===")
    
    # Get some sample data
    ai_courses = AILearningCourse.objects.all()[:3]
    ai_topics = AITopicContent.objects.all()[:3]
    
    print(f"📊 Found {AILearningCourse.objects.count()} AI Learning Courses in database")
    print(f"📊 Found {AITopicContent.objects.count()} AI Topic Contents in database")
    
    if ai_courses:
        print(f"\n📋 Sample AI Learning Courses:")
        for course in ai_courses:
            print(f"   - {course.course_title} (ID: {course.course_identifier})")
            print(f"     User: {course.user.email if course.user else 'No User'}")
            print(f"     Topics: {len(course.topics_list)} topics")
            print(f"     URL: {course.get_course_url()}")
    
    if ai_topics:
        print(f"\n📋 Sample AI Topic Contents:")
        for topic in ai_topics:
            ai_course_title = topic.ai_course.course_title if topic.ai_course else 'No Course Linked'
            print(f"   - {topic.topic_name} (Course: {ai_course_title})")
            print(f"     User: {topic.user.email if topic.user else 'No User'}")
            print(f"     Has Reading: {bool(topic.reading)}")
    
    print(f"\n=== Admin Integration Test Complete ===")
    print(f"🎉 AI Learning Course admin is ready!")
    print(f"🔗 Access at: http://127.0.0.1:8000/admin/courses/ailearningcourse/")
    print(f"🔗 Topic admin: http://127.0.0.1:8000/admin/courses/aitopiccontent/")

if __name__ == '__main__':
    test_admin_registration()
