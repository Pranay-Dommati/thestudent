#!/usr/bin/env python
"""
Test script to check why the topics count is 0 for the new course
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import AILearningCourse, AITopicContent
from django.contrib.auth import get_user_model

User = get_user_model()

def check_course_topics():
    """Check the topics count for the new course"""
    print("=== Checking Course Topics Count ===\n")
    
    # Find the course with identifier "course_1753767558246_a5qtgx6br7k"
    try:
        course = AILearningCourse.objects.get(course_identifier="course_1753767558246_a5qtgx6br7k")
        print(f"✅ Found course: {course.course_title}")
        print(f"   Course ID: {course.id}")
        print(f"   Course Identifier: {course.course_identifier}")
        print(f"   User: {course.user.email if course.user else 'No User'}")
        print(f"   Created: {course.created_at}")
        
        # Check topics_list JSON field
        print(f"\n📋 Topics List (JSON field):")
        if course.topics_list:
            print(f"   Count: {len(course.topics_list)}")
            for i, topic in enumerate(course.topics_list, 1):
                print(f"   {i}. {topic}")
        else:
            print("   ❌ No topics in topics_list JSON field")
        
        # Check linked AITopicContent records
        print(f"\n🔗 Linked AITopicContent Records:")
        linked_topics = course.topic_contents.all()
        print(f"   Count: {linked_topics.count()}")
        
        if linked_topics.exists():
            for topic in linked_topics:
                print(f"   - {topic.topic_name} (Created: {topic.created_at})")
        else:
            print("   ❌ No AITopicContent records linked to this course")
            print("   💡 This is why the topics count shows 0!")
        
        # Check if there are any AITopicContent records for this user that could be linked
        print(f"\n🔍 All AITopicContent for user {course.user.email}:")
        all_user_topics = AITopicContent.objects.filter(user=course.user)
        print(f"   Total topics by this user: {all_user_topics.count()}")
        
        unlinked_topics = all_user_topics.filter(ai_course__isnull=True)
        print(f"   Unlinked topics: {unlinked_topics.count()}")
        
        if unlinked_topics.exists():
            print("   📝 Unlinked topics that could potentially be linked:")
            for topic in unlinked_topics:
                print(f"      - {topic.topic_name} (Course Title: {topic.course_title})")
        
        # Explanation
        print(f"\n💡 Explanation:")
        print(f"   The 'topics_count' in admin now shows ACTUAL linked AITopicContent records")
        print(f"   The 'planned_topics_count' shows the JSON topics_list count")
        print(f"   Your course shows 0 because no AITopicContent records are linked to it yet")
        print(f"   Topics are only linked when they're saved using the new saveAITopicContentWithCourse API")
        
    except AILearningCourse.DoesNotExist:
        print("❌ Course not found with that identifier")
        
        # Show all courses
        print(f"\n📋 All AI Learning Courses:")
        all_courses = AILearningCourse.objects.all()
        for course in all_courses:
            print(f"   - {course.course_title} (ID: {course.course_identifier})")

if __name__ == '__main__':
    check_course_topics()
