from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import ProLearningCourse, ProLearningTopic, ProLearningShareLink
from .serializers import (
    ProLearningCourseSerializer,
    ProLearningCourseCreateSerializer,
    ProLearningTopicSerializer,
    ProLearningTopicCreateSerializer,
    ProLearningTopicUpdateSerializer,
    PublicProLearningCourseSerializer,
    ProLearningShareLinkSerializer,
)


class ProLearningCourseListCreateView(generics.ListCreateAPIView):
    """
    GET /api/courses/pro-learning/ - List all user's Pro Learning courses
    POST /api/courses/pro-learning/ - Create a new Pro Learning course
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            queryset = ProLearningCourse.objects.filter(user=self.request.user).order_by('-created_at')
            if settings.DEBUG:
                print(f"🔍 Debug - User: {self.request.user}")
                print(f"🔍 Debug - Queryset count: {queryset.count()}")
                for course in queryset:
                    print(f"🔍 Debug - Course: {course.course_name}, ID: {course.id}")
                    print(f"🔍 Debug - Topics count: {course.topics.count()}")
            return queryset
        except Exception as e:
            print(f"❌ Error in get_queryset: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProLearningCourseCreateSerializer
        return ProLearningCourseSerializer
    
    def list(self, request, *args, **kwargs):
        """Override list method to add debugging"""
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            if settings.DEBUG:
                print(f"🔍 Debug - Serializer data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            print(f"❌ Error in list method: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
    GET /api/courses/pro-learning/{id}/ - Get specific course details
    PUT /api/courses/pro-learning/{id}/ - Update course
    DELETE /api/courses/pro-learning/{id}/ - Delete course
    """
    serializer_class = ProLearningCourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        # Allow admins to view any course
        if getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False):
            return ProLearningCourse.objects.all()
        return ProLearningCourse.objects.filter(user=self.request.user)


class ProLearningTopicListView(generics.ListAPIView):
    """
    GET /api/courses/pro-learning/{course_id}/topics/ - List all topics for a course
    """
    serializer_class = ProLearningTopicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        course_id = self.kwargs['id']
        # Admins can access any course topics
        if getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False):
            course = get_object_or_404(ProLearningCourse, id=course_id)
        else:
            course = get_object_or_404(
                ProLearningCourse,
                id=course_id,
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
        course_id = self.kwargs['id']
        topic_id = self.kwargs['topic_id']
        
        course = get_object_or_404(
            ProLearningCourse,
            id=course_id,
            user=self.request.user
        )
        
        return get_object_or_404(
            ProLearningTopic,
            id=topic_id,
            course=course
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_topic_complete(request, id, topic_id):
    """
    PATCH /api/courses/pro-learning/{id}/topics/{topic_id}/complete/
    Mark a topic as completed/uncompleted
    """
    # Note: URL pattern uses '<uuid:id>', so the parameter name here must be 'id'
    # to correctly receive the course identifier from the route.
    course = get_object_or_404(
        ProLearningCourse,
        id=id,
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

        # Persist course-wide completion percentage and flags
        try:
            # Recalculate and store completion percentage on the course model
            course.update_completion_percentage()
        except Exception:
            # Fallback: still mark complete if all topics completed
            if course.topics.filter(is_completed=False).count() == 0:
                course.is_completed = True
                course.save(update_fields=['is_completed'])
        
        return Response(
            ProLearningTopicSerializer(topic).data,
            status=status.HTTP_200_OK
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_progress(request, id):
    """
    GET /api/courses/pro-learning/{id}/progress/
    Get course progress statistics
    """
    # Admins can view progress for any course
    if getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False):
        course = get_object_or_404(ProLearningCourse, id=id)
    else:
        course = get_object_or_404(
            ProLearningCourse,
            id=id,
            user=request.user
        )
    
    total_topics = course.topics.count()
    completed_topics = course.topics.filter(is_completed=True).count()
    completion_percentage = (completed_topics / total_topics * 100) if total_topics > 0 else 0
    
    progress_data = {
        'course_id': course.id,
        'title': course.title,
        'total_topics': total_topics,
        'completed_topics': completed_topics,
        'completion_percentage': round(completion_percentage, 2),
        'is_completed': course.is_completed,
        'created_at': course.created_at,
        'updated_at': course.updated_at
    }
    
    return Response(progress_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_course_from_localStorage(request):
    """
    POST /api/courses/pro-learning/save-from-storage/
    Save course content from localStorage to database with proper topic structure
    """
    try:
        data = request.data
        title = data.get('title')
        description = data.get('description')
        proficiency = data.get('proficiency', 'beginner')
        category = data.get('category', 'AI Generated')
        topics = data.get('topics', [])
        learning_points = data.get('learning_points', [])
        requirements = data.get('requirements', [])
        
        if not title or not topics:
            return Response(
                {'error': 'title and topics are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create course using the create serializer
        serializer = ProLearningCourseCreateSerializer(
            data={
                'title': title,
                'description': description,
                'proficiency': proficiency,
                'category': category,
                'learning_points': learning_points,
                'requirements': requirements,
                'is_published': True,
                'topics_data': [
                    {
                        'name': topic['name'],
                        'content': topic['content'],
                        'order': idx
                    } for idx, topic in enumerate(topics)
                ]
            },
            context={'request': request}
        )
        
        if serializer.is_valid():
            with transaction.atomic():
                course = serializer.save(user=request.user)
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


# ==================== PUBLIC SHARING ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_share_link(request, id):
    """
    POST /api/courses/pro-learning/{id}/share/
    Create (or return existing) active public share link for a course owned by the user.
    """
    course = get_object_or_404(ProLearningCourse, id=id, user=request.user)

    # Return an existing active link if present, otherwise create one
    link = (
        ProLearningShareLink.objects
        .filter(course=course, is_active=True)
        .order_by('-created_at')
        .first()
    )
    if not link:
        link = ProLearningShareLink.objects.create(course=course, created_by=request.user)

    serializer = ProLearningShareLinkSerializer(link, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def revoke_share_link(request, share_id):
    """
    DELETE/PATCH /api/courses/pro-learning/share/{share_id}/
    Revoke/deactivate a share link. Only the course owner can revoke.
    """
    link = get_object_or_404(ProLearningShareLink, id=share_id)
    if link.created_by != request.user and link.course.user != request.user and not getattr(request.user, 'is_staff', False):
        return Response({'detail': 'Not authorized to revoke this link.'}, status=status.HTTP_403_FORBIDDEN)

    link.is_active = False
    link.save(update_fields=['is_active'])
    return Response({'status': 'revoked', 'id': str(link.id)}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_shared_course(request, share_id):
    """
    GET /api/courses/pro-learning/share/{share_id}/
    Public, unauthenticated endpoint to fetch a shared course's read-only content.
    """
    link = get_object_or_404(ProLearningShareLink, id=share_id)
    if not link.is_usable():
        return Response({'detail': 'This shared link is no longer available.'}, status=status.HTTP_410_GONE)

    course = link.course
    data = PublicProLearningCourseSerializer(course).data
    # Include minimal share metadata for client UX
    data['share'] = {
        'id': str(link.id),
        'created_at': link.created_at,
        'expires_at': link.expires_at,
    }
    return Response(data, status=status.HTTP_200_OK)
