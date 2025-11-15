#!/usr/bin/env python3
"""
Debug script to test content retrieval and understand the payload structure
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import ProLearningCourse, ProLearningTopic
from django.contrib.auth.models import User

def debug_latest_course():
    """Debug the latest course to see actual content"""
    print("🔍 DEBUGGING LATEST COURSE CONTENT")
    print("=" * 50)
    
    try:
        # Get the latest course
        latest_course = ProLearningCourse.objects.latest('created_at')
        print(f"📚 Latest Course: {latest_course.course_name}")
        print(f"📝 Description: {latest_course.description}")
        print(f"👤 User: {latest_course.user.username}")
        print(f"📅 Created: {latest_course.created_at}")
        print()
        
        # Get all topics for this course
        topics = ProLearningTopic.objects.filter(course=latest_course).order_by('order')
        print(f"📖 Topics Count: {topics.count()}")
        print()
        
        for i, topic in enumerate(topics, 1):
            print(f"📌 Topic {i}: {topic.topic_name}")
            print(f"   📖 Reading Material: {len(topic.reading_material or '')} chars")
            print(f"   📝 Summary: {len(topic.summary or '')} chars")
            print(f"   🔢 Order: {topic.order}")
            
            # Show first 100 chars of each if they exist
            if topic.reading_material:
                print(f"   📖 Reading Preview: {topic.reading_material[:100]}...")
            else:
                print(f"   📖 Reading: EMPTY")
                
            if topic.summary:
                print(f"   📝 Summary Preview: {topic.summary[:100]}...")
            else:
                print(f"   📝 Summary: EMPTY")
            print()
            
    except ProLearningCourse.DoesNotExist:
        print("❌ No courses found in database")
    except Exception as e:
        print(f"❌ Error: {e}")

def simulate_payload_processing():
    """Simulate the payload processing that happens in the backend"""
    print("🧪 SIMULATING PAYLOAD PROCESSING")
    print("=" * 50)
    
    # Simulate the payload structure that should come from frontend
    sample_payload = {
        "course_name": "test-course-debug",
        "title": "Test Course Debug",
        "topics": {
            "Python Basics": {
                "content": {
                    "reading": "This is the reading material for Python Basics. It covers variables, data types, and basic syntax...",
                    "summary": "This topic introduces Python fundamentals including variables and basic syntax.",
                    "videos": [],
                    "quiz": [],
                    "resources": []
                },
                "reading": "Alternative reading field",
                "summary": "Alternative summary field"
            },
            "Functions": {
                "content": {
                    "reading": "Functions in Python allow you to organize code into reusable blocks...",
                    "summary": "Learn how to create and use functions in Python.",
                    "videos": [],
                    "quiz": [],
                    "resources": []
                }
            }
        }
    }
    
    print("📦 Sample payload structure:")
    print(f"   Course name: {sample_payload['course_name']}")
    print(f"   Title: {sample_payload['title']}")
    print(f"   Topics count: {len(sample_payload['topics'])}")
    print()
    
    # Process each topic like the backend does
    for topic_name, topic_content in sample_payload['topics'].items():
        print(f"🔄 Processing topic: {topic_name}")
        
        # Handle different data structures from frontend
        if 'content' in topic_content:
            # Frontend format with nested content
            content_data = topic_content['content']
            reading_material = content_data.get('reading', '') or content_data.get('readingMaterial', '')
            summary = content_data.get('summary', '') or content_data.get('topicSummary', '')
            videos = content_data.get('videos', [])
            quiz_questions = content_data.get('quiz', []) or content_data.get('quizQuestions', [])
            resources = content_data.get('resources', [])
        else:
            # Direct format (legacy support)
            reading_material = topic_content.get('readingMaterial', '') or topic_content.get('reading_material', '')
            summary = topic_content.get('summary', '') or topic_content.get('topicSummary', '')
            videos = topic_content.get('videos', [])
            quiz_questions = topic_content.get('quiz', []) or topic_content.get('quizQuestions', [])
            resources = topic_content.get('resources', [])
        
        print(f"   📖 Reading material: {len(reading_material)} chars")
        print(f"   📝 Summary: {len(summary)} chars")
        print(f"   🎥 Videos: {len(videos)}")
        print(f"   ❓ Quiz: {len(quiz_questions)}")
        print(f"   📎 Resources: {len(resources)}")
        
        if reading_material:
            print(f"   📖 Reading preview: {reading_material[:50]}...")
        if summary:
            print(f"   📝 Summary preview: {summary[:50]}...")
        print()

if __name__ == "__main__":
    debug_latest_course()
    print()
    simulate_payload_processing()
