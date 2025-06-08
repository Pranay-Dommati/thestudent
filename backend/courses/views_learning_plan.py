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
import re

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

    def retrieve(self, request, *args, **kwargs):
        """Custom retrieve method to handle learning plan retrieval"""
        try:
            instance = self.get_object()
            logger.info(f"Retrieving learning plan with ID: {instance.id}")
            
            # Ensure plan_data is a dictionary
            if isinstance(instance.plan_data, str):
                try:
                    instance.plan_data = json.loads(instance.plan_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing plan_data JSON: {str(e)}")
                    instance.plan_data = {}
            
            # Validate plan_data structure
            if not isinstance(instance.plan_data, dict):
                logger.error(f"Invalid plan_data type: {type(instance.plan_data)}")
                instance.plan_data = {}
            
            # Ensure required fields exist
            if 'days' not in instance.plan_data:
                instance.plan_data['days'] = []
            if 'goal' not in instance.plan_data:
                instance.plan_data['goal'] = instance.title
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except AILearningPlan.DoesNotExist:
            logger.error(f"Learning plan not found with ID: {kwargs.get('pk')}")
            return Response(
                {'error': 'Learning plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving learning plan: {str(e)}")
            return Response(
                {'error': f'An error occurred while retrieving the learning plan: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
    """Generate an AI-powered learning plan based on a goal."""
    logger.debug("generate_learning_plan called")
    logger.debug(f"Request data: {request.data}")
    
    if 'goal' not in request.data:
        logger.warning("Goal not found in request data")
        return Response({'error': 'Goal is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    goal = request.data['goal']
    logger.info(f"Generating plan for goal: {goal}")
    
    try:
        # Check if frontend has already provided days data (from frontend AI generation)
        if 'days' in request.data and isinstance(request.data['days'], list) and len(request.data['days']) > 0:
            logger.info("Using frontend-provided days data with videos")
            days_data = request.data['days']
            duration_days = len(days_data)
            
            # Ensure each day has required fields and preserve videos
            for day in days_data:
                if 'videos' not in day:
                    day['videos'] = []
                if 'day' not in day:
                    day['day'] = days_data.index(day) + 1
                if 'topic' not in day:
                    day['topic'] = f"Day {day['day']}"
                if 'project_idea' not in day:
                    day['project_idea'] = ""
                if 'youtube_query' not in day:
                    day['youtube_query'] = ""
            
            logger.info(f"Using {len(days_data)} days with {sum(len(day.get('videos', [])) for day in days_data)} total videos")
        else:
            logger.info("No frontend days data provided, generating new plan")
            # Extract learning parameters from the goal
            goal_lower = goal.lower()
            
            # Extract duration
            duration_match = re.search(r'in\s+(\d+)\s+days?', goal_lower)
            duration_days = int(duration_match.group(1)) if duration_match else 7
            
            # Generate the learning plan using Hugging Face
            try:
                days_data = generate_plan_from_huggingface(goal)
            except Exception as e:
                logger.error(f"Error generating plan from Hugging Face: {str(e)}")
                # Fallback to basic structure
                days_data = [
                    {
                        'day': i + 1,
                        'topic': f'Day {i + 1} of {goal}',
                        'project_idea': f'Practice project for day {i + 1}',
                        'youtube_query': f"{goal} day {i + 1} tutorial"
                    }
                    for i in range(duration_days)
                ]

            # Attach YouTube videos for each day (only if not provided by frontend)
            for day in days_data:
                if not day.get('videos') and day.get('youtube_query'):
                    try:
                        videos = fetch_youtube_videos(day['youtube_query'], max_results=1)
                        for v in videos:
                            v['url'] = f"https://www.youtube.com/watch?v={v.get('video_id')}"
                        day['videos'] = videos
                    except Exception as e:
                        logger.error(f"Failed to fetch videos for day {day.get('day')}: {e}")
                        day['videos'] = []
        
        # Extract learning parameters for metadata
        goal_lower = goal.lower()
        difficulty_level = 'beginner'
        if 'intermediate' in goal_lower:
            difficulty_level = 'intermediate'
        elif 'advanced' in goal_lower or 'expert' in goal_lower:
            difficulty_level = 'advanced'
        
        # Extract subject/topic
        subject = goal.split(' in ')[0].strip() if ' in ' in goal else goal

        # Structure the complete plan data
        plan_data = {
            'goal': goal,
            'days': days_data,
            'generated_at': str(timezone.now()),
            'source': 'ai_generated',
            'metadata': {
                'total_days': len(days_data),
                'total_videos': sum(len(day.get('videos', [])) for day in days_data),
                'has_projects': any(day.get('project_idea') for day in days_data),
                'difficulty_level': difficulty_level,
                'subject': subject
            }
        }
        
        # Create the AI learning plan
        title = f"AI Learning Plan: {subject}"
        
        try:
            # Check for existing plans with same title
            existing_plan = AILearningPlan.objects.filter(
                user=request.user, 
                title=title
            ).first()
            
            if existing_plan:
                logger.warning(f"Learning plan with title '{title}' already exists for user {request.user.email}")
                serializer = AILearningPlanSerializer(existing_plan)
                return Response({
                    'id': existing_plan.id,
                    'type': 'ai_learning_plan',
                    'plan': serializer.data,
                    'message': 'Learning plan already exists, returning existing plan'
                }, status=status.HTTP_200_OK)
            
            # Create the new learning plan
            learning_plan = AILearningPlan.objects.create(
                user=request.user,
                title=title,
                description=f"AI-generated personalized learning plan for mastering {subject} in {duration_days} days",
                plan_data=plan_data,
                duration_days=duration_days,
                difficulty_level=difficulty_level,
                category='AI-Generated'
            )
            
            logger.info(f"Created AI learning plan with ID: {learning_plan.id}")
            
            # Return the serialized learning plan
            serializer = AILearningPlanSerializer(learning_plan)
            return Response({
                'id': learning_plan.id,
                'type': 'ai_learning_plan',
                'plan': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating learning plan: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in generate_learning_plan: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_ai_quiz(request, plan_id, lesson_id):
    """Submit quiz answers for AI learning plan and calculate score"""
    try:
        # Get the AI learning plan
        learning_plan = AILearningPlan.objects.get(id=plan_id, user=request.user)
        
        # Get user's answers from request data
        user_answers = request.data.get('answers', {})
        
        # Parse lesson_id to find the day and quiz questions
        # lesson_id format: "day_X_quiz"
        if not lesson_id.startswith('day_') or not lesson_id.endswith('_quiz'):
            return Response(
                {"error": "Invalid lesson ID format for AI learning plan"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract day number from lesson_id
        try:
            day_number = int(lesson_id.split('_')[1])
        except (IndexError, ValueError):
            return Response(
                {"error": "Could not parse day number from lesson ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the day in the learning plan
        plan_days = learning_plan.plan_data.get('days', [])
        target_day = None
        
        for day in plan_days:
            if day.get('day') == day_number:
                target_day = day
                break
        
        if not target_day:
            return Response(
                {"error": f"Day {day_number} not found in learning plan"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get quiz questions for this day
        quiz_questions = target_day.get('quizQuestions', [])
        
        if not quiz_questions:
            return Response(
                {"error": f"No quiz questions found for day {day_number}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate score
        total_questions = len(quiz_questions)
        correct_answers = 0
        
        # Debug information
        logger.info(f"Processing AI quiz submission for plan: {plan_id}, lesson: {lesson_id}")
        logger.info(f"User answers received: {user_answers}")
        
        for question in quiz_questions:
            question_id = str(question.get('id', ''))
            user_answer = user_answers.get(question_id)
            
            # Get options and correct answer
            options = question.get('options', [])
            correct_answer = question.get('correct_answer', '')
            
            logger.info(f"Question {question_id}: {question.get('question', '')}")
            logger.info(f"Options: {options}")
            logger.info(f"Correct answer: {correct_answer}")
            logger.info(f"User answer index: {user_answer}")
            
            if user_answer is not None:
                try:
                    user_answer_index = int(user_answer)
                    # Make sure the answer index is valid
                    if user_answer_index >= 0 and user_answer_index < len(options):
                        # Check if the option at this index matches the correct answer
                        if options[user_answer_index] == correct_answer:
                            correct_answers += 1
                            logger.info(f"Correct answer for question {question_id}")
                        else:
                            logger.info(f"Wrong answer for question {question_id}")
                    else:
                        logger.info(f"Invalid answer index for question {question_id}: {user_answer_index}")
                except (ValueError, TypeError):
                    logger.info(f"Invalid answer format for question {question_id}: {user_answer}")
                    continue
        
        # Calculate percentage score
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= 80  # 80% passing score
        
        # Update learning plan progress
        plan_data = learning_plan.plan_data
        if 'progress' not in plan_data:
            plan_data['progress'] = {}
        
        # Mark this quiz as completed if passed
        if passed:
            plan_data['progress'][lesson_id] = True
        
        learning_plan.plan_data = plan_data
        learning_plan.save()
        
        return Response({
            "score": score,
            "passed": passed,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "lesson_id": lesson_id,
            "day_number": day_number
        })
        
    except AILearningPlan.DoesNotExist:
        return Response(
            {"error": "Learning plan not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error submitting AI quiz: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

def generate_plan_from_huggingface(goal):
    """
    Call Hugging Face API to generate a learning plan
    """
    # HF_API_TOKEN should be stored in environment variables or settings
    api_token = getattr(settings, 'HUGGINGFACE_API_TOKEN', None)
    if not api_token:
        raise Exception("Hugging Face API token not configured")
    
    api_url = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
    
    # Extract parameters from the goal
    goal_lower = goal.lower()
    duration_match = re.search(r'in\s+(\d+)\s+days?', goal_lower)
    duration_days = int(duration_match.group(1)) if duration_match else 7
    
    difficulty_level = 'beginner'
    if 'intermediate' in goal_lower:
        difficulty_level = 'intermediate'
    elif 'advanced' in goal_lower or 'expert' in goal_lower:
        difficulty_level = 'advanced'
    
    subject = goal.split(' in ')[0].strip() if ' in ' in goal else goal
    
    # Create a detailed prompt for the model
    prompt = f"""
    Create a detailed {duration_days}-day learning plan for {subject} at {difficulty_level} level.
    
    For each day, provide:
    1. Day number
    2. Main topic to focus on
    3. Key concepts to learn
    4. A practical project idea to reinforce learning
    5. A specific YouTube search query to find relevant tutorials
    
    The plan should:
    - Start with fundamentals and gradually increase in complexity
    - Include hands-on projects for practical experience
    - Focus on {difficulty_level} level concepts and challenges
    - Be achievable within {duration_days} days
    - Include clear learning objectives for each day
    
    Return the response as a JSON array with objects for each day containing:
    - day (number)
    - topic (string)
    - key_concepts (array of strings)
    - project_idea (string)
    - youtube_query (string)
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
    
    try:
        # Parse the response
        response_text = response.json()[0]['generated_text']
        
        # Try to extract JSON array from the response
        json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
        if json_match:
            days_data = json.loads(json_match.group(0))
            return days_data
            
        # If JSON extraction fails, try to parse the text format
        days_data = []
        current_day = None
        current_data = {}
        
        for line in response_text.split('\n'):
            # Look for day headers
            day_match = re.match(r'Day\s+(\d+)[:.]?\s*(.*)', line, re.IGNORECASE)
            if day_match:
                if current_day is not None:
                    days_data.append(current_data)
                current_day = int(day_match.group(1))
                current_data = {
                    'day': current_day,
                    'topic': day_match.group(2).strip(),
                    'key_concepts': [],
                    'project_idea': '',
                    'youtube_query': f"{subject} day {current_day} tutorial"
                }
                continue
            
            # Look for key concepts
            if 'key concepts' in line.lower() or 'concepts' in line.lower():
                continue
            elif line.strip().startswith('-') or line.strip().startswith('*'):
                concept = line.strip('- *').strip()
                if concept and current_day is not None:
                    current_data['key_concepts'].append(concept)
            
            # Look for project ideas
            elif 'project' in line.lower():
                project_match = re.search(r'project[:\s]+(.*)', line, re.IGNORECASE)
                if project_match and current_day is not None:
                    current_data['project_idea'] = project_match.group(1).strip()
        
        # Add the last day if exists
        if current_day is not None:
            days_data.append(current_data)
        
        return days_data
        
    except Exception as e:
        logger.error(f"Failed to parse HuggingFace response: {str(e)}")
        # Provide a minimal fallback plan
        return [
            {
                'day': i + 1,
                'topic': f'Day {i + 1} of {subject}',
                'key_concepts': [f'Key concept {j + 1}' for j in range(3)],
                'project_idea': f'Practice project for day {i + 1}',
                'youtube_query': f"{subject} day {i + 1} tutorial"
            }
            for i in range(duration_days)
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
