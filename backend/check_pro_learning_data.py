#!/usr/bin/env python
import os
import sys
import django

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from courses.models import ProLearningCourse, ProLearningTopic

def check_pro_learning_data():
    print("=== Pro Learning Database Check ===\n")
    
    # Check courses
    courses = ProLearningCourse.objects.all()
    print(f"📚 Total Pro Learning Courses: {courses.count()}")
    
    # Check topics
    topics = ProLearningTopic.objects.all()
    print(f"📖 Total Pro Learning Topics: {topics.count()}")
    
    if courses.exists():
        print("\n=== Course Details ===")
        for course in courses:
            print(f"\n🎓 Course: {course.course_name}")
            print(f"   Description: {course.description[:100]}...")
            print(f"   User: {course.user.username if course.user else 'No user'}")
            print(f"   Created: {course.created_at}")
            
            course_topics = course.topics.all()
            print(f"   Topics: {course_topics.count()}")
            
            for topic in course_topics:
                print(f"\n   📝 Topic: {topic.topic_name}")
                
                # Check reading material
                reading_len = len(topic.reading_material) if topic.reading_material else 0
                print(f"      📖 Reading Material: {reading_len} characters")
                if reading_len > 0:
                    print(f"         Preview: {topic.reading_material[:100]}...")
                
                # Check summary
                summary_len = len(topic.summary) if topic.summary else 0
                print(f"      📝 Summary: {summary_len} characters")
                if summary_len > 0:
                    print(f"         Preview: {topic.summary[:100]}...")
                
                # Check related content
                print(f"      🎥 Videos: {topic.videos.count()}")
                print(f"      ❓ Quiz Questions: {topic.quiz_questions.count()}")
                print(f"      🔗 Resources: {topic.resources.count()}")
    else:
        print("\n❌ No Pro Learning courses found in database")

if __name__ == "__main__":
    check_pro_learning_data()
