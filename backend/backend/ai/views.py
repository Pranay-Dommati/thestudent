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
from .ai_service import call_gemini_api, NetworkError, call_intent_classifier, call_gemini_flash_api
import requests
from .youtube import handle_youtube_search
import re

# Use the 'ai' logger configured in settings (console+file, level INFO by default)
logger = logging.getLogger('ai')

# Input validation constants
MAX_QUERY_LENGTH = 1000
MAX_TOPICS_PER_REQUEST = 4


def derive_personalization(user_query: str) -> str:
    """Derive a concise, domain-aware personalization from the user query.
    Keeps it short and instructive, suitable for the confirmation modal.
    """
    try:
        pq = (user_query or '').lower()
        # Detect level
        level = None
        if any(k in pq for k in ['advanced', 'deep dive', 'expert', 'pro level', 'senior']):
            level = 'advanced'
        elif any(k in pq for k in ['intermediate', 'medium', 'some experience', 'familiar']):
            level = 'intermediate'
        elif any(k in pq for k in ['beginner', 'new to', 'no experience', 'basic', 'basics']):
            level = 'beginner'

        # Domain categories
        is_math = any(k in pq for k in [
            'trigonometry', 'trigonometric', 'trignometric', 'calculus', 'algebra', 'geometry', 'math', 'unit circle', 'sine', 'cosine', 'tangent'
        ])
        is_exam = any(k in pq for k in ['jee', 'neet', 'sat', 'gate', 'exam', 'test prep'])
        # DSA-specific signals
        is_dsa = any(k in pq for k in [
            'dsa', 'data structure', 'data structures', 'algorithms', 'leetcode', 'coding interview',
            'time complexity', 'space complexity', 'big o', 'big-o'
        ])
        is_coding = is_dsa or any(k in pq for k in [
            'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'react', 'node', 'django', 'flask']
        )
        is_finance = any(k in pq for k in ['finance', 'economics', 'stock', 'stocks', 'etf', 'invest', 'trading'])
        is_digital = any(k in pq for k in [
            'digital logic', 'logic gate', 'logic gates', 'boolean algebra', 'karnaugh', 'k-map', 'k map', 'truth table',
            'combinational', 'sequential', 'flip-flop', 'flip flops', 'flipflop', 'latch', 'fsm', 'state machine',
            'multiplexer', 'decoder', 'encoder', 'adder', 'subtractor', 'register', 'counter', 'binary', 'hexadecimal',
            'octal', 'number system'
        ])
        if is_digital:
            if level == 'advanced' or level == 'intermediate':
                text = 'Hands-on digital logic with annotated examples: truth tables, Karnaugh maps, minimization, timing diagrams, and FSM design.'
            elif level == 'beginner':
                text = 'Beginner-friendly digital logic with visual truth tables, step-by-step K-map simplification, and progressive circuit exercises.'
            else:
                text = 'Practical digital logic with truth tables, K-Maps, and progressive circuit design practice.'
            return text[:300]
        is_history = any(k in pq for k in [
            'history', 'ww1', 'ww2', 'wwi', 'wwii', 'world war i', 'world war ii', 'world war 1', 'world war 2',
            'second world war', 'first world war'
        ])
        is_business = any(k in pq for k in ['entrepreneur', 'startup', 'business', 'founder'])

        # Build personalization phrase
        # DSA personalization (before generic coding)
        if is_dsa:
            if level == 'advanced' or level == 'intermediate':
                text = (
                    'Intermediate-to-advanced DSA with interview-style problems; annotated code (Python/C++), '
                    'pattern-based solutions (two pointers, sliding window, recursion/backtracking, DP), '
                    'Big-O analysis, tests, and edge cases.'
                )
            elif level == 'beginner':
                text = (
                    'Beginner-friendly DSA with visual intuitions, step-by-step dry runs, annotated Python code, '
                    'practice problems, and clear Big-O reasoning.'
                )
            else:
                text = (
                    'Example-driven DSA with code walkthroughs, problem patterns, Big-O analysis, and '
                    'progressive LeetCode-style practice.'
                )
            return text[:300]

        if is_coding:
            if level == 'advanced' or level == 'intermediate':
                text = (
                    'Intermediate-to-advanced, hands-on coding with projects; assumes basics; '
                    'focus on best practices, performance, and real-world patterns.'
                )
            elif level == 'beginner':
                text = 'Beginner-friendly, practical code walkthroughs with bite-sized projects.'
            else:
                text = 'Practical, example-driven coding with step-by-step walkthroughs and projects.'
            return text[:300]

        if is_math:
            if level == 'advanced' or level == 'intermediate':
                text = 'Intermediate-to-advanced, visual intuition with proof sketches and problem-solving drills.'
            elif level == 'beginner':
                text = 'Beginner-friendly, visual explanations with scaffolded practice and step-by-step examples.'
            else:
                text = 'Visual explanations with step-by-step derivations and graded problem sets.'
            return text[:300]

        if is_exam:
            text = 'Exam-focused with timed practice, strategy tips, and targeted error analysis.'
            return text[:300]

        if is_finance:
            text = 'Real-world examples, calculators, and decision frameworks with clear risk/return trade-offs.'
            return text[:300]

        if is_history:
            text = 'Narrative timelines with maps, primary sources, and geopolitical context; compare causes, strategies, and consequences.'
            return text[:300]

        if is_business:
            text = 'Lean, case-driven learning with experiments, metrics, and actionable templates.'
            return text[:300]

        # Generic fallback by level
        if level == 'advanced' or level == 'intermediate':
            return 'Intermediate-to-advanced, example-driven learning with efficient practice and quick feedback.'
        if level == 'beginner':
            return 'Beginner-friendly, step-by-step explanations with practical examples.'

        # Default catch-all
        return 'Accessible, example-driven learning with clear steps and quick feedback.'
    except Exception:
        return 'Accessible, example-driven learning with clear steps and quick feedback.'


def extract_explicit_topics(user_query: str):
    """Extract explicitly mentioned topics when the user names them, especially for DSA.
    Returns a list of topic objects or an empty list when nothing explicit is found.
    """
    try:
        text = (user_query or '').lower()

        # Do NOT attempt to append language/framework or domain suffixes here.
        # Only detect the base topics; context enrichment will be handled by AI in direct mode.

        # Detect DSA domain suffix
        dsa_suffix = ''
        if any(k in text for k in [' dsa', 'data structures', 'algorithms']):
            dsa_suffix = ' in DSA'

        # Token-to-topic mapping for DSA (structures + techniques)
        dsa_topic_map = [
            (['array', 'arrays'], 'Arrays'),
            (['string', 'strings'], 'Strings'),
            (['stack', 'stacks'], 'Stacks'),
            (['queue', 'queues'], 'Queues'),
            (['linked list', 'linked lists'], 'Linked Lists'),
            (['hash map', 'hash maps', 'hashmap', 'hash table', 'hash tables'], 'Hash Maps'),
            (['tree', 'trees', 'bst', 'binary search tree'], 'Trees'),
            (['graph', 'graphs'], 'Graphs'),
            (['heap', 'heaps', 'priority queue', 'priority queues'], 'Heaps & Priority Queues'),
            (['trie', 'tries'], 'Tries'),
            (['sort', 'sorting'], 'Sorting'),
            (['search', 'searching', 'binary search'], 'Searching'),
            (['dp', 'dynamic programming'], 'Dynamic Programming'),
            (['recursion', 'recursive'], 'Recursion'),
            (['backtracking', 'back-track'], 'Backtracking'),
            (['two pointers', 'two-pointers', 'two pointer'], 'Two Pointers'),
            (['sliding window', 'sliding-window'], 'Sliding Window'),
            (['greedy'], 'Greedy Algorithms'),
            (['divide and conquer', 'divide & conquer', 'divide-and-conquer'], 'Divide & Conquer'),
            (['bfs', 'breadth first search', 'breadth-first search'], 'BFS'),
            (['dfs', 'depth first search', 'depth-first search'], 'DFS'),
            (['topological sort', 'topo sort'], 'Topological Sort'),
            (['prefix sum', 'prefix sums'], 'Prefix Sums'),
            (['bit manipulation', 'bitmask', 'bitwise'], 'Bit Manipulation'),
        ]

        # Trigonometry detection (including common misspelling)
        is_trig = any(k in text for k in [
            'trigonometry', 'trigonometric', 'trignometric', 'trigonometric ratios', 'trigonometric ratio',
            'trig ratios', 'sine', 'cosine', 'tangent', 'secant', 'cosecant', 'cotangent', 'unit circle',
            'radians', 'degrees'
        ])
        trig_suffix = ' in Trigonometry'
        trig_topic_map = []
        if is_trig:
            trig_topic_map = [
                (['trigonometric ratios', 'trigonometric ratio', 'trig ratios'], 'Trigonometric Ratios: sin, cos, tan'),
                (['sine', 'cosine', 'tangent'], 'Trigonometric Ratios: sin, cos, tan'),
                (['secant', 'cosecant', 'cotangent'], 'Reciprocal & Co-function Ratios: sec, csc, cot'),
                (['unit circle', 'special angles'], 'Unit Circle & Special Angles'),
                (['radians', 'degrees', 'angle measure', 'angle measurement'], 'Angles, Degrees & Radians'),
                (['identities', 'trigonometric identities', 'trig identities'], 'Trigonometric Identities'),
                (['inverse trig', 'inverse trigonometric'], 'Inverse Trig Functions'),
                (['graphs', 'graphing'], 'Trig Graphs & Transformations'),
                (['law of sines'], 'Law of Sines'),
                (['law of cosines'], 'Law of Cosines'),
                (['applications', 'problem solving'], 'Applications & Problem Solving'),
            ]

        # Digital Logic detection
        is_digital = any(k in text for k in [
            'digital logic', 'logic gate', 'logic gates', 'boolean algebra', 'karnaugh', 'k-map', 'k map', 'truth table',
            'combinational', 'sequential', 'flip-flop', 'flip flops', 'flipflop', 'latch', 'fsm', 'state machine',
            'multiplexer', 'decoder', 'encoder', 'adder', 'subtractor', 'register', 'counter', 'binary', 'hexadecimal',
            'octal', 'number system'
        ])
        digital_topic_map = []
        if is_digital:
            digital_topic_map = [
                (['number system', 'binary', 'octal', 'hexadecimal'], 'Number Systems & Conversions'),
                (['boolean algebra', 'truth table'], 'Boolean Algebra & Truth Tables'),
                (['logic gate', 'logic gates', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'], 'Logic Gates & Minimization'),
                (['karnaugh', 'k-map', 'k map'], 'Karnaugh Maps (K-Map) Simplification'),
                (['combinational', 'adder', 'subtractor', 'multiplexer', 'decoder', 'encoder'], 'Combinational Circuits: Adders, MUX/Decoder'),
                (['sequential', 'flip-flop', 'flip flops', 'flipflop', 'latch', 'register', 'counter'], 'Sequential Circuits: Flip-Flops, Counters & Registers'),
                (['fsm', 'state machine'], 'Finite State Machines (FSM) Design'),
                (['timing', 'waveform'], 'Timing Diagrams & Hazards'),
            ]

        # Collect matches with their earliest index to preserve input order
        matches = []  # list of tuples: (index, title)
        # DSA matches
        for keys, name in dsa_topic_map:
            idxs = [text.find(k) for k in keys if k in text]
            if idxs:
                # Return base name only; no suffixes here
                title = name
                matches.append((min(idxs), title))
        # Trigonometry matches
        for keys, name in trig_topic_map:
            idxs = [text.find(k) for k in keys if k in text]
            if idxs:
                # Return base name only; no suffixes here
                title = name
                matches.append((min(idxs), title))
        # Digital logic matches
        for keys, name in digital_topic_map:
            idxs = [text.find(k) for k in keys if k in text]
            if idxs:
                # Return base name only; no suffixes here
                title = name
                matches.append((min(idxs), title))

        if matches:
            # Sort by appearance order, then deduplicate while preserving order
            matches.sort(key=lambda x: x[0])
            ordered = []
            seen = set()
            for _, title in matches:
                if title not in seen:
                    seen.add(title)
                    ordered.append(title)

            topics = [
                {'id': i + 1, 'name': ordered[i], 'isActive': True}
                for i in range(min(len(ordered), MAX_TOPICS_PER_REQUEST))
            ]
            return topics

        return []
    except Exception:
        return []


def _merge_with_fallback(user_query: str, explicit_topics: list):
    """If explicit topics are fewer than MAX_TOPICS_PER_REQUEST, merge with domain fallback.
    Preserves order: explicit first, then fallback topics excluding duplicates by name (case-insensitive).
    Returns topics with sequential ids starting at 1.
    """
    try:
        names_ci = set(t.get('name', '').strip().lower() for t in explicit_topics if isinstance(t, dict))
        fallback = generate_simple_fallback_topics(user_query)
        merged = []
        # Start with explicit (keep original order and fields where present)
        for t in explicit_topics:
            if isinstance(t, dict) and t.get('name'):
                merged.append({'id': len(merged) + 1, 'name': t['name'], 'isActive': True, **({k: v for k, v in t.items() if k in ('context',)})})
        # Add fallback excluding duplicates
        for t in fallback:
            name = t.get('name') if isinstance(t, dict) else None
            if not name:
                continue
            if name.strip().lower() in names_ci:
                continue
            merged.append({'id': len(merged) + 1, 'name': name, 'isActive': True})
            names_ci.add(name.strip().lower())
            if len(merged) >= MAX_TOPICS_PER_REQUEST:
                break
        # Cap and reassign ids
        merged = merged[:MAX_TOPICS_PER_REQUEST]
        for idx, t in enumerate(merged):
            t['id'] = idx + 1
        return merged
    except Exception:
        # On error, just fallback
        return generate_simple_fallback_topics(user_query)


def build_topics_prompt(user_query: str, explicit_names: list[str] | None = None) -> str:
        """Build a robust prompt for Gemini to produce 2–4 topics and a concise personalization.
        If explicit_names are provided, instruct the model to include them (lightly rephrase allowed)
        and, if fewer than 4, complete with closely related topics to form a cohesive mini-curriculum.
        """
        explicit_clause = ""
        if explicit_names:
                # Keep it compact; model can lightly rephrase but preserve intent
                names_str = ", ".join(explicit_names[:MAX_TOPICS_PER_REQUEST])
                explicit_clause = f"\nMUST INCLUDE these user-named topics (you may lightly rephrase names but keep intent): [{names_str}]. If fewer than {MAX_TOPICS_PER_REQUEST}, add closely related topics to reach up to {MAX_TOPICS_PER_REQUEST}."

        return f"""You are an expert curriculum designer and learning coach.
Analyze the user's request and return: (1) 2–4 precise topics and (2) a tailored personalization capturing learner level, intent, tone, pace, prerequisites, and domain context.

Return ONLY a JSON object with this exact shape (no extra text):
{{
    "personalization": "Short, informative phrase under 220 characters.",
    "topics": [
        {{"id": 1, "name": "Topic Name", "isActive": true, "context": "Optional topic-specific context"}}
    ]
}}

Guidelines for personalization:
- Infer level (beginner/intermediate/advanced) from cues; if uncertain, default to accessible but domain-appropriate.
- Include 2–3 hints about delivery style (e.g., visual, example-driven, step-by-step, proof-oriented, exam-focused).
- Include domain framing if signaled (e.g., web dev, DSA/interview, high-school math, electronics).

Guidelines for topics:
- If the request is BROAD (e.g., "learn java"), BREAK into 2–4 progressive subtopics forming a mini-curriculum.
- Preserve explicit context like language or domain (e.g., "Arrays & Strings in DSA").
- Maximum {MAX_TOPICS_PER_REQUEST} topics total.
- Topic names should be specific and outcomes-oriented when possible.{explicit_clause}

User Query: "{user_query}"

Return only the JSON, no explanations."""


def build_direct_topics_prompt(user_query: str, explicit_names: list[str]) -> str:
        """Build a prompt for AI to enrich explicit topics with context from the user query.
        Requirements:
        - Preserve number and order of topics exactly as provided in explicit_names
        - Lightly rephrase each name to include relevant context (e.g., language/framework/domain),
            such as "Recursion in Python" instead of just "Recursion" when the query indicates it.
        - Output a JSON object with the topics array only (personalization is not required here).
        """
        names_str = ", ".join(explicit_names[:MAX_TOPICS_PER_REQUEST])
        return f"""You are an expert at clarifying topic names with context.
From the user's query and their explicit topics, rewrite each topic name to include relevant context indicated by the query (e.g., language/framework/domain), but do NOT add or remove topics and preserve the same order.

Return ONLY a JSON object with this exact shape (no extra text):
{{
    "topics": [
        {{"id": 1, "name": "Rephrased Topic", "isActive": true}},
        {{"id": 2, "name": "Rephrased Topic", "isActive": true}}
    ]
}}

Rules:
- Keep exactly {len(explicit_names[:MAX_TOPICS_PER_REQUEST])} topics, same order as provided.
- If the query implies a programming language, framework, or domain (e.g., Python, JavaScript, DSA, Trigonometry), reflect it in the topic names: e.g., "{{Original}} in Python".
- Be concise and clear. Topic names should be <= 60 characters when possible.

User Query: "{user_query}"
Explicit Topics (in order): [{names_str}]

Return only the JSON, no explanations.
"""


def classify_query_intent(user_query: str) -> str:
    """Heuristically classify the query as 'direct' or 'broad'.
    - direct: user named specific topics (e.g., arrays, recursion, AES, bubble sort)
    - broad: user asked for a general area (e.g., python, trigonometry, digital logic)
    """
    try:
        q = (user_query or '').strip().lower()
        if not q:
            return 'broad'

        # Quick signals: lists or conjunctions typically indicate direct items
        if any(sep in q for sep in [',', ';']) or any(conn in q for conn in [' and ', ' or '] ):
            return 'direct'

        # Known broad domains
        broad_terms = {
            'python','java','javascript','typescript','react','node','django','flask','c++','c#','golang','go','rust',
            'dsa','data structures','algorithms','math','algebra','trigonometry','calculus','geometry','probability','statistics',
            'digital logic','history','world history','ww1','ww2','web','frontend','backend'
        }
        for t in broad_terms:
            if t in q:
                # Some short tokens like 'ww1'/'ww2' we treat as broad historical themes
                return 'broad'

        # Short single-term queries that are acronyms or specific concepts -> direct
        toks = q.split()
        if len(toks) == 1:
            tok = toks[0]
            # Common specific concepts
            specific_set = {'aes','rsa','sha','sha-256','sha256','bubble sort','binary search','recursion','pointers','stack','queue','linked list','mitosis','photosynthesis'}
            if tok in specific_set:
                return 'direct'
            # Acronym-like or library/util single token
            if tok.isalpha() and 2 <= len(tok) <= 6:
                return 'direct'
        # Phrases like 'learn about <x>' where x is a single specific concept
        if any(p in q for p in ['learn about ', 'study ', 'deep dive into ', 'explain ']):
            # If extractor finds specific topics, consider direct
            if extract_explicit_topics(user_query):
                return 'direct'

        # Default
        return 'direct' if extract_explicit_topics(user_query) else 'broad'
    except Exception:
        return 'broad'


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
        logger.info(f"Classifying topics for: {safe_query}")
        
        # Extract context and main topic focus
        parts = user_query.lower().split(" in ")
        learning_context = parts[1].strip() if len(parts) > 1 else None

        # Structured debug metadata returned to frontend for transparency
        debug_meta = {
            'intent': None,
            'intent_source': None,           # ai | heuristic-fallback | override
            'prompt_mode': None,            # direct | broad
            'explicit_constraints': [],
            'topic_model_used': None,       # 2.5-pro | 1.5-pro
            'model_retry_used': False,
            'fallback_used': False,
            'fallback_strategy': None,
        }

        # Classify intent: explicit vs broad (AI-first, fallback to heuristic)
        intent = None
        try:
            ic_resp = call_intent_classifier(user_query)
            ic_text = None
            if 'candidates' in ic_resp and ic_resp['candidates']:
                parts_ic = ic_resp['candidates'][0].get('content', {}).get('parts', [])
                if parts_ic:
                    ic_text = parts_ic[0].get('text')
            if isinstance(ic_text, str) and ic_text.strip():
                import re
                m = re.search(r'\{[\s\S]*\}', ic_text)
                parsed_ic = json.loads(m.group()) if m else json.loads(ic_text)
                if isinstance(parsed_ic, dict) and parsed_ic.get('intent') in ['broad', 'direct']:
                    intent = parsed_ic['intent']
                    logger.info(f"Intent classifier (AI) returned: {intent} for query='{safe_query}'")
                    debug_meta['intent'] = intent
                    debug_meta['intent_source'] = 'ai'
                    # Post-classification guardrail: single short term should be direct
                    uq = user_query.strip()
                    if intent == 'broad' and len(uq.split()) == 1 and 2 <= len(uq) <= 15:
                        intent = 'direct'
                        logger.info("Intent override applied (single short term → direct)")
                        debug_meta['intent'] = intent
                        debug_meta['intent_source'] = 'override'
        except Exception:
            intent = None
        if not intent:
            logger.info("Intent classifier failed; falling back to heuristic")
        if not intent:
            intent = classify_query_intent(user_query)
            logger.info(f"Heuristic intent decided: {intent}")
            debug_meta['intent'] = intent
            debug_meta['intent_source'] = 'heuristic-fallback'
        try:
            explicit_topics = extract_explicit_topics(user_query)
        except Exception:
            explicit_topics = []
        explicit_names = [t.get('name') for t in explicit_topics if isinstance(t, dict) and t.get('name')]

        # For direct intent: return extracted topic names as-is; for broad: let AI break down freely
        if intent == 'direct' and explicit_names:
            # Direct mode: enrich explicit topics with query context using AI (no breakdown, same count/order)
            debug_meta['prompt_mode'] = 'direct'
            debug_meta['explicit_constraints'] = explicit_names
            logger.info(f"Direct mode: enriching {len(explicit_names)} explicit topics with context via AI")

            prompt_direct = build_direct_topics_prompt(user_query, explicit_names[:MAX_TOPICS_PER_REQUEST])
            used_model = None
            response = None
            try:
                response = call_gemini_api(prompt_direct)
                used_model = '1.5-pro'
            except Exception:
                try:
                    response = call_gemini_flash_api(prompt_direct)
                    used_model = '1.5-flash'
                except Exception as e:
                    logger.info(f"Direct enrichment failed, using explicit topics as-is. Error: {e}")
                    # Fall back to explicit topics unchanged
                    formatted_topics = [
                        {'id': i + 1, 'name': name, 'isActive': True}
                        for i, name in enumerate(explicit_names[:MAX_TOPICS_PER_REQUEST])
                    ]
                    debug_meta['topic_model_used'] = None
                    debug_meta['topics_count'] = len(formatted_topics)
                    debug_meta['fallback_used'] = True
                    debug_meta['fallback_strategy'] = 'direct_enrichment_failed'
                    personalization_value = derive_personalization(user_query)
                    return JsonResponse({
                        'topics': formatted_topics,
                        'personalization': personalization_value,
                        'debug_meta': debug_meta
                    })

            debug_meta['topic_model_used'] = used_model
            # Extract and parse topics JSON
            enriched_topics = None
            try:
                text = None
                if 'candidates' in response and response['candidates']:
                    parts_resp = response['candidates'][0].get('content', {}).get('parts', [])
                    if parts_resp:
                        text = parts_resp[0].get('text')
                if isinstance(text, str) and text.strip():
                    import re
                    m = re.search(r'\{[\s\S]*\}', text)
                    parsed = json.loads(m.group()) if m else json.loads(text)
                    if isinstance(parsed, dict) and isinstance(parsed.get('topics'), list):
                        enriched_topics = parsed['topics']
            except Exception:
                enriched_topics = None

            # Validate and normalize enriched topics; fallback to explicit if malformed
            formatted_topics = []
            if isinstance(enriched_topics, list) and len(enriched_topics) == len(explicit_names[:MAX_TOPICS_PER_REQUEST]):
                for i, topic in enumerate(enriched_topics[:MAX_TOPICS_PER_REQUEST]):
                    if isinstance(topic, dict):
                        name = str(topic.get('name', explicit_names[i])).strip()[:200]
                        formatted_topics.append({'id': i + 1, 'name': name, 'isActive': True})
                    elif isinstance(topic, str):
                        name = str(topic).strip()[:200]
                        formatted_topics.append({'id': i + 1, 'name': name, 'isActive': True})
            else:
                # Fallback: keep original explicit names
                formatted_topics = [
                    {'id': i + 1, 'name': name, 'isActive': True}
                    for i, name in enumerate(explicit_names[:MAX_TOPICS_PER_REQUEST])
                ]
                if used_model:
                    debug_meta['fallback_used'] = True
                    debug_meta['fallback_strategy'] = 'direct_enrichment_parse_failed'

            debug_meta['topics_count'] = len(formatted_topics)
            personalization_value = derive_personalization(user_query)
            return JsonResponse({
                'topics': formatted_topics,
                'personalization': personalization_value,
                'debug_meta': debug_meta
            })
        
        # Broad mode: use AI to generate curriculum breakdown
        prompt = build_topics_prompt(user_query, None)  # No constraints for broad mode
        debug_meta['prompt_mode'] = 'broad'
        debug_meta['explicit_constraints'] = []
        logger.info(f"Broad mode: using AI to break down '{safe_query}' into curriculum")
        
        try:
            # Use Gemini 1.5 Pro for topic classification + personalization; fallback to 1.5 Flash.
            if settings.DEBUG:
                logger.debug("Attempting Gemini 1.5 Pro API call for topic classification + personalization...")
            try:
                response = call_gemini_api(prompt)
                used_model = '1.5-pro'
            except Exception:
                response = call_gemini_flash_api(prompt)
                used_model = '1.5-flash'
            logger.info(f"Topic generation model used: {used_model}")
            debug_meta['topic_model_used'] = used_model
            
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
                personalization_default = derive_personalization(user_query)
                if not isinstance(text, str) or not text.strip():
                    logger.info("Empty/invalid AI text; retry with Gemini 1.5 Pro before fallback")
                    # If initial was 1.5 Flash, retry once with 1.5 Pro; if initial was 1.5 Pro, no retry
                    if used_model == '1.5-flash':
                        try:
                            retry_resp = call_gemini_api(prompt)
                            # Extract retry text
                            retry_text = None
                            if 'candidates' in retry_resp and retry_resp['candidates']:
                                rparts = retry_resp['candidates'][0].get('content', {}).get('parts', [])
                                if rparts:
                                    retry_text = rparts[0].get('text')
                            if isinstance(retry_text, str) and retry_text.strip():
                                text = retry_text
                                debug_meta['model_retry_used'] = True
                                debug_meta['topic_model_used'] = '1.5-pro'
                            else:
                                raise ValueError('Empty retry text')
                        except Exception:
                            text = None
                    if not text:
                        logger.info("Falling back to explicit+merge or domain fallback topics")
                        # Compute fallback with strategy labeling
                        fallback_topics = []
                        if explicit_topics:
                            fallback_topics = _merge_with_fallback(user_query, explicit_topics)
                            if fallback_topics:
                                debug_meta['fallback_strategy'] = 'explicit_merge'
                        if not fallback_topics:
                            re_explicit = extract_explicit_topics(user_query)
                            if re_explicit:
                                fallback_topics = re_explicit
                                debug_meta['fallback_strategy'] = 're_extract_explicit'
                        if not fallback_topics:
                            fallback_topics = generate_simple_fallback_topics(user_query)
                            debug_meta['fallback_strategy'] = 'domain_fallback'
                        debug_meta['fallback_used'] = True
                        return JsonResponse({
                            'topics': fallback_topics,
                            'personalization': personalization_default,
                            'debug_meta': debug_meta
                        })
                
                # Try to parse JSON from response (support object or array for backward compatibility)
                try:
                    # Prefer object shape first (with personalization)
                    import re
                    json_obj_match = re.search(r'\{[\s\S]*\}', text)
                    personalization_default = derive_personalization(user_query)
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

                        # Heuristic enhancement: if personalization is too generic or empty,
                        # rebuild it from the query using derive_personalization().
                        if not personalization_value or personalization_value.strip().lower() in (
                            'beginner-friendly, step-by-step explanations with practical examples.'.lower(),
                            'beginner friendly, step by step explanations with practical examples.'.lower()
                        ):
                            personalization_value = derive_personalization(user_query)

                        debug_meta['topics_count'] = len(formatted_topics)
                        return JsonResponse({
                            'topics': formatted_topics,
                            'personalization': personalization_value,
                            'debug_meta': debug_meta
                        })
                    else:
                        # No topics found
                        debug_meta['topics_count'] = 0
                        return JsonResponse({
                            'topics': [],
                            'message': 'No clear learning topics found in your query. Please be more specific.',
                            'personalization': personalization_default,
                            'debug_meta': debug_meta
                        })
                    
                except (json.JSONDecodeError, ValueError) as e:
                    if settings.DEBUG:
                        logger.debug(f"Failed to parse AI response: {e}; retry with 1.5 Pro before fallback")
                    # Retry parse with 1.5 Pro if first was 2.5
                    if used_model == '1.5-flash':
                        try:
                            retry_resp = call_gemini_api(prompt)
                            debug_meta['model_retry_used'] = True
                            debug_meta['topic_model_used'] = '1.5-pro'
                            rtext = None
                            if 'candidates' in retry_resp and retry_resp['candidates']:
                                rparts = retry_resp['candidates'][0].get('content', {}).get('parts', [])
                                if rparts:
                                    rtext = rparts[0].get('text')
                            if isinstance(rtext, str) and rtext.strip():
                                # try parse again
                                import re
                                json_obj_match = re.search(r'\{[\s\S]*\}', rtext)
                                parsed = None
                                if json_obj_match:
                                    try:
                                        parsed = json.loads(json_obj_match.group())
                                    except Exception:
                                        parsed = None
                                if parsed is None:
                                    json_arr_match = re.search(r'\[[\s\S]*\]', rtext)
                                    if json_arr_match:
                                        parsed = json.loads(json_arr_match.group())
                                    else:
                                        parsed = json.loads(rtext)
                                # Normalize to topics
                                if isinstance(parsed, dict) and 'topics' in parsed:
                                    topics_raw = parsed.get('topics', [])
                                    personalization_value = parsed.get('personalization') or personalization_default
                                elif isinstance(parsed, list):
                                    topics_raw = parsed
                                    personalization_value = personalization_default
                                else:
                                    raise ValueError('Unexpected JSON shape after retry')

                                formatted_topics = []
                                for i, topic in enumerate(topics_raw[:MAX_TOPICS_PER_REQUEST]):
                                    if isinstance(topic, dict):
                                        name = str(topic.get('name', 'Unknown')).strip()[:200]
                                        topic_payload = {
                                            'id': topic.get('id', i + 1),
                                            'name': name,
                                            'isActive': topic.get('isActive', True)
                                        }
                                        if 'context' in topic and isinstance(topic['context'], str) and topic['context'].strip():
                                            topic_payload['context'] = topic['context'].strip()[:200]
                                        formatted_topics.append(topic_payload)
                                    elif isinstance(topic, str):
                                        name = str(topic).strip()[:200]
                                        formatted_topics.append({'id': i + 1, 'name': name, 'isActive': True})

                                if formatted_topics:
                                    debug_meta['topics_count'] = len(formatted_topics)
                                    return JsonResponse({
                                        'topics': formatted_topics,
                                        'personalization': personalization_value,
                                        'debug_meta': debug_meta
                                    })
                                parsed_ok = True
                        except Exception:
                            parsed_ok = False

                    # Fallback if retry also failed (prefer explicit augmented by domain)
                    # Compute fallback with strategy labeling
                    fallback_topics = []
                    if explicit_topics:
                        fallback_topics = _merge_with_fallback(user_query, explicit_topics)
                        if fallback_topics:
                            debug_meta['fallback_strategy'] = 'explicit_merge'
                    if not fallback_topics:
                        re_explicit = extract_explicit_topics(user_query)
                        if re_explicit:
                            fallback_topics = re_explicit
                            debug_meta['fallback_strategy'] = 're_extract_explicit'
                    if not fallback_topics:
                        fallback_topics = generate_simple_fallback_topics(user_query)
                        debug_meta['fallback_strategy'] = 'domain_fallback'
                    debug_meta['fallback_used'] = True
                    personalization_default = derive_personalization(user_query)
                    return JsonResponse({
                        'topics': fallback_topics,
                        'personalization': personalization_default,
                        'debug_meta': debug_meta
                    })
            else:
                if settings.DEBUG:
                    logger.debug("No valid candidates in response")
                # Compute fallback with strategy labeling
                fallback_topics = extract_explicit_topics(user_query) or generate_simple_fallback_topics(user_query)
                debug_meta['fallback_used'] = True
                debug_meta['fallback_strategy'] = 're_extract_explicit' if extract_explicit_topics(user_query) else 'domain_fallback'
                personalization_default = derive_personalization(user_query)
                return JsonResponse({
                    'topics': fallback_topics,
                    'personalization': personalization_default,
                    'debug_meta': debug_meta
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
            # Return explicit or fallback topics for review
            fallback_topics = extract_explicit_topics(user_query) or generate_simple_fallback_topics(user_query)
            personalization_default = derive_personalization(user_query)
            debug_meta['fallback_used'] = True
            debug_meta['fallback_strategy'] = 'api_error_fallback'
            return JsonResponse({
                'topics': fallback_topics,
                'personalization': personalization_default,
                'debug_meta': debug_meta
            })
        
    except Exception as e:
        logger.error(f"Error in classify_topics: {e}")
        # Return minimal fallback
        debug_meta['fallback_used'] = True
        debug_meta['fallback_strategy'] = 'unhandled_exception'
        return JsonResponse({
            'topics': [{'id': 1, 'name': 'General Learning', 'isActive': True}],
            'personalization': derive_personalization(""),
            'debug_meta': debug_meta
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
    # Math domains first to avoid programming defaults
    if any(k in query for k in ['trigonometry', 'trigonometric', 'trignometric', 'unit circle', 'sine', 'cosine', 'tangent']):
        return four([
            'Trigonometric Ratios: sin, cos, tan',
            'Unit Circle & Special Angles',
            'Angles, Degrees & Radians',
            'Trigonometric Identities & Applications',
        ])
    if any(k in query for k in ['algebra']):
        return four([
            'Algebra Basics & Expressions',
            'Linear Equations & Inequalities',
            'Polynomials & Factoring',
            'Quadratic Equations & Graphs',
        ])
    if any(k in query for k in ['calculus', 'derivative', 'integral']):
        return four([
            'Limits & Continuity',
            'Derivatives & Rules',
            'Applications of Derivatives',
            'Integrals & Applications',
        ])
    if any(k in query for k in ['geometry']):
        return four([
            'Lines, Angles & Triangles',
            'Quadrilaterals & Polygons',
            'Circles & Properties',
            'Area, Volume & Similarity',
        ])
    if any(k in query for k in ['probability', 'statistics', 'random variable']):
        return four([
            'Descriptive Statistics & Visualization',
            'Probability Fundamentals',
            'Random Variables & Distributions',
            'Inference: Confidence & Hypothesis Testing',
        ])

    # Digital logic / electronics
    if any(k in query for k in [
        'digital logic', 'logic gate', 'logic gates', 'boolean algebra', 'karnaugh', 'k-map', 'k map', 'truth table',
        'combinational', 'sequential', 'flip-flop', 'flip flops', 'flipflop', 'latch', 'fsm', 'state machine',
        'multiplexer', 'decoder', 'encoder', 'adder', 'subtractor', 'register', 'counter', 'number system', 'binary',
        'hexadecimal', 'octal'
    ]):
        return four([
            'Number Systems & Conversions',
            'Boolean Algebra, Logic Gates & Truth Tables',
            'K-Map Minimization & Combinational Circuits',
            'Sequential Circuits: Flip-Flops, Counters & FSMs',
        ])

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
    # History and world wars
    if (
        'history' in query or 'ww1' in query or 'ww2' in query or 'wwi' in query or 'wwii' in query or
        'world war' in query or 'first world war' in query or 'second world war' in query
    ):
        # If both WW1 and WW2 implied, present both; otherwise general modern history scaffold
        if any(k in query for k in ['ww1', 'wwi', 'world war i', 'world war 1', 'first world war']) and any(
            k in query for k in ['ww2', 'wwii', 'world war ii', 'world war 2', 'second world war']
        ):
            return four([
                'World War I: Causes & Alliances',
                'World War I: Major Battles & Turning Points',
                'World War II: Rise of Fascism & Causes',
                'World War II: Theaters, Strategies & Aftermath',
            ])
        # Single war or generic world war/history
        if any(k in query for k in ['ww1', 'wwi', 'world war i', 'world war 1', 'first world war']):
            return four([
                'WWI: Causes, Alliances & Spark (1914)',
                'WWI: Trench Warfare & Major Fronts',
                'WWI: Turning Points & US Entry',
                'WWI: Armistice, Treaty of Versailles & Consequences',
            ])
        if any(k in query for k in ['ww2', 'wwii', 'world war ii', 'world war 2', 'second world war']):
            return four([
                'WWII: Interwar Period & Causes',
                'WWII: European Theater (Blitzkrieg to D-Day)',
                'WWII: Pacific Theater (Pearl Harbor to Hiroshima)',
                'WWII: Aftermath, UN, and Geopolitical Shifts',
            ])
        # General history default
        return four([
            'Modern History: Key Causes & Movements',
            'Major Conflicts: Alliances & Strategies',
            'Consequences: Political & Economic Changes',
            'Primary Sources & Historical Debates',
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