from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .quiz import handle_quiz
from .summary import handle_summary
from .reading import handle_reading
from .resources import handle_resources
from .videos import handle_videos
from .topics import handle_topics
from .rate_limiter import check_topic_rate_limit, record_topic_creation
import json
from .ai_service import call_gemini_api

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
def get_topic_rate_limit_status(request):
    """Get current rate limiting status for the user"""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET required'}, status=405)
    
    try:
        from .rate_limiter import TopicRateLimiter, get_user_ip
        
        user = getattr(request, 'user', None)
        user_ip = get_user_ip(request)
        
        limiter = TopicRateLimiter(user=user, user_ip=user_ip)
        usage_stats = limiter.get_usage_stats()
        
        return JsonResponse({
            'status': 'success',
            'rate_limit_info': usage_stats
        })
        
    except Exception as e:
        print(f"❌ Error getting rate limit status: {e}")
        return JsonResponse({'error': str(e)}, status=500) 

@csrf_exempt
def classify_topics(request):
    """Classify topics from user query - matches frontend expectations with rate limiting"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        user_query = body.get('query', '')
        
        if not user_query:
            return JsonResponse({'error': 'Query parameter required'}, status=400)
        
        print(f"🔍 Classifying topics for: {user_query}")
        
        prompt = f"""Extract the main topics from this user's course creation request.

User Query: "{user_query}"

Return ONLY a JSON array with the exact topics the user mentioned:
[
  {{"id": 1, "name": "Topic Name", "isActive": true}}
]

IMPORTANT RULES:
- Extract ONLY the main topics explicitly mentioned by the user
- Do NOT break topics into sub-topics or components  
- Do NOT add related topics not mentioned by the user
- Keep topic names simple and direct (1-2 words when possible)
- Maximum 4 topics per response (rate limit enforcement)
- If user mentions more than 4 topics, pick the 4 most important ones
- If user says "arrays, strings" return exactly 2 topics: "Arrays" and "Strings"
- If user says "JavaScript" return exactly 1 topic: "JavaScript"
- If user says "Python data structures" return exactly 1 topic: "Python Data Structures"
- Return JSON only, no explanations"""
        
        try:
            # Call Gemini API
            print("🔑 Attempting Gemini API call...")
            response = call_gemini_api(prompt)
            print(f"✅ Got Gemini response: {response}")
            
            # Extract text from response
            if 'candidates' in response and len(response['candidates']) > 0:
                text = response['candidates'][0]['content']['parts'][0]['text']
                print(f"📝 Extracted text: {text}")
                
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
                    for i, topic in enumerate(topics[:4]):  # Limit to 4 topics
                        if isinstance(topic, dict):
                            formatted_topics.append({
                                'id': topic.get('id', i + 1),
                                'name': topic.get('name', 'Unknown'),
                                'isActive': topic.get('isActive', True)
                            })
                        elif isinstance(topic, str):
                            formatted_topics.append({
                                'id': i + 1,
                                'name': topic,
                                'isActive': True
                            })
                    
                    # Return topics for user to review - DON'T record usage yet
                    if formatted_topics:
                        print(f"✅ Returning formatted topics for review: {formatted_topics}")
                        
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
                    print(f"❌ Failed to parse AI response: {e}")
                    # Return fallback topics for review - DON'T record usage yet
                    fallback_topics = generate_simple_fallback_topics(user_query)
                    
                    if fallback_topics:
                        return JsonResponse({
                            'topics': fallback_topics
                        })
                    else:
                        return JsonResponse({'topics': []})
            else:
                print("❌ No valid candidates in response")
                fallback_topics = generate_simple_fallback_topics(user_query)
                
                if fallback_topics:
                    return JsonResponse({
                        'topics': fallback_topics
                    })
                else:
                    return JsonResponse({'topics': []})
                
        except Exception as api_error:
            print(f"❌ Gemini API error: {api_error}")
            # Return fallback topics for review - DON'T record usage yet
            fallback_topics = generate_simple_fallback_topics(user_query)
            
            if fallback_topics:
                return JsonResponse({
                    'topics': fallback_topics
                })
            else:
                return JsonResponse({'topics': []})
        
    except Exception as e:
        print(f"❌ Error in classify_topics: {e}")
        # Return minimal fallback
        return JsonResponse({'topics': [{'id': 1, 'name': 'General Learning', 'isActive': True}]})

@csrf_exempt 
def create_course_topics(request):
    """Actually create the course topics and apply rate limiting"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        topics = body.get('topics', [])
        
        if not topics:
            return JsonResponse({'error': 'Topics are required'}, status=400)
        
        print(f"🎯 Creating course with topics: {topics}")
        
        # Apply rate limiting NOW (when actually creating)
        allowed, rate_limit_message, usage_stats = check_topic_rate_limit(request, topics)
        
        if not allowed:
            print(f"🚫 Rate limit exceeded during creation: {rate_limit_message}")
            return JsonResponse({
                'error': 'rate_limit_exceeded',
                'message': rate_limit_message,
                'usage_stats': usage_stats
            }, status=429)
        
        # Record the topic creation (only when actually creating)
        updated_usage_stats = record_topic_creation(request, topics)
        
        print(f"✅ Course created successfully!")
        print(f"📊 Updated usage stats: {updated_usage_stats}")
        
        return JsonResponse({
            'success': True,
            'message': f'Course created with {len(topics)} topics!',
            'usage_stats': updated_usage_stats,
            'topics': topics
        })
        
    except Exception as e:
        print(f"❌ Error in create_course_topics: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def generate_simple_fallback_topics(user_query):
    """Generate simple fallback topics based on basic keyword matching (max 4 topics)"""
    query = user_query.lower()
    topics = []
    
    # Simple keyword mapping
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
        if keyword in query and len(topics) < 4:  # Limit to 4 topics
            topics.append({
                'id': topic_id,
                'name': topic_name,
                'isActive': True
            })
            topic_id += 1
    
    # If no keywords matched, return general topic
    if not topics:
        topics = [{'id': 1, 'name': 'General Programming', 'isActive': True}]
    
    return topics[:4]  # Ensure max 4 topics