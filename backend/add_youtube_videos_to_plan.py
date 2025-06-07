#!/usr/bin/env python
"""
Script to update AI Learning Plans with YouTube videos.
This script will add YouTube videos to existing AI Learning Plans.
"""

import os
import sys
import json
import django
import googleapiclient.discovery
from django.conf import settings

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from courses.models import AILearningPlan

def get_youtube_api_key():
    """Get YouTube API key from settings."""
    api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
    if not api_key:
        print("YouTube API key not found in settings! Please add YOUTUBE_API_KEY to your settings.")
        sys.exit(1)
    return api_key

def fetch_youtube_videos(query, max_results=1):
    """
    Fetch YouTube videos for a specific query.
    
    Args:
        query (str): Search query for YouTube
        max_results (int): Number of results to return
        
    Returns:
        list: List of video data dictionaries
    """
    api_key = get_youtube_api_key()
    
    # Initialize YouTube API client
    youtube = googleapiclient.discovery.build(
        'youtube', 'v3', developerKey=api_key, cache_discovery=False
    )
    
    # Search for videos
    search_response = youtube.search().list(
        q=query,
        part='snippet',
        maxResults=max_results,
        type='video'
    ).execute()
    
    videos = []
    for item in search_response.get('items', []):
        video_data = {
            'id': item['id']['videoId'],
            'video_id': item['id']['videoId'],
            'title': item['snippet']['title'],
            'description': item['snippet']['description'],
            'thumbnail': item['snippet']['thumbnails']['medium']['url'],
            'published_at': item['snippet']['publishedAt'],
            'channel_title': item['snippet']['channelTitle'],
            'channel_id': item['snippet']['channelId']
        }
        videos.append(video_data)
    
    return videos

def update_learning_plan_videos(plan_id=None):
    """
    Update learning plan YouTube videos.
    
    Args:
        plan_id (str, optional): Specific plan ID to update. If None, update all plans.
    """
    if plan_id:
        plans = AILearningPlan.objects.filter(id=plan_id)
    else:
        plans = AILearningPlan.objects.all()
    
    print(f"Found {plans.count()} plans to update")
    
    updated_count = 0
    for plan in plans:
        print(f"\nProcessing plan: {plan.title} (ID: {plan.id})")
        
        plan_data = plan.plan_data
        if not plan_data or not isinstance(plan_data, dict):
            print(f"- Error: Invalid plan_data for plan {plan.id}")
            continue
        
        days = plan_data.get('days', [])
        if not days:
            print(f"- No days found in plan {plan.id}")
            continue
        
        updated = False
        
        for day in days:
            if not day.get('videos'):
                print(f"- Day {day.get('day')}: No videos found, fetching...")
                
                # Get YouTube search query for this day
                query = day.get('youtube_query')
                if not query:
                    # Fallback query based on topic
                    topic = day.get('topic', '')
                    query = f"{plan.title.replace('AI Learning Plan:', '').strip()} {topic}"
                
                print(f"  - Query: {query}")
                
                # Fetch videos for this day
                try:
                    videos = fetch_youtube_videos(query, max_results=4)
                    
                    if videos:
                        print(f"  - Found {len(videos)} videos")
                        day['videos'] = videos
                        updated = True
                    else:
                        print(f"  - No videos found for query: {query}")
                except Exception as e:
                    print(f"  - Error fetching videos: {str(e)}")
        
        if updated:
            try:
                plan.plan_data = plan_data
                plan.save()
                print(f"✅ Updated plan: {plan.title}")
                updated_count += 1
            except Exception as e:
                print(f"❌ Error saving plan {plan.id}: {str(e)}")
    
    print(f"\nCompleted! Updated {updated_count} out of {plans.count()} plans.")

if __name__ == "__main__":
    print("YouTube Video Updater for AI Learning Plans")
    print("------------------------------------------")
    
    if len(sys.argv) > 1:
        plan_id = sys.argv[1]
        print(f"Updating plan with ID: {plan_id}")
        update_learning_plan_videos(plan_id)
    else:
        update_learning_plan_videos()
