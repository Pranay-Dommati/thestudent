from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from django.views.decorators.http import require_http_methods
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from .quiz import handle_quiz
from .summary import handle_summary
from .reading import handle_reading
from .resources import handle_resources
from .videos import handle_videos
from .topics import handle_topics
from .rate_limiter import check_topic_rate_limit, record_topic_creation
import json
import logging
from .ai_service import call_gemini_api, NetworkError, call_gemini_2_5_pro_api
import requests
from .youtube import handle_youtube_search

# Configure logging
logger = logging.getLogger(__name__)

# Input validation constants
MAX_QUERY_LENGTH = 1000
MAX_TOPICS_PER_REQUEST = 4


class AIChatThrottle(UserRateThrottle):
    # Much higher throttle in development to avoid 429s during iteration
    rate = '3000/min' if settings.DEBUG else '30/min'


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def chat(request):
    """Secure chat endpoint that proxies Gemini via server-side key."""
    try:
        message = (request.data or {}).get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required'}, status=400)
        if len(message) > 2000:
            return Response({'error': 'Message too long'}, status=400)

        # Call faster flash model for chat if available, else fallback to pro
        try:
            from .ai_service import call_gemini_flash_api
            resp = call_gemini_flash_api(message)
        except Exception:
            resp = call_gemini_api(message)

        # Extract text from Gemini response shape
        text = None
        try:
            if 'candidates' in resp and resp['candidates']:
                parts = resp['candidates'][0].get('content', {}).get('parts', [])
                if parts:
                    text = parts[0].get('text')
        except Exception:
            text = None

        if not text:
            return Response({'error': 'Empty AI response'}, status=502)
        return Response({'text': text})
    except NetworkError as ne:
        return Response({'error': str(ne)}, status=503)
    except Exception as e:
        return Response({'error': 'AI service error'}, status=502)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def quiz(request):
    return handle_quiz(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def summary(request):
    return handle_summary(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def reading(request):
    return handle_reading(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def resources(request):
    return handle_resources(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def videos(request):
    return handle_videos(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def youtube_search(request):
    return handle_youtube_search(request)

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def topics(request):
    return handle_topics(request)

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_topic_rate_limit_status(request):
    """Get current rate limiting status for the user"""
    try:
        from .rate_limiter import TopicRateLimiter, get_user_ip
        user = request.user if request.user and request.user.is_authenticated else None
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

@api_view(["GET"])
@permission_classes([AllowAny])
def debug_rate_limit_cache(request):
    """DEBUG: Get detailed cache information for rate limiting investigation"""
    if not settings.DEBUG:
        return JsonResponse({'error': 'Debug endpoint only available in development'}, status=403)
    
    try:
        from django.core.cache import cache
        from .rate_limiter import TopicRateLimiter, get_user_ip
        from django.contrib.auth import get_user_model
        
        # Try to get authenticated user
        user = None
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                import jwt
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                if user_id:
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
            except Exception:
                user = getattr(request, 'user', None)
        else:
            user = getattr(request, 'user', None)
        
        user_ip = get_user_ip(request)
        
        # Create limiter and get cache key
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        cache_key = limiter.get_cache_key("_daily")
        
        # Get raw cache data
        cache_data = cache.get(cache_key)
        
        # Get all cache keys (if possible)
        try:
            # This might not work with all cache backends
            from django.core.cache.backends.locmem import LocMemCache
            if isinstance(cache, LocMemCache):
                all_keys = list(cache._cache.keys())
                topic_keys = [k for k in all_keys if 'topic_rate_limit' in str(k)]
            else:
                topic_keys = ["Cache backend doesn't support key listing"]
        except Exception:
            topic_keys = ["Unable to list cache keys"]
        
        debug_info = {
            'request_info': {
                'user_authenticated': user and user.is_authenticated,
                'user_id': getattr(user, 'id', None),
                'user_email': getattr(user, 'email', None),
                'user_ip': user_ip,
                'cache_key': cache_key,
                'request_meta_keys': list(request.META.keys()),
                'authorization_header': bool(auth_header),
            },
            'cache_info': {
                'cache_key_exists': cache_data is not None,
                'cache_data': cache_data,
                'all_topic_cache_keys': topic_keys,
                'cache_backend': str(type(cache)),
            },
            'system_info': {
                'debug_mode': settings.DEBUG,
                'cache_timeout': getattr(settings, 'CACHE_TIMEOUT', 'default'),
            }
        }
        
        return JsonResponse({
            'status': 'success',
            'debug_info': debug_info
        })
        
    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}")
        return JsonResponse({'error': f'Debug error: {str(e)}'}, status=500) 

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def classify_topics(request):
    """Classify topics and derive personalization/context from user query with enhanced security and rate limiting"""
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

        prompt = f"""Extract the main learning topics and the user's likely learning context/personalization from this request.

User Query: "{user_query}"

Return ONLY a JSON object with this exact shape:
{{
    "personalization": "A short phrase capturing audience/level/style, e.g., 'Beginner-friendly, step-by-step explanations with practical examples.'",
    "topics": [
        {{"id": 1, "name": "Topic Name", "isActive": true, "context": "Optional topic-specific context like 'for web development' or 'for data science'"}}
    ]
}}

IMPORTANT RULES:
- Understand relationships between topics and technologies
- If the request is BROAD (e.g., "learn python", "learn dsa", "finance", "entrepreneurship"), BREAK IT INTO 2–4 PROGRESSIVE, BEGINNER-FRIENDLY SUBTOPICS that together form a mini-curriculum.
- If user specifies "X in Y" (e.g., "DSA in C++"), either combine as a single unit OR break into 2–4 progressive subtopics that keep the language context (e.g., "Arrays & Strings in C++"). Prefer breaking down when the request is broad.
- Keep the primary learning focus intact and avoid overly generic single-topic outputs.
- Maximum 4 topics total.
- Preserve technological context in topic names.
- Derive "personalization" from the request (audience/level/preferences). If unclear, use this default:
    "Beginner-friendly, step-by-step explanations with practical examples."

Examples:
- "i wanna learn python" → {{
        "personalization": "Beginner-friendly, step-by-step explanations with practical examples.",
        "topics": [
            {{"id": 1, "name": "Introduction to Python & Setup", "isActive": true}},
            {{"id": 2, "name": "Variables, Data Types & Strings", "isActive": true}},
            {{"id": 3, "name": "Control Flow: Conditionals & Loops", "isActive": true}},
            {{"id": 4, "name": "Functions & OOP Basics in Python", "isActive": true}}
        ]
    }}
- "i wanna learn dsa" → {{
        "personalization": "Beginner-friendly, step-by-step explanations with practical examples.",
        "topics": [
            {{"id": 1, "name": "Arrays & Strings", "isActive": true}},
            {{"id": 2, "name": "Stacks & Queues", "isActive": true}},
            {{"id": 3, "name": "Linked Lists & Hash Maps", "isActive": true}},
            {{"id": 4, "name": "Sorting & Searching Basics", "isActive": true}}
        ]
    }}
- "give me a course on finance" → {{
        "personalization": "Beginner-friendly, step-by-step explanations with practical examples.",
        "topics": [
            {{"id": 1, "name": "Personal Finance Fundamentals", "isActive": true}},
            {{"id": 2, "name": "Budgeting & Saving Strategies", "isActive": true}},
            {{"id": 3, "name": "Investing Basics: Stocks & ETFs", "isActive": true}},
            {{"id": 4, "name": "Risk Management & Planning", "isActive": true}}
        ]
    }}
- "get started with entrepreneurship" → {{
        "personalization": "Beginner-friendly, step-by-step explanations with practical examples.",
        "topics": [
            {{"id": 1, "name": "Ideation & Problem Validation", "isActive": true}},
            {{"id": 2, "name": "MVP & Lean Testing", "isActive": true}},
            {{"id": 3, "name": "Business Model & Go-To-Market", "isActive": true}},
            {{"id": 4, "name": "Funding Basics & Key Metrics", "isActive": true}}
        ]
    }}
- "learn DSA in C++" → {{
        "personalization": "Beginner-friendly, step-by-step explanations with practical examples.",
        "topics": [
            {{"id": 1, "name": "Arrays & Strings in C++", "isActive": true}},
            {{"id": 2, "name": "Stacks & Queues in C++", "isActive": true}},
            {{"id": 3, "name": "Linked Lists & Hash Maps in C++", "isActive": true}},
            {{"id": 4, "name": "Sorting & Searching in C++", "isActive": true}}
        ]
    }}

Return only the JSON, no explanations."""
        
        try:
            # Call Gemini 1.5 Pro for topic classification and personalization (more stable for this task)
            if settings.DEBUG:
                logger.debug("Attempting Gemini 1.5 Pro API call for topic classification + personalization...")
            response = call_gemini_api(prompt)
            if settings.DEBUG:
                logger.debug("Got Gemini 1.5 Pro response")
            
            # Extract text from response (robust to shape differences)
            if 'candidates' in response and len(response['candidates']) > 0:
                text = None
                try:
                    parts = response['candidates'][0].get('content', {}).get('parts')
                    if isinstance(parts, list) and parts:
                        # Prefer first part.text if present, else join any texts
                        if isinstance(parts[0], dict) and 'text' in parts[0]:
                            text = parts[0]['text']
                        else:
                            texts = [p.get('text') for p in parts if isinstance(p, dict) and 'text' in p]
                            text = '\n'.join([t for t in texts if t]) if texts else None
                    else:
                        # Some responses might place text differently
                        candidate = response['candidates'][0]
                        if isinstance(candidate.get('content'), str):
                            text = candidate.get('content')
                        elif 'text' in candidate:
                            text = candidate.get('text')
                except Exception:
                    text = None
                if settings.DEBUG:
                    logger.debug(f"Extracted text length: {len(text) if text else 0}")

                # Guard against empty/None text
                personalization_default = "Beginner-friendly, step-by-step explanations with practical examples."
                if not isinstance(text, str) or not text.strip():
                    if settings.DEBUG:
                        logger.debug("Empty or invalid AI text response; returning fallback topics with default personalization")
                    fallback_topics = generate_simple_fallback_topics(user_query)
                    return JsonResponse({
                        'topics': fallback_topics,
                        'personalization': personalization_default
                    })
                
                # Try to parse JSON from response (support object or array for backward compatibility)
                try:
                    # Prefer object shape first (with personalization)
                    import re
                    json_obj_match = re.search(r'\{[\s\S]*\}', text)
                    personalization_default = "Beginner-friendly, step-by-step explanations with practical examples."
                    personalization_value = personalization_default

                    parsed = None
                    if json_obj_match:
                        try:
                            parsed = json.loads(json_obj_match.group())
                        except Exception:
                            parsed = None

                    if parsed is None:
                        # Try array fallback
                        json_arr_match = re.search(r'\[[\s\S]*\]', text)
                        if json_arr_match:
                            parsed = json.loads(json_arr_match.group())
                        else:
                            parsed = json.loads(text)

                    # Normalize to topics list and personalization
                    if isinstance(parsed, dict) and 'topics' in parsed:
                        topics_raw = parsed.get('topics', [])
                        if isinstance(parsed.get('personalization'), str) and parsed.get('personalization').strip():
                            personalization_value = parsed.get('personalization').strip()[:300]
                    elif isinstance(parsed, list):
                        topics_raw = parsed
                    else:
                        raise ValueError("Unexpected JSON shape for topics response")

                    # Ensure proper format and enforce max 4 topics
                    formatted_topics = []
                    for i, topic in enumerate(topics_raw[:MAX_TOPICS_PER_REQUEST]):
                        if isinstance(topic, dict):
                            name = str(topic.get('name', 'Unknown')).strip()[:200]
                            topic_payload = {
                                'id': topic.get('id', i + 1),
                                'name': name,
                                'isActive': topic.get('isActive', True)
                            }
                            # Pass through optional topic-specific context if present
                            if 'context' in topic and isinstance(topic['context'], str) and topic['context'].strip():
                                topic_payload['context'] = topic['context'].strip()[:200]
                            formatted_topics.append(topic_payload)
                        elif isinstance(topic, str):
                            name = str(topic).strip()[:200]
                            formatted_topics.append({
                                'id': i + 1,
                                'name': name,
                                'isActive': True
                            })

                    # Return topics for user to review - DON'T record usage yet
                    if formatted_topics:
                        if settings.DEBUG:
                            logger.debug(f"Returning {len(formatted_topics)} formatted topics for review with personalization")

                        return JsonResponse({
                            'topics': formatted_topics,
                            'personalization': personalization_value
                        })
                    else:
                        # No topics found
                        return JsonResponse({
                            'topics': [],
                            'message': 'No clear learning topics found in your query. Please be more specific.',
                            'personalization': personalization_default
                        })
                    
                except (json.JSONDecodeError, ValueError) as e:
                    if settings.DEBUG:
                        logger.debug(f"Failed to parse AI response: {e}")
                    # Return fallback topics for review with default personalization
                    fallback_topics = generate_simple_fallback_topics(user_query)
                    personalization_default = "Beginner-friendly, step-by-step explanations with practical examples."
                    return JsonResponse({
                        'topics': fallback_topics,
                        'personalization': personalization_default
                    })
            else:
                if settings.DEBUG:
                    logger.debug("No valid candidates in response")
                fallback_topics = generate_simple_fallback_topics(user_query)
                personalization_default = "Beginner-friendly, step-by-step explanations with practical examples."
                return JsonResponse({
                    'topics': fallback_topics,
                    'personalization': personalization_default
                })
                
        except NetworkError as network_error:
            logger.warning(f"Network connection error: {network_error}")
            # Return specific network error response
            return JsonResponse({
                'error': 'network_error',
                'message': 'Network connection lost. Attempting to reconnect...',
                'details': str(network_error),
                'retry_suggested': True
            }, status=503)  # Service Unavailable
                
        except Exception as api_error:
            logger.error(f"Gemini API error: {api_error}")
            # Return fallback topics for review
            fallback_topics = generate_simple_fallback_topics(user_query)
            personalization_default = "Beginner-friendly, step-by-step explanations with practical examples."
            return JsonResponse({
                'topics': fallback_topics,
                'personalization': personalization_default
            })
        
    except Exception as e:
        logger.error(f"Error in classify_topics: {e}")
        # Return minimal fallback
        return JsonResponse({
            'topics': [{'id': 1, 'name': 'General Learning', 'isActive': True}],
            'personalization': "Beginner-friendly, step-by-step explanations with practical examples."
        })

def check_topic_rate_limit_with_auth(request, requested_topics):
    """Enhanced rate limit check with proper authentication and security"""
    from .rate_limiter import TopicRateLimiter, get_user_ip, validate_topic_input
    from django.contrib.auth import get_user_model
    
    # Dev bypass to avoid 429s while iterating locally (enabled when DEBUG or explicit flag)
    if getattr(settings, 'DEBUG', False) or getattr(settings, 'TOPIC_RATE_LIMIT_BYPASS_DEV', False):
        try:
            validate_topic_input(requested_topics)
        except ValueError as e:
            return False, str(e), {}
        return True, "", {
            'daily_used': 0,
            'daily_limit': getattr(settings, 'MAX_TOPICS_PER_DAY', 1000),
            'daily_remaining': getattr(settings, 'MAX_TOPICS_PER_DAY', 1000),
            'per_request_limit': getattr(settings, 'MAX_TOPICS_PER_REQUEST', 4),
        }

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
    
    # Dev bypass to avoid caching usage while iterating locally (enabled when DEBUG or explicit flag)
    if getattr(settings, 'DEBUG', False) or getattr(settings, 'TOPIC_RATE_LIMIT_BYPASS_DEV', False):
        try:
            validate_topic_input(topics_created)
        except ValueError:
            return {}
        return {
            'daily_used': 0,
            'daily_limit': getattr(settings, 'MAX_TOPICS_PER_DAY', 1000),
            'daily_remaining': getattr(settings, 'MAX_TOPICS_PER_DAY', 1000),
            'per_request_limit': getattr(settings, 'MAX_TOPICS_PER_REQUEST', 4),
        }

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

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@throttle_classes([AIChatThrottle])
def create_course_topics(request):
    """Actually create the course topics and apply rate limiting with enhanced security"""
    try:
        # Parse and validate input
        try:
            body = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        topics = body.get('topics', [])

        # Basic structural validation first
        if not topics:
            return JsonResponse({'error': 'Topics are required'}, status=400)

        if not isinstance(topics, list):
            return JsonResponse({'error': 'Topics must be a list'}, status=400)

        if len(topics) > MAX_TOPICS_PER_REQUEST:
            return JsonResponse({
                'error': f'Too many topics: maximum {MAX_TOPICS_PER_REQUEST} allowed per request'
            }, status=400)

        # Validate topic names using rate_limiter validation for clear 400s
        try:
            from .rate_limiter import validate_topic_input
            validate_topic_input(topics)
        except ValueError as ve:
            return JsonResponse({'error': str(ve)}, status=400)
        
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
    """Generate structured fallback topics (up to 4) for broad queries with security validation"""
    if not user_query or len(user_query) > MAX_QUERY_LENGTH:
        return [
            {'id': 1, 'name': 'Introduction to Programming Concepts', 'isActive': True},
            {'id': 2, 'name': 'Variables, Data Types & Operators', 'isActive': True},
            {'id': 3, 'name': 'Control Flow: Conditionals & Loops', 'isActive': True},
            {'id': 4, 'name': 'Functions & Modular Code', 'isActive': True},
        ]

    query = user_query.lower().strip()

    def four(ids_names):
        # Ensure ids are 1..n and cap at MAX_TOPICS_PER_REQUEST
        return [
            {'id': i + 1, 'name': n, 'isActive': True}
            for i, n in enumerate(ids_names[:MAX_TOPICS_PER_REQUEST])
        ]

    # Domain-specific 4-topic mini-curricula
    if 'python' in query:
        return four([
            'Introduction to Python & Setup',
            'Variables, Data Types & Strings',
            'Control Flow: Conditionals & Loops',
            'Functions & OOP Basics in Python',
        ])
    if 'dsa' in query or 'data structures' in query or 'algorithms' in query:
        return four([
            'Arrays & Strings',
            'Stacks & Queues',
            'Linked Lists & Hash Maps',
            'Sorting & Searching Basics',
        ])
    if 'finance' in query or 'personal finance' in query:
        return four([
            'Personal Finance Fundamentals',
            'Budgeting & Saving Strategies',
            'Investing Basics: Stocks & ETFs',
            'Risk Management & Financial Planning',
        ])
    if 'entrepreneur' in query or 'entrepreneurship' in query or 'startup' in query:
        return four([
            'Ideation & Problem Validation',
            'MVP & Lean Testing',
            'Business Model & Go-To-Market',
            'Funding Basics & Key Metrics',
        ])
    if 'javascript' in query or 'js' in query:
        return four([
            'JavaScript Basics & Syntax',
            'DOM & Events',
            'Functions, Scope & Closures',
            'Async JS: Promises & Async/Await',
        ])
    if 'react' in query:
        return four([
            'React Fundamentals & Components',
            'State & Props',
            'Hooks: useState & useEffect',
            'Routing & Project Structure',
        ])
    if 'java' in query:
        return four([
            'Java Basics & Setup',
            'OOP in Java: Classes & Objects',
            'Collections & Generics',
            'Exception Handling & File I/O',
        ])
    if 'web' in query or 'frontend' in query:
        return four([
            'HTML & Semantic Structure',
            'CSS Fundamentals & Layout',
            'JavaScript Essentials for the Web',
            'Building a Simple Web Project',
        ])

    # General programming default
    return four([
        'Introduction to Programming Concepts',
        'Variables, Data Types & Operators',
        'Control Flow: Conditionals & Loops',
        'Functions & Modular Code',
    ])