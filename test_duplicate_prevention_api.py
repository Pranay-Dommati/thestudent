#!/usr/bin/env python
"""
Test script to verify API-level duplicate prevention for AI Learning Plans
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thestudent.settings')

# Change to backend directory for Django setup
original_cwd = os.getcwd()
os.chdir(backend_path)

django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from courses.models import AILearningPlan
import json

def test_api_duplicate_prevention():
    """Test API-level duplicate prevention"""
    print("🚀 TESTING API DUPLICATE PREVENTION")
    print("=" * 60)
    
    # Get test user
    User = get_user_model()
    user = User.objects.filter(email='sai@gmail.com').first()
    
    if not user:
        print("❌ Test user not found")
        return
    
    print(f"✅ Using test user: {user.email}")
    
    # Create Django test client
    client = Client()
    
    # Test data for learning plan
    test_data = {
        'title': 'API Test Learning Plan',
        'description': 'Test plan for API duplicate prevention',
        'category': 'Programming',
        'difficulty_level': 'Beginner',
        'duration_days': 7,
        'user_id': user.id
    }
    
    # Clear any existing test data
    AILearningPlan.objects.filter(user=user, title=test_data['title']).delete()
    
    print("\n🧪 Test 1: Create first learning plan via model...")
    try:
        # Create first plan directly via model
        plan1 = AILearningPlan.objects.create(
            title=test_data['title'],
            description=test_data['description'],
            category=test_data['category'],
            difficulty_level=test_data['difficulty_level'],
            duration_days=test_data['duration_days'],
            user=user,
            plan_data=json.dumps({
                "days": [
                    {
                        "day": 1,
                        "title": "Day 1: Introduction",
                        "videos": [
                            {
                                "title": "Intro Video",
                                "video_id": "test123",
                                "description": "Test video",
                                "thumbnail_url": "https://example.com/thumb.jpg",
                                "channel_title": "Test Channel"
                            }
                        ]
                    }
                ]
            })
        )
        print(f"   ✅ Created first plan: ID {plan1.id[:8]}...")
        
    except Exception as e:
        print(f"   ❌ Error creating first plan: {e}")
        return
    
    print("\n🧪 Test 2: Test model-level duplicate prevention...")
    try:
        # Try to create duplicate via model
        duplicate_plan = AILearningPlan.objects.create(
            title=test_data['title'],
            description=test_data['description'],
            category=test_data['category'],
            difficulty_level=test_data['difficulty_level'],
            duration_days=test_data['duration_days'],
            user=user,
            plan_data=json.dumps({"days": []})
        )
        print(f"   ❌ Duplicate creation succeeded (should have failed): ID {duplicate_plan.id[:8]}...")
        
    except Exception as e:
        print(f"   ✅ Duplicate prevented by database constraint: {str(e)[:100]}...")
    
    print("\n🧪 Test 3: Test create_with_duplicate_check method...")
    try:
        # Test the new create_with_duplicate_check method
        result = AILearningPlan.create_with_duplicate_check(
            title=test_data['title'],
            description=test_data['description'],
            category=test_data['category'],
            difficulty_level=test_data['difficulty_level'],
            duration_days=test_data['duration_days'],
            user=user,
            plan_data={"days": []}
        )
        
        if result['created']:
            print(f"   ❌ New plan created when it should have found existing: ID {result['plan'].id[:8]}...")
        else:
            print(f"   ✅ Found existing plan instead of creating duplicate: ID {result['plan'].id[:8]}...")
            
    except Exception as e:
        print(f"   ❌ Error in create_with_duplicate_check: {e}")
    
    print("\n🧪 Test 4: Test find_similar_plans method...")
    try:
        similar_plans = AILearningPlan.find_similar_plans(user, test_data['title'])
        print(f"   ✅ Found {len(similar_plans)} similar plans")
        for plan in similar_plans:
            print(f"      - {plan.title} (ID: {plan.id[:8]}...)")
            
    except Exception as e:
        print(f"   ❌ Error in find_similar_plans: {e}")
    
    print("\n🧹 Cleanup test data...")
    try:
        deleted_count = AILearningPlan.objects.filter(user=user, title=test_data['title']).delete()[0]
        print(f"   ✅ Cleaned up {deleted_count} test plans")
    except Exception as e:
        print(f"   ❌ Error during cleanup: {e}")

def test_youtube_video_extraction():
    """Test YouTube video data extraction"""
    print("\n🎥 TESTING YOUTUBE VIDEO EXTRACTION")
    print("=" * 60)
    
    # Get a user
    User = get_user_model()
    user = User.objects.filter(email='sai@gmail.com').first()
    
    if not user:
        print("❌ Test user not found")
        return
    
    # Get existing plans with video data
    plans = AILearningPlan.objects.filter(user=user)[:2]
    
    for plan in plans:
        print(f"\n📋 Plan: {plan.title}")
        try:
            plan_data = json.loads(plan.plan_data)
            total_videos = 0
            youtube_links = []
            
            for day in plan_data.get('days', []):
                day_videos = day.get('videos', [])
                total_videos += len(day_videos)
                
                for video in day_videos:
                    if 'video_id' in video:
                        youtube_url = f"https://www.youtube.com/watch?v={video['video_id']}"
                        youtube_links.append({
                            'title': video.get('title', 'Unknown'),
                            'url': youtube_url,
                            'day': day.get('day', 'Unknown')
                        })
            
            print(f"   📊 Total videos: {total_videos}")
            print(f"   🔗 YouTube links found: {len(youtube_links)}")
            
            for link in youtube_links[:3]:  # Show first 3 links
                print(f"      - Day {link['day']}: {link['title']}")
                print(f"        URL: {link['url']}")
                
        except Exception as e:
            print(f"   ❌ Error parsing plan data: {e}")

if __name__ == "__main__":
    test_api_duplicate_prevention()
    test_youtube_video_extraction()
    print("\n🎉 ALL TESTS COMPLETED!")
