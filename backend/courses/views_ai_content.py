from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AITopicContent
from .serializers import AITopicContentSerializer
import json

class AIContentViewSet(viewsets.ModelViewSet):
    """ViewSet for AI-generated content (topics)"""
    serializer_class = AITopicContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AITopicContent.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to return learning plan format"""
        instance = self.get_object()
        
        # Convert to learning plan format for frontend compatibility
        learning_plan_data = {
            'id': str(instance.id),
            'title': instance.course_title,
            'type': 'ai_learning_plan',
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            'plan_data': {
                'goal': instance.course_title,
                'days': [{
                    'day': 1,
                    'topic': instance.topic_name,
                    'reading': instance.reading,
                    'summary': instance.summary,
                    'videos': instance.videos if isinstance(instance.videos, list) else [],
                    'resources': instance.resources if isinstance(instance.resources, list) else [],
                    'quiz': instance.quiz if isinstance(instance.quiz, list) else [],
                    'projects': instance.projects if isinstance(instance.projects, list) else [],
                }]
            }
        }
        
        return Response(learning_plan_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_ai_content(request):
    """Get all AI content for the authenticated user"""
    try:
        # Get all AI topic content for the user
        ai_content = AITopicContent.objects.filter(user=request.user)
        
        # Group by course_title to create a plan-like structure
        plans = {}
        for content in ai_content:
            course_title = content.course_title
            if course_title not in plans:
                plans[course_title] = {
                    'id': str(content.id),  # Use the content ID as plan ID
                    'title': course_title,
                    'type': 'ai_learning_plan',
                    'created_at': content.created_at,
                    'updated_at': content.updated_at,
                    'plan_data': {
                        'goal': course_title,
                        'days': []
                    }
                }
            
            # Add topic as a day in the plan
            plans[course_title]['plan_data']['days'].append({
                'day': len(plans[course_title]['plan_data']['days']) + 1,
                'topic': content.topic_name,
                'reading': content.reading,
                'summary': content.summary,
                'videos': content.videos if isinstance(content.videos, list) else [],
                'resources': content.resources if isinstance(content.resources, list) else [],
                'quiz': content.quiz if isinstance(content.quiz, list) else [],
                'projects': content.projects if isinstance(content.projects, list) else [],
            })
        
        # Convert to list format expected by frontend
        plans_list = list(plans.values())
        
        return Response(plans_list, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch AI content: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_learning_plan(request, plan_id):
    """Get a specific AI learning plan by ID"""
    try:
        # Find the first AI content with this ID for this user
        ai_content = AITopicContent.objects.filter(user=request.user, id=plan_id).first()
        
        if not ai_content:
            # If not found by ID, try to find by course title
            ai_contents = AITopicContent.objects.filter(user=request.user)
            
            # Group by course title and find the one that matches the plan_id as title
            for content in ai_contents:
                if str(content.id) == str(plan_id):
                    ai_content = content
                    break
            
            if not ai_content:
                return Response(
                    {'error': 'Learning plan not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get all topics for this course
        course_title = ai_content.course_title
        all_topics = AITopicContent.objects.filter(user=request.user, course_title=course_title)
        
        # Create the learning plan structure
        plan_data = {
            'id': str(ai_content.id),
            'title': course_title,
            'type': 'ai_learning_plan',
            'created_at': ai_content.created_at,
            'updated_at': ai_content.updated_at,
            'plan_data': {
                'goal': course_title,
                'days': []
            }
        }
        
        # Add all topics as days
        for i, topic in enumerate(all_topics, 1):
            plan_data['plan_data']['days'].append({
                'day': i,
                'topic': topic.topic_name,
                'reading': topic.reading,
                'summary': topic.summary,
                'videos': topic.videos if isinstance(topic.videos, list) else [],
                'resources': topic.resources if isinstance(topic.resources, list) else [],
                'quiz': topic.quiz if isinstance(topic.quiz, list) else [],
                'projects': topic.projects if isinstance(topic.projects, list) else [],
            })
        
        return Response(plan_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch learning plan: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_ai_content(request):
    """Create AI-generated content for a topic"""
    try:
        data = request.data
        
        # Handle different possible data structures from frontend
        if 'plan_data' in data and isinstance(data['plan_data'], dict):
            # Frontend is sending in learning plan format
            plan_data = data['plan_data']
            course_title = data.get('title') or plan_data.get('goal', 'Untitled Course')
            
            # Extract topics from days structure
            days = plan_data.get('days', [])
            if not days:
                return Response(
                    {'error': 'No topics found in plan data'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process each day/topic
            created_contents = []
            for day_data in days:
                topic_name = day_data.get('topic', f"Day {day_data.get('day', 1)}")
                
                # Create or update content for this topic
                content_data = {
                    'course_title': course_title,
                    'topic_name': topic_name,
                    'reading': day_data.get('reading', ''),
                    'summary': day_data.get('summary', ''),
                    'videos': day_data.get('videos', []),
                    'resources': day_data.get('resources', []),
                    'quiz': day_data.get('quiz', []),
                    'projects': day_data.get('projects', []),
                }
                
                # Check if content already exists
                existing_content = AITopicContent.objects.filter(
                    user=request.user,
                    course_title=course_title,
                    topic_name=topic_name
                ).first()
                
                if existing_content:
                    serializer = AITopicContentSerializer(
                        existing_content, 
                        data=content_data, 
                        partial=True,
                        context={'request': request}
                    )
                else:
                    serializer = AITopicContentSerializer(
                        data=content_data,
                        context={'request': request}
                    )
                
                if serializer.is_valid():
                    ai_content = serializer.save()
                    created_contents.append(ai_content)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Return the first content item in learning plan format
            if created_contents:
                first_content = created_contents[0]
                return Response({
                    'id': first_content.id,
                    'title': course_title,
                    'type': 'ai_topic_content',
                    'plan_data': {
                        'goal': course_title,
                        'days': [{
                            'day': i + 1,
                            'topic': content.topic_name,
                            'reading': content.reading,
                            'summary': content.summary,
                            'videos': content.videos,
                            'resources': content.resources,
                            'quiz': content.quiz,
                            'projects': content.projects,
                        } for i, content in enumerate(created_contents)]
                    },
                    'created_at': first_content.created_at,
                    'updated_at': first_content.updated_at,
                }, status=status.HTTP_201_CREATED)
        
        else:
            # Direct topic content format
            course_title = data.get('course_title') or data.get('title')
            topic_name = data.get('topic_name') or data.get('topic')
            
            if not course_title or not topic_name:
                return Response(
                    {'error': 'course_title and topic_name are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if content already exists for this user, course, and topic
            existing_content = AITopicContent.objects.filter(
                user=request.user,
                course_title=course_title,
                topic_name=topic_name
            ).first()
            
            if existing_content:
                # Update existing content
                serializer = AITopicContentSerializer(
                    existing_content, 
                    data=data, 
                    partial=True,
                    context={'request': request}
                )
            else:
                # Create new content
                serializer = AITopicContentSerializer(
                    data=data,
                    context={'request': request}
                )
            
            if serializer.is_valid():
                ai_content = serializer.save()
                return Response({
                    'id': ai_content.id,
                    'course_title': ai_content.course_title,
                    'topic_name': ai_content.topic_name,
                    'reading': ai_content.reading,
                    'summary': ai_content.summary,
                    'videos': ai_content.videos,
                    'resources': ai_content.resources,
                    'quiz': ai_content.quiz,
                    'projects': ai_content.projects,
                    'created_at': ai_content.created_at,
                    'updated_at': ai_content.updated_at,
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response(
            {'error': f'Failed to create AI content: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_content_by_course(request, course_title):
    """Get AI content for a specific course"""
    try:
        ai_content = AITopicContent.objects.filter(
            user=request.user,
            course_title=course_title
        )
        
        topics = []
        for content in ai_content:
            topics.append({
                'id': content.id,
                'topic_name': content.topic_name,
                'reading': content.reading,
                'summary': content.summary,
                'videos': content.videos,
                'resources': content.resources,
                'created_at': content.created_at,
                'updated_at': content.updated_at,
            })
        
        return Response({
            'course_title': course_title,
            'topics': topics,
            'count': len(topics)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch course content: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
