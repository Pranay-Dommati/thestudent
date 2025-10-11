"""
Enhanced error handling patches for views that are causing 500 errors
Apply these fixes to improve error reporting and prevent crashes
"""

# Fix 1: Improve error handling in list_engineering_courses
# Location: backend/courses/views.py around line 387

IMPROVED_LIST_ENGINEERING_COURSES = '''
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def list_engineering_courses(request):
    """List engineering courses with improved error handling"""
    try:
        category = request.query_params.get('category', 'all')
        logger = logging.getLogger('django')
        
        if settings.DEBUG:
            logger.debug(f"Requested category: {category}")
        
        # Get queryset
        queryset = EngineeringCourse.objects.all()
        
        if settings.DEBUG:
            logger.debug(f"Total courses before filtering: {queryset.count()}")
        
        # Apply category filter
        if category and category != 'all' and category != '':
            queryset = queryset.filter(category=category)
            if settings.DEBUG:
                logger.debug(f"Courses after category filter: {queryset.count()}")

        # Process course data with error handling
        courses_data = []
        for course in queryset:
            try:
                # Build thumbnail URL safely
                thumbnail_url = None
                if course.thumbnail:
                    try:
                        thumbnail_url = request.build_absolute_uri(course.thumbnail.url)
                    except Exception as e:
                        logger.warning(f"Error building thumbnail URL for course {course.id}: {e}")
                        thumbnail_url = None
                
                course_data = {
                    'id': str(course.id),
                    'title': str(course.title or ''),
                    'thumbnail': thumbnail_url,
                    'short_description': str(course.short_description or ''),
                    'description': str(course.description or ''),
                    'duration': str(course.duration or ''),
                    'sources': str(course.sources or ''),
                    'proficiency': str(course.proficiency or ''),
                    'certificate_given': bool(course.certificate_given),
                    'project_based': bool(course.project_based),
                    'category': str(course.category or ''),
                    'last_updated': course.last_updated.isoformat() if course.last_updated else None,
                }
                courses_data.append(course_data)
            except Exception as course_error:
                logger.error(f"Error processing course {course.id}: {course_error}")
                # Continue with other courses
                continue

        logger.info(f"Successfully processed {len(courses_data)} courses")
        return Response(courses_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger = logging.getLogger('django')
        logger.error(f"Error in list_engineering_courses: {str(e)}")
        logger.error(traceback.format_exc())
        
        return Response(
            {
                "error": "Internal server error",
                "message": "Failed to fetch engineering courses",
                "details": str(e) if settings.DEBUG else "An error occurred"
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
'''

# Fix 2: Improve error handling in enrollment_status
# Location: backend/courses/views.py around line 1857

IMPROVED_ENROLLMENT_STATUS = '''
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enrollment_status(request, course_id):
    """Compatibility endpoint with improved error handling"""
    from .models import UserStartedPredefinedCourse, SchoolCourse, EngineeringCourse
    import logging
    
    logger = logging.getLogger('django')
    
    try:
        user = request.user
        
        if not user or not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not course_id:
            return Response(
                {'error': 'course_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course_type = None
        is_enrolled = False
        
        # Try to find course and check enrollment
        try:
            # Check if it's a school course
            if SchoolCourse.objects.filter(id=course_id).exists():
                course_type = 'school'
                is_enrolled = UserStartedPredefinedCourse.objects.filter(
                    user=user, 
                    school_course_id=course_id
                ).exists()
            # Check if it's an engineering course
            elif EngineeringCourse.objects.filter(id=course_id).exists():
                course_type = 'engineering'
                is_enrolled = UserStartedPredefinedCourse.objects.filter(
                    user=user, 
                    engineering_course_id=course_id
                ).exists()
            else:
                return Response(
                    {'error': 'Course not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'is_enrolled': is_enrolled,
                'course_type': course_type,
                'course_id': str(course_id)
            }, status=status.HTTP_200_OK)
            
        except Exception as db_error:
            logger.error(f"Database error checking enrollment for course {course_id}: {db_error}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Database error', 'details': str(db_error) if settings.DEBUG else 'An error occurred'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Error in enrollment_status: {e}")
        logger.error(traceback.format_exc())
        return Response(
            {'error': 'Internal server error', 'details': str(e) if settings.DEBUG else 'An error occurred'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
'''

# Fix 3: Improve create_course_topics error handling
# Location: backend/backend/ai/views.py around line 1469

IMPROVED_CREATE_COURSE_TOPICS = '''
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course_topics(request):
    """Create course topics with enhanced error handling"""
    import logging
    logger = logging.getLogger('ai')
    
    try:
        # Parse request body
        try:
            if isinstance(request.body, bytes):
                body = json.loads(request.body.decode('utf-8'))
            else:
                body = json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError) as parse_error:
            logger.error(f"JSON parse error: {parse_error}")
            return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
        
        # Validate topics field
        topics = body.get('topics', [])
        
        if not topics:
            return JsonResponse({'error': 'Topics are required'}, status=400)

        if not isinstance(topics, list):
            return JsonResponse({'error': 'Topics must be a list'}, status=400)

        if len(topics) > MAX_TOPICS_PER_REQUEST:
            return JsonResponse({
                'error': f'Too many topics: maximum {MAX_TOPICS_PER_REQUEST} allowed per request'
            }, status=400)

        # Validate topic structure
        try:
            from .rate_limiter import validate_topic_input
            validate_topic_input(topics)
        except ValueError as ve:
            logger.warning(f"Topic validation failed: {ve}")
            return JsonResponse({'error': str(ve)}, status=400)
        except Exception as validation_error:
            logger.error(f"Unexpected validation error: {validation_error}")
            return JsonResponse({'error': 'Topic validation failed'}, status=400)
        
        if settings.DEBUG:
            logger.debug(f"Creating course with {len(topics)} topics")
        
        # Apply rate limiting
        try:
            allowed, rate_limit_message, usage_stats = check_topic_rate_limit_with_auth(request, topics)
            
            if not allowed:
                logger.warning(f"Rate limit exceeded: {rate_limit_message}")
                return JsonResponse({
                    'error': 'rate_limit_exceeded',
                    'message': rate_limit_message,
                    'usage_stats': usage_stats
                }, status=429)
        except Exception as rate_limit_error:
            logger.error(f"Rate limiting error: {rate_limit_error}")
            # Continue anyway if rate limiting fails (fail open)
            usage_stats = {}
        
        # Record topic creation
        try:
            updated_usage_stats = record_topic_creation_with_auth(request, topics)
        except Exception as record_error:
            logger.error(f"Error recording topic creation: {record_error}")
            updated_usage_stats = {}
        
        if settings.DEBUG:
            logger.debug("Course created successfully!")
            logger.debug(f"Updated usage stats: {updated_usage_stats}")
        
        return JsonResponse({
            'success': True,
            'message': f'Course created with {len(topics)} topics!',
            'usage_stats': updated_usage_stats,
            'topics': topics
        }, status=200)
        
    except Exception as e:
        logger.error(f"Unexpected error in create_course_topics: {e}")
        logger.error(traceback.format_exc())
        return JsonResponse({
            'error': 'Internal server error',
            'message': str(e) if settings.DEBUG else 'An error occurred while creating course topics'
        }, status=500)
'''

print("Error handling improvements prepared!")
print("\\nThese enhanced versions add:")
print("- Better exception handling at multiple levels")
print("- More detailed logging")
print("- Graceful fallbacks")
print("- Proper error messages for debugging")
print("\\nReview the improvements above and apply them to the respective view files if needed.")
