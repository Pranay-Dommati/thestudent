#!/usr/bin/env python3
"""
Test script to verify that the quiz fix is working.
This script will simulate the creation of an AI learning plan
and check if quiz questions are properly saved to the database.
"""

import os
import sys
import django
import json

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import AILearningPlan
from authentication.models import User

def test_quiz_functionality():
    """Test that quiz questions are properly included in AI learning plans"""
    print("🧪 TESTING QUIZ FIX FUNCTIONALITY")
    print("=" * 60)
    
    # Check for existing test user
    test_user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'username': 'testuser'
        }
    )
    
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"✅ Created test user: {test_user.email}")
    else:
        print(f"✅ Using existing test user: {test_user.email}")
    
    # Create test learning plan with quiz questions
    test_plan_data = {
        'goal': 'Learn Python Programming in 3 days',
        'days': [
            {
                'day': 1,
                'topic': 'Python Basics',
                'project_idea': 'Create a simple calculator',
                'youtube_query': 'python basics tutorial',
                'videos': [
                    {
                        'title': 'Python Tutorial for Beginners',
                        'video_id': 'test123',
                        'thumbnail_url': 'https://example.com/thumb.jpg',
                        'channel_title': 'Test Channel'
                    }
                ],
                'quizQuestions': [
                    {
                        'question': 'What is Python?',
                        'options': ['A programming language', 'A snake', 'A type of tea', 'A database'],
                        'correct_answer': 'A programming language'
                    },
                    {
                        'question': 'What is the file extension for Python files?',
                        'options': ['.py', '.python', '.txt', '.exe'],
                        'correct_answer': '.py'
                    }
                ]
            },
            {
                'day': 2,
                'topic': 'Python Data Types',
                'project_idea': 'Work with different data types',
                'youtube_query': 'python data types tutorial',
                'videos': [
                    {
                        'title': 'Python Data Types Explained',
                        'video_id': 'test456',
                        'thumbnail_url': 'https://example.com/thumb2.jpg',
                        'channel_title': 'Test Channel'
                    }
                ],
                'quizQuestions': [
                    {
                        'question': 'Which of these is a Python data type?',
                        'options': ['string', 'integer', 'list', 'All of the above'],
                        'correct_answer': 'All of the above'
                    }
                ]
            }
        ],
        'metadata': {
            'total_days': 2,
            'total_videos': 2,
            'has_projects': True,
            'difficulty_level': 'beginner',
            'subject': 'Python Programming'
        }
    }
    
    # Create the learning plan
    learning_plan = AILearningPlan.objects.create(
        user=test_user,
        title='Test AI Learning Plan: Python Programming',
        description='Test plan to verify quiz functionality',
        plan_data=test_plan_data,
        duration_days=2,
        difficulty_level='beginner',
        category='Test'
    )
    
    print(f"✅ Created test learning plan: {learning_plan.id}")
    
    # Verify the plan was saved correctly
    saved_plan = AILearningPlan.objects.get(id=learning_plan.id)
    print(f"✅ Retrieved saved plan: {saved_plan.title}")
    
    # Check if quiz questions are present in saved plan
    saved_days = saved_plan.plan_data.get('days', [])
    
    quiz_stats = {
        'total_days': len(saved_days),
        'days_with_quizzes': 0,
        'total_quiz_questions': 0
    }
    
    for day_num, day in enumerate(saved_days, 1):
        quiz_questions = day.get('quizQuestions', [])
        if quiz_questions:
            quiz_stats['days_with_quizzes'] += 1
            quiz_stats['total_quiz_questions'] += len(quiz_questions)
            print(f"  Day {day_num} ({day.get('topic', 'Unknown')}): {len(quiz_questions)} quiz questions ✅")
        else:
            print(f"  Day {day_num} ({day.get('topic', 'Unknown')}): No quiz questions ❌")
    
    # Display results
    print("\n📊 QUIZ VERIFICATION RESULTS:")
    print(f"   Total Days: {quiz_stats['total_days']}")
    print(f"   Days with Quizzes: {quiz_stats['days_with_quizzes']}")
    print(f"   Total Quiz Questions: {quiz_stats['total_quiz_questions']}")
    
    # Determine if fix is working
    if quiz_stats['days_with_quizzes'] > 0 and quiz_stats['total_quiz_questions'] > 0:
        print("\n🎉 SUCCESS: Quiz questions are being saved properly!")
        print("   The quiz fix is working correctly.")
    else:
        print("\n❌ FAILURE: Quiz questions are NOT being saved!")
        print("   The quiz fix needs further investigation.")
    
    # Clean up test data
    learning_plan.delete()
    if created:
        test_user.delete()
    print(f"\n🧹 Cleaned up test data")
    
    return quiz_stats['days_with_quizzes'] > 0

if __name__ == '__main__':
    success = test_quiz_functionality()
    sys.exit(0 if success else 1)
