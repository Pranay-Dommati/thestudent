from django.core.management.base import BaseCommand
from django.conf import settings
import json
import logging
import requests
from courses.models import AILearningPlan

# Set up logging
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Add missing YouTube videos to AILearningPlan objects'

    def fetch_youtube_videos(self, query, max_results=1):
        """
        Fetch YouTube videos using the YouTube Data API
        """
        api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
        if not api_key:
            self.stdout.write(self.style.ERROR("YouTube API key not configured"))
            return []
        
        api_url = "https://www.googleapis.com/youtube/v3/search"
        
        params = {
            'key': api_key,
            'part': 'snippet',
            'q': query,
            'maxResults': max_results,
            'type': 'video'
        }
        
        self.stdout.write(f"Fetching YouTube videos for query: {query}")
        response = requests.get(api_url, params=params)
        
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f"YouTube API error: {response.status_code} - {response.text}"))
            return []
        
        data = response.json()
        videos = []
        
        for item in data.get('items', []):
            video_id = item.get('id', {}).get('videoId', '')
            snippet = item.get('snippet', {})
            
            video_data = {
                'video_id': video_id,
                'title': snippet.get('title', ''),
                'description': snippet.get('description', ''),
                'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                'channel_title': snippet.get('channelTitle', ''),
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
            videos.append(video_data)
        
        return videos

    def handle(self, *args, **kwargs):
        """
        Update all learning plans to add YouTube videos where missing
        """
        plans = AILearningPlan.objects.all()
        self.stdout.write(self.style.SUCCESS(f"Found {plans.count()} learning plans to process"))
        
        for plan in plans:
            self.stdout.write(f"Processing plan: {plan.id} - {plan.title}")
            
            # Ensure plan_data is a dictionary, not a string
            plan_data = plan.plan_data
            if isinstance(plan_data, str):
                try:
                    plan_data = json.loads(plan_data)
                except json.JSONDecodeError:
                    self.stdout.write(self.style.ERROR(f"Invalid JSON in plan_data for plan {plan.id}"))
                    continue
            
            if not isinstance(plan_data, dict):
                self.stdout.write(self.style.ERROR(f"plan_data is not a dictionary for plan {plan.id}"))
                continue
            
            # Check if days exists
            days = plan_data.get('days', [])
            modified = False
            
            for day in days:
                # If videos aren't in the day data or are empty, try to fetch them
                if not day.get('videos'):
                    youtube_query = day.get('youtube_query')
                    if youtube_query:
                        try:
                            self.stdout.write(f"Fetching videos for day {day.get('day')} with query: {youtube_query}")
                            videos = self.fetch_youtube_videos(youtube_query, max_results=2)
                            day['videos'] = videos
                            modified = True
                            self.stdout.write(self.style.SUCCESS(f"Added {len(videos)} videos to day {day.get('day')}"))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error fetching videos for day {day.get('day')}: {str(e)}"))
            
            if modified:
                # Update metadata
                if 'metadata' in plan_data:
                    plan_data['metadata']['total_videos'] = sum(len(day.get('videos', [])) for day in days)
                
                # Save the updated plan data
                plan.plan_data = plan_data
                plan.save()
                self.stdout.write(self.style.SUCCESS(f"Updated plan {plan.id} with new videos"))
            else:
                self.stdout.write(f"No changes needed for plan {plan.id}")
        
        self.stdout.write(self.style.SUCCESS("Command completed successfully"))
