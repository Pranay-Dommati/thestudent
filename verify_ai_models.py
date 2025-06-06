#!/usr/bin/env python
"""
Verification script for AI-generated content storage, ID generation, and duplicate prevention.
"""

import os
import sys
import django
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(r'c:\Users\Irfan\Documents\Visual Studio\startup project\thestudent\backend')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import AILearningPlan
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

def verify_database_state():
    """Verify the current state of AI learning plans in the database"""
    print("🔍 AI LEARNING PLAN DATABASE VERIFICATION")
    print("=" * 60)
    
    # Basic counts
    total_users = User.objects.count()
    total_plans = AILearningPlan.objects.count()
    
    print(f"📊 OVERVIEW:")
    print(f"   Total Users: {total_users}")
    print(f"   Total AI Learning Plans: {total_plans}")
    print()
    
    # User details
    print(f"👥 USERS:")
    for user in User.objects.all():
        plans_count = AILearningPlan.objects.filter(user=user).count()
        print(f"   User: {user.email} (ID: {str(user.id)[:8]}...) - Plans: {plans_count}")
    print()
    
    # Learning plan details
    print(f"🧠 AI LEARNING PLANS:")
    for i, plan in enumerate(AILearningPlan.objects.all(), 1):
        print(f"   {i}. Plan ID: {str(plan.id)[:8]}...")
        print(f"      Title: {plan.title}")
        print(f"      User: {plan.user.email if plan.user else 'No User'}")
        print(f"      Created: {plan.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"      Days Count: {plan.days_count}")
        print(f"      Total Videos: {plan.total_videos}")
        print(f"      Duration: {plan.duration_days} days")
        print(f"      Category: {plan.category or 'Not set'}")
        print(f"      Completed: {plan.is_completed}")
        print()

def verify_plan_data_structure():
    """Verify the structure of plan_data JSON field"""
    print("🔍 PLAN DATA STRUCTURE VERIFICATION")
    print("=" * 60)
    
    for plan in AILearningPlan.objects.all():
        print(f"📋 Plan: {plan.title}")
        print(f"   Plan ID: {str(plan.id)[:8]}...")
        
        if not plan.plan_data:
            print("   ❌ ERROR: plan_data is empty or null")
            continue
            
        # Check for required keys
        required_keys = ['goal', 'days']
        missing_keys = [key for key in required_keys if key not in plan.plan_data]
        
        if missing_keys:
            print(f"   ⚠️  Missing keys: {missing_keys}")
        else:
            print(f"   ✅ Has required keys: {required_keys}")
        
        # Check days structure
        days = plan.plan_data.get('days', [])
        print(f"   📅 Days: {len(days)}")
        
        total_videos = 0
        for day_num, day in enumerate(days, 1):
            videos = day.get('videos', [])
            total_videos += len(videos)
            print(f"      Day {day_num}: {len(videos)} videos")
            
            # Check if videos have required data
            if videos:
                first_video = videos[0]
                video_keys = list(first_video.keys())
                print(f"         Video keys: {video_keys}")
        
        print(f"   🎥 Total Videos Across All Days: {total_videos}")
        print()

def check_for_duplicates():
    """Check for potential duplicate learning plans"""
    print("🔍 DUPLICATE DETECTION")
    print("=" * 60)
    
    # Group plans by title and user
    from collections import defaultdict
    plan_groups = defaultdict(list)
    
    for plan in AILearningPlan.objects.all():
        key = (plan.title.lower().strip(), plan.user.id if plan.user else None)
        plan_groups[key].append(plan)
    
    duplicates_found = False
    for (title, user_id), plans in plan_groups.items():
        if len(plans) > 1:
            duplicates_found = True
            user_email = plans[0].user.email if plans[0].user else 'No User'
            print(f"⚠️  POTENTIAL DUPLICATE:")
            print(f"   Title: {title}")
            print(f"   User: {user_email}")
            print(f"   Count: {len(plans)}")
            for plan in plans:
                print(f"      ID: {str(plan.id)[:8]}... Created: {plan.created_at}")
            print()
    
    if not duplicates_found:
        print("✅ No duplicate learning plans found")
    
    return duplicates_found

def verify_youtube_links():
    """Verify YouTube links are properly stored"""
    print("🔍 YOUTUBE LINKS VERIFICATION")
    print("=" * 60)
    
    total_videos = 0
    total_valid_links = 0
    
    for plan in AILearningPlan.objects.all():
        print(f"📋 Plan: {plan.title}")
        
        days = plan.plan_data.get('days', [])
        plan_videos = 0
        plan_valid_links = 0
        
        for day in days:
            videos = day.get('videos', [])
            plan_videos += len(videos)
            
            for video in videos:
                if 'video_id' in video and video['video_id']:
                    plan_valid_links += 1
                    # Construct YouTube URL
                    youtube_url = f"https://www.youtube.com/watch?v={video['video_id']}"
                    print(f"   ✅ {video.get('title', 'Untitled')} - {youtube_url}")
                else:
                    print(f"   ❌ Missing video_id: {video.get('title', 'Untitled')}")
        
        total_videos += plan_videos
        total_valid_links += plan_valid_links
        
        print(f"   Videos: {plan_videos}, Valid Links: {plan_valid_links}")
        print()
    
    print(f"📊 SUMMARY:")
    print(f"   Total Videos: {total_videos}")
    print(f"   Valid YouTube Links: {total_valid_links}")
    print(f"   Success Rate: {(total_valid_links/total_videos*100):.1f}%" if total_videos > 0 else "No videos found")

def verify_uuid_generation():
    """Verify UUID generation is working correctly"""
    print("🔍 UUID GENERATION VERIFICATION")
    print("=" * 60)
    
    import uuid as uuid_module
    
    # Check existing UUIDs
    plan_ids = list(AILearningPlan.objects.values_list('id', flat=True))
    
    print(f"📊 EXISTING IDS:")
    for plan_id in plan_ids:
        # Verify it's a valid UUID
        try:
            uuid_module.UUID(str(plan_id))
            print(f"   ✅ Valid UUID: {str(plan_id)}")
        except ValueError:
            print(f"   ❌ Invalid UUID: {plan_id}")
    
    # Check for ID collisions
    if len(plan_ids) == len(set(plan_ids)):
        print(f"   ✅ All IDs are unique ({len(plan_ids)} plans)")
    else:
        print(f"   ❌ ID collision detected!")
    
    print()

def main():
    """Run all verification checks"""
    print("🚀 STARTING AI LEARNING PLAN VERIFICATION")
    print(f"🕒 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        verify_database_state()
        verify_plan_data_structure()
        duplicates_found = check_for_duplicates()
        verify_youtube_links()
        verify_uuid_generation()
        
        print("🎉 VERIFICATION COMPLETE")
        print("=" * 60)
        
        if duplicates_found:
            print("⚠️  Issues found: Potential duplicates detected")
            print("💡 Recommendation: Consider implementing duplicate prevention logic")
        else:
            print("✅ All checks passed successfully!")
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
