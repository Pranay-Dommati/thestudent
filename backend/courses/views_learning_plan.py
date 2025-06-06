from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import requests
import json
import os
import uuid
from django.conf import settings
from django.utils import timezone
from .models import AILearningPlan
from .serializers_ai_learning_plan import AILearningPlanSerializer, AILearningPlanCreateSerializer
import logging

# Configure module logger
logger = logging.getLogger(__name__)

class AILearningPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and creating AI learning plans"""
    serializer_class = AILearningPlanSerializer
    permission_classes = [AllowAny]
    queryset = AILearningPlan.objects.all()

    def get_queryset(self):
        """Return learning plans for the authenticated user"""
        if self.request.user.is_authenticated:
            return AILearningPlan.objects.filter(user=self.request.user)
        return AILearningPlan.objects.none()
        
    def create(self, request, *args, **kwargs):
        """Custom create method to handle AI learning plan creation"""
        logger.debug("Creating AI learning plan from API request")
        try:
            serializer = AILearningPlanCreateSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                learning_plan = serializer.save()
                # Fetch and attach YouTube URLs for each day
                plan_data = learning_plan.plan_data
                for day in plan_data.get('days', []):
                    if not day.get('videos') and day.get('youtube_query'):
                        try:
                            videos = fetch_youtube_videos(day['youtube_query'], max_results=1)
                            for v in videos:
                                v['url'] = f"https://www.youtube.com/watch?v={v.get('video_id')}"
                            day['videos'] = videos
                        except Exception as e:
                            logger.error(f"Failed to fetch videos for day {day.get('day')}: {e}")
                learning_plan.plan_data = plan_data
                learning_plan.save()
                # Return the created learning plan using the main serializer
                response_serializer = AILearningPlanSerializer(learning_plan)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error creating AI learning plan: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_learning_plan(request):
    """
    Generate an AI-powered learning plan based on a goal.
    Creates a unified AILearningPlan with all data stored in JSON fields.
    """
    logger.debug("generate_learning_plan called")
    logger.debug(f"Request data: {request.data}")
    
    if 'goal' not in request.data:
        logger.warning("Goal not found in request data")
        return Response({'error': 'Goal is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    goal = request.data['goal']
    logger.info(f"Generating plan for goal: {goal}")
    
    try:
        # Check if the request contains pre-generated learning plan with days
        if 'days' in request.data and isinstance(request.data['days'], list):
            logger.info("Received pre-generated learning plan with days from frontend")
            days_data = request.data['days']
        else:
            logger.info("No pre-generated plan provided, generating basic structure")
            # Create a basic structure if no days provided
            days_data = [
                {
                    'day': 1,
                    'topic': 'Getting Started with ' + goal,
                    'project_idea': 'Hello World project',
                    'youtube_query': f"{goal} getting started",
                    'videos': []
                },
                {
                    'day': 2,
                    'topic': 'Basic Concepts of ' + goal,
                    'project_idea': 'Simple practice project',
                    'youtube_query': f"{goal} basics tutorial",
                    'videos': []
                },
                {
                    'day': 3,
                    'topic': 'Advanced ' + goal + ' Topics',
                    'project_idea': 'Advanced implementation project',
                    'youtube_query': f"{goal} advanced concepts",
                    'videos': []
                }
            ]
        
        # Fetch YouTube videos for each day and set URL
        for day in days_data:
            query = day.get('youtube_query')
            if query and not day.get('videos'):
                try:
                    videos = fetch_youtube_videos(query, max_results=1)
                    for v in videos:
                        v['url'] = f"https://www.youtube.com/watch?v={v.get('video_id')}"
                    day['videos'] = videos
                except Exception as e:
                    logger.error(f"Failed to fetch YouTube videos for '{query}': {e}")
        
        # Structure the complete plan data
        plan_data = {
            'goal': goal,
            'days': days_data,
            'generated_at': str(timezone.now()),
            'source': 'ai_generated',
            'metadata': {
                'total_days': len(days_data),
                'total_videos': sum(len(day.get('videos', [])) for day in days_data),
                'has_projects': any(day.get('project_idea') for day in days_data)
            }
        }
        
        # Create the AI learning plan with duplicate checking
        title = f"AI Learning Plan: {goal}"
        
        try:
            # Check for existing plans with same title
            existing_plan = AILearningPlan.objects.filter(
                user=request.user, 
                title=title
            ).first()
            
            if existing_plan:
                logger.warning(f"Learning plan with title '{title}' already exists for user {request.user.email}")
                # Return the existing plan instead of creating a duplicate
                serializer = AILearningPlanSerializer(existing_plan)
                return Response({
                    'id': existing_plan.id,
                    'type': 'ai_learning_plan',
                    'plan': serializer.data,
                    'message': 'Learning plan already exists, returning existing plan'
                }, status=status.HTTP_200_OK)
            
            # Check for similar plans
            similar_plans = AILearningPlan.find_similar_plans(request.user, title, threshold=0.7)
            if similar_plans:
                logger.info(f"Found {len(similar_plans)} similar plans for user {request.user.email}")
                # You could optionally return this info to the frontend for user confirmation
            
            # Create the new learning plan
            learning_plan = AILearningPlan.objects.create(
                user=request.user,
                title=title,
                description=f"AI-generated personalized learning plan for mastering {goal}",
                plan_data=plan_data,
                duration_days=len(days_data),
                difficulty_level='beginner',
                category='AI-Generated'
            )
            
        except Exception as e:
            logger.error(f"Error creating learning plan: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Created AI learning plan with ID: {learning_plan.id}")
        
        # Return the serialized learning plan
        serializer = AILearningPlanSerializer(learning_plan)
        return Response({
            'id': learning_plan.id,
            'type': 'ai_learning_plan',
            'plan': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating AI learning plan: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_learning_plans(request):
    """Get all learning plans for the authenticated user"""
    try:
        learning_plans = AILearningPlan.objects.filter(user=request.user).order_by('-created_at')
        serializer = AILearningPlanSerializer(learning_plans, many=True)
        return Response({
            'count': learning_plans.count(),
            'plans': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching user learning plans: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_learning_plan_progress(request, plan_id):
    """Update learning plan progress or completion status"""
    try:
        learning_plan = AILearningPlan.objects.get(id=plan_id, user=request.user)
        
        # Update fields if provided
        if 'is_completed' in request.data:
            learning_plan.is_completed = request.data['is_completed']
        
        if 'plan_data' in request.data:
            # Allow updating the plan data (e.g., marking days as completed)
            learning_plan.plan_data.update(request.data['plan_data'])
        
        learning_plan.save()
        
        serializer = AILearningPlanSerializer(learning_plan)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except AILearningPlan.DoesNotExist:
        return Response({'error': 'Learning plan not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating learning plan: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        logger.debug(f"Raw HuggingFace response: {response_json}")
        
        # Handle different response formats
        if isinstance(response_json, list) and len(response_json) > 0:
            generated_text = response_json[0].get('generated_text', '')
        elif isinstance(response_json, dict):
            generated_text = response_json.get('generated_text', '')
        else:
            generated_text = str(response_json)
        
        logger.debug(f"Generated text: {generated_text}")
        
        # Try to extract JSON from the response (the model might wrap it in markdown or other text)
        import re
        
        # Look for JSON array pattern
        json_match = re.search(r'\[\s*{.*}\s*\]', generated_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            logger.debug(f"Found JSON array: {json_str}")
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                logger.error("Failed to parse JSON array, trying to clean it up")
                # Sometimes quotes or escaping might be incorrect, try a fallback
        
        # If that doesn't work, try to find individual JSON objects and create an array
        # Create a simple fallback structure if all else fails
        fallback_data = []
        # Extract days using regex pattern matching
        day_matches = re.findall(r'Day\s+(\d+)[:\s]+(.*?)(?=Day\s+\d+|$)', generated_text, re.DOTALL | re.IGNORECASE)
        
        if day_matches:
            logger.info(f"Found {len(day_matches)} day matches using regex")
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
            logger.info("Creating minimal fallback plan")
            return [
                {'day': 1, 'topic': 'Getting Started', 'project_idea': 'Hello World application', 'youtube_query': f"{goal} getting started"},
                {'day': 2, 'topic': 'Basic Concepts', 'project_idea': 'Simple project', 'youtube_query': f"{goal} basics"},
                {'day': 3, 'topic': 'Advanced Topics', 'project_idea': 'Advanced project', 'youtube_query': f"{goal} advanced tutorial"}
            ]
            
    except Exception as e:
        logger.error(f"Failed to parse HuggingFace response: {str(e)}")
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
