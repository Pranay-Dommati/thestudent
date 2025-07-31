from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from .models import ProLearningCourse, ProLearningTopic
from .serializers import (
    ProLearningCourseSerializer,
    ProLearningCourseCreateSerializer,
    ProLearningTopicSerializer,
    ProLearningTopicCreateSerializer,
    ProLearningTopicUpdateSerializer
)


class ProLearningCourseListCreateView(generics.ListCreateAPIView):
    """
    GET /api/courses/pro-learning/ - List all user's Pro Learning courses
    POST /api/courses/pro-learning/ - Create a new Pro Learning course
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ProLearningCourse.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProLearningCourseCreateSerializer
        return ProLearningCourseSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new Pro Learning course from localStorage data"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                course = serializer.save()
                return Response(
                    ProLearningCourseSerializer(course).data,
                    status=status.HTTP_201_CREATED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProLearningCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/courses/pro-learning/{course_id}/ - Get specific course details
    PUT /api/courses/pro-learning/{course_id}/ - Update course
    DELETE /api/courses/pro-learning/{course_id}/ - Delete course
    """
    serializer_class = ProLearningCourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'course_id'
    
    def get_queryset(self):
        return ProLearningCourse.objects.filter(user=self.request.user)


class ProLearningTopicListView(generics.ListAPIView):
    """
    GET /api/courses/pro-learning/{course_id}/topics/ - List all topics for a course
    """
    serializer_class = ProLearningTopicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        course_id = self.kwargs['course_id']
        course = get_object_or_404(
            ProLearningCourse,
            course_id=course_id,
            user=self.request.user
        )
        return course.topics.all().order_by('order')


class ProLearningTopicDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/courses/pro-learning/{course_id}/topics/{topic_id}/ - Get specific topic
    PUT /api/courses/pro-learning/{course_id}/topics/{topic_id}/ - Update topic
    """
    serializer_class = ProLearningTopicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        course_id = self.kwargs['course_id']
        topic_id = self.kwargs['topic_id']
        
        course = get_object_or_404(
            ProLearningCourse,
            course_id=course_id,
            user=self.request.user
        )
        
        return get_object_or_404(
            ProLearningTopic,
            id=topic_id,
            course=course
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_topic_complete(request, course_id, topic_id):
    """
    PATCH /api/courses/pro-learning/{course_id}/topics/{topic_id}/complete/
    Mark a topic as completed/uncompleted
    """
    course = get_object_or_404(
        ProLearningCourse,
        course_id=course_id,
        user=request.user
    )
    
    topic = get_object_or_404(
        ProLearningTopic,
        id=topic_id,
        course=course
    )
    
    serializer = ProLearningTopicUpdateSerializer(
        topic,
        data=request.data,
        partial=True
    )
    
    if serializer.is_valid():
        serializer.save()
        
        # Check if all topics are completed to mark course as complete
        if course.topics.filter(is_completed=False).count() == 0:
            course.is_completed = True
            course.save()
        
        return Response(
            ProLearningTopicSerializer(topic).data,
            status=status.HTTP_200_OK
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_progress(request, course_id):
    """
    GET /api/courses/pro-learning/{course_id}/progress/
    Get course progress statistics
    """
    course = get_object_or_404(
        ProLearningCourse,
        course_id=course_id,
        user=request.user
    )
    
    total_topics = course.topics.count()
    completed_topics = course.topics.filter(is_completed=True).count()
    completion_percentage = (completed_topics / total_topics * 100) if total_topics > 0 else 0
    
    progress_data = {
        'course_id': course.course_id,
        'title': course.title,
        'total_topics': total_topics,
        'completed_topics': completed_topics,
        'completion_percentage': round(completion_percentage, 2),
        'is_completed': course.is_completed,
        'created_at': course.created_at,
        'updated_at': course.updated_at
    }
    
    return Response(progress_data, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_course_from_localStorage(request):
    """
    POST /api/courses/pro-learning/save-from-storage/
    Save course content from localStorage to database
    """
    try:
        course_id = request.data.get('course_id')
        title = request.data.get('title')
        topics_data = request.data.get('topics', {})
        
        if not course_id or not title:
            return Response(
                {'error': 'course_id and title are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if course already exists
        if ProLearningCourse.objects.filter(
            course_id=course_id,
            user=request.user
        ).exists():
            return Response(
                {'error': 'Course already exists in your Learning Hub'},
                status=status.HTTP_409_CONFLICT
            )
        
        # Create course using the create serializer
        serializer = ProLearningCourseCreateSerializer(
            data={
                'course_id': course_id,
                'title': title,
                'description': f'AI-generated course on {title}',
                'topics_data': topics_data
            },
            context={'request': request}
        )
        
        if serializer.is_valid():
            with transaction.atomic():
                course = serializer.save()
                return Response(
                    {
                        'message': 'Course saved successfully to Learning Hub!',
                        'course': ProLearningCourseSerializer(course).data
                    },
                    status=status.HTTP_201_CREATED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to save course: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
