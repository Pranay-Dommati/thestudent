#!/usr/bin/env python3
"""
Script to inspect the videos in AI learning plans
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import AILearningPlan
import json

def inspect_learning_plans():
    """Inspect all learning plans and their video data"""
    plans = AILearningPlan.objects.all().order_by('-created_at')
    
    print(f"Found {plans.count()} AI Learning Plans")
    print("=" * 60)
    
    for plan in plans:
        print(f"\nPlan ID: {plan.id}")
        print(f"Title: {plan.title}")
        print(f"Created: {plan.created_at}")
        print(f"User: {plan.user.email if plan.user else 'None'}")
        
        # Check plan_data structure
        if plan.plan_data:
            days = plan.plan_data.get('days', [])
            print(f"Days: {len(days)}")
            
            total_videos = 0
            for i, day in enumerate(days):
                videos = day.get('videos', [])
                total_videos += len(videos)
                print(f"  Day {day.get('day', i+1)}: {day.get('topic', 'No topic')} - {len(videos)} videos")
                
                # Show first video details if any
                if videos:
                    first_video = videos[0]
                    print(f"    First video: {first_video.get('title', 'No title')}")
                    print(f"    Video ID: {first_video.get('video_id', 'No ID')}")
                else:
                    print("    No videos found")
            
            print(f"Total videos: {total_videos}")
            print(f"Property total_videos: {plan.total_videos}")
            
        else:
            print("No plan_data found")
        
        print("-" * 40)

if __name__ == "__main__":
    inspect_learning_plans()
