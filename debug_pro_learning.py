#!/usr/bin/env python3
"""
Debug script to check Pro Learning courses in database
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import ProLearningCourse, ProLearningTopic

def debug_pro_learning():
    print("=== Pro Learning Database Debug ===\n")
    
    # Check courses
    courses = ProLearningCourse.objects.all()
    print(f"📊 Total Pro Learning Courses: {courses.count()}")
    
    if courses.exists():
        print("\n📚 Courses Found:")
        for course in courses:
            print(f"  • ID: {course.id}")
            print(f"    Title: {course.title}")
            print(f"    Course Name: {course.course_name}")
            print(f"    Created: {course.created_at}")
            print(f"    Topics: {course.topics.count()}")
            
            # Show topics
            topics = course.topics.all()
            if topics.exists():
                print(f"    📝 Topics:")
                for topic in topics:
                    print(f"      - {topic.name}")
                    print(f"        Reading: {'✅' if topic.reading_material else '❌'}")
                    print(f"        Summary: {'✅' if topic.summary else '❌'}")
                    print(f"        Videos: {topic.videos.count()}")
                    print(f"        Quiz: {topic.quiz_questions.count()}")
                    print(f"        Resources: {topic.resources.count()}")
            print()
    else:
        print("❌ No Pro Learning courses found in database")
        print("\n🔍 Possible issues:")
        print("  1. Auto-save is not being called")
        print("  2. Auto-save is failing silently")
        print("  3. Authentication token is missing")
        print("  4. Django server is not running")
        print("  5. Proxy configuration issue")
    
    print("\n=== Debug Complete ===")

if __name__ == "__main__":
    debug_pro_learning()
