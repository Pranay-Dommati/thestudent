from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .quiz import handle_quiz
from .summary import handle_summary
from .reading import handle_reading
from .resources import handle_resources
from .videos import handle_videos
from .topics import handle_topics
from .rate_limiter import check_topic_rate_limit, record_topic_creation
import json
import logging
from .ai_service import call_gemini_api

# Configure logging
logger = logging.getLogger(__name__)

# Input validation constants
MAX_QUERY_LENGTH = 1000
MAX_TOPICS_PER_REQUEST = 4

@csrf_exempt
def quiz(request):
    return handle_quiz(request)

@csrf_exempt
def summary(request):
    return handle_summary(request)

@csrf_exempt
def reading(request):
    return handle_reading(request)

@csrf_exempt
def resources(request):
    return handle_resources(request)

@csrf_exempt
def videos(request):
    return handle_videos(request)

@csrf_exempt
def topics(request):
    return handle_topics(request) 

@csrf_exempt
@require_http_methods(["GET"])
def get_topic_rate_limit_status(request):
    """Get current rate limiting status for the user"""
    try:
        from .rate_limiter import TopicRateLimiter, get_user_ip
        from django.contrib.auth import get_user_model
        
        # Try to get authenticated user from Authorization header
        user = None
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
            try:
                # Try to decode JWT token to get user
                import jwt
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                if user_id:
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    if not settings.DEBUG:
                        logger.info(f"Successfully decoded JWT for user: {user_id}")
            except Exception as token_error:
                if settings.DEBUG:
                    logger.debug(f"JWT decode failed: {token_error}")
                # Fallback to request.user
                user = getattr(request, 'user', None)
        else:
            user = getattr(request, 'user', None)
        
        user_ip = get_user_ip(request)
        
        # Debug logging only in development
        if settings.DEBUG:
            logger.debug(f"Rate limit check - User: {user}")
            logger.debug(f"Rate limit check - User authenticated: {user and user.is_authenticated}")
            logger.debug(f"Rate limit check - User ID: {getattr(user, 'id', 'None')}")
            logger.debug(f"Rate limit check - User IP: {user_ip}")
        
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        usage_stats = limiter.get_usage_stats()
        
        if settings.DEBUG:
            logger.debug(f"Usage stats returned: {usage_stats}")
        
        return JsonResponse({
            'status': 'success',
            'rate_limit_info': usage_stats
        })
        
    except Exception as e:
        logger.error(f"Error getting rate limit status: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500) 

@csrf_exempt
@require_http_methods(["POST"])
def classify_topics(request):
    """Classify topics from user query with enhanced security and rate limiting"""
    try:
        # Parse and validate input
        try:
            body = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        user_query = body.get('query', '').strip()
        
        # Input validation
        if not user_query:
            return JsonResponse({'error': 'Query parameter required'}, status=400)
        
        if len(user_query) > MAX_QUERY_LENGTH:
            return JsonResponse({'error': f'Query too long (max {MAX_QUERY_LENGTH} characters)'}, status=400)
        
        # Sanitize query for logging
        safe_query = user_query[:100] + "..." if len(user_query) > 100 else user_query
        if settings.DEBUG:
            logger.debug(f"Classifying topics for: {safe_query}")
        
        # Extract context and main topic focus
        parts = user_query.lower().split(" in ")
        learning_context = parts[1].strip() if len(parts) > 1 else None

        prompt = f"""Extract the main learning topics from this user's request, understanding the context and relationships between topics.

User Query: "{user_query}"

Return ONLY a JSON array with properly contextualized topics:
[
  {{"id": 1, "name": "Topic Name", "isActive": true, "context": "Optional Context"}}
]

IMPORTANT RULES:
- Understand relationships between topics and technologies
- If user specifies "X in Y" (e.g. "DSA in C++"), combine them as one topic
- Keep the primary learning focus intact
- Maximum 4 topics total
- Preserve technological context in topic names

Examples:
- "learn DSA in C++" → [{{id: 1, name: "Data Structures and Algorithms in C++", isActive: true}}]
- "create course on arrays and strings in java" → [{{id: 1, name: "Java Arrays", isActive: true}}, {{id: 2, name: "Java Strings", isActive: true}}]
- "python for web development" → [{{id: 1, name: "Python Web Development", isActive: true}}]

Return only the JSON array, no explanations."""
        
        try:
            # Call Gemini API
            if settings.DEBUG:
                logger.debug("Attempting Gemini API call...")
            response = call_gemini_api(prompt)
            if settings.DEBUG:
                logger.debug("Got Gemini response")
            
            # Extract text from response
            if 'candidates' in response and len(response['candidates']) > 0:
                text = response['candidates'][0]['content']['parts'][0]['text']
                if settings.DEBUG:
                    logger.debug(f"Extracted text length: {len(text)}")
                
                # Try to parse JSON from response
                try:
                    # Extract JSON array from response
                    import re
                    json_match = re.search(r'\[[\s\S]*\]', text)
                    if json_match:
                        topics = json.loads(json_match.group())
                    else:
                        topics = json.loads(text)
                    
                    # Validate structure
                    if not isinstance(topics, list):
                        raise ValueError("Response is not a list")
                    
                    # Ensure proper format and enforce max 4 topics
                    formatted_topics = []
                    for i, topic in enumerate(topics[:MAX_TOPICS_PER_REQUEST]):
                        if isinstance(topic, dict):
                            name = str(topic.get('name', 'Unknown')).strip()[:200]  # Limit length
                            formatted_topics.append({
                                'id': topic.get('id', i + 1),
                                'name': name,
                                'isActive': topic.get('isActive', True)
                            })
                        elif isinstance(topic, str):
                            name = str(topic).strip()[:200]  # Limit length
                            formatted_topics.append({
                                'id': i + 1,
                                'name': name,
                                'isActive': True
                            })
                    
                    # Return topics for user to review - DON'T record usage yet
                    if formatted_topics:
                        if settings.DEBUG:
                            logger.debug(f"Returning {len(formatted_topics)} formatted topics for review")
                        
                        return JsonResponse({
                            'topics': formatted_topics
                        })
                    else:
                        # No topics found
                        return JsonResponse({
                            'topics': [],
                            'message': 'No clear learning topics found in your query. Please be more specific.'
                        })
                    
                except (json.JSONDecodeError, ValueError) as e:
                    if settings.DEBUG:
                        logger.debug(f"Failed to parse AI response: {e}")
                    # Return fallback topics for review
                    fallback_topics = generate_simple_fallback_topics(user_query)
                    
                    return JsonResponse({
                        'topics': fallback_topics
                    })
            else:
                if settings.DEBUG:
                    logger.debug("No valid candidates in response")
                fallback_topics = generate_simple_fallback_topics(user_query)
                
                return JsonResponse({
                    'topics': fallback_topics
                })
                
        except Exception as api_error:
            logger.error(f"Gemini API error: {api_error}")
            # Return fallback topics for review
            fallback_topics = generate_simple_fallback_topics(user_query)
            
            return JsonResponse({
                'topics': fallback_topics
            })
        
    except Exception as e:
        logger.error(f"Error in classify_topics: {e}")
        # Return minimal fallback
        return JsonResponse({
            'topics': [{'id': 1, 'name': 'General Learning', 'isActive': True}]
        })

def check_topic_rate_limit_with_auth(request, requested_topics):
    """Enhanced rate limit check with proper authentication and security"""
    from .rate_limiter import TopicRateLimiter, get_user_ip, validate_topic_input
    from django.contrib.auth import get_user_model
    
    try:
        # Validate input first
        validate_topic_input(requested_topics)
    except ValueError as e:
        return False, str(e), {}
    
    # Try to get authenticated user from Authorization header
    user = None
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        try:
            # Try to decode JWT token to get user
            import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if user_id:
                User = get_user_model()
                user = User.objects.get(id=user_id)
                if settings.DEBUG:
                    logger.debug(f"Successfully decoded JWT - User ID: {user_id}")
        except Exception as token_error:
            if settings.DEBUG:
                logger.debug(f"JWT decode failed: {token_error}")
            # Fallback to request.user
            user = getattr(request, 'user', None)
    else:
        user = getattr(request, 'user', None)
    
    user_ip = get_user_ip(request)
    
    try:
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        allowed, message, usage_data = limiter.is_request_allowed(requested_topics)
        usage_stats = limiter.get_usage_stats()
        
        return allowed, message, usage_stats
    except Exception as e:
        logger.error(f"Rate limit check error: {e}")
        return False, "Rate limiting error occurred", {}

def record_topic_creation_with_auth(request, topics_created):
    """Enhanced topic creation recording with proper authentication and security"""
    from .rate_limiter import TopicRateLimiter, get_user_ip, validate_topic_input
    from django.contrib.auth import get_user_model
    
    try:
        # Validate input first
        validate_topic_input(topics_created)
    except ValueError as e:
        logger.error(f"Invalid topics in record: {e}")
        return {}
    
    # Try to get authenticated user from Authorization header
    user = None
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        try:
            # Try to decode JWT token to get user
            import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if user_id:
                User = get_user_model()
                user = User.objects.get(id=user_id)
        except Exception as token_error:
            if settings.DEBUG:
                logger.debug(f"JWT decode failed: {token_error}")
            # Fallback to request.user
            user = getattr(request, 'user', None)
    else:
        user = getattr(request, 'user', None)
    
    user_ip = get_user_ip(request)
    
    try:
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        usage_data = limiter.record_usage(topics_created)
        
        return limiter.get_usage_stats()
    except Exception as e:
        logger.error(f"Topic creation recording error: {e}")
        return {}

@csrf_exempt 
@require_http_methods(["POST"])
def create_course_topics(request):
    """Actually create the course topics and apply rate limiting with enhanced security"""
    try:
        # Parse and validate input
        try:
            body = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        topics = body.get('topics', [])
        
        if not topics:
            return JsonResponse({'error': 'Topics are required'}, status=400)
        
        if not isinstance(topics, list):
            return JsonResponse({'error': 'Topics must be a list'}, status=400)
        
        if len(topics) > MAX_TOPICS_PER_REQUEST:
            return JsonResponse({
                'error': f'Too many topics: maximum {MAX_TOPICS_PER_REQUEST} allowed per request'
            }, status=400)
        
        if settings.DEBUG:
            logger.debug(f"Creating course with {len(topics)} topics")
        
        # Apply rate limiting NOW (when actually creating)
        allowed, rate_limit_message, usage_stats = check_topic_rate_limit_with_auth(request, topics)
        
        if not allowed:
            logger.warning(f"Rate limit exceeded during creation: {rate_limit_message}")
            return JsonResponse({
                'error': 'rate_limit_exceeded',
                'message': rate_limit_message,
                'usage_stats': usage_stats
            }, status=429)
        
        # Record the topic creation (only when actually creating)
        updated_usage_stats = record_topic_creation_with_auth(request, topics)
        
        if settings.DEBUG:
            logger.debug("Course created successfully!")
            logger.debug(f"Updated usage stats: {updated_usage_stats}")
        
        return JsonResponse({
            'success': True,
            'message': f'Course created with {len(topics)} topics!',
            'usage_stats': updated_usage_stats,
            'topics': topics
        })
        
    except Exception as e:
        logger.error(f"Error in create_course_topics: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)

def generate_simple_fallback_topics(user_query):
    """Generate simple fallback topics based on basic keyword matching with security validation"""
    if not user_query or len(user_query) > MAX_QUERY_LENGTH:
        return [{'id': 1, 'name': 'General Programming', 'isActive': True}]
    
    query = user_query.lower().strip()
    topics = []
    
    # Simple keyword mapping with input sanitization
    keywords = {
        'javascript': 'JavaScript',
        'react': 'React',
        'python': 'Python',
        'html': 'HTML',
        'css': 'CSS',
        'java': 'Java',
        'programming': 'Programming',
        'web': 'Web Development',
        'mobile': 'Mobile Development',
        'api': 'API Development'
    }
    
    topic_id = 1
    for keyword, topic_name in keywords.items():
        if keyword in query and len(topics) < MAX_TOPICS_PER_REQUEST:
            topics.append({
                'id': topic_id,
                'name': topic_name,
                'isActive': True
            })
            topic_id += 1
    
    # If no keywords matched, return general topic
    if not topics:
        topics = [{'id': 1, 'name': 'General Programming', 'isActive': True}]
    
    return topics[:MAX_TOPICS_PER_REQUEST]  # Ensure max topics limit