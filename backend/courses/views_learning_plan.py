from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import requests
import json
import os
import uuid
from django.conf import settings
from .models_learning_plan import LearningPlan, LearningPlanDay, VideoResource
from .serializers_learning_plan import LearningPlanSerializer, LearningPlanDaySerializer

class LearningPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and creating learning plans"""
    queryset = LearningPlan.objects.all().prefetch_related('days', 'days__videos')
    serializer_class = LearningPlanSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # For detail view with an ID, we'll return any plan (even for anonymous users)
        # For list view, only return plans belonging to the authenticated user
        if self.action == 'retrieve':
            return LearningPlan.objects.all().prefetch_related('days', 'days__videos')
        elif self.request.user.is_authenticated:
            return LearningPlan.objects.filter(user=self.request.user).prefetch_related('days', 'days__videos')
        return LearningPlan.objects.none()
        
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested days and videos"""
        print("Creating learning plan from API request")
        
        try:
            # Extract data from request
            goal = request.data.get('goal')
            days_data = request.data.get('days', [])
            
            if not goal:
                return Response({'error': 'Goal is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Create the learning plan
            learning_plan = LearningPlan.objects.create(
                title=goal,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Process each day
            for day_data in days_data:
                day_number = day_data.get('day')
                topic = day_data.get('topic', '')
                project_idea = day_data.get('project_idea', '')
                youtube_query = day_data.get('youtube_query', '')
                videos_data = day_data.get('videos', [])
                
                # Create the day
                day = LearningPlanDay.objects.create(
                    learning_plan=learning_plan,
                    day=day_number,
                    topic=topic,
                    project_idea=project_idea,
                    youtube_query=youtube_query
                )
                
                # Create videos for the day
                for video_data in videos_data:
                    VideoResource.objects.create(
                        learning_plan_day=day,
                        title=video_data.get('title', ''),
                        description=video_data.get('description', ''),
                        video_id=video_data.get('video_id', ''),
                        thumbnail_url=video_data.get('thumbnail_url', ''),
                        channel_title=video_data.get('channel_title', '')
                    )
            
            # Return the serialized learning plan
            serializer = self.get_serializer(learning_plan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating learning plan: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def generate_learning_plan(request):
    """
    Generate a learning plan based on a goal.
    Expects a 'goal' parameter in the request data.
    Can also receive a complete learning plan with days and videos from the frontend.
    """
    print("\n\n*** DEBUGGING: generate_learning_plan called ***")
    print(f"Request data: {request.data}")
    
    if 'goal' not in request.data:
        print("Goal not found in request data")
        return Response({'error': 'Goal is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    goal = request.data['goal']
    print(f"Goal: {goal}")
    
    # Check if the request contains a pre-generated learning plan with days
    if 'days' in request.data and isinstance(request.data['days'], list):
        print("Received pre-generated learning plan with days from frontend")
        
        # Create a new LearningPlan
        try:
            learning_plan = LearningPlan.objects.create(
                title=goal,
                user=request.user if request.user.is_authenticated else None
            )
            print(f"Created learning plan with ID: {learning_plan.id}")
        except Exception as e:
            print(f"Error creating learning plan: {str(e)}")
            # Create without user if there's an issue
            learning_plan = LearningPlan.objects.create(
                title=goal
            )
            print(f"Created learning plan without user, ID: {learning_plan.id}")
        
        # Process each day in the learning plan
        for day_data in request.data['days']:
            day_number = day_data.get('day')
            topic = day_data.get('topic', '')
            project_idea = day_data.get('project_idea', '')
            youtube_query = day_data.get('youtube_query', '')
            videos = day_data.get('videos', [])
            
            print(f"Processing day {day_number}: {topic}")
            
            # Create the day entry
            day_entry = LearningPlanDay.objects.create(
                learning_plan=learning_plan,
                day=day_number,
                topic=topic,
                project_idea=project_idea,
                youtube_query=youtube_query
            )
            
            # Process videos (expecting only one per day)
            for video_data in videos:
                VideoResource.objects.create(
                    learning_plan_day=day_entry,
                    title=video_data.get('title', ''),
                    description=video_data.get('description', ''),
                    video_id=video_data.get('video_id', ''),
                    thumbnail_url=video_data.get('thumbnail_url', ''),
                    channel_title=video_data.get('channel_title', '')
                )
                print(f"Added video: {video_data.get('title', '')}")
        
        # Return the complete learning plan
        serializer = LearningPlanSerializer(learning_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # If no pre-generated plan was provided, generate one using the backend API
    print("No pre-generated plan provided, generating using backend API")
    
    # Fallback: create and save a simple learning plan in the database
    days_data = [
        {
            "day": 1,
            "topic": "Getting Started",
            "project_idea": "Setup your development environment",
            "youtube_query": f"{goal} introduction",
            "videos": [
                {
                    "title": "Introduction Video",
                    "description": "Learn the basics",
                    "video_id": "dQw4w9WgXcQ",
                    "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                    "channel_title": "Learning Channel"
                }
            ]
        },
        {
            "day": 2,
            "topic": "Basic Concepts",
            "project_idea": "Build a simple project",
            "youtube_query": f"{goal} basics",
            "videos": [
                {
                    "title": "Basic Concepts Video",
                    "description": "Learn the fundamentals",
                    "video_id": "dQw4w9WgXcQ",
                    "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                    "channel_title": "Learning Channel"
                }
            ]
        }
    ]
    # Create and save the learning plan and associated days and videos
    learning_plan = LearningPlan.objects.create(
        title=goal,
        user=request.user if request.user.is_authenticated else None
    )
    for day_data in days_data:
        day_entry = LearningPlanDay.objects.create(
            learning_plan=learning_plan,
            day=day_data["day"],
            topic=day_data["topic"],
            project_idea=day_data["project_idea"],
            youtube_query=day_data["youtube_query"]
        )
        for video in day_data["videos"]:
            VideoResource.objects.create(
                learning_plan_day=day_entry,
                title=video.get("title", ""),
                description=video.get("description", ""),
                video_id=video.get("video_id", ""),
                thumbnail_url=video.get("thumbnail_url", ""),
                channel_title=video.get("channel_title", "")
            )
    serializer = LearningPlanSerializer(learning_plan)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

def generate_plan_from_huggingface(goal):
    """
    Call Hugging Face API to generate a learning plan
    """
    # HF_API_TOKEN should be stored in environment variables or settings
    api_token = getattr(settings, 'HUGGINGFACE_API_TOKEN', None)
    if not api_token:
        raise Exception("Hugging Face API token not configured")
    
    api_url = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
    
    # Create a prompt for the model
    prompt = f"""
    Create a day-by-day learning plan for the goal: '{goal}'.
    Include 7-14 days with specific topics to learn each day.
    For each day, include:
    1. Day number
    2. Topic to focus on
    3. A project idea to practice the topic
    4. A specific YouTube search query to find relevant tutorials
    Return the response as a JSON array with objects for each day containing keys: day (number), topic (string), project_idea (string), and youtube_query (string).
    """
    
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 2048,
            "temperature": 0.7,
            "return_full_text": False
        }
    }
    
    response = requests.post(api_url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"HuggingFace API error: {response.text}")
    
    # Extract the generated text and parse it as JSON
    try:
        response_json = response.json()
        print(f"Raw HuggingFace response: {response_json}")
        
        # Handle different response formats
        if isinstance(response_json, list) and len(response_json) > 0:
            generated_text = response_json[0].get('generated_text', '')
        elif isinstance(response_json, dict):
            generated_text = response_json.get('generated_text', '')
        else:
            generated_text = str(response_json)
        
        print(f"Generated text: {generated_text}")
        
        # Try to extract JSON from the response (the model might wrap it in markdown or other text)
        import re
        
        # Look for JSON array pattern
        json_match = re.search(r'\[\s*{.*}\s*\]', generated_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            print(f"Found JSON array: {json_str}")
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                print("Failed to parse JSON array, trying to clean it up")
                # Sometimes quotes or escaping might be incorrect, try a fallback
        
        # If that doesn't work, try to find individual JSON objects and create an array
        # Create a simple fallback structure if all else fails
        fallback_data = []
        # Extract days using regex pattern matching
        day_matches = re.findall(r'Day\s+(\d+)[:\s]+(.*?)(?=Day\s+\d+|$)', generated_text, re.DOTALL | re.IGNORECASE)
        
        if day_matches:
            print(f"Found {len(day_matches)} day matches using regex")
            for day_num, content in day_matches:
                day_data = {
                    'day': int(day_num),
                    'topic': '',
                    'project_idea': '',
                    'youtube_query': ''
                }
                
                # Try to extract topic
                topic_match = re.search(r'Topic[:\s]+(.*?)(?=Project|$)', content, re.DOTALL | re.IGNORECASE)
                if topic_match:
                    day_data['topic'] = topic_match.group(1).strip()
                else:
                    # If no explicit topic label, use the first line
                    first_line = content.strip().split('\n')[0]
                    day_data['topic'] = first_line.strip()
                
                # Try to extract project idea
                project_match = re.search(r'Project[:\s]+(.*?)(?=YouTube|$)', content, re.DOTALL | re.IGNORECASE)
                if project_match:
                    day_data['project_idea'] = project_match.group(1).strip()
                
                # Set YouTube query based on topic
                day_data['youtube_query'] = f"{day_data['topic']} tutorial"
                
                fallback_data.append(day_data)
            
            return fallback_data
            
        # If all else fails, create a simple structure with the goal
        if not fallback_data:
            print("Creating minimal fallback plan")
            return [
                {'day': 1, 'topic': 'Getting Started', 'project_idea': 'Hello World application', 'youtube_query': f"{goal} getting started"},
                {'day': 2, 'topic': 'Basic Concepts', 'project_idea': 'Simple project', 'youtube_query': f"{goal} basics"},
                {'day': 3, 'topic': 'Advanced Topics', 'project_idea': 'Advanced project', 'youtube_query': f"{goal} advanced tutorial"}
            ]
            
    except Exception as e:
        print(f"Failed to parse HuggingFace response: {str(e)}")
        # Provide a minimal fallback plan rather than raising an exception
        return [
            {'day': 1, 'topic': 'Getting Started', 'project_idea': 'Hello World application', 'youtube_query': f"{goal} getting started"},
            {'day': 2, 'topic': 'Basic Concepts', 'project_idea': 'Simple project', 'youtube_query': f"{goal} basics"},
            {'day': 3, 'topic': 'Advanced Topics', 'project_idea': 'Advanced project', 'youtube_query': f"{goal} advanced tutorial"}
        ]

def fetch_youtube_videos(query, max_results=1):
    """
    Fetch YouTube videos using the YouTube Data API
    Default to fetching only 1 best video per day
    """
    # YOUTUBE_API_KEY should be stored in environment variables or settings
    api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
    if not api_key:
        raise Exception("YouTube API key not configured")
    
    api_url = "https://www.googleapis.com/youtube/v3/search"
    
    params = {
        'key': api_key,
        'part': 'snippet',
        'q': query,
        'maxResults': max_results,
        'type': 'video'
    }
    
    response = requests.get(api_url, params=params)
    
    if response.status_code != 200:
        raise Exception(f"YouTube API error: {response.text}")
    
    data = response.json()
    videos = []
    
    for item in data.get('items', []):
        video_id = item.get('id', {}).get('videoId', '')
        snippet = item.get('snippet', {})
        
        videos.append({
            'video_id': video_id,
            'title': snippet.get('title', ''),
            'description': snippet.get('description', ''),
            'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
            'channel_title': snippet.get('channelTitle', '')
        })
    
    return videos
