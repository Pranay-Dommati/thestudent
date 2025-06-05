#!/usr/bin/env python
"""
Test script to verify duplicate prevention system for AI Learning Plans
Run this from the backend directory: python test_duplicates.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thestudent.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import AILearningPlan
import json

def test_duplicate_prevention():
    """Test model-level duplicate prevention"""
    print("🚀 TESTING AI LEARNING PLAN DUPLICATE PREVENTION")
    print("=" * 60)
    
    # Get test user
    User = get_user_model()
    user = User.objects.filter(email='sai@gmail.com').first()
    
    if not user:
        print("❌ Test user 'sai@gmail.com' not found")
        return False
    
    print(f"✅ Using test user: {user.email}")
    
    # Test data
    test_title = "Test Duplicate Prevention Plan"
    test_data = {
        'title': test_title,
        'description': 'Test plan for duplicate prevention',
        'category': 'Programming',
        'difficulty_level': 'Beginner',
        'duration_days': 5,
        'plan_data': json.dumps({
            "days": [
                {
                    "day": 1,
                    "title": "Day 1: Test",
                    "videos": [
                        {
                            "title": "Test Video",
                            "video_id": "test123",
                            "description": "Test description",
                            "thumbnail_url": "https://example.com/thumb.jpg",
                            "channel_title": "Test Channel"
                        }
                    ]
                }
            ]
        })
    }
    
    # Clean up any existing test data
    AILearningPlan.objects.filter(user=user, title=test_title).delete()
    
    print(f"\n🧪 Test 1: Creating first learning plan...")
    try:
        plan1 = AILearningPlan.objects.create(
            user=user,
            **test_data
        )
        print(f"   ✅ Created plan successfully: {plan1.id[:8]}...")
        
    except Exception as e:
        print(f"   ❌ Failed to create first plan: {e}")
        return False
    
    print(f"\n🧪 Test 2: Attempting to create duplicate...")
    try:
        plan2 = AILearningPlan.objects.create(
            user=user,
            **test_data
        )
        print(f"   ❌ Duplicate creation succeeded (should fail): {plan2.id[:8]}...")
        return False
        
    except Exception as e:
        print(f"   ✅ Duplicate prevented: {str(e)[:100]}...")
    
    print(f"\n🧪 Test 3: Testing create_with_duplicate_check method...")
    try:
        result = AILearningPlan.create_with_duplicate_check(
            user=user,
            **test_data
        )
        
        if result['created']:
            print(f"   ❌ New plan created when existing one should be returned")
            return False
        else:
            print(f"   ✅ Existing plan returned: {result['plan'].id[:8]}...")
            
    except Exception as e:
        print(f"   ❌ Error in create_with_duplicate_check: {e}")
        return False
    
    print(f"\n🧪 Test 4: Testing find_similar_plans method...")
    try:
        similar = AILearningPlan.find_similar_plans(user, test_title)
        print(f"   ✅ Found {len(similar)} similar plans")
        
        for plan in similar:
            print(f"      - {plan.title} (ID: {plan.id[:8]}...)")
            
    except Exception as e:
        print(f"   ❌ Error in find_similar_plans: {e}")
        return False
    
    print(f"\n🧪 Test 5: Creating plan with different title...")
    try:
        different_data = test_data.copy()
        different_data['title'] = "Different Title Plan"
        
        plan3 = AILearningPlan.objects.create(
            user=user,
            **different_data
        )
        print(f"   ✅ Created plan with different title: {plan3.id[:8]}...")
        
    except Exception as e:
        print(f"   ❌ Failed to create plan with different title: {e}")
        return False
    
    # Cleanup
    print(f"\n🧹 Cleaning up test data...")
    deleted = AILearningPlan.objects.filter(
        user=user, 
        title__in=[test_title, "Different Title Plan"]
    ).delete()
    print(f"   ✅ Cleaned up {deleted[0]} test plans")
    
    return True

def test_youtube_extraction():
    """Test YouTube video extraction from existing plans"""
    print("\n🎥 TESTING YOUTUBE VIDEO EXTRACTION")
    print("=" * 60)
    
    # Get test user
    User = get_user_model()
    user = User.objects.filter(email='sai@gmail.com').first()
    
    if not user:
        print("❌ Test user not found")
        return False
    
    # Get existing plans
    plans = AILearningPlan.objects.filter(user=user)[:2]
    
    if not plans:
        print("❌ No existing plans found for testing")
        return False
    
    for plan in plans:
        print(f"\n📋 Plan: {plan.title} (ID: {plan.id[:8]}...)")
        try:
            plan_data = json.loads(plan.plan_data)
            total_videos = 0
            youtube_links = []
            
            for day in plan_data.get('days', []):
                day_num = day.get('day', '?')
                day_title = day.get('title', f'Day {day_num}')
                videos = day.get('videos', [])
                total_videos += len(videos)
                
                print(f"   📅 {day_title}: {len(videos)} videos")
                
                for video in videos:
                    video_title = video.get('title', 'Unknown')
                    video_id = video.get('video_id', '')
                    
                    if video_id:
                        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                        youtube_links.append({
                            'title': video_title,
                            'url': youtube_url,
                            'day': day_num
                        })
                        print(f"      🎥 {video_title}")
                        print(f"         🔗 {youtube_url}")
            
            print(f"   📊 Total videos: {total_videos}, YouTube links: {len(youtube_links)}")
            
        except Exception as e:
            print(f"   ❌ Error parsing plan data: {e}")
            return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 STARTING COMPREHENSIVE AI LEARNING PLAN TESTS")
    print("=" * 70)
    
    success = True
    
    # Test duplicate prevention
    if not test_duplicate_prevention():
        success = False
    
    # Test YouTube extraction
    if not test_youtube_extraction():
        success = False
    
    print("\n" + "=" * 70)
    if success:
        print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
        print("✅ Duplicate prevention system is working correctly")
        print("✅ YouTube video storage and extraction verified")
    else:
        print("❌ SOME TESTS FAILED")
        print("Please check the error messages above")
    
    return success

if __name__ == "__main__":
    main()
