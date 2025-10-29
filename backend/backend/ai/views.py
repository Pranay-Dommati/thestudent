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
from .ai_service import call_gemini_api, NetworkError, call_intent_classifier
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

        # Cryptography / Security detection (RSA, AES, SHA, ECC, etc.)
        is_crypto = any(k in text for k in [
            'rsa','aes','des','3des','triple des','ecc','ecdsa','dsa','diffie-hellman','diffie hellman','dh',
            'hmac','sha-256','sha256','sha 256','sha-1','sha1','sha 1','sha-3','sha3','sha 3','md5',
            'digital signature','digital signatures','public key','public-key','asymmetric encryption',
            'symmetric encryption','pki','public key infrastructure','certificate','certificates','x.509','x509'
        ])
        crypto_topic_map = []
        if is_crypto:
            crypto_topic_map = [
                (['rsa','rivest-shamir-adleman'], 'RSA'),
                (['aes','advanced encryption standard'], 'AES'),
                (['des','3des','triple des','data encryption standard'], 'DES / 3DES'),
                (['ecc','elliptic curve cryptography'], 'Elliptic Curve Cryptography (ECC)'),
                (['ecdsa'], 'ECDSA'),
                (['dsa'], 'DSA'),
                (['diffie-hellman','diffie hellman','dh key exchange','dh'], 'Diffie-Hellman Key Exchange'),
                (['hmac'], 'HMAC'),
                (['sha-256','sha256','sha 256'], 'SHA-256'),
                (['sha-1','sha1','sha 1'], 'SHA-1'),
                (['sha-3','sha3','sha 3'], 'SHA-3'),
                (['md5'], 'MD5'),
                (['digital signature','digital signatures'], 'Digital Signatures'),
                (['public key','public-key','public key cryptography','asymmetric encryption'], 'Public-Key Cryptography'),
                (['symmetric encryption','secret key encryption'], 'Symmetric Encryption'),
                (['pki','public key infrastructure','certificate','certificates','x.509','x509'], 'PKI & Certificates'),
            ]
        for keys, name in crypto_topic_map:
            idxs = [text.find(k) for k in keys if k in text]
            if idxs:
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


def _normalize_single_topic_name(user_query: str) -> str:
    """Normalize a single-token query to a clean topic name.
    - Uppercase common crypto acronyms (RSA, AES, ECC, HMAC, DSA, ECDSA, MD5, DH)
    - Normalize SHA variants to SHA-256 / SHA-1 / SHA-3
    - For other short alphabetic tokens, uppercase if <=6 chars; else title-case
    """
    try:
        s = (user_query or '').strip()
        if not s:
            return ''
        sl = s.lower()
        replacements = {
            'sha256': 'SHA-256', 'sha-256': 'SHA-256', 'sha 256': 'SHA-256',
            'sha1': 'SHA-1', 'sha-1': 'SHA-1', 'sha 1': 'SHA-1',
            'sha3': 'SHA-3', 'sha-3': 'SHA-3', 'sha 3': 'SHA-3',
            'aes': 'AES', 'rsa': 'RSA', 'ecc': 'ECC', 'ecdsa': 'ECDSA', 'dsa': 'DSA', 'md5': 'MD5', 'hmac': 'HMAC', 'dh': 'DH',
        }
        if sl in replacements:
            return replacements[sl]
        # If single token and alphabetic short string, use upper for acronym-like
        toks = s.split()
        if len(toks) == 1 and s.isalpha() and 2 <= len(s) <= 6:
            return s.upper()
        return s.title()
    except Exception:
        return (user_query or '').strip()


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


def build_direct_extraction_prompt(user_query: str) -> str:
                """Prompt to extract topics directly from a short user query that lists items and possibly a global context.
                Goals:
                - Preserve the items/topics the user named; do NOT invent new ones.
                - Infer any global context (e.g., a programming language or domain) present in the query and apply it to each item.
                - Keep the original order of items from the query.
                - If the query is a single specific term (e.g., 'rsa', 'aes'), return exactly one normalized topic.
                - Output strictly JSON with topics array; 1–4 topics maximum.

STRICT OUTPUT REQUIREMENTS:
- Respond with RAW JSON only. Start your response with '{' and end with '}'.
- Do NOT include any prose, explanations, markdown, code fences, backticks, or extra characters before or after the JSON.
- The JSON must have this exact shape:
{
    "topics": [
        {"id": 1, "name": "Topic Name", "isActive": true}
    ]
}

Guidelines:
- Detect a single shared context if present (like "Python", "JavaScript", "DSA", "Trigonometry") and prepend/append it appropriately. Example: "python arrays strings" -> ["Python Arrays", "Python Strings"].
- Split multiple items when the query uses connectors such as commas, semicolons, "and", "as well as", plus (+). Do NOT return the entire sentence as one topic when multiple items are present.
- Correct minor spelling mistakes in item names (e.g., "recurstion" -> "Recursion").
- Do not expand into subtopics or a curriculum; only reflect exactly the items the user mentioned.
- Keep each topic name concise (<= 60 chars) and properly cased.
- Maximum 4 topics.

Examples (follow exactly these output conventions):
- Input: "i wanna learn python arrays and recursion as well as hash maps" → Topics: ["Python Arrays", "Python Recursion", "Python Hash Maps"]
- Input: "i want to learn python arrays and recurstion and hash maps" → Topics: ["Python Arrays", "Python Recursion", "Python Hash Maps"]
- Input: "aes" → Topics: ["AES"]

User Query: """ + user_query + """

Return only the JSON, no explanations.
"""


def build_direct_retry_prompt(user_query: str) -> str:
                """Ultra-constrained retry prompt for direct extraction when the first attempt returned non-JSON or prose.
                The model MUST return ONLY a minimal JSON object with an array of 1–4 topic strings.
                """
                return (
                        "You are formatting a machine-only response. DO NOT explain. DO NOT use markdown or backticks.\n"
                        "Start your answer with '{' and end with '}'.\n"
                        "Return ONLY a JSON object with this exact shape: {\n"
                        "  \"topics\": [\"Topic 1\", \"Topic 2\"]\n"
                        "}.\n"
                        "Rules:\n"
                        "- Detect a single global context like 'Python' and apply it to each item if present in the query.\n"
                        "- Split items on connectors (commas, semicolons, 'and', '+', 'as well as'). Preserve original order.\n"
                        "- Correct minor spelling mistakes (e.g., 'recurstion' -> 'Recursion').\n"
                        "- 1 to 4 items maximum. No subtopics or curriculum.\n"
                        "- No prose, no explanations. JSON only.\n\n"
                        f"User Query: {user_query}\n\n"
                        "Respond with exactly one JSON object."
                )


def _extract_root_context_ai(user_query: str, max_retries: int = 2) -> str | None:
    """AI-powered context extraction using Gemini Flash.
    
    Uses AI to intelligently extract the primary subject/domain from any user query,
    handling cases that keyword matching would miss (e.g., "mental health", "startup").
    
    Returns:
        A concise subject/domain string (e.g., "Mental Health", "Startup", "Python")
        or None if extraction fails or query is unrelated to learning.
    """
    try:
        if not user_query or not isinstance(user_query, str) or len(user_query.strip()) < 3:
            return None
        
        # Ultra-compact prompt for fast extraction
        context_prompt = (
            "Extract ONLY the primary subject/domain from this learning query. "
            "Return a short phrase (1-4 words max) that describes what the course is about.\n\n"
            "Examples:\n"
            "- 'Dutch language beginner friendly' → 'Dutch language'\n"
            "- 'mental health awareness' → 'Mental Health'\n"
            "- 'startup business basics' → 'Startup'\n"
            "- 'Python for data science' → 'Python'\n"
            "- 'learn calculus' → 'Calculus'\n\n"
            "Rules:\n"
            "- Return ONLY the subject name, nothing else\n"
            "- Use title case (e.g., 'Mental Health', not 'mental health')\n"
            "- Keep it concise (max 4 words)\n"
            "- If no clear subject, return 'General'\n\n"
            f"Query: \"{user_query}\"\n\n"
            "Subject:"
        )
        
        from .ai_service import call_gemini_flash_api
        
        for attempt in range(max_retries):
            try:
                response = call_gemini_flash_api(context_prompt)
                
                # Extract text from response
                text = None
                if 'candidates' in response and response['candidates']:
                    parts = response['candidates'][0].get('content', {}).get('parts', [])
                    if parts:
                        text = parts[0].get('text')
                
                if isinstance(text, str) and text.strip():
                    # Clean up the response
                    extracted = text.strip()
                    
                    # Remove common prefixes/suffixes
                    for prefix in ['Subject:', 'Domain:', 'Topic:', 'The subject is', 'Answer:']:
                        if extracted.startswith(prefix):
                            extracted = extracted[len(prefix):].strip()
                    
                    # Remove quotes if present
                    extracted = extracted.strip('"\'')
                    
                    # Validate: should be short (1-4 words) and not generic
                    words = extracted.split()
                    if 1 <= len(words) <= 4 and extracted.lower() not in ['general', 'learning', 'course', 'study']:
                        if settings.DEBUG:
                            logger.debug(f"AI context extraction: '{user_query}' → '{extracted}'")
                        return extracted
                    elif extracted.lower() == 'general':
                        # AI couldn't determine specific subject
                        return None
                
            except Exception as e:
                if settings.DEBUG:
                    logger.debug(f"AI context extraction attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    continue
                break
        
        return None
    except Exception as e:
        logger.error(f"AI context extraction error: {e}")
        return None


def _extract_root_context_keyword(user_query: str) -> str | None:
    """Keyword-based context extraction (fallback method).
    
    Uses pattern matching for common subjects when AI extraction fails.
    This is the backup method - AI extraction should be tried first.
    """
    try:
        q = (user_query or '').strip()
        if not q:
            return None
        
        q_lower = q.lower()
        
        # Human languages (highest priority - check before programming languages)
        human_languages = [
            ('dutch', 'Dutch'), ('spanish', 'Spanish'), ('french', 'French'), ('german', 'German'),
            ('hindi', 'Hindi'), ('telugu', 'Telugu'), ('tamil', 'Tamil'), ('kannada', 'Kannada'),
            ('malayalam', 'Malayalam'), ('bengali', 'Bengali'), ('marathi', 'Marathi'), ('gujarati', 'Gujarati'),
            ('punjabi', 'Punjabi'), ('urdu', 'Urdu'), ('arabic', 'Arabic'), ('mandarin', 'Mandarin'),
            ('chinese', 'Chinese'), ('japanese', 'Japanese'), ('korean', 'Korean'), ('italian', 'Italian'),
            ('portuguese', 'Portuguese'), ('russian', 'Russian'), ('turkish', 'Turkish'), ('thai', 'Thai'),
            ('vietnamese', 'Vietnamese'), ('swedish', 'Swedish'), ('norwegian', 'Norwegian'), ('danish', 'Danish'),
            ('english', 'English')
        ]
        
        for key, label in human_languages:
            if key in q_lower and 'language' in q_lower:
                return f"{label} language"
        
        # Programming languages & frameworks
        tech_contexts = [
            ('python', 'Python'), ('javascript', 'JavaScript'), ('typescript', 'TypeScript'), ('js', 'JavaScript'),
            ('java', 'Java'), ('c++', 'C++'), ('c#', 'C#'), ('golang', 'Go'), ('rust', 'Rust'),
            ('react', 'React'), ('vue', 'Vue'), ('angular', 'Angular'), ('django', 'Django'), ('flask', 'Flask'),
            ('node', 'Node.js'), ('express', 'Express')
        ]
        
        for key, label in tech_contexts:
            if key in q_lower:
                return label
        
        # Academic subjects & common domains
        academic_subjects = [
            ('data structures', 'DSA'), ('algorithms', 'DSA'), (' dsa ', 'DSA'),
            ('trigonometry', 'Trigonometry'), ('digital logic', 'Digital Logic'),
            ('algebra', 'Algebra'), ('calculus', 'Calculus'), ('geometry', 'Geometry'),
            ('physics', 'Physics'), ('chemistry', 'Chemistry'), ('biology', 'Biology'),
            ('finance', 'Finance'), ('economics', 'Economics'), ('history', 'History'),
            ('mental health', 'Mental Health'), ('psychology', 'Psychology'),
            ('startup', 'Startup'), ('entrepreneurship', 'Entrepreneurship'),
            ('marketing', 'Marketing'), ('business', 'Business')
        ]
        
        for key, label in academic_subjects:
            if key in q_lower:
                return label
        
        return None
    except Exception:
        return None


def _extract_root_context(user_query: str) -> str | None:
    """Extract the primary subject/domain from the user query.
    
    Strategy:
    1. Try AI-powered extraction first (handles any subject intelligently)
    2. Fallback to keyword matching if AI fails
    3. Return None if both methods fail
    
    This ensures we can handle novel subjects like "mental health" or "startup"
    that aren't in our keyword lists.
    
    Examples:
    - "Dutch language beginner friendly" → "Dutch language"
    - "mental health awareness" → "Mental Health"
    - "startup business basics" → "Startup"
    - "Python for data science" → "Python"
    """
    try:
        # Strategy 1: AI-powered extraction (primary method)
        ai_context = _extract_root_context_ai(user_query)
        if ai_context:
            return ai_context
        
        # Strategy 2: Keyword-based extraction (fallback)
        keyword_context = _extract_root_context_keyword(user_query)
        if keyword_context:
            if settings.DEBUG:
                logger.debug(f"Keyword fallback context: '{user_query}' → '{keyword_context}'")
            return keyword_context
        
        # Both methods failed
        if settings.DEBUG:
            logger.warning(f"Context extraction failed for: '{user_query}'")
        return None
        
    except Exception as e:
        logger.error(f"Context extraction error: {e}")
        return None


def _inject_context_into_topics(topics: list[dict], root_context: str | None, user_query: str) -> list[dict]:
    """Inject root context into topic names to make them self-contained for downstream services.
    
    Strategy:
    - If a topic name already contains the context (case-insensitive), leave it unchanged
    - Otherwise, append " in {root_context}" to the topic name
    - Store original name in metadata for reference
    - Add root_context as separate metadata field
    
    Args:
        topics: List of topic dicts with 'name' field
        root_context: The extracted subject/domain (e.g., "Dutch language", "Python")
        user_query: Original query for fallback context detection
    
    Returns:
        Topics with context-enriched names and metadata
    """
    try:
        if not topics or not isinstance(topics, list):
            return topics
        
        # If no explicit root context, try to infer it
        if not root_context:
            root_context = _extract_root_context(user_query)
        
        # If still no context, return topics unchanged
        if not root_context:
            return topics
        
        enriched_topics = []
        root_lower = root_context.lower()
        
        for topic in topics:
            if not isinstance(topic, dict):
                enriched_topics.append(topic)
                continue
            
            original_name = topic.get('name', '')
            if not original_name or not isinstance(original_name, str):
                enriched_topics.append(topic)
                continue
            
            # Check if context is already in the topic name
            name_lower = original_name.lower()
            has_context = root_lower in name_lower
            
            # Create enriched topic
            enriched_topic = {**topic}  # Copy all existing fields
            
            if not has_context:
                # Inject context: append " in {root_context}"
                enriched_topic['name'] = f"{original_name} in {root_context}"
            
            # Add metadata for downstream services (always, even if context already present)
            enriched_topic['root_context'] = root_context
            enriched_topic['original_name'] = original_name
            
            enriched_topics.append(enriched_topic)
        
        return enriched_topics
    except Exception as e:
        logger.error(f"Error injecting context into topics: {e}")
        # Return original topics on error
        return topics


def _infer_global_context(user_query: str) -> str | None:
    """Legacy function - redirects to _extract_root_context for backward compatibility."""
    return _extract_root_context(user_query)


def _token_title(token: str) -> str:
    t = (token or '').strip()
    if not t:
        return ''
    tl = t.lower()
    special = {
        'c++': 'C++', 'c#': 'C#', 'js': 'JavaScript', 'ts': 'TypeScript',
        'rsa': 'RSA', 'aes': 'AES', 'sha256': 'SHA-256', 'sha-256': 'SHA-256', 'sha 256': 'SHA-256',
        'ecc': 'ECC', 'ecdsa': 'ECDSA', 'dsa': 'DSA', 'md5': 'MD5', 'hmac': 'HMAC'
    }
    if tl in special:
        return special[tl]
    # title case regular words
    return t.title()


def _fallback_direct_items(user_query: str) -> list[str]:
    """Non-regex, minimal fallback: split by commas/semicolons/and, or space list with a global context prefix.
    Returns up to 4 cleaned items in order.
    """
    try:
        q = (user_query or '').strip()
        if not q:
            return []

        # Split on common list connectors while preserving order
        # Connectors: commas, semicolons, pipes, "and", "as well as", "+", "plus"
        parts = [p.strip() for p in re.split(r"\b(?:,|;|\||and|as well as|\+|plus)\b", q, flags=re.IGNORECASE) if p and p.strip()]
        if len(parts) > 1:
            return parts[:MAX_TOPICS_PER_REQUEST]

        # If no connectors, return single trimmed query as one item
        return [q]
    except Exception:
        return []


def _dedup_adjacent_words(name: str) -> str:
    try:
        if not isinstance(name, str):
            return name
        parts = [p for p in name.strip().split() if p]
        if not parts:
            return ''
        out = [parts[0]]
        for p in parts[1:]:
            if p.lower() == out[-1].lower():
                continue
            out.append(p)
        return ' '.join(out)
    except Exception:
        return str(name)


def classify_query_intent(user_query: str) -> str:
    """Heuristically classify the query as 'direct' or 'broad'.
    Note: Not used for production routing anymore; AI-only intent is authoritative.
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

    def get_ident(self, request):
        """Throttle key: prefer authenticated user id, else fall back to IP.
        This lets anonymous users be throttled per IP while logged-in users
        get their own bucket.
        """
        try:
            user = getattr(request, 'user', None)
            if user and getattr(user, 'is_authenticated', False) and getattr(user, 'id', None):
                return f"user:{user.id}"
        except Exception:
            pass
        # Fallback to IP
        try:
            from .rate_limiter import get_user_ip
            ip = get_user_ip(request)
        except Exception:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return f"ip:{ip}"


@api_view(["POST"])
@permission_classes([AllowAny])
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
            'topic_model_used': None,       # 2.5-flash | 2.0-flash
            'model_retry_used': False,
            'fallback_used': False,
            'fallback_strategy': None,
        }

        # Classify intent strictly via AI (no heuristic fallback)
        intent = None
        try:
            ic_resp = call_intent_classifier(user_query)
            print(f"value of ic_resp: {ic_resp}")
            # DEBUG: Log the full raw response from the intent classifier before any parsing.
            try:
                if settings.DEBUG:
                    logger.debug("Intent classifier full response:\n" + (json.dumps(ic_resp, indent=2)[:8000] if isinstance(ic_resp, (dict, list)) else str(ic_resp)))
            except Exception:
                # Avoid crashing on logging issues
                pass
            ic_text = None
            # Record candidates count for debugging
            try:
                debug_meta['intent_candidates_count'] = len(ic_resp.get('candidates', [])) if isinstance(ic_resp, dict) else None
            except Exception:
                debug_meta['intent_candidates_count'] = None
            if 'candidates' in ic_resp and ic_resp['candidates']:
                parts_ic = ic_resp['candidates'][0].get('content', {}).get('parts', [])
                try:
                    debug_meta['intent_candidate0_has_parts'] = bool(parts_ic)
                except Exception:
                    pass
                if parts_ic:
                    ic_text = parts_ic[0].get('text')
                    try:
                        debug_meta['intent_candidate0_has_text'] = isinstance(ic_text, str) and bool(ic_text.strip())
                    except Exception:
                        pass
            # Robust parsing: accept raw token, fenced JSON, or plain JSON
            if isinstance(ic_text, str) and ic_text.strip():
                raw_ic = ic_text.strip()
                # Always log a visible snippet of raw model output for diagnostics
                snippet = raw_ic if len(raw_ic) <= 300 else raw_ic[:300] + '...'
                logger.info(f"Intent classifier raw text (snippet): {snippet}")
                # Strip common markdown fences if present
                stripped = raw_ic
                if stripped.startswith('```'):
                    import re as _re
                    stripped = _re.sub(r'^```[a-zA-Z]*\n', '', stripped)
                    stripped = _re.sub(r'\n```\s*$', '', stripped)
                # Try to find a JSON object first
                try:
                    import re as _re
                    m = _re.search(r'\{[\s\S]*\}', stripped)
                    parsed_ic = json.loads(m.group()) if m else json.loads(stripped)
                    if isinstance(parsed_ic, dict) and parsed_ic.get('intent') in ['broad', 'direct', 'not_study']:
                        intent = parsed_ic['intent']
                        debug_meta['intent_parse_stage'] = 'json_object'
                        # capture model-provided user-friendly message for non-study
                        if intent == 'not_study' and isinstance(parsed_ic.get('message'), str):
                            debug_meta['not_study_message'] = parsed_ic.get('message')
                except Exception:
                    intent = None
                # Fallback: look for a bare token 'direct' or 'broad' in text
                if not intent:
                    import re as _re
                    m2 = _re.search(r'\b(direct|broad|not_study)\b', stripped, flags=_re.IGNORECASE)
                    if m2:
                        intent = m2.group(1).lower()
                        debug_meta['intent_parse_stage'] = 'bare_token'
                debug_meta['intent_raw_text'] = stripped[:300]
                if intent in ['broad', 'direct', 'not_study']:
                    logger.info(f"Intent classifier (AI) returned: {intent} for query='{safe_query}'")
                    debug_meta['intent'] = intent
                    debug_meta['intent_source'] = 'ai'
        except Exception as e:
            logger.error(f"Intent classifier AI error: {e}")
            intent = None
        if not intent:
            # Strict no-fallback policy: return 422 if AI didn't provide a valid intent
            debug_meta['intent'] = None
            debug_meta['intent_source'] = 'ai'
            try:
                logger.warning(f"Intent classification failed. debug_meta={debug_meta}")
            except Exception:
                pass
            return JsonResponse({
                'error': 'intent_classification_failed',
                'message': 'AI intent classification did not return a valid intent (direct/broad).',
                'debug_meta': debug_meta
            }, status=422)

        # If the classifier says this is not a study-related query, return early with a friendly message
        if intent == 'not_study':
            # Prefer model-provided message; fallback to our standard friendly guidance
            friendly = debug_meta.get('not_study_message') or "🤔 I didn't quite get that. Try a short topic like \"Basics of photosynthesis\" or \"Intro to networking\"."
            return JsonResponse({
                'success': False,
                'intent': 'not_study',
                'message': friendly,
                'topics': [],
                'usage_stats': None,
                'debug_meta': debug_meta,
            }, status=200)
        # We no longer use heuristic explicit extraction to generate topics; keep names for potential AI guidance only
        try:
            explicit_topics = extract_explicit_topics(user_query)
        except Exception:
            explicit_topics = []
        explicit_names = [t.get('name') for t in explicit_topics if isinstance(t, dict) and t.get('name')]

        # Direct intent: AI-only extraction with context; do not use regex/keyword extraction or client-side parsing for multiple items
        if intent == 'direct':
            debug_meta['prompt_mode'] = 'direct'
            prompt_extraction = build_direct_extraction_prompt(user_query)
            used_model = None
            response = None
            raw_ai_text = None
            try:
                response = call_gemini_api(prompt_extraction)
                # Primary model is 2.5-flash with 2.0-flash fallback in ai_service
                used_model = '2.5-flash'
            except Exception as e:
                logger.error(f"Direct extraction AI (flash) failed: {e}")
                return JsonResponse({
                    'error': 'ai_unavailable',
                    'message': 'Unable to extract topics from AI (direct mode).',
                    'debug_meta': debug_meta
                }, status=502)

            debug_meta['topic_model_used'] = used_model
            # Parse AI JSON
            topics_ai = None
            try:
                text = None
                if 'candidates' in response and response['candidates']:
                    parts_resp = response['candidates'][0].get('content', {}).get('parts', [])
                    if parts_resp:
                        text = parts_resp[0].get('text')
                if isinstance(text, str) and text.strip():
                    raw_ai_text = text.strip()
                    import re
                    # Strip common Markdown code fences to ease JSON parsing
                    stripped = raw_ai_text
                    if stripped.startswith('```'):
                        # remove first fence line and possible trailing fence
                        stripped = re.sub(r'^```[a-zA-Z]*\n', '', stripped)
                        stripped = re.sub(r'\n```\s*$', '', stripped)
                    # Try object first
                    m_obj = re.search(r'\{[\s\S]*\}', stripped)
                    parsed = None
                    if m_obj:
                        try:
                            parsed = json.loads(m_obj.group())
                        except Exception:
                            parsed = None
                    if parsed is None:
                        # Try array fallback
                        m_arr = re.search(r'\[[\s\S]*\]', stripped)
                        if m_arr:
                            try:
                                parsed = json.loads(m_arr.group())
                            except Exception:
                                parsed = None
                    if parsed is None:
                        # Final attempt on the whole string
                        try:
                            parsed = json.loads(stripped)
                        except Exception:
                            parsed = None
                    if isinstance(parsed, dict) and isinstance(parsed.get('topics'), list):
                        topics_ai = parsed['topics']
                    elif isinstance(parsed, list):
                        topics_ai = parsed
            except Exception:
                topics_ai = None

            # Normalize to formatted topics strictly; if malformed, return 422 (no fallback)
            formatted_topics = []
            if isinstance(topics_ai, list) and 1 <= len(topics_ai) <= MAX_TOPICS_PER_REQUEST:
                for i, topic in enumerate(topics_ai[:MAX_TOPICS_PER_REQUEST]):
                    if isinstance(topic, dict):
                        name = str(topic.get('name', f'Topic {i+1}')).strip()
                        name = _dedup_adjacent_words(name)[:200]
                        formatted_topics.append({'id': i + 1, 'name': name, 'isActive': True})
                    elif isinstance(topic, str):
                        const_name = _dedup_adjacent_words(topic.strip())[:200]
                        formatted_topics.append({'id': i + 1, 'name': const_name, 'isActive': True})
            if not formatted_topics:
                # One strict retry with ultra-constrained prompt (AI-only, no heuristics)
                if settings.DEBUG:
                    logger.error("Direct mode parse failed; attempting strict retry with ultra-constrained prompt")
                try:
                    retry_prompt = build_direct_retry_prompt(user_query)
                    # Retry uses the same flash-family call (2.5-flash primary, 2.0-flash fallback)
                    retry_resp = call_gemini_api(retry_prompt)
                    retry_model = '2.5-flash'

                    debug_meta['model_retry_used'] = True
                    debug_meta['topic_model_used'] = retry_model

                    # Parse retry json (expecting {"topics": ["..."]})
                    retry_text = None
                    if 'candidates' in retry_resp and retry_resp['candidates']:
                        rparts = retry_resp['candidates'][0].get('content', {}).get('parts', [])
                        if rparts:
                            retry_text = rparts[0].get('text')
                    retry_raw = retry_text.strip() if isinstance(retry_text, str) else None

                    topics_ai = None
                    if isinstance(retry_raw, str) and retry_raw:
                        import re
                        stripped = retry_raw
                        if stripped.startswith('```'):
                            stripped = re.sub(r'^```[a-zA-Z]*\n', '', stripped)
                            stripped = re.sub(r'\n```\s*$', '', stripped)
                        m_obj = re.search(r'\{[\s\S]*\}', stripped)
                        parsed = None
                        if m_obj:
                            try:
                                parsed = json.loads(m_obj.group())
                            except Exception:
                                parsed = None
                        if parsed is None:
                            try:
                                parsed = json.loads(stripped)
                            except Exception:
                                parsed = None
                        if isinstance(parsed, dict) and isinstance(parsed.get('topics'), list):
                            topics_ai = parsed['topics']

                    formatted_topics = []
                    if isinstance(topics_ai, list) and 1 <= len(topics_ai) <= MAX_TOPICS_PER_REQUEST:
                        for i, topic in enumerate(topics_ai[:MAX_TOPICS_PER_REQUEST]):
                            if isinstance(topic, dict):
                                name = str(topic.get('name', f'Topic {i+1}')).strip()
                                name = _dedup_adjacent_words(name)[:200]
                                formatted_topics.append({'id': i + 1, 'name': name, 'isActive': True})
                            elif isinstance(topic, str):
                                const_name = _dedup_adjacent_words(topic.strip())[:200]
                                formatted_topics.append({'id': i + 1, 'name': const_name, 'isActive': True})

                    if not formatted_topics:
                        # Debug logging for troubleshooting
                        if settings.DEBUG:
                            logger.error(f"🚨 DIRECT MODE AI_PARSE_ERROR DEBUG:")
                            logger.error(f"   Query: {safe_query}")
                            logger.error(f"   Used Model (first): {used_model}")
                            logger.error(f"   Raw AI Text (first): {raw_ai_text[:1000] if isinstance(raw_ai_text, str) else 'None'}")
                            logger.error(f"   Retry Model: {retry_model}")
                            logger.error(f"   Raw AI Text (retry): {retry_raw[:1000] if isinstance(retry_raw, str) else 'None'}")
                            logger.error(f"   Formatted Topics (after retry): {formatted_topics}")
                        error_payload = {
                            'error': 'ai_parse_error',
                            'message': 'AI did not return a valid topics JSON for direct mode.',
                            'debug_meta': debug_meta
                        }
                        if settings.DEBUG:
                            error_payload['raw_ai_text'] = (raw_ai_text[:2000] if isinstance(raw_ai_text, str) else None)
                            error_payload['used_model'] = used_model
                        return JsonResponse(error_payload, status=422)

                except Exception as _retry_err:
                    if settings.DEBUG:
                        logger.error(f"Strict retry failed: {_retry_err}")
                    error_payload = {
                        'error': 'ai_parse_error',
                        'message': 'AI did not return a valid topics JSON for direct mode.',
                        'debug_meta': debug_meta
                    }
                    if settings.DEBUG:
                        error_payload['raw_ai_text'] = (raw_ai_text[:2000] if isinstance(raw_ai_text, str) else None)
                        error_payload['used_model'] = used_model
                    return JsonResponse(error_payload, status=422)

            # CONTEXT INJECTION: Enrich topics with root context for downstream services
            root_context = _extract_root_context(user_query)
            formatted_topics = _inject_context_into_topics(formatted_topics, root_context, user_query)
            
            if settings.DEBUG and root_context:
                logger.debug(f"Context injection (DIRECT): added '{root_context}' to {len(formatted_topics)} topics")

            debug_meta['topics_count'] = len(formatted_topics)
            debug_meta['root_context'] = root_context  # Add to debug metadata
            return JsonResponse({
                'topics': formatted_topics,
                'personalization': derive_personalization(user_query),
                'debug_meta': debug_meta
            })
        
        # If intent was direct but we still couldn't derive a topic, fall back to broad
        
    # Broad mode: use AI to generate curriculum breakdown (no heuristic fallback)
        prompt = build_topics_prompt(user_query, None)  # No constraints for broad mode
        debug_meta['prompt_mode'] = 'broad'
        debug_meta['explicit_constraints'] = []
        logger.info(f"Broad mode: using AI to break down '{safe_query}' into curriculum")
        
        try:
            # Use Gemini 2.5 Flash for topic classification + personalization (fallback to 2.0 Flash)
            if settings.DEBUG:
                logger.debug("Attempting Gemini 2.5 Flash API call for topic classification + personalization...")
            response = call_gemini_api(prompt)
            used_model = '2.5-flash'
            logger.info(f"Topic generation model used: {used_model}")
            debug_meta['topic_model_used'] = used_model
            
            # Extract text from response (robust to shape differences)
            raw_ai_text = None
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
                raw_ai_text = text.strip() if isinstance(text, str) else None
                if settings.DEBUG:
                    logger.debug(f"Extracted text length: {len(text) if text else 0}")

                # Guard against empty/None text
                personalization_default = derive_personalization(user_query)
                if not isinstance(text, str) or not text.strip():
                    logger.info("Empty/invalid AI text from flash model")
                    text = None
                    if not text:
                        error_payload = {
                            'error': 'ai_empty_response',
                            'message': 'AI returned no content for broad mode.',
                            'debug_meta': debug_meta
                        }
                        if settings.DEBUG:
                            error_payload['raw_ai_text'] = None
                            error_payload['used_model'] = used_model
                        return JsonResponse(error_payload, status=502)
                
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

                        # CONTEXT INJECTION: Enrich topics with root context for downstream services
                        root_context = _extract_root_context(user_query)
                        formatted_topics = _inject_context_into_topics(formatted_topics, root_context, user_query)
                        
                        if settings.DEBUG and root_context:
                            logger.debug(f"Context injection: added '{root_context}' to {len(formatted_topics)} topics")

                        debug_meta['topics_count'] = len(formatted_topics)
                        debug_meta['root_context'] = root_context  # Add to debug metadata
                        return JsonResponse({
                            'topics': formatted_topics,
                            'personalization': personalization_value,
                            'debug_meta': debug_meta
                        })
                    else:
                        # No topics found (AI returned empty topics)
                        debug_meta['topics_count'] = 0
                        error_payload = {
                            'error': 'ai_empty_topics',
                            'message': 'AI did not return any topics.',
                            'debug_meta': debug_meta
                        }
                        if settings.DEBUG:
                            error_payload['raw_ai_text'] = (raw_ai_text[:2000] if isinstance(raw_ai_text, str) else None)
                            error_payload['used_model'] = used_model
                        return JsonResponse(error_payload, status=422)
                    
                except (json.JSONDecodeError, ValueError) as e:
                    if settings.DEBUG:
                        logger.debug(f"Failed to parse AI response: {e}")
                    # No secondary retry; return parse error directly
                    # No Flash retry; return parse error directly
                    error_payload = {
                        'error': 'ai_parse_error',
                        'message': 'AI response could not be parsed into topics.',
                        'debug_meta': debug_meta
                    }
                    if settings.DEBUG:
                        error_payload['raw_ai_text'] = (raw_ai_text[:2000] if isinstance(raw_ai_text, str) else None)
                        error_payload['used_model'] = used_model
                    return JsonResponse(error_payload, status=422)
            else:
                if settings.DEBUG:
                    logger.debug("No valid candidates in response")
                error_payload = {
                    'error': 'ai_empty_response',
                    'message': 'AI returned no candidates.',
                    'debug_meta': debug_meta
                }
                if settings.DEBUG:
                    error_payload['raw_ai_text'] = None
                    error_payload['used_model'] = used_model
                return JsonResponse(error_payload, status=502)
                
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
            return JsonResponse({
                'error': 'ai_service_error',
                'message': 'AI service error during broad classification.',
                'debug_meta': debug_meta
            }, status=502)
        
    except Exception as e:
        logger.error(f"Error in classify_topics: {e}")
        return JsonResponse({
            'error': 'internal_error',
            'message': 'Unexpected server error in classification.',
            'debug_meta': debug_meta if 'debug_meta' in locals() else {}
        }, status=500)

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
            'rate_limits': {
                'monthly': {
                    'limit': getattr(settings, 'MAX_TOPICS_PER_MONTH', 15),
                    'used': 0,
                    'remaining': getattr(settings, 'MAX_TOPICS_PER_MONTH', 15),
                    'percent_used': 0,
                },
                'daily': { 'enforced': getattr(settings, 'ENFORCE_DAILY_LIMIT', False) }
            }
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
            'rate_limits': {
                'monthly': {
                    'limit': getattr(settings, 'MAX_TOPICS_PER_MONTH', 15),
                    'used': 0,
                    'remaining': getattr(settings, 'MAX_TOPICS_PER_MONTH', 15),
                    'percent_used': 0,
                },
                'daily': { 'enforced': getattr(settings, 'ENFORCE_DAILY_LIMIT', False) }
            }
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