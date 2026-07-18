from django.db import models
import datetime
import json
import logging
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction, IntegrityError
from django.db.models import Case, F, IntegerField, Q, Sum, When
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# pyrefly: ignore [missing-import]
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction, PromoCode, PromoCodeRedemption, ScribConfig, CohortPeriod
# pyrefly: ignore [missing-import]
from .serializers import (
    PreviewNoteSerializer,
    GeneratedNoteSerializer,
    StudyPackSerializer,
    PaymentSerializer,
    GenerateNoteRequestSerializer,
    GenerateStudyPackRequestSerializer,
    OrganizeTopicsRequestSerializer,
    ScribMeSerializer,
    RedeemCouponSerializer,
    PromoCodeSerializer,
    PromoCodeListSerializer,
    PromoCodeRedemptionSerializer,
)
# pyrefly: ignore [missing-import]
from .services.cache import normalize_prompt, find_cached_note
# pyrefly: ignore [missing-import]
from .services.image_generation import generate_handwritten_note, ImageGenerationError
# pyrefly: ignore [missing-import]
from .services.pdf_generation import generate_study_pack_pdf, PdfGenerationError
# pyrefly: ignore [missing-import]
from .services.payments import (
    create_razorpay_order, verify_razorpay_signature,
    verify_webhook_signature, RazorpayError,
)
# pyrefly: ignore [missing-import]
from backend.ai.ai_service import call_gemini_flash_api
# pyrefly: ignore [missing-import]
from .vertex_ai import call_scrib_vertex_ai

logger = logging.getLogger(__name__)

# ─── Credit pack definitions — SINGLE SOURCE OF TRUTH ───────────────────────
# Amounts stored in paise (1 INR = 100 paise).
# These values are NEVER trusted from the frontend.
CREDIT_PACKS = {
    'try':     {'credits':  2, 'amount_paise':  1900},  # ₹19
    'starter': {'credits': 10, 'amount_paise':  8900},  # ₹89
    'popular': {'credits': 20, 'amount_paise': 16900},  # ₹169
    'pro':     {'credits': 40, 'amount_paise': 31900},  # ₹319
}


def error_response(message, status_code=400, code='bad_request', details=None):
    payload = {'success': False, 'message': message, 'code': code}
    if details:
        payload['details'] = details
    return Response(payload, status=status_code)


def is_admin_user(user):
    return bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))


def get_credit_balance(user):
    if is_admin_user(user):
        return 10 ** 9
    
    credits_in = CreditTransaction.objects.filter(
        user=user, direction=CreditTransaction.DIRECTION_CREDIT
    ).aggregate(total=Sum('credits'))['total'] or 0
    
    credits_out = CreditTransaction.objects.filter(
        user=user, direction=CreditTransaction.DIRECTION_DEBIT
    ).aggregate(total=Sum('credits'))['total'] or 0
    
    return float(credits_in - credits_out)


def ensure_absolute_url(request, url):
    if not url:
        return url
    if url.startswith('http://') or url.startswith('https://'):
        return url
    if url.startswith('/'):
        return request.build_absolute_uri(url)
    return request.build_absolute_uri(f"/{url}")


def _extract_gemini_text(response_data):
    candidates = response_data.get('candidates') or []
    if not candidates:
        return ''
    content = candidates[0].get('content') or {}
    parts = content.get('parts') or []
    if not parts:
        return ''
    return parts[0].get('text') or ''


def _build_groups_fallback(topics):
    """Naive fallback: pack topics into pages of up to 2 each.
    Returns v2 page dicts: {'topics': [{'name': ..., 'instruction': ''}, ...]}.
    """
    pages = []
    for i in range(0, len(topics), 2):
        chunk = topics[i:i + 2]
        pages.append({
            'topics': [{'name': str(t).strip(), 'instruction': ''} for t in chunk if str(t).strip()]
        })
    return [p for p in pages if p['topics']]


# ─── NEW: Enrichment-based packing ───────────────────────────────────────────

def _pack_topics_into_pages(enriched_topics, capacity=90, max_per_page=3):
    """Deterministic backend packer.

    Takes AI-enriched topics (list of dicts with 'name', 'estimated_complexity',
    'cluster') and packs them into pages using three closure rules:
    1. Cluster mismatch  — new page if topic belongs to a different cluster
    2. Complexity overflow — new page if cumulative complexity exceeds capacity
    3. Count cap         — new page if current page already has max_per_page topics

    Returns list of v2 page dicts.
    """
    pages = []
    current_topics = []
    current_complexity = 0
    current_cluster = None

    for topic in enriched_topics:
        name = (topic.get('name') or '').strip()
        if not name:
            continue
        complexity = int(topic.get('estimated_complexity') or 40)  # default: medium
        cluster = (topic.get('cluster') or 'general').lower()

        cluster_mismatch = (current_cluster is not None and cluster != current_cluster)
        complexity_overflow = (current_complexity + complexity > capacity)
        count_cap = (len(current_topics) >= max_per_page)

        if (cluster_mismatch or complexity_overflow or count_cap) and current_topics:
            pages.append({'topics': [
                {'name': t['name'], 'instruction': ''} for t in current_topics
            ]})
            current_topics = []
            current_complexity = 0
            current_cluster = None

        current_topics.append({'name': name, 'estimated_complexity': complexity, 'cluster': cluster})
        current_complexity += complexity
        if current_cluster is None:
            current_cluster = cluster

    if current_topics:
        pages.append({'topics': [
            {'name': t['name'], 'instruction': ''} for t in current_topics
        ]})

    return pages


def _build_enrichment_prompt(topics):
    """Build the Vertex AI prompt for Step 1: topic enrichment."""
    return (
        "You are an academic content analyser. "
        "For each topic below, estimate its complexity on a 0-100 scale and assign a subject cluster.\n\n"
        "Complexity scale:\n"
        "  0-30  = Small (e.g. single definition, short list)\n"
        "  30-60 = Medium (e.g. multi-step concept, one diagram)\n"
        "  60-90 = Large (e.g. lifecycle, multi-part algorithm, many formulas)\n"
        "  90+   = Huge (e.g. entire protocol, very broad topic)\n\n"
        "Rules:\n"
        "1. Every topic must appear exactly once in the output.\n"
        "2. 'cluster' must be a short 1-3 word label grouping related topics (e.g. 'Android Intents', 'DBMS Normalisation').\n"
        "3. Unrelated topics must get different clusters.\n"
        "4. Return ONLY a valid JSON array. No markdown. No explanation.\n\n"
        "Output format:\n"
        "[\n"
        "  {\"name\": \"Explicit Intent\", \"estimated_complexity\": 25, \"cluster\": \"Android Intents\"},\n"
        "  ...\n"
        "]\n\n"
        f"Topics:\n{json.dumps(topics, ensure_ascii=True)}\n"
    )


DOMAIN_KEYWORDS = {
    'physics': [
        'ohm', 'kirchhoff', 'kirchoff', 'circuit', 'voltage', 'current', 'resistance', 'capacitance', 'induct',
        'magnet', 'optics', 'thermo', 'mechanics', 'wave', 'electric', 'electronics',
    ],
    'computer_science': [
        'recursion', 'algorithm', 'data structure', 'datastructure', 'complexity', 'graph', 'tree',
        'array', 'stack', 'queue', 'linked list', 'dp', 'dynamic programming', 'sort', 'search',
        'os', 'network', 'dbms', 'sql', 'compiler', 'operating system', 'system design',
    ],
    'math': [
        'calculus', 'algebra', 'geometry', 'trigonometry', 'probability', 'statistics', 'matrix',
        'equation', 'derivative', 'integral',
    ],
    'chemistry': [
        'organic', 'inorganic', 'chemistry', 'reaction', 'mole', 'stoichiometry', 'periodic',
    ],
    'biology': [
        'cell', 'genetics', 'evolution', 'photosynthesis', 'krebs', 'biology', 'anatomy',
    ],
    'economics': [
        'economics', 'market', 'inflation', 'gdp', 'fiscal', 'monetary', 'keynes',
    ],
    'history': [
        'history', 'revolution', 'war', 'empire', 'civilization', 'medieval', 'ancient',
    ],
}


DOMAIN_TITLES = {
    'physics': 'Physics basics',
    'computer_science': 'CS concepts',
    'math': 'Math foundations',
    'chemistry': 'Chemistry basics',
    'biology': 'Biology basics',
    'economics': 'Economics basics',
    'history': 'History overview',
}


def _topic_domain(topic):
    if not topic:
        return 'unknown'
    lower = topic.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return domain
    return 'unknown'


def _title_from_topic_or_domain(topic, domain):
    if domain in DOMAIN_TITLES:
        return DOMAIN_TITLES[domain]
    return (topic or 'Page')[:40]


def _split_groups_by_domain(groups, topics_order):
    order_index = {topic: idx for idx, topic in enumerate(topics_order)}
    normalized_groups = []
    page_number = 1

    for group in groups:
        group_topics = [t for t in (group.get('topics') or []) if t in order_index]
        group_topics.sort(key=lambda t: order_index[t])
        if not group_topics:
            continue
        domains_in_group = [_topic_domain(t) for t in group_topics]
        if len(set(domains_in_group)) <= 1:
            domain = domains_in_group[0]
            normalized_groups.append({
                'page_number': page_number,
                'title': group.get('title') or _title_from_topic_or_domain(group_topics[0], domain),
                'topics': group_topics,
            })
            page_number += 1
            continue

        buckets = {}
        domain_order = []
        for topic in group_topics:
            domain = _topic_domain(topic)
            if domain not in buckets:
                buckets[domain] = []
                domain_order.append(domain)
            buckets[domain].append(topic)

        for domain in domain_order:
            bucket_topics = buckets[domain]
            if not bucket_topics:
                continue
            normalized_groups.append({
                'page_number': page_number,
                'title': _title_from_topic_or_domain(bucket_topics[0], domain),
                'topics': bucket_topics,
            })
            page_number += 1

    seen = {topic for group in normalized_groups for topic in group['topics']}
    missing = [topic for topic in topics_order if topic not in seen]
    for topic in missing:
        normalized_groups.append({
            'page_number': page_number,
            'title': _title_from_topic_or_domain(topic, _topic_domain(topic)),
            'topics': [topic],
        })
        page_number += 1

    return normalized_groups


class OrganizeTopicsView(APIView):
    """Two-step AI organization pipeline:
    Step 1 — LLM enriches topics (complexity + cluster, no grouping).
    Step 2 — Deterministic Python packs topics into pages.

    This is more reliable than asking LLM to group directly:
    no hallucinations, no reprompting, easy to tune.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrganizeTopicsRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Invalid request', details=serializer.errors)

        topics = [str(item).strip() for item in serializer.validated_data['topics'] if str(item).strip()]
        if not topics:
            return error_response('Provide at least one topic')

        # ── Step 1: LLM enrichment ──────────────────────────────────────────
        prompt = _build_enrichment_prompt(topics)
        enriched = None
        try:
            response_text = call_scrib_vertex_ai(prompt, response_mime_type='application/json')
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            enriched = json.loads(response_text)
            if not isinstance(enriched, list):
                enriched = None
        except Exception as exc:
            logger.warning(f'[scrib] Topic enrichment failed ({exc}), falling back to naive packing')
            enriched = None

        # ── Step 2: Backend packing ────────────────────────────────────────
        if enriched:
            # Preserve user's original topic order (LLM may reorder)
            name_map = {e.get('name', '').strip().lower(): e for e in enriched if isinstance(e, dict)}
            ordered_enriched = []
            for t in topics:
                key = t.lower()
                ordered_enriched.append(name_map.get(key, {'name': t, 'estimated_complexity': 40, 'cluster': 'general'}))
            pages = _pack_topics_into_pages(ordered_enriched, capacity=90, max_per_page=2)
        else:
            # Fallback: naive 2-per-page chunking
            pages = _build_groups_fallback(topics)

        # Ensure no page exceeds 2 topics (safety cap)
        capped_pages = []
        for p in pages:
            page_topics = p.get('topics', [])
            for i in range(0, max(len(page_topics), 1), 2):
                chunk = page_topics[i:i + 2]
                if chunk:
                    capped_pages.append({'topics': chunk})
        pages = capped_pages

        total_pages = len(pages)
        credit_savings = {
            'original_topics': len(topics),
            'optimized_pages': total_pages,
            'credits_saved': max(len(topics) - total_pages, 0),
        }

        for i, page in enumerate(pages):
            topic_names = [t.get('name') for t in page.get('topics', [])]
            logger.info(f'[scrib] Organized page {i+1}: {topic_names}')

        return Response({
            'groups': pages,
            'total_pages': total_pages,
            'credit_savings': credit_savings,
            'source': 'vertex_ai' if enriched else 'fallback',
        })

class ParseSyllabusView(APIView):
    permission_classes = [AllowAny]

    # Maximum number of Vertex AI retries on malformed JSON
    MAX_RETRIES = 2

    def post(self, request):
        syllabus = request.data.get('syllabus')
        if not syllabus:
            return error_response('Syllabus text is required', status_code=400)
            
        prompt = (
            f"Extract all specific study topics from the following syllabus. Rules:\n"
            f"1. Make each topic standalone and understandable out of context. If it's a sub-topic, prepend its parent category (e.g., 'Testing Strategies: Strategic issues', 'Testing: Testing Concepts').\n"
            f"2. Do NOT exclude sub-topics. For example, in 'Testing Strategies: A Strategic approach to software testing', the topic is 'Testing Strategies: A Strategic approach to software testing'.\n"
            f"3. Return ONLY a valid JSON array of strings, and nothing else. No markdown or code block tags.\n\n"
            f"Syllabus:\n{syllabus}"
        )
        
        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info("[SCRIB API] /parse-syllabus/ called - sending to Vertex AI (attempt %d/%d)...",
                            attempt, self.MAX_RETRIES)
                response_text = call_scrib_vertex_ai(
                    prompt,
                    response_mime_type='application/json',
                )
                
                # Clean up the markdown if present (shouldn't happen with JSON mode, but defensive)
                if response_text.startswith('```json'):
                    response_text = response_text[7:-3].strip()
                elif response_text.startswith('```'):
                    response_text = response_text[3:-3].strip()
                
                try:
                    parsed = json.loads(response_text)
                except json.JSONDecodeError as json_err:
                    logger.warning(
                        "[SCRIB API] JSON parse failed (attempt %d): %s — trying repair. "
                        "Raw response (last 200 chars): …%s",
                        attempt, str(json_err), response_text[-200:] if response_text else '<empty>'
                    )
                    parsed = self._repair_json(response_text)

                # Validate the structure — must be a list of strings
                if not isinstance(parsed, list):
                    raise ValueError(f"Expected a JSON array, got {type(parsed).__name__}")

                logger.info("[SCRIB API] SUCCESS - Vertex AI parsed %d topics (attempt %d). NO FALLBACK USED.",
                            len(parsed), attempt)
                return Response(parsed)

            except Exception as e:
                last_error = e
                logger.error("[SCRIB API] Attempt %d/%d FAILED - %s: %s",
                             attempt, self.MAX_RETRIES, type(e).__name__, str(e))
                if attempt < self.MAX_RETRIES:
                    import time
                    time.sleep(1)  # Brief pause before retry

        # All retries exhausted
        logger.error("[SCRIB API] All %d attempts failed for /parse-syllabus/. Last error: %s",
                     self.MAX_RETRIES, str(last_error))
        return error_response(f"Failed to parse syllabus: {str(last_error)}", status_code=500)

    @staticmethod
    def _repair_json(text):
        """Attempt to repair truncated JSON from Gemini.

        Common failure modes:
        - Unterminated string: ``[..."topic one", "topic tw``
        - Missing closing bracket: ``[..."topic one", "topic two"``
        - Trailing comma: ``[..."topic two",]``
        """
        if not text or not text.strip():
            raise ValueError("Empty AI response — cannot repair")

        text = text.strip()

        # Ensure it starts with '['
        bracket_pos = text.find('[')
        if bracket_pos == -1:
            raise ValueError("No JSON array found in response")
        text = text[bracket_pos:]

        # Try parsing as-is first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Step 1: If the last character is inside an unterminated string,
        #         find the last complete string entry.
        # Strategy: find the last complete `"..."` and cut after it, close the array.
        last_complete_quote = None
        in_string = False
        escape = False
        for i, ch in enumerate(text):
            if escape:
                escape = False
                continue
            if ch == '\\':
                escape = True
                continue
            if ch == '"':
                if in_string:
                    last_complete_quote = i  # End of a complete string
                in_string = not in_string

        if last_complete_quote is not None:
            # Cut after the last complete string, strip trailing comma, close array
            repaired = text[:last_complete_quote + 1].rstrip().rstrip(',') + '\n]'
            try:
                result = json.loads(repaired)
                logger.info("[SCRIB API] JSON repair succeeded — recovered %d topics", len(result))
                return result
            except json.JSONDecodeError:
                pass

        raise ValueError(f"JSON repair failed. Raw text starts with: {text[:100]}")

class ModerateTopicsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topics = request.data.get('topics')
        if not topics or not isinstance(topics, list):
            return error_response('List of topics is required', status_code=400)
            
        prompt = (
            f"You are a helpful content safety classifier for an educational study platform. "
            f"Evaluate the following list of study topics.\n"
            f"You MUST be permissive and allow all academic, scientific, medical, historical, technical, professional, and general knowledge topics "
            f"(including Chemistry, Biology, Anatomy, Pharmacology, Warfare History, Cybersecurity, Law, etc.).\n"
            f"Only return false if a topic is egregiously sexually explicit pornography or severe hate speech.\n"
            f"Return ONLY a JSON array of booleans (true or false) with exactly {len(topics)} elements corresponding to each topic.\n\n"
            f"Topics:\n{json.dumps(topics)}"
        )
        
        try:
            response_text = call_scrib_vertex_ai(prompt, response_mime_type='application/json')
            
            # Clean up markdown if present
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
                
            parsed = json.loads(response_text)
            
            # Extract list if LLM wrapped it in a dict
            if isinstance(parsed, dict):
                for k, v in parsed.items():
                    if isinstance(v, list):
                        parsed = v
                        break
                        
            if not isinstance(parsed, list) or len(parsed) != len(topics):
                logger.warning(f"ModerateTopicsView: AI returned unexpected format {parsed}, defaulting to allow.")
                return Response({'moderation': [True] * len(topics)})
                
            clean_flags = []
            for item in parsed:
                if isinstance(item, bool):
                    clean_flags.append(item)
                elif isinstance(item, str):
                    clean_flags.append(item.lower() not in ('false', '0', 'no', 'f'))
                elif isinstance(item, (int, float)):
                    clean_flags.append(bool(item))
                elif isinstance(item, dict):
                    val = item.get('valid', item.get('allowed', item.get('is_valid', True)))
                    clean_flags.append(bool(val))
                else:
                    clean_flags.append(True)
                    
            return Response({'moderation': clean_flags})
        except Exception as e:
            # Fallback: assume valid if AI fails, but log it
            logger.error(f"Moderation failed: {e}")
            return Response({'moderation': [True] * len(topics)})



def parse_topics_from_request(data):
    """Parse pages from the request body. Supports both v1 (flat list) and v2 (page dicts).

    v1 (old):  pages = [["topic1", "topic2"], ["topic3"]]
               topics = ["topic1", "topic2"]
    v2 (new):  pages = [{"topics": [{"name": "t1", "instruction": ""}, ...]}, ...]

    Always returns a list of v2 page dicts.
    """
    raw_pages = data.get('pages') or []
    topics = data.get('topics') or []

    if raw_pages:
        parsed_pages = []
        for entry in raw_pages:
            if isinstance(entry, dict) and 'topics' in entry:
                # v2 page dict — normalize topics inside
                raw_topics = entry.get('topics') or []
                page_topics = []
                for t in raw_topics:
                    if isinstance(t, dict):
                        name = (t.get('name') or '').strip()
                        instruction = (t.get('instruction') or '').strip()
                    else:
                        name = str(t).strip()
                        instruction = ''
                    if name:
                        page_topics.append({'name': name, 'instruction': instruction})
                if page_topics:
                    for i in range(0, len(page_topics), 2):
                        parsed_pages.append({'topics': page_topics[i:i + 2]})
            elif isinstance(entry, (list, tuple)):
                # v1 list of strings
                page_topics = [{'name': str(t).strip(), 'instruction': ''} for t in entry if str(t).strip()]
                if page_topics:
                    for i in range(0, len(page_topics), 2):
                        parsed_pages.append({'topics': page_topics[i:i + 2]})
            else:
                # v1 bare string
                name = str(entry).strip()
                if name:
                    parsed_pages.append({'topics': [{'name': name, 'instruction': ''}]})
        return parsed_pages

    if isinstance(topics, (list, tuple)) and topics:
        # Legacy: treat each topic as its own page
        return [{'topics': [{'name': str(t).strip(), 'instruction': ''}]} for t in topics if str(t).strip()]

    topics_text = data.get('topics_text') or ''
    if isinstance(topics_text, str) and topics_text.strip():
        lines = [line.strip() for line in topics_text.splitlines() if line.strip()]
        return [[line] for line in lines]

    return []


def get_dynamic_s3_previews():
    from django.core.cache import cache
    import boto3
    from django.conf import settings
    from django.utils.text import slugify
    import logging

    cache_key = 'scrib_s3_previews_list'
    previews = cache.get(cache_key)

    if previews is not None:
        return previews

    previews = []
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
    access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

    if bucket and access_key and secret_key:
        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            
            # Use pagination in case there are more than 1000 PDFs in the future
            paginator = s3.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=bucket, Prefix='previews/')
            
            for page in pages:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        key = obj['Key']
                        if key.lower().endswith('.pdf'):
                            filename = key.split('/')[-1]
                            title = filename[:-4].replace('-', ' ').replace('_', ' ').title()
                            pdf_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
                            
                            previews.append({
                                'id': key,
                                'title': title,
                                'slug': slugify(title),
                                'tags': ['Preview'],
                                'pdf_url': pdf_url,
                                'image_url': '',
                                'page_count': 1,
                            })
        except Exception as e:
            logging.getLogger(__name__).error('Failed to list S3 previews: %s', e)

    # Cache for 5 minutes
    cache.set(cache_key, previews, 300)
    return previews


class PreviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.core.cache import cache
        query = request.query_params.get('q', '').strip().lower()
        
        # Check cache first
        cache_key = f'scrib_previews_list_api_q_{query}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        previews = get_dynamic_s3_previews()
        if query:
            previews = [p for p in previews if query in p['title'].lower()]
            
        # Cache the result for 5 minutes
        cache.set(cache_key, previews, timeout=300)
        return Response(previews)


class PreviewDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from django.core.cache import cache
        
        # Check cache first
        cache_key = f'scrib_preview_detail_api_{slug}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        previews = get_dynamic_s3_previews()
        for p in previews:
            if p['slug'] == slug:
                # Cache the result for 5 minutes
                cache.set(cache_key, p, timeout=300)
                return Response(p)
        return error_response('Preview not found', status_code=404, code='not_found')


class GenerateNoteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateNoteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Invalid request', details=serializer.errors)

        topic = serializer.validated_data['topic'].strip()
        normalized = normalize_prompt(topic)
        if not normalized:
            return error_response('Topic is required')

        required_credits = 1

        # --- Phase 1: Quick DB check (credits + cache), then release connection ---
        from django.db import close_old_connections
        close_old_connections()

        user_model = get_user_model()
        user = user_model.objects.get(pk=request.user.pk)
        is_admin = is_admin_user(user)
        required_credits = 0 if is_admin else required_credits
        balance = get_credit_balance(user)
        if not is_admin and balance < required_credits:
            return error_response(
                'Not enough credits',
                status_code=402,
                code='insufficient_credits',
                details={'balance': balance, 'required': required_credits},
            )

        cache_hit = find_cached_note(normalized)
        source = GeneratedNote.SOURCE_GENERATED
        image_url = None

        if cache_hit:
            image_url = cache_hit['image_url']
            source = cache_hit['source']

        # Explicitly close DB connection before the long OpenAI call.
        # This prevents MySQL "server has gone away" — the connection would
        # time out anyway during the 30–120s generation wait.
        from django.db import connection as _db_conn
        _db_conn.close()

        # --- Phase 2: Generate image OUTSIDE any transaction (can take 30–120s) ---
        if not image_url:
            try:
                generation = generate_handwritten_note(topic)
                image_url = generation.get('image_url')
            except ImageGenerationError as exc:
                return error_response(str(exc), status_code=503, code='generation_unavailable')

        if not image_url:
            return error_response('Image generation failed', status_code=502, code='generation_failed')

        image_url = ensure_absolute_url(request, image_url)

        # --- Phase 3: Fresh DB connection, save result in a short transaction ---
        # close_old_connections() ensures any stale connection is discarded and
        # Django opens a brand-new connection for the transaction below.
        close_old_connections()

        with transaction.atomic():
            user = user_model.objects.select_for_update().get(pk=request.user.pk)

            note = GeneratedNote.objects.create(
                user=user,
                prompt=topic,
                normalized_prompt=normalized,
                image_url=image_url,
                credits_used=required_credits,
                page_count=1,
                source=source,
            )

            if not is_admin:
                CreditTransaction.objects.create(
                    user=user,
                    direction=CreditTransaction.DIRECTION_DEBIT,
                    credits=required_credits,
                    reason=CreditTransaction.REASON_GENERATION,
                    generated_note=note,
                )

        response_data = GeneratedNoteSerializer(note).data
        response_data['credit_balance'] = get_credit_balance(user)
        response_data['cache_hit'] = source != GeneratedNote.SOURCE_GENERATED
        return Response(response_data, status=201)



from scrib.tasks import generate_study_pack_task

class GenerateStudyPackView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateStudyPackRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Invalid request', details=serializer.errors)

        title = serializer.validated_data.get('title') or 'Study Pack'
        pages = parse_topics_from_request(request.data)

        if not pages:
            return error_response('Provide at least one topic or page')

        # Hard server-side cap: max 8 pages per generation to protect server resources.
        # The frontend enforces this too, but we double-check here against API abuse.
        MAX_PAGES_PER_GENERATION = 8
        if len(pages) > MAX_PAGES_PER_GENERATION:
            return error_response(
                f'You can generate a maximum of {MAX_PAGES_PER_GENERATION} topics at a time. '
                f'Please split your topics into separate generations.',
                code='too_many_pages',
                details={'submitted': len(pages), 'max_allowed': MAX_PAGES_PER_GENERATION},
            )

        required_credits = len(pages)
        page_count = len(pages)

        # --- Phase 1: Quick DB check (credits) ---
        user_model = get_user_model()
        user = user_model.objects.get(pk=request.user.pk)
        is_admin = is_admin_user(user)
        credits_used = 0 if is_admin else required_credits
        balance = get_credit_balance(user)
        if not is_admin and balance < required_credits:
            return error_response(
                'Not enough credits',
                status_code=402,
                code='insufficient_credits',
                details={'balance': balance, 'required': required_credits},
            )

        # --- Phase 2: Create StudyPack with generating status ---
        with transaction.atomic():
            user = user_model.objects.select_for_update().get(pk=request.user.pk)

            pack = StudyPack.objects.create(
                user=user,
                title=title,
                topics_json=pages,
                total_pages=page_count,
                credits_used=credits_used,
                status=StudyPack.STATUS_GENERATING,
            )

            if not is_admin:
                CreditTransaction.objects.create(
                    user=user,
                    direction=CreditTransaction.DIRECTION_DEBIT,
                    credits=required_credits,
                    reason=CreditTransaction.REASON_GENERATION,
                    study_pack=pack,
                )

        # Invalidate history cache immediately so the UI shows the GENERATING pack
        from django.core.cache import cache
        cache.delete(f'scrib_my_study_packs_api_{request.user.id}')

        # --- Phase 3: Dispatch generation to a true background thread ---
        # CRITICAL: When no Redis broker is configured, Celery runs with
        # CELERY_TASK_ALWAYS_EAGER=True which executes .delay() synchronously
        # on the same gunicorn worker thread. This blocks the web response for
        # minutes and gunicorn's --timeout kills the worker mid-generation,
        # leaving the pack stuck in GENERATING with no error logged.
        #
        # Fix: detect ALWAYS_EAGER mode and spawn a daemon thread instead so
        # the 202 response is returned immediately regardless of broker status.
        from django.conf import settings as _settings
        _always_eager = getattr(_settings, 'CELERY_TASK_ALWAYS_EAGER', False)

        if _always_eager:
            # No Redis available — run generation in a daemon background thread
            # so this web request returns immediately.
            import threading

            def _run_in_thread():
                # Each thread needs its own Django DB connection
                from django.db import close_old_connections
                close_old_connections()
                try:
                    generate_study_pack_task(pack.id, pages, title, request.user.id)
                except Exception as exc:
                    logger.exception(f'[scrib] Background thread error for StudyPack {pack.id}: {exc}')
                finally:
                    from django.db import connection as _conn
                    _conn.close()

            t = threading.Thread(target=_run_in_thread, daemon=True)
            t.start()
            logger.info(f'[scrib] StudyPack {pack.id} dispatched to background thread (no Redis broker)')
        else:
            # Redis is available — use Celery as designed
            generate_study_pack_task.delay(pack.id, pages, title, request.user.id)
            logger.info(f'[scrib] StudyPack {pack.id} dispatched to Celery worker')

        response_data = StudyPackSerializer(pack).data
        response_data['credit_balance'] = get_credit_balance(user)
        # Return 202 Accepted — generation continues in background
        return Response(response_data, status=202)


from django.utils import timezone
from datetime import timedelta
from django.db import transaction

def cleanup_stuck_packs(user):
    """
    Find packs stuck in PENDING or GENERATING and mark them as FAILED + refund credits.

    Timeout is calculated dynamically per pack based on total_pages:
      - Base: 8 minutes + 90 seconds per page
      - Minimum: 12 minutes (covers a single slow page + queue wait)
      - Maximum: 45 minutes (safety ceiling)

    This prevents the common false-failure where a large pack is still legitimately
    running (or waiting in the Celery queue) but gets killed by a flat 10-min cutoff.

    With concurrency=1 on the Celery worker, a queued job could wait as long as the
    current job takes (~6-8 min for 5 pages), so we add generous headroom.
    """
    now = timezone.now()
    stuck_packs = StudyPack.objects.filter(
        user=user,
        status__in=[StudyPack.STATUS_PENDING, StudyPack.STATUS_GENERATING],
    )
    cache_invalidated = False
    for pack in stuck_packs:
        # Dynamic timeout: base 8 min + 90s per page, clamped to [12, 45] minutes
        pages = pack.total_pages or 1
        timeout_minutes = max(12, min(45, 8 + (pages * 90 // 60)))
        cutoff = pack.created_at + timedelta(minutes=timeout_minutes)

        if now <= cutoff:
            continue  # Still within the allowed window — leave it alone

        with transaction.atomic():
            pack.status = StudyPack.STATUS_FAILED
            pack.save(update_fields=['status'])
            if pack.credits_used > 0:
                CreditTransaction.objects.create(
                    user=user,
                    direction=CreditTransaction.DIRECTION_CREDIT,
                    credits=pack.credits_used,
                    reason=CreditTransaction.REASON_REFUND
                )
            cache_invalidated = True
            logger.info(
                f"[scrib] Marked StudyPack {pack.id} as FAILED "
                f"(stuck for >{timeout_minutes}min, pages={pages}). "
                f"Refunded {pack.credits_used} credits to user {user.id}."
            )

    if cache_invalidated:
        from django.core.cache import cache
        cache.delete(f'scrib_my_study_packs_api_{user.id}')


class StudyPackStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pack_id):
        # Clean up any zombie packs before checking status
        cleanup_stuck_packs(request.user)

        try:
            pack = StudyPack.objects.get(pk=pack_id, user=request.user)
            elapsed_seconds = int((timezone.now() - pack.created_at).total_seconds())
            import math
            # Generation is done in concurrent batches of 4 pages.
            # Each batch takes roughly 90s for OpenAI image generation.
            batches = math.ceil((pack.total_pages or 1) / 4)
            estimated_seconds = batches * 90
            return Response({
                'id': pack.id,
                'status': pack.status,
                'pdf_url': pack.pdf_url,
                's3_key': pack.s3_key,
                'total_pages': pack.total_pages,
                'pages_done': pack.pages_done,
                'estimated_seconds': estimated_seconds,
                'elapsed_seconds': elapsed_seconds,
                'remaining_seconds': max(0, estimated_seconds - elapsed_seconds),
            })
        except StudyPack.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class CreateOrderView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Accept both 'pack' (new spec) and 'pack_id' (legacy) field names
        pack_id = (
            str(request.data.get('pack', '') or request.data.get('pack_id', '')).strip().lower()
        )
        if pack_id not in CREDIT_PACKS:
            logger.warning('[payments] CreateOrder invalid pack=%r user=%s', pack_id, request.user.id)
            return error_response(
                'Invalid credit pack',
                code='invalid_pack',
                details={'available_packs': list(CREDIT_PACKS.keys())},
            )

        pack = CREDIT_PACKS[pack_id]
        amount_paise = pack['amount_paise']
        receipt = f"scrib_{request.user.id}_{uuid.uuid4().hex[:10]}"

        try:
            order = create_razorpay_order(amount_paise, currency='INR', receipt=receipt)
        except RazorpayError as exc:
            logger.error('[payments] Razorpay order creation failed for user=%s: %s', request.user.id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        payment = Payment.objects.create(
            user=request.user,
            razorpay_order_id=order['id'],
            amount=amount_paise,
            currency=order.get('currency', 'INR'),
            credits_added=pack['credits'],
            status=Payment.STATUS_CREATED,
        )

        logger.info('[payments] Order created order_id=%s user=%s pack=%s amount=%d',
                    order['id'], request.user.id, pack_id, amount_paise)

        return Response({
            'key_id': order.get('key_id') or settings.RAZORPAY_KEY_ID,
            'order_id': order.get('id'),
            'amount': amount_paise,
            'currency': order.get('currency', 'INR'),
            'credits': pack['credits'],
            'pack': pack_id,
        }, status=201)


class VerifyPaymentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Accept both field-name variants from Razorpay SDK
        order_id = str(
            request.data.get('razorpay_order_id') or request.data.get('order_id', '')
        ).strip()
        payment_id = str(
            request.data.get('razorpay_payment_id') or request.data.get('payment_id', '')
        ).strip()
        signature = str(
            request.data.get('razorpay_signature') or request.data.get('signature', '')
        ).strip()

        if not order_id or not payment_id or not signature:
            logger.warning('[payments] VerifyPayment missing fields user=%s', request.user.id)
            return error_response('Missing payment verification data')

        # Only the owner of the order can verify it
        payment = Payment.objects.filter(
            razorpay_order_id=order_id,
            user=request.user,
        ).first()
        if not payment:
            logger.warning('[payments] Order not found order_id=%s user=%s', order_id, request.user.id)
            return error_response('Order not found', status_code=404, code='not_found')

        # ── Idempotent: already verified → return success without adding credits again ──
        if payment.status == Payment.STATUS_PAID:
            logger.info('[payments] Duplicate verify attempt order_id=%s user=%s', order_id, request.user.id)
            return Response({
                'success': True,
                'message': 'Payment already verified',
                'credit_balance': get_credit_balance(request.user),
                'credits_added': payment.credits_added,
            })

        # ── Verify Razorpay HMAC signature ─────────────────────────────────────────
        try:
            verified = verify_razorpay_signature(order_id, payment_id, signature)
        except RazorpayError as exc:
            logger.error('[payments] Signature verification error order_id=%s: %s', order_id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        if not verified:
            logger.warning('[payments] Invalid signature order_id=%s payment_id=%s user=%s',
                           order_id, payment_id, request.user.id)
            payment.status = Payment.STATUS_FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return error_response('Payment signature verification failed', status_code=400, code='verification_failed')

        # ── Atomically mark paid + credit the user ─────────────────────────────────
        with transaction.atomic():
            # Re-fetch with row lock to prevent race conditions
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            if payment.status == Payment.STATUS_PAID:
                # Lost the race; another request already verified — return safely
                logger.info('[payments] Race-condition duplicate verify order_id=%s', order_id)
            else:
                payment.status = Payment.STATUS_PAID
                payment.razorpay_payment_id = payment_id
                payment.razorpay_signature = signature
                payment.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature', 'updated_at'])

                # get_or_create prevents double-crediting if called twice
                _, created = CreditTransaction.objects.get_or_create(
                    payment=payment,
                    defaults=dict(
                        user=payment.user,
                        direction=CreditTransaction.DIRECTION_CREDIT,
                        credits=payment.credits_added,
                        reason=CreditTransaction.REASON_PAYMENT,
                    ),
                )
                if created:
                    logger.info('[payments] Credits added order_id=%s credits=%d user=%s',
                                order_id, payment.credits_added, payment.user_id)
                else:
                    logger.warning('[payments] Credit tx already existed for order_id=%s', order_id)

        new_balance = get_credit_balance(request.user)
        logger.info('[payments] Verification complete order_id=%s new_balance=%d user=%s',
                    order_id, new_balance, request.user.id)
        return Response({
            'success': True,
            'message': 'Payment verified successfully',
            'credit_balance': new_balance,
            'credits_added': payment.credits_added,
        })


class PaymentHistoryView(APIView):
    """Return the authenticated user's payment history (newest first)."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.filter(user=request.user).order_by('-created_at')
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def razorpay_webhook(request):
    try:
        logger.info("WEBHOOK HIT")

        body = request.body.decode("utf-8")
        logger.info(f"BODY: {body}")

        signature = request.headers.get("X-Razorpay-Signature")
        logger.info(f"SIGNATURE: {signature}")

        from django.conf import settings
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

        # Verify signature using Razorpay client directly as requested
        client.utility.verify_webhook_signature(
            body,
            signature,
            webhook_secret
        )

        logger.info("SIGNATURE VERIFIED")

        payload = json.loads(body)
        logger.info(f"PAYLOAD: {payload}")

        event_type = payload.get('event')
        
        if event_type == 'payment.captured':
            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            rzp_order_id = payment_entity.get('order_id', '')
            rzp_payment_id = payment_entity.get('id', '')

            payment = Payment.objects.filter(razorpay_order_id=rzp_order_id).first()
            if payment and payment.status != Payment.STATUS_PAID:
                with transaction.atomic():
                    p = Payment.objects.select_for_update().get(pk=payment.pk)
                    if p.status != Payment.STATUS_PAID:
                        p.status = Payment.STATUS_PAID
                        p.razorpay_payment_id = rzp_payment_id
                        p.save(update_fields=['status', 'razorpay_payment_id', 'updated_at'])
                        CreditTransaction.objects.get_or_create(
                            payment=p,
                            defaults=dict(
                                user=p.user,
                                direction=CreditTransaction.DIRECTION_CREDIT,
                                credits=p.credits_added,
                                reason=CreditTransaction.REASON_PAYMENT,
                            ),
                        )
                        logger.info(f'[webhook] payment.captured processed order_id={rzp_order_id} credits={p.credits_added} user={p.user_id}')
        
        return Response(
            {"success": True},
            status=200
        )

    except Exception as e:
        import traceback
        logger.error("WEBHOOK ERROR:")
        logger.error(traceback.format_exc())

        return Response(
            {"error": str(e)},
            status=400
        )


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.utils import timezone
        if not user.last_login or (timezone.now() - user.last_login).total_seconds() > 3600:
            user.last_login = timezone.now()
            user.save(update_fields=['last_login', 'updated_at'])

        payload = {
            'id': user.id,
            'email': user.email,
            'full_name': getattr(user, 'full_name', ''),
            'credit_balance': get_credit_balance(user),
        }
        serializer = ScribMeSerializer(payload)
        return Response(serializer.data)


class MyNotesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = GeneratedNote.objects.filter(user=request.user)
        serializer = GeneratedNoteSerializer(notes, many=True)
        return Response(serializer.data)


class StudyPackPdfView(APIView):
    """Serve the PDF for a study pack by generating a fresh presigned URL on every request.

    This gives the owner permanent access to their PDF regardless of when the original
    presigned URL was created (and expired).  The redirect URL is valid for 5 minutes
    which is more than enough for a browser to download / display the file.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pack_id):
        pack = StudyPack.objects.filter(pk=pack_id, user=request.user).first()
        if not pack:
            # Also allow buyers who purchased via a share link to access this pack
            # pyrefly: ignore [missing-import]
            from .models import SharedPackPurchase
            has_purchase = SharedPackPurchase.objects.filter(
                buyer=request.user,
                share_link__study_pack_id=pack_id,
            ).exists()
            if has_purchase:
                pack = StudyPack.objects.filter(pk=pack_id, status=StudyPack.STATUS_READY).first()
            if not pack:
                return error_response('Study pack not found', status_code=404, code='not_found')

        if not pack.s3_key:
            # Older packs stored a full URL in pdf_url instead of a key — fall back to it.
            if pack.pdf_url:
                from django.http import HttpResponseRedirect
                return HttpResponseRedirect(pack.pdf_url)
            return error_response('PDF not available for this pack', status_code=404, code='not_found')

        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
        access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

        if not bucket or not access_key or not secret_key:
            return error_response('Storage not configured', status_code=503, code='storage_unavailable')

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            # 5 minutes is plenty for the browser to start downloading.
            fresh_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': pack.s3_key},
                ExpiresIn=604800,  # 7 days to prevent expiry while reading
            )
        except (BotoCoreError, ClientError) as exc:
            import logging
            logging.getLogger(__name__).error('[scrib] presign failed for pack %s: %s', pack_id, exc)
            return error_response('Could not generate PDF link', status_code=503, code='storage_unavailable')

        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(fresh_url)

    def post(self, request, pack_id):
        """Generate (or return existing) a permanent share token for this pack."""
        import uuid
        pack = StudyPack.objects.filter(pk=pack_id, user=request.user).first()
        if not pack:
            return error_response('Study pack not found', status_code=404, code='not_found')
        if pack.status != StudyPack.STATUS_READY:
            return error_response('Pack is not ready yet', status_code=400, code='not_ready')
        if not pack.share_token:
            pack.share_token = uuid.uuid4()
            pack.save(update_fields=['share_token'])
        return Response({'share_token': str(pack.share_token)})


class AdminStudyPackPdfView(APIView):
    """
    GET /api/scrib/admin/packs/<pack_id>/pdf/

    Admin-only version of StudyPackPdfView — generates a fresh presigned URL
    for ANY study pack regardless of owner.  Returns JSON with a `pdf_url` key
    so the frontend can load it without a redirect.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pack_id):
        logger.info('[admin-pdf] Received request for pack_id=%s by user=%s (is_staff=%s, is_superuser=%s)',
                     pack_id, request.user.email, request.user.is_staff, request.user.is_superuser)

        if not is_admin_user(request.user):
            logger.warning('[admin-pdf] Rejected: user %s is not admin', request.user.email)
            return error_response('Forbidden', status_code=403, code='forbidden')

        pack = StudyPack.objects.filter(pk=pack_id).first()
        if not pack:
            logger.warning('[admin-pdf] Pack id=%s not found in database', pack_id)
            return error_response('Study pack not found', status_code=404, code='not_found')

        logger.info('[admin-pdf] Found pack id=%s title="%s" s3_key=%s pdf_url=%s',
                     pack_id, pack.title, bool(pack.s3_key), bool(pack.pdf_url))

        if not pack.s3_key:
            # Older packs stored a full URL — return it directly.
            if pack.pdf_url:
                logger.info('[admin-pdf] No s3_key, falling back to stored pdf_url for pack %s', pack_id)
                return Response({
                    'pdf_url': pack.pdf_url,
                    'topics_json': pack.topics_json or [],
                    'title': pack.title,
                    'total_pages': pack.total_pages,
                })
            logger.warning('[admin-pdf] Pack %s has no s3_key and no pdf_url', pack_id)
            return error_response('PDF not available for this pack', status_code=404, code='not_found')

        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
        access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

        if not bucket or not access_key or not secret_key:
            logger.error('[admin-pdf] Storage not configured: bucket=%s access_key=%s secret_key=%s',
                         bool(bucket), bool(access_key), bool(secret_key))
            return error_response('Storage not configured', status_code=503, code='storage_unavailable')

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            fresh_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': pack.s3_key},
                ExpiresIn=604800,  # 7 days
            )
            logger.info('[admin-pdf] Generated fresh presigned URL for pack %s (key=%s)', pack_id, pack.s3_key)
        except (BotoCoreError, ClientError) as exc:
            logger.error('[admin-pdf] presign failed for pack %s: %s', pack_id, exc)
            return error_response('Could not generate PDF link', status_code=503, code='storage_unavailable')

        return Response({
            'pdf_url': fresh_url,
            'topics_json': pack.topics_json or [],
            'title': pack.title,
            'total_pages': pack.total_pages,
        })


class StudyPackShareView(APIView):
    """Public endpoint — no authentication required.

    Given a share_token, generate a fresh presigned URL and redirect to it.
    This lets anyone with the share link access the PDF forever, because we
    regenerate the presigned URL on every request rather than relying on an
    expiring stored URL.
    """


    authentication_classes = []
    permission_classes = []

    def get(self, request, share_token):
        pack = StudyPack.objects.filter(share_token=share_token, status=StudyPack.STATUS_READY).first()
        if not pack:
            return error_response('Share link not found or pack is not ready', status_code=404, code='not_found')

        if not pack.s3_key:
            if pack.pdf_url:
                from django.http import HttpResponseRedirect
                return HttpResponseRedirect(pack.pdf_url)
            return error_response('PDF not available', status_code=404, code='not_found')

        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
        access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

        if not bucket or not access_key or not secret_key:
            return error_response('Storage not configured', status_code=503, code='storage_unavailable')

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            fresh_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': pack.s3_key},
                ExpiresIn=604800,  # 7 days to prevent expiry while reading
            )
        except (BotoCoreError, ClientError) as exc:
            import logging
            logging.getLogger(__name__).error('[scrib] share presign failed for token %s: %s', share_token, exc)
            return error_response('Could not generate PDF link', status_code=503, code='storage_unavailable')

        # Also return pack metadata so the viewer page can render the title/topics
        return Response({
            'pdf_url': fresh_url,
            'title': pack.title,
            'total_pages': pack.total_pages,
            'topics_json': pack.topics_json,
        })


class ContactSupportView(APIView):
    authentication_classes = [JWTAuthentication]
    # Allow any so both guests and logged-in users can reach it
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()

        # If user is authenticated, use their info if they didn't provide any or as a fallback
        if request.user.is_authenticated:
            if not name:
                name = getattr(request.user, 'full_name', '') or request.user.email
            if not email:
                email = request.user.email

        if not subject or not message:
            return error_response('Subject and message are required.')
            
        if not email:
            return error_response('An email address is required so we can reply to you.')

        # Construct email body
        body = f"New Support Request from Scrib\n\n"
        body += f"Name: {name or 'Not provided'}\n"
        body += f"Email: {email}\n"
        if request.user.is_authenticated:
            body += f"User ID: {request.user.id}\n"
        body += f"\nMessage:\n{message}\n"

        try:
            from authentication.views import send_email_via_ses
            html_body = body.replace("\n", "<br>")
            success = send_email_via_ses(
                to_email='bannydommati@gmail.com',
                subject=f"[Scrib Support] {subject}",
                html_content=html_body,
                reply_to=email if email else None
            )
            
            if success:
                return Response({'success': True, 'message': 'Your message has been sent successfully. We will get back to you soon!'})
            else:
                return error_response('Failed to send message via SES. Please try again later.', status_code=500)
        except Exception as e:
            logger.error(f"Failed to send support email: {e}", exc_info=True)
            return error_response('Failed to send message. Please try again later.', status_code=500)


class MyStudyPacksView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # pyrefly: ignore [missing-import]
        from .models import NoteShareLink, SharedPackPurchase
        # Clean up any zombie packs before returning history
        cleanup_stuck_packs(request.user)

        created_packs = StudyPack.objects.filter(user=request.user)

        # Also include packs the user purchased via a share link.
        purchases = SharedPackPurchase.objects.filter(
            buyer=request.user, amount_paise__gt=0
        ).values('share_link__study_pack_id', 'purchased_at')
        
        purchased_pack_info = {
            p['share_link__study_pack_id']: p['purchased_at']
            for p in purchases
        }
        purchased_pack_ids = set(purchased_pack_info.keys())
        purchased_packs = StudyPack.objects.filter(id__in=purchased_pack_ids)
        
        all_packs = (created_packs | purchased_packs).distinct()
        
        serializer = StudyPackSerializer(all_packs, many=True)
        data = serializer.data

        # Attach share link info so the frontend can show "✓ Sharing" badges without
        # making a separate API call per pack.
        share_links = {
            sl.study_pack_id: sl.share_code
            for sl in NoteShareLink.objects.filter(
                owner=request.user, is_active=True
            )
        }

        for item in data:
            item['has_share_link'] = item['id'] in share_links
            item['share_code'] = share_links.get(item['id'])
            item['is_purchased'] = item['id'] in purchased_pack_ids
            if item['is_purchased']:
                item['purchased_at'] = purchased_pack_info[item['id']].isoformat() if purchased_pack_info[item['id']] else None

        return Response(data)


# ─── Promo Code Views ─────────────────────────────────────────────────────────

import random
import string
from django.utils import timezone
from django.db.models import Count, Q


def _generate_promo_code():
    """Generate a unique SCRIB-XXXXXX code (6 random uppercase alphanumeric chars)."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):  # retry up to 20 times to avoid collision
        suffix = ''.join(random.choices(chars, k=6))
        code = f'SCRIB-{suffix}'
        if not PromoCode.objects.filter(code=code).exists():
            return code
    raise ValueError('Failed to generate a unique promo code after 20 attempts')


class RedeemCouponView(APIView):
    """
    POST /api/scrib/redeem-coupon/

    Authenticated users can redeem a promo code. Validation:
    - Code must exist, be active, not expired, have remaining redemptions
    - User must not have already redeemed this code
    All credit changes happen inside an atomic transaction with select_for_update
    to prevent race conditions.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RedeemCouponSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Invalid request', details=serializer.errors)

        code_str = serializer.validated_data['code']
        user_model = get_user_model()

        try:
            with transaction.atomic():
                # Lock the promo code row to prevent concurrent redemption races
                try:
                    promo = PromoCode.objects.select_for_update().get(code=code_str)
                except PromoCode.DoesNotExist:
                    return error_response('Coupon not found.', status_code=404, code='coupon_not_found')

                if not promo.is_active:
                    return error_response('Coupon is no longer active.', status_code=400, code='coupon_inactive')

                if timezone.now() > promo.expires_at:
                    return error_response('Coupon expired.', status_code=400, code='coupon_expired')

                if promo.times_redeemed >= promo.max_redemptions:
                    return error_response('Coupon usage limit reached.', status_code=400, code='coupon_exhausted')

                already_redeemed = PromoCodeRedemption.objects.filter(
                    promo_code=promo, user=request.user
                ).exists()
                if already_redeemed:
                    return error_response('You have already redeemed this coupon.', status_code=400, code='already_redeemed')

                # All checks passed — apply the redemption
                user = user_model.objects.get(pk=request.user.pk)

                CreditTransaction.objects.create(
                    user=user,
                    direction=CreditTransaction.DIRECTION_CREDIT,
                    credits=promo.credits_to_add,
                    reason=CreditTransaction.REASON_PROMO,
                )

                promo.times_redeemed += 1
                promo.save(update_fields=['times_redeemed'])

                PromoCodeRedemption.objects.create(
                    promo_code=promo,
                    user=user,
                    credits_added=promo.credits_to_add,
                )

        except Exception as exc:
            logger.exception(f'[scrib] Promo redemption error for code={code_str}: {exc}')
            return error_response('An error occurred. Please try again.', status_code=500)

        new_balance = get_credit_balance(request.user)
        return Response({
            'success': True,
            'message': f'Successfully redeemed coupon. {promo.credits_to_add} credits added to your account.',
            'credits_added': promo.credits_to_add,
            'campaign_name': promo.campaign_name,
            'new_balance': new_balance,
        }, status=200)


class AdminPromoCodeListView(APIView):
    """
    GET  /api/scrib/admin/promo-codes/  — paginated list grouped by campaign
    POST /api/scrib/admin/promo-codes/  — bulk-generate codes for a new campaign
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        campaign = request.query_params.get('campaign', '').strip()
        qs = PromoCode.objects.all()
        if campaign:
            qs = qs.filter(campaign_name__icontains=campaign)

        serializer = PromoCodeListSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': qs.count()})

    def post(self, request):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        campaign_name = (request.data.get('campaign_name') or '').strip()
        credits_to_add = request.data.get('credits_to_add', 5)
        quantity = request.data.get('quantity', 1)
        expires_at = request.data.get('expires_at')  # ISO datetime string
        max_redemptions = request.data.get('max_redemptions', 1)

        if not campaign_name:
            return error_response('campaign_name is required')
        try:
            credits_to_add = int(credits_to_add)
            quantity = int(quantity)
            max_redemptions = int(max_redemptions)
            if quantity < 1 or quantity > 500:
                raise ValueError
        except (ValueError, TypeError):
            return error_response('Invalid quantity (1–500) or credits value')

        if not expires_at:
            return error_response('expires_at is required')
        try:
            from django.utils.dateparse import parse_datetime
            expires_dt = parse_datetime(expires_at)
            if expires_dt is None:
                raise ValueError
            # Handle naive datetimes
            if timezone.is_naive(expires_dt):
                expires_dt = timezone.make_aware(expires_dt)
        except (ValueError, TypeError):
            return error_response('Invalid expires_at format. Use ISO 8601.')

        # Bulk-generate codes
        created_codes = []
        try:
            with transaction.atomic():
                for _ in range(quantity):
                    code_str = _generate_promo_code()
                    obj = PromoCode.objects.create(
                        code=code_str,
                        credits_to_add=credits_to_add,
                        campaign_name=campaign_name,
                        max_redemptions=max_redemptions,
                        expires_at=expires_dt,
                        is_active=True,
                        created_by=request.user,
                    )
                    created_codes.append(obj)
        except Exception as exc:
            logger.exception(f'[scrib] Promo code bulk-create error: {exc}')
            return error_response('Failed to generate codes. Please try again.', status_code=500)

        return Response({
            'success': True,
            'created': quantity,
            'campaign_name': campaign_name,
            'codes': [c.code for c in created_codes],
        }, status=201)


class AdminPromoCodeDetailView(APIView):
    """
    GET /api/scrib/admin/promo-codes/<pk>/
    Returns the promo code detail with all redemptions.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        try:
            promo = PromoCode.objects.prefetch_related('redemptions__user').get(pk=pk)
        except PromoCode.DoesNotExist:
            return error_response('Promo code not found', status_code=404, code='not_found')

        serializer = PromoCodeSerializer(promo)
        return Response(serializer.data)


class AdminPromoCodeStatsView(APIView):
    """
    GET /api/scrib/admin/promo-codes/stats/
    Returns aggregate stats for the promo code dashboard.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        now = timezone.now()
        total_codes = PromoCode.objects.count()
        total_redeemed = PromoCodeRedemption.objects.count()
        active_campaigns = PromoCode.objects.filter(
            is_active=True, expires_at__gt=now
        ).values('campaign_name').distinct().count()
        total_remaining = sum(
            max(p.max_redemptions - p.times_redeemed, 0)
            for p in PromoCode.objects.filter(is_active=True, expires_at__gt=now)
        )

        # Campaign-level summary
        from django.db.models import Sum as DSum, Max
        campaigns = (
            PromoCode.objects
            .values('campaign_name', 'credits_to_add', 'expires_at')
            .annotate(
                total_generated=Count('id'),
                total_redeemed=DSum('times_redeemed'),
            )
            .order_by('-expires_at')
        )

        campaign_data = []
        for c in campaigns:
            gen = c['total_generated'] or 0
            red = c['total_redeemed'] or 0
            remaining = gen - red
            exp_dt = c['expires_at']
            if timezone.is_naive(exp_dt):
                exp_dt = timezone.make_aware(exp_dt)
            is_active_camp = exp_dt > now
            campaign_data.append({
                'campaign_name': c['campaign_name'],
                'credits_to_add': c['credits_to_add'],
                'total_generated': gen,
                'total_redeemed': red,
                'remaining': max(remaining, 0),
                'expires_at': exp_dt.isoformat(),
                'status': 'Active' if is_active_camp else 'Expired',
            })

        return Response({
            'total_codes': total_codes,
            'total_redeemed': total_redeemed,
            'active_campaigns': active_campaigns,
            'total_remaining': total_remaining,
            'campaigns': campaign_data,
        })


class AdminUserInsightsView(APIView):
    """
    GET /api/scrib/admin/user-insights/

    Returns two annotated user lists for Scrib analytics:
      1. paid_and_coupon  — users who completed at least one payment AND redeemed
                            at least one promo code
      2. generated_users  — users who generated at least one note or study pack
                            (regardless of payment status)

    Each user entry includes: id, email, full_name, join_date,
    plus relevant counters (payments, notes, packs, coupons redeemed).
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        from django.db.models import Count as DCount, Min, Max as DMax
        User = get_user_model()

        # ── 1. Users who paid (at least 1 paid Payment) AND redeemed a promo ──
        paid_user_ids = set(
            Payment.objects.filter(status=Payment.STATUS_PAID)
            .values_list('user_id', flat=True)
            .distinct()
        )

        # Users who have paid >= 2 times (repeating / returning payers)
        repeat_paid_user_ids = set(
            Payment.objects.filter(status=Payment.STATUS_PAID)
            .values('user_id')
            .annotate(pay_count=DCount('id'))
            .filter(pay_count__gte=2)
            .values_list('user_id', flat=True)
        )
        coupon_user_ids = set(
            PromoCodeRedemption.objects.values_list('user_id', flat=True).distinct()
        )
        paid_and_coupon_ids = paid_user_ids & coupon_user_ids

        paid_and_coupon_qs = (
            User.objects.filter(pk__in=paid_and_coupon_ids)
            .annotate(
                paid_payments=DCount(
                    'scrib_payments',
                    filter=Q(scrib_payments__status=Payment.STATUS_PAID),
                    distinct=True,
                ),
                coupons_redeemed=DCount('promo_redemptions', distinct=True),
                notes_generated=DCount('scrib_notes', distinct=True),
                packs_generated=DCount('scrib_study_packs', distinct=True),
            )
            .order_by('email')
            .values(
                'id', 'email', 'full_name', 'date_joined',
                'paid_payments', 'coupons_redeemed', 'notes_generated', 'packs_generated',
            )
        )

        paid_and_coupon = []
        for u in paid_and_coupon_qs:
            paid_and_coupon.append({
                'id': u['id'],
                'email': u['email'],
                'full_name': u.get('full_name') or '',
                'date_joined': u['date_joined'].isoformat() if u['date_joined'] else None,
                'paid_payments': u['paid_payments'],
                'coupons_redeemed': u['coupons_redeemed'],
                'notes_generated': u['notes_generated'],
                'packs_generated': u['packs_generated'],
                'total_generated': (u['notes_generated'] or 0) + (u['packs_generated'] or 0),
            })

        # ── 2. Users who generated at least one note OR study pack ──
        note_user_ids = set(
            GeneratedNote.objects.values_list('user_id', flat=True).distinct()
        )
        pack_user_ids = set(
            StudyPack.objects.exclude(status=StudyPack.STATUS_FAILED)
            .values_list('user_id', flat=True).distinct()
        )
        generated_ids = note_user_ids | pack_user_ids

        generated_qs = (
            User.objects.filter(pk__in=generated_ids)
            .annotate(
                notes_generated=DCount('scrib_notes', distinct=True),
                packs_generated=DCount('scrib_study_packs', distinct=True),
                coupons_redeemed=DCount('promo_redemptions', distinct=True),
                paid_payments=DCount(
                    'scrib_payments',
                    filter=Q(scrib_payments__status=Payment.STATUS_PAID),
                    distinct=True,
                ),
            )
            .order_by('-notes_generated', '-packs_generated')
            .values(
                'id', 'email', 'full_name', 'date_joined',
                'notes_generated', 'packs_generated', 'coupons_redeemed', 'paid_payments',
            )
        )

        generated_users = []
        for u in generated_qs:
            generated_users.append({
                'id': u['id'],
                'email': u['email'],
                'full_name': u.get('full_name') or '',
                'date_joined': u['date_joined'].isoformat() if u['date_joined'] else None,
                'notes_generated': u['notes_generated'],
                'packs_generated': u['packs_generated'],
                'total_generated': (u['notes_generated'] or 0) + (u['packs_generated'] or 0),
                'coupons_redeemed': u['coupons_redeemed'],
                'paid_payments': u['paid_payments'],
                'has_paid': (u['paid_payments'] or 0) > 0,
            })

        return Response({
            'paid_and_coupon': {
                'count': len(paid_and_coupon),
                'users': paid_and_coupon,
            },
            'generated_users': {
                'count': len(generated_users),
                'users': generated_users,
            },
            'total_packs_generated': StudyPack.objects.exclude(status=StudyPack.STATUS_FAILED).count(),
            'total_paid_users': len(paid_user_ids),
            'repeat_paid_users': len(repeat_paid_user_ids),
        })


# ─────────────────────────────────────────────────────────────────────────────
# Paid Users Analytics  (Phase 1)
# GET /api/scrib/admin/paid-analytics/
# ─────────────────────────────────────────────────────────────────────────────

class AdminPaidUsersAnalyticsView(APIView):
    """
    Returns a comprehensive analytics payload for all users who have made
    at least one successful (STATUS_PAID) payment.

    Sections returned
    -----------------
    summary          — aggregate KPIs
    cohorts          — ₹19 trial cohort + coupon cohort
    paid_users       — per-user table rows with embedded study-pack history
    leaderboards     — top-10 revenue / repeat / credit-consumers
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    # ₹19 trial pack amount in paise (must match CREDIT_PACKS['try'])
    TRIAL_AMOUNT_PAISE = 1900

    def get(self, request):
        if not is_admin_user(request.user):
            return error_response('Forbidden', status_code=403, code='forbidden')

        from django.utils import timezone
        import datetime
        from django.db.models import Count as DCount, Max as DMax, Min as DMin

        User = get_user_model()
        
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str and end_date_str:
            try:
                start_date = timezone.make_aware(datetime.datetime.strptime(start_date_str, '%Y-%m-%d'))
                end_date = timezone.make_aware(datetime.datetime.strptime(end_date_str, '%Y-%m-%d')) + datetime.timedelta(days=1) - datetime.timedelta(microseconds=1)
            except ValueError:
                return error_response('Invalid date format. Use YYYY-MM-DD.', status_code=400)
        else:
            end_date = timezone.now()
            start_date = end_date - datetime.timedelta(days=28)

        # ── 1. All paid Payment rows ──────────────────────────────────────────
        paid_qs = Payment.objects.filter(
            status=Payment.STATUS_PAID,
            created_at__gte=start_date,
            created_at__lte=end_date
        )

        # Per-user aggregates from payments
        per_user_pay = list(
            paid_qs
            .values('user_id')
            .annotate(
                pay_count=DCount('id'),
                total_revenue_paise=Sum('amount'),
                total_credits_bought=Sum('credits_added'),
                first_payment=DMin('created_at'),
                last_payment=DMax('created_at'),
            )
        )
        # Build lookup by user_id
        pay_map = {r['user_id']: r for r in per_user_pay}
        paid_user_ids = list(pay_map.keys())

        if not paid_user_ids:
            return Response({
                'summary': {
                    'total_paid_users': 0,
                    'repeat_payers': 0,
                    'three_plus_payers': 0,
                    'avg_revenue_per_user_inr': 0,
                    'avg_credits_per_user': 0,
                },
                'cohorts': {'trial': {}, 'coupon': {}},
                'paid_users': [],
                'leaderboards': {'top_revenue': [], 'top_repeat': [], 'top_credits': []},
            })

        # ── 2. Credits consumed per user (DEBIT transactions) ────────────────
        debit_map = {
            r['user_id']: r['total']
            for r in CreditTransaction.objects.filter(
                user_id__in=paid_user_ids,
                direction=CreditTransaction.DIRECTION_DEBIT,
            ).values('user_id').annotate(total=Sum('credits'))
        }

        # Credits received (CREDIT transactions — payments + promos)
        credit_map = {
            r['user_id']: r['total']
            for r in CreditTransaction.objects.filter(
                user_id__in=paid_user_ids,
                direction=CreditTransaction.DIRECTION_CREDIT,
            ).values('user_id').annotate(total=Sum('credits'))
        }

        # ── 3. Study packs per user ───────────────────────────────────────────
        packs_per_user = {}
        for pack in (
            StudyPack.objects
            .filter(user_id__in=paid_user_ids)
            .exclude(status=StudyPack.STATUS_FAILED)
            .order_by('-created_at')
            .values('id', 'user_id', 'title', 'created_at', 'credits_used',
                    'status', 'pdf_url', 's3_key', 'share_token', 'total_pages', 'topics_json')
        ):
            packs_per_user.setdefault(pack['user_id'], []).append(pack)

        # ── 4. Last active (max of last note, pack, or payment) ───────────────
        last_note = {
            r['user_id']: r['last']
            for r in GeneratedNote.objects.filter(user_id__in=paid_user_ids)
            .values('user_id').annotate(last=DMax('created_at'))
        }
        last_pack = {
            r['user_id']: r['last']
            for r in StudyPack.objects.filter(user_id__in=paid_user_ids)
            .exclude(status=StudyPack.STATUS_FAILED)
            .values('user_id').annotate(last=DMax('created_at'))
        }

        # ── 5. User display info ──────────────────────────────────────────────
        user_info = {
            u.pk: u
            for u in User.objects.filter(pk__in=paid_user_ids).only('id', 'email', 'full_name', 'date_joined')
        }

        # ── 6. Coupon users ───────────────────────────────────────────────────
        coupon_user_ids_set = set(
            PromoCodeRedemption.objects.values_list('user_id', flat=True).distinct()
        )

        # Which payments were trial payments (₹19) per user
        trial_user_ids_set = set(
            Payment.objects.filter(
                status=Payment.STATUS_PAID,
                amount=self.TRIAL_AMOUNT_PAISE,
            ).values_list('user_id', flat=True).distinct()
        )

        # ── 7. Build per-user rows ────────────────────────────────────────────
        rows = []
        for uid in paid_user_ids:
            p = pay_map[uid]
            user = user_info.get(uid)
            if not user:
                continue

            credits_bought = p['total_credits_bought'] or 0
            credits_in = credit_map.get(uid, 0) or 0
            credits_out = debit_map.get(uid, 0) or 0
            credits_remaining = max(credits_in - credits_out, 0)

            # Last active = max of last note, pack, or payment
            candidates = [
                last_note.get(uid),
                last_pack.get(uid),
                p['last_payment'],
            ]
            last_active = max((c for c in candidates if c), default=None)

            # Pack rows for this user
            user_packs = []
            for pk in packs_per_user.get(uid, []):
                user_packs.append({
                    'id': pk['id'],
                    'title': pk['title'],
                    'status': pk['status'],
                    'total_pages': pk['total_pages'],
                    'credits_used': pk['credits_used'],
                    'created_at': pk['created_at'].isoformat() if pk['created_at'] else None,
                    'pdf_url': pk['pdf_url'] or None,
                    'share_token': str(pk['share_token']) if pk['share_token'] else None,
                    'topics_json': pk.get('topics_json') or [],
                })

            rows.append({
                'id': uid,
                'email': user.email,
                'full_name': user.full_name or '',
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                # payment stats
                'payment_count': p['pay_count'],
                'total_revenue_paise': p['total_revenue_paise'] or 0,
                'total_revenue_inr': round((p['total_revenue_paise'] or 0) / 100, 2),
                # credit stats
                'credits_purchased': credits_bought,
                'credits_remaining': credits_remaining,
                'credits_spent': credits_out,
                # generation stats
                'study_packs_count': len(user_packs),
                'packs': user_packs,
                # activity
                'last_active': last_active.isoformat() if last_active else None,
                'first_payment': p['first_payment'].isoformat() if p['first_payment'] else None,
                # cohort flags
                'has_coupon': uid in coupon_user_ids_set,
                'has_trial': uid in trial_user_ids_set,
            })

        # ── 8. Summary KPIs ───────────────────────────────────────────────────
        total_paid = len(rows)
        repeat_payers = sum(1 for r in rows if r['payment_count'] >= 2)
        three_plus = sum(1 for r in rows if r['payment_count'] >= 3)
        total_rev = sum(r['total_revenue_paise'] for r in rows)
        total_credits_all = sum(r['credits_purchased'] for r in rows)

        avg_rev_inr = round((total_rev / total_paid / 100), 2) if total_paid else 0
        avg_credits = round(total_credits_all / total_paid, 1) if total_paid else 0

        # ── 9. ₹19 Trial Cohort ──────────────────────────────────────────────
        trial_rows = [r for r in rows if r['has_trial']]
        trial_total = len(trial_rows)
        trial_2nd = sum(1 for r in trial_rows if r['payment_count'] >= 2)
        trial_3rd = sum(1 for r in trial_rows if r['payment_count'] >= 3)
        trial_rev = sum(r['total_revenue_paise'] for r in trial_rows)
        avg_trial_rev = round(trial_rev / trial_total / 100, 2) if trial_total else 0

        trial_cohort = {
            'trial_buyers': trial_total,
            'conversion_to_2nd_pct': round(trial_2nd * 100 / trial_total, 1) if trial_total else 0,
            'conversion_to_3rd_pct': round(trial_3rd * 100 / trial_total, 1) if trial_total else 0,
            'avg_revenue_inr': avg_trial_rev,
        }

        # ── 10. Coupon Cohort ────────────────────────────────────────────────
        all_coupon_user_ids = set(
            PromoCodeRedemption.objects.values_list('user_id', flat=True).distinct()
        )
        coupon_total = len(all_coupon_user_ids)
        coupon_paid_ids = all_coupon_user_ids & set(paid_user_ids)
        coupon_repeat_ids = {uid for uid in coupon_paid_ids if pay_map[uid]['pay_count'] >= 2}
        coupon_paid_rows = [r for r in rows if r['id'] in coupon_paid_ids]
        coupon_rev = sum(r['total_revenue_paise'] for r in coupon_paid_rows)
        avg_coupon_rev = round(coupon_rev / len(coupon_paid_rows) / 100, 2) if coupon_paid_rows else 0

        coupon_cohort = {
            'coupon_users': coupon_total,
            'coupon_to_paid_pct': round(len(coupon_paid_ids) * 100 / coupon_total, 1) if coupon_total else 0,
            'coupon_to_repeat_pct': round(len(coupon_repeat_ids) * 100 / coupon_total, 1) if coupon_total else 0,
            'avg_revenue_inr': avg_coupon_rev,
        }

        # ── 11. Leaderboards ─────────────────────────────────────────────────
        def leaderboard_entry(r, rank):
            return {
                'rank': rank,
                'id': r['id'],
                'email': r['email'],
                'full_name': r['full_name'],
                'payment_count': r['payment_count'],
                'total_revenue_inr': r['total_revenue_inr'],
                'credits_purchased': r['credits_purchased'],
                'credits_spent': r['credits_spent'],
                'study_packs_count': r['study_packs_count'],
            }

        top_revenue = [
            leaderboard_entry(r, i + 1)
            for i, r in enumerate(sorted(rows, key=lambda x: x['total_revenue_paise'], reverse=True)[:10])
        ]
        top_repeat = [
            leaderboard_entry(r, i + 1)
            for i, r in enumerate(sorted(rows, key=lambda x: x['payment_count'], reverse=True)[:10])
        ]
        top_credits = [
            leaderboard_entry(r, i + 1)
            for i, r in enumerate(sorted(rows, key=lambda x: x['credits_spent'], reverse=True)[:10])
        ]

        recent_packs_qs = StudyPack.objects.select_related('user').order_by('-created_at')[:10]
        recent_packs = [
            {
                'id': rp.id,
                'title': rp.title,
                'email': rp.user.email,
                'created_at': rp.created_at.isoformat() if rp.created_at else None,
                'status': rp.status,
                'total_pages': rp.total_pages,
                'share_token': str(rp.share_token) if rp.share_token else None,
                'topics_json': rp.topics_json or [],
            }
            for rp in recent_packs_qs
        ]

        # Calculate start of today in IST (UTC+5:30)
        ist_now = timezone.now() + datetime.timedelta(hours=5, minutes=30)
        ist_today_start = (ist_now.replace(hour=0, minute=0, second=0, microsecond=0) - datetime.timedelta(hours=5, minutes=30))
        today_packs_qs = StudyPack.objects.select_related('user').filter(created_at__gte=ist_today_start).order_by('-created_at')[:100]
        today_packs = [
            {
                'id': rp.id,
                'title': rp.title,
                'email': rp.user.email,
                'created_at': rp.created_at.isoformat() if rp.created_at else None,
                'status': rp.status,
                'total_pages': rp.total_pages,
                'share_token': str(rp.share_token) if rp.share_token else None,
                'topics_json': rp.topics_json or [],
            }
            for rp in today_packs_qs
        ]
        today_packs_count = StudyPack.objects.filter(created_at__gte=ist_today_start).count()

        return Response({
            'summary': {
                'total_paid_users': total_paid,
                'repeat_payers': repeat_payers,
                'three_plus_payers': three_plus,
                'avg_revenue_per_user_inr': avg_rev_inr,
                'avg_credits_per_user': avg_credits,
                'total_revenue_inr': round(total_rev / 100, 2),
            },
            'cohorts': {
                'trial': trial_cohort,
                'coupon': coupon_cohort,
            },
            'paid_users': rows,
            'leaderboards': {
                'top_revenue': top_revenue,
                'top_repeat': top_repeat,
                'top_credits': top_credits,
            },
            'recent_packs': recent_packs,
            'today_packs': today_packs,
            'today_packs_count': today_packs_count,
        })


# ─── Scrib Config (Cohort Toggle) ────────────────────────────────────────────

class ScribConfigPublicView(APIView):
    """GET /api/scrib/config/  — public, no auth required.

    Returns the active cohort so the scrib SPA can decide which
    landing modal to show without a code deploy.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        config = ScribConfig.get()
        return Response({
            'cohort': config.cohort,
            'give_free_credit_on_signup': config.give_free_credit_on_signup,
        })


class AdminScribConfigView(APIView):
    """GET / PATCH /api/scrib/admin/config/  — superuser only.

    Allows the admin panel to read and update the active cohort
    and the free-credit-on-signup toggle.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def _check_superuser(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Admin access required.'}, status=403)
        return None

    def get(self, request):
        denied = self._check_superuser(request)
        if denied:
            return denied
        config = ScribConfig.get()

        # Compute Free Credit Cohort Economics
        from scrib.models import CreditTransaction, Payment

        bonus_user_ids = set(CreditTransaction.objects.filter(
            direction=CreditTransaction.DIRECTION_CREDIT,
            reason=CreditTransaction.REASON_SIGNUP_BONUS,
        ).values_list('user_id', flat=True))

        users_given = len(bonus_user_ids)
        if users_given > 0:
            used_user_ids = set(CreditTransaction.objects.filter(
                user_id__in=bonus_user_ids,
                direction=CreditTransaction.DIRECTION_DEBIT,
            ).values_list('user_id', flat=True))
            free_credits_used = len(used_user_ids)

            paid_user_ids = set(Payment.objects.filter(
                user_id__in=bonus_user_ids,
                status=Payment.STATUS_PAID,
            ).values_list('user_id', flat=True))
            converted_to_paid = len(paid_user_ids)
            conversion_rate = round((converted_to_paid * 100.0) / users_given, 2) if users_given > 0 else 0.0

            cost_per_credit = 7
            total_cost = free_credits_used * cost_per_credit

            payments = Payment.objects.filter(
                user_id__in=bonus_user_ids,
                status=Payment.STATUS_PAID,
            )
            lifetime_profit = 0
            for p in payments:
                if p.amount == 1900 or p.credits_added == 2:
                    lifetime_profit += 5
                elif p.amount == 8900 or p.credits_added == 10:
                    lifetime_profit += 20
                elif p.amount == 16900 or p.credits_added == 20:
                    lifetime_profit += 30
                elif p.amount == 31900 or p.credits_added == 40:
                    lifetime_profit += 40
                else:
                    lifetime_profit += round((p.amount / 100.0) * 0.22)

            net_gain = lifetime_profit - total_cost
            roi_per_rupee = round(lifetime_profit / total_cost, 2) if total_cost > 0 else 0.0

            cohort_economics = {
                'users_given_free_credit': users_given,
                'free_credits_used': free_credits_used,
                'converted_to_paid': converted_to_paid,
                'conversion_rate_pct': conversion_rate,
                'cost_per_free_credit': cost_per_credit,
                'total_free_credit_cost': total_cost,
                'lifetime_profit': lifetime_profit,
                'net_gain': net_gain,
                'return_per_rupee': roi_per_rupee,
                'is_live_data': True,
            }
        else:
            cohort_economics = {
                'users_given_free_credit': 2481,
                'free_credits_used': 2106,
                'converted_to_paid': 184,
                'conversion_rate_pct': 8.74,
                'cost_per_free_credit': 7,
                'total_free_credit_cost': 14742,
                'lifetime_profit': 96850,
                'net_gain': 82108,
                'return_per_rupee': 6.57,
                'is_live_data': False,
            }

        return Response({
            'cohort': config.cohort,
            'give_free_credit_on_signup': config.give_free_credit_on_signup,
            'updated_at': config.updated_at,
            'cohort_economics': cohort_economics,
            'cohort_comparison': self._compute_cohort_comparison(),
        })

    def _compute_cohort_comparison(self):
        """Aggregate lifetime signup and payment metrics grouped by User.signup_cohort.

        Profit per pack per cohort uses the same per-pack formula as cohort_economics.
        Returns a dict keyed by cohort name with summary stats + a periods timeline.
        """
        User = get_user_model()
        now = timezone.now()
        results = {}

        for cohort_key in [CohortPeriod.COHORT_PREVIEW, CohortPeriod.COHORT_FREE_CREDIT]:
            signups = User.objects.filter(signup_cohort=cohort_key).count()

            paid_payments = Payment.objects.filter(
                user__signup_cohort=cohort_key,
                status=Payment.STATUS_PAID,
            )
            paid_user_ids = paid_payments.values_list('user_id', flat=True).distinct()
            paid_users = paid_user_ids.count()
            conversion_pct = round(paid_users * 100.0 / signups, 2) if signups else 0.0

            lifetime_profit = 0
            for p in paid_payments:
                if p.amount == 1900 or p.credits_added == 2:
                    lifetime_profit += 5
                elif p.amount == 8900 or p.credits_added == 10:
                    lifetime_profit += 20
                elif p.amount == 16900 or p.credits_added == 20:
                    lifetime_profit += 30
                elif p.amount == 31900 or p.credits_added == 40:
                    lifetime_profit += 40
                else:
                    lifetime_profit += round((p.amount / 100.0) * 0.22)

            avg_profit = round(lifetime_profit / paid_users, 2) if paid_users else 0.0

            credits_used = CreditTransaction.objects.filter(
                user__signup_cohort=cohort_key,
                direction=CreditTransaction.DIRECTION_DEBIT,
            ).aggregate(total=Sum('credits'))['total'] or 0

            # Days active = sum of all period durations for this cohort (in float days)
            periods_qs = CohortPeriod.objects.filter(cohort=cohort_key)
            total_sec = sum(
                ((p.ended_at or now) - p.started_at).total_seconds()
                for p in periods_qs
            )
            days_float = round(total_sec / 86400.0, 1) if total_sec > 0 else 0
            days_active = int(days_float) if isinstance(days_float, float) and days_float.is_integer() else days_float

            signups_per_day = round(signups / days_float, 1) if days_float > 0 else 0.0

            results[cohort_key] = {
                'signups': signups,
                'signups_per_day': signups_per_day,
                'paid_users': paid_users,
                'conversion_pct': conversion_pct,
                'lifetime_profit': lifetime_profit,
                'avg_profit_per_paid_user': avg_profit,
                'credits_used': credits_used,
                'days_active': days_active,
            }


        # Build a period timeline for display
        periods_timeline = [
            {
                'cohort': p.cohort,
                'started_at': p.started_at.isoformat(),
                'ended_at': p.ended_at.isoformat() if p.ended_at else None,
            }
            for p in CohortPeriod.objects.order_by('started_at')
        ]

        return {
            'by_cohort': results,
            'periods': periods_timeline,
        }

    def patch(self, request):
        denied = self._check_superuser(request)
        if denied:
            return denied

        config = ScribConfig.get()
        changed = False

        cohort = request.data.get('cohort')
        if cohort is not None:
            valid_cohorts = [ScribConfig.COHORT_PREVIEW, ScribConfig.COHORT_FREE_CREDIT]
            if cohort not in valid_cohorts:
                return Response(
                    {'error': f'Invalid cohort. Must be one of: {valid_cohorts}'},
                    status=400,
                )
            if cohort != config.cohort:
                # Close the currently active period and open a new one
                now = timezone.now()
                CohortPeriod.objects.filter(ended_at__isnull=True).update(ended_at=now)
                CohortPeriod.objects.create(
                    cohort=cohort,
                    started_at=now,
                    switched_by=request.user,
                )
                logger.info(
                    f"Admin {request.user.email} switched cohort: "
                    f"{config.cohort} → {cohort}. New CohortPeriod created."
                )
            config.cohort = cohort
            changed = True

        give_free = request.data.get('give_free_credit_on_signup')
        if give_free is not None:
            if not isinstance(give_free, bool):
                return Response({'error': 'give_free_credit_on_signup must be a boolean.'}, status=400)
            config.give_free_credit_on_signup = give_free
            changed = True

        if changed:
            config.save()
            logger.info(
                f"Admin {request.user.email} updated ScribConfig: "
                f"cohort={config.cohort}, give_free_credit={config.give_free_credit_on_signup}"
            )

        return self.get(request)


# ─── Earn While Learning Views ───────────────────────────────────────────────────
# All constants imported from share_constants.py — no hardcoded numbers here.

# pyrefly: ignore [missing-import]
from .models import NoteShareLink, SharedPackPurchase
# pyrefly: ignore [missing-import]
from .share_constants import (
    SHARE_PRICE_PER_PAGE, SHARE_REWARD_PER_PAGE, SHARE_REWARD_TYPE,
    generate_share_code, SHARE_CODE_MAX_RETRIES, PREVIEW_TOKEN_TTL_SECONDS,
)


def _get_topics_per_page(topics_json):
    """Extract up to 2 topic names per page from the StudyPack.topics_json structure.

    Handles both the legacy list-of-strings format and the v2 page-dict format.
    Returns a list of {page, topics} dicts suitable for the share landing page.
    """
    result = []
    if not topics_json:
        return result
    for i, page in enumerate(topics_json, start=1):
        if isinstance(page, dict) and 'topics' in page:
            # v2 format: {'topics': [{'name': ..., 'instruction': ...}, ...]}
            names = [
                (t.get('name') or t.get('topic') or str(t)).strip()
                for t in page['topics']
                if t
            ][:2]
        elif isinstance(page, list):
            names = [str(t).strip() for t in page][:2]
        elif isinstance(page, str):
            names = [page.strip()]
        else:
            names = []
        result.append({'page': i, 'topics': names})
    return result


def _parse_device_info(request):
    """Parse device, browser, and country from request headers.

    Returns a dict with 'device', 'browser', 'country'.
    Country comes from the CF-IPCountry header (set by Cloudflare on Render/Railway).
    Device/browser are parsed from User-Agent using the `user-agents` library if
    available, otherwise left blank.
    """
    ua_string = request.META.get('HTTP_USER_AGENT', '')
    country = (
        request.META.get('HTTP_CF_IPCOUNTRY', '')
        or request.META.get('HTTP_X_COUNTRY_CODE', '')
    )[:2].upper()

    device = ''
    browser = ''
    try:
        # pyrefly: ignore [missing-import]
        import user_agents
        ua = user_agents.parse(ua_string)
        if ua.is_mobile:
            device = 'mobile'
        elif ua.is_tablet:
            device = 'tablet'
        else:
            device = 'desktop'
        browser = ua.browser.family or ''
    except ImportError:
        pass  # user-agents not installed — fields stay blank

    return {'device': device, 'browser': browser, 'country': country}


def _generate_share_message(pack, is_creator, share_url):
    """Build the share message text, dynamically worded for creator vs. buyer."""
    total_price = int(pack.total_pages * SHARE_PRICE_PER_PAGE)
    
    intro = 'Check out my AI handwritten notes on Scrib!' if is_creator else 'Check out these AI handwritten notes on Scrib!'
    
    raw_topics = getattr(pack, 'topics_json', None)
    topics = []
    
    if isinstance(raw_topics, dict):
        topics_data = raw_topics.get('topics', [])
    elif isinstance(raw_topics, list):
        topics_data = raw_topics
    else:
        topics_data = []

    for t in topics_data:
        if isinstance(t, dict) and 'name' in t:
            topics.append(t['name'])
        elif isinstance(t, str):
            topics.append(t)

    if not topics:
        topics = [pack.title]
        
    if len(topics) > 4:
        topics = topics[:4]
        
    topics_list = '\n'.join([f"- {t}" for t in topics])

    return (
        f"{intro}\n\n"
        f"Why generate your own notes when you can unlock these ready-made notes for almost 50% less?\n\n"
        f"Topics:\n"
        f"{topics_list}\n\n"
        f"{pack.total_pages} Page{'s' if pack.total_pages != 1 else ''}\n"
        f"Only \u20b9{total_price}\n\n"
        f"{share_url}"
    )


def _build_share_url(share_code, request):
    """Return the canonical share URL for Scrib note share links."""
    # First check for explicit SCRIB_FRONTEND_DOMAIN setting in settings
    scrib_domain = getattr(settings, 'SCRIB_FRONTEND_DOMAIN', None)
    
    if not scrib_domain or ('easylearnova.com' in scrib_domain and 'scrib' not in scrib_domain) or 'www.scrib' in scrib_domain:
        # Check if incoming request Origin / Referer points to local dev
        origin = request.headers.get('Origin', '') or ''
        referer = request.headers.get('Referer', '') or ''
        if 'localhost:5174' in origin or 'localhost:5174' in referer:
            scrib_domain = 'http://localhost:5174'
        else:
            scrib_domain = 'https://scrib.easylearnova.com'
            
    return f"{scrib_domain.rstrip('/')}/share/{share_code}"


class ShareCreateView(APIView):
    """POST /api/scrib/share/create/

    Create (or retrieve existing) share link for a StudyPack or GeneratedNote.
    Idempotent: calling multiple times for the same (user, pack) returns the same code.

    Request body:
        { "pack_id": 42 }     for a StudyPack
        { "note_id": 7 }      for a GeneratedNote (auto-wraps into its linked StudyPack
                               or returns an error if the note has no backing pack)
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pack_id = request.data.get('pack_id')
        note_id = request.data.get('note_id')

        pack = None
        if pack_id:
            pack = StudyPack.objects.filter(
                pk=pack_id, status=StudyPack.STATUS_READY
            ).first()
            # Allow owner OR share-purchase holder to create their own link
            if pack:
                is_owner = (pack.user_id == request.user.id)
                is_purchaser = SharedPackPurchase.objects.filter(
                    buyer=request.user, share_link__study_pack_id=pack.id
                ).exists()
                if not is_owner and not is_purchaser:
                    pack = None
            if not pack:
                return error_response('Study pack not found or not ready', status_code=404, code='not_found')
        elif note_id:
            # GeneratedNote — find a StudyPack the user owns that matches
            # (In practice, the frontend sends pack_id for packs; note_id is
            #  a future convenience path for single-page notes.)
            note = GeneratedNote.objects.filter(pk=note_id, user=request.user).first()
            if not note:
                return error_response('Note not found', status_code=404, code='not_found')
            # Try to find an existing StudyPack that wraps this note's prompt/image
            pack = StudyPack.objects.filter(
                user=request.user, title=note.prompt, status=StudyPack.STATUS_READY
            ).first()
            if not pack:
                return error_response(
                    'This note does not have a shareable study pack yet. '
                    'Please generate a Study Pack first.',
                    status_code=400, code='no_study_pack',
                )
        else:
            return error_response('pack_id or note_id is required')

        is_creator = (pack.user_id == request.user.id)

        # Get or create the share link (idempotent)
        existing = NoteShareLink.objects.filter(
            study_pack=pack, owner=request.user
        ).first()

        if existing:
            share_link = existing
            is_new = False
        else:
            # Generate a unique share code with collision retry
            code = None
            for _ in range(SHARE_CODE_MAX_RETRIES):
                candidate = generate_share_code()
                if not NoteShareLink.objects.filter(share_code=candidate).exists():
                    code = candidate
                    break
            if not code:
                logger.error('[share] Failed to generate unique share code after %d retries', SHARE_CODE_MAX_RETRIES)
                return error_response('Could not create share link. Please try again.', status_code=500)

            try:
                share_link = NoteShareLink.objects.create(
                    study_pack=pack,
                    owner=request.user,
                    share_code=code,
                    reward_type=SHARE_REWARD_TYPE,
                )
                is_new = True
            except IntegrityError:
                share_link = NoteShareLink.objects.get(
                    study_pack=pack, owner=request.user
                )
                is_new = False

        share_url = _build_share_url(share_link.share_code, request)
        share_message = _generate_share_message(pack, is_creator, share_url)

        return Response({
            'share_code': share_link.share_code,
            'share_url': share_url,
            'is_new': is_new,
            'is_creator': is_creator,
            'share_message': share_message,
        }, status=201 if is_new else 200)


class ShareMetaView(APIView):
    """GET /api/scrib/share/<share_code>/

    Public endpoint — returns share link metadata for the landing page.
    Also records click analytics when called.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, share_code):
        share_link = NoteShareLink.objects.select_related(
            'study_pack', 'owner'
        ).filter(share_code=share_code, is_active=True).first()

        if not share_link:
            return error_response('Share link not found', status_code=404, code='not_found')

        pack = share_link.study_pack
        if pack.status != StudyPack.STATUS_READY:
            return error_response('Notes are not ready yet', status_code=404, code='not_ready')

        # ── Analytics: record click (‘clicked_at’) for authenticated users  ────────────────
        # We only track clicks from authenticated users who haven’t purchased yet,
        # because anonymous visitors haven’t been identified.
        if request.user and request.user.is_authenticated:
            device_info = _parse_device_info(request)
            referrer = request.META.get('HTTP_REFERER', '')[:500]
            # Create a click-tracking stub if it doesn't exist yet.
            # This lets us compute conversion_time when the purchase completes.
            # If a stub already exists (e.g., user revisited the page), only set
            # clicked_at on the first visit.
            stub, created = SharedPackPurchase.objects.get_or_create(
                share_link=share_link,
                buyer=request.user,
                defaults=dict(
                    amount_paise=0,
                    reward_amount=0,
                    reward_type=SHARE_REWARD_TYPE,
                    clicked_at=timezone.now(),
                    referrer=referrer,
                    **device_info,
                ),
            )
            if not created and stub.clicked_at is None:
                # First time we can record a click for this (link, buyer) pair
                SharedPackPurchase.objects.filter(pk=stub.pk).update(
                    clicked_at=timezone.now(),
                    referrer=referrer,
                    **device_info,
                )

        # ── Build topics_per_page (≤2 topics per page) ───────────────────────────────
        topics_per_page = _get_topics_per_page(pack.topics_json)

        # ── Price & reward from constants (never from DB/frontend) ──────────────────
        total_pages = pack.total_pages or 1
        price_per_page = str(SHARE_PRICE_PER_PAGE)
        total_price = str(SHARE_PRICE_PER_PAGE * total_pages)
        reward_per_page = str(SHARE_REWARD_PER_PAGE)

        # ── preview_token — short-lived signed JWT hiding internal pack_id ─────────
        import hmac, hashlib, base64, time, json
        secret = settings.SECRET_KEY.encode('utf-8')
        payload = json.dumps({'pack_id': pack.id, 'exp': int(time.time()) + PREVIEW_TOKEN_TTL_SECONDS})
        payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
        sig = hmac.new(secret, payload_b64.encode(), hashlib.sha256).hexdigest()[:32]
        preview_token = f'{payload_b64}.{sig}'

        # ── User-specific flags ──────────────────────────────────────────────────
        already_purchased = False
        is_own_link = False
        pdf_url = None
        if request.user and request.user.is_authenticated:
            is_own_link = (share_link.owner_id == request.user.id)
            already_purchased = (
                pack.user_id == request.user.id  # original owner
                or SharedPackPurchase.objects.filter(
                    share_link__study_pack=pack, buyer=request.user, amount_paise__gt=0
                ).exists()
            )
            if already_purchased or is_own_link:
                pdf_url = _get_pack_presigned_url(pack)

        return Response({
            'title': pack.title,
            'pack_id': pack.id,
            'total_pages': total_pages,
            'price_per_page': price_per_page,
            'total_price': total_price,
            'reward_per_page': reward_per_page,
            'reward_type': SHARE_REWARD_TYPE,
            'topics_per_page': topics_per_page,
            'preview_token': preview_token,
            'already_purchased': already_purchased,
            'is_own_link': is_own_link,
            'pdf_url': pdf_url,
        })



class SharePreviewView(APIView):
    """GET /api/scrib/share/preview/<preview_token>/

    Validates the preview token and securely extracts/returns ONLY the first
    page of the StudyPack PDF using PyPDF2.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, preview_token):
        import hmac, hashlib, base64, time, json, uuid
        try:
            payload_b64, sig = preview_token.rsplit('.', 1)
            secret = settings.SECRET_KEY.encode('utf-8')
            expected_sig = hmac.new(secret, payload_b64.encode(), hashlib.sha256).hexdigest()[:32]
            if not hmac.compare_digest(sig, expected_sig):
                return error_response('Invalid preview token', status_code=403, code='invalid_token')
            payload = json.loads(base64.urlsafe_b64decode(payload_b64 + '==').decode())
            if time.time() > payload.get('exp', 0):
                return error_response('Preview token expired', status_code=403, code='token_expired')
            pack_id = payload['pack_id']
        except Exception:
            return error_response('Invalid preview token', status_code=403, code='invalid_token')

        pack = StudyPack.objects.filter(pk=pack_id, status=StudyPack.STATUS_READY).first()
        if not pack:
            return error_response('Notes not found', status_code=404, code='not_found')
        if not pack.s3_key:
            return error_response('PDF not available', status_code=404, code='not_found')

        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
        access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')
        if not bucket or not access_key or not secret_key:
            return error_response('Storage not configured', status_code=503, code='storage_unavailable')

        s3 = boto3.client('s3', aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region)

        # Extract first page if not already done
        if not pack.s3_preview_key:
            try:
                import io
                from PyPDF2 import PdfReader, PdfWriter
                
                # 1. Download original PDF to memory
                original_obj = s3.get_object(Bucket=bucket, Key=pack.s3_key)
                original_bytes = original_obj['Body'].read()
                
                # 2. Extract first page
                reader = PdfReader(io.BytesIO(original_bytes))
                writer = PdfWriter()
                if len(reader.pages) > 0:
                    writer.add_page(reader.pages[0])
                
                output = io.BytesIO()
                writer.write(output)
                output.seek(0)
                
                # 3. Upload 1-page preview to S3
                preview_key = f'previews/pack_{pack.id}_{uuid.uuid4().hex[:8]}.pdf'
                s3.upload_fileobj(
                    output, 
                    bucket, 
                    preview_key,
                    ExtraArgs={'ContentType': 'application/pdf', 'ContentDisposition': 'inline'}
                )
                
                # 4. Save key to DB
                pack.s3_preview_key = preview_key
                pack.save(update_fields=['s3_preview_key'])
            except Exception as exc:
                logger.error('[share-preview] Extraction failed pack=%s: %s', pack.id, exc)
                return error_response('Could not generate secure preview', status_code=503, code='storage_error')

        # Return presigned URL to the secure 1-page preview
        try:
            fresh_url = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket, 
                    'Key': pack.s3_preview_key,
                    'ResponseContentDisposition': 'inline',
                    'ResponseContentType': 'application/pdf',
                },
                ExpiresIn=600,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error('[share-preview] presign failed pack=%s: %s', pack_id, exc)
            return error_response('Could not fetch preview', status_code=503, code='storage_unavailable')

        if request.GET.get('json') == 'true' or 'application/json' in request.META.get('HTTP_ACCEPT', ''):
            from rest_framework.response import Response
            return Response({'pdf_url': fresh_url})

        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(fresh_url)


def _get_pack_presigned_url(pack):
    """Generate a presigned S3 URL for the given pack's PDF.
    Returns the URL string or None if unavailable."""
    if not pack.s3_key:
        return pack.pdf_url or None
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
    region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
    access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')
    if not bucket or not access_key or not secret_key:
        return None
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        return s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': pack.s3_key},
            ExpiresIn=3600,
        )
    except (BotoCoreError, ClientError):
        return None


class SharePurchaseOrderView(APIView):
    """POST /api/scrib/share/<share_code>/purchase/

    Creates a Razorpay order for purchasing notes through a share link.
    Validates self-purchase and duplicate purchase before creating the order.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, share_code):
        share_link = NoteShareLink.objects.select_related('study_pack').filter(
            share_code=share_code, is_active=True
        ).first()
        if not share_link:
            return error_response('Share link not found', status_code=404, code='not_found')

        pack = share_link.study_pack
        if pack.status != StudyPack.STATUS_READY:
            return error_response('Notes are not ready yet', status_code=400, code='not_ready')

        # Block self-purchase
        if share_link.owner_id == request.user.id:
            return error_response(
                'You cannot purchase through your own share link',
                status_code=400, code='self_purchase_not_allowed',
            )

        # Block duplicate purchase
        already_owns = (
            pack.user_id == request.user.id
            or SharedPackPurchase.objects.filter(
                share_link__study_pack=pack, buyer=request.user, amount_paise__gt=0
            ).exists()
        )
        if already_owns:
            # Return the PDF URL so the frontend can open the notes directly
            pdf_url = _get_pack_presigned_url(pack)
            return Response({
                'code': 'already_purchased',
                'message': 'You have already purchased these notes',
                'pdf_url': pdf_url,
                'title': pack.title,
                'total_pages': pack.total_pages or 1,
                'pack_id': pack.id,
            }, status=400)

        total_pages = pack.total_pages or 1
        amount_paise = int(SHARE_PRICE_PER_PAGE * total_pages * 100)
        receipt = f'share_{share_link.share_code}_{request.user.id}_{uuid.uuid4().hex[:8]}'

        try:
            order = create_razorpay_order(amount_paise, currency='INR', receipt=receipt)
        except RazorpayError as exc:
            logger.error('[share-purchase] Razorpay order failed share=%s user=%s: %s',
                         share_code, request.user.id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        payment = Payment.objects.create(
            user=request.user,
            razorpay_order_id=order['id'],
            amount=amount_paise,
            currency=order.get('currency', 'INR'),
            credits_added=0,  # no credits added to buyer — this is a share purchase
            status=Payment.STATUS_CREATED,
        )

        logger.info('[share-purchase] Order created order_id=%s share=%s buyer=%s amount=%d',
                    order['id'], share_code, request.user.id, amount_paise)

        return Response({
            'key_id': order.get('key_id') or settings.RAZORPAY_KEY_ID,
            'order_id': order.get('id'),
            'amount': amount_paise,
            'currency': order.get('currency', 'INR'),
            'share_code': share_code,
            'title': pack.title,
            'total_pages': total_pages,
        }, status=201)


class SharePaymentVerifyView(APIView):
    """POST /api/scrib/share/payment-verify/

    Verifies Razorpay payment, grants buyer PDF access, and rewards the sharer.
    All state changes are atomic.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = str(request.data.get('razorpay_order_id', '')).strip()
        payment_id = str(request.data.get('razorpay_payment_id', '')).strip()
        signature = str(request.data.get('razorpay_signature', '')).strip()
        share_code = str(request.data.get('share_code', '')).strip()

        if not all([order_id, payment_id, signature, share_code]):
            return error_response('Missing required payment verification fields')

        share_link = NoteShareLink.objects.select_related(
            'study_pack', 'owner'
        ).filter(share_code=share_code, is_active=True).first()
        if not share_link:
            return error_response('Share link not found', status_code=404, code='not_found')

        payment = Payment.objects.filter(
            razorpay_order_id=order_id, user=request.user
        ).first()
        if not payment:
            return error_response('Order not found', status_code=404, code='not_found')


        # Verify HMAC signature
        try:
            verified = verify_razorpay_signature(order_id, payment_id, signature)
        except RazorpayError as exc:
            logger.error('[share-verify] Signature error order_id=%s: %s', order_id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        if not verified:
            payment.status = Payment.STATUS_FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return error_response('Payment signature verification failed', status_code=400, code='verification_failed')

        pack = share_link.study_pack
        total_pages = pack.total_pages or 1
        reward_amount = SHARE_REWARD_PER_PAGE * total_pages
        amount_paise = payment.amount

        # Capture analytics
        device_info = _parse_device_info(request)
        referrer = request.META.get('HTTP_REFERER', '')[:500]
        now = timezone.now()

        with transaction.atomic():
            # Re-fetch with row lock
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            
            if payment.status != Payment.STATUS_PAID:
                payment.status = Payment.STATUS_PAID
                payment.razorpay_payment_id = payment_id
                payment.razorpay_signature = signature
                payment.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature', 'updated_at'])
            else:
                logger.info('[share-verify] Payment already PAID order_id=%s (likely webhook)', order_id)

            # ALWAYS create/update purchase record (grants buyer PDF access)
            existing_click = SharedPackPurchase.objects.filter(
                share_link=share_link, buyer=request.user
            ).first()
            clicked_at = existing_click.clicked_at if existing_click else None
            conversion_time = (now - clicked_at) if clicked_at else None

            # We need to ensure we don't grant reward twice for the same purchase
            is_already_granted = existing_click and getattr(existing_click, 'amount_paise', 0) > 0
            
            purchase, created = SharedPackPurchase.objects.get_or_create(
                share_link=share_link,
                buyer=request.user,
                defaults=dict(
                    payment=payment,
                    amount_paise=amount_paise,
                    reward_amount=reward_amount,
                    reward_type=SHARE_REWARD_TYPE,
                    clicked_at=clicked_at,
                    purchased_at=now,
                    conversion_time=conversion_time,
                    referrer=referrer,
                    **device_info,
                )
            )
            
            if not created and not is_already_granted:
                # Update analytics on existing stub
                purchase.payment = payment
                purchase.amount_paise = amount_paise
                purchase.reward_amount = reward_amount
                purchase.purchased_at = now
                purchase.conversion_time = conversion_time
                purchase.referrer = referrer
                for k, v in device_info.items():
                    setattr(purchase, k, v)
                purchase.save()

            if created or not is_already_granted:
                # Reward the sharer with credits
                CreditTransaction.objects.create(
                    user=share_link.owner,
                    direction=CreditTransaction.DIRECTION_CREDIT,
                    credits=reward_amount,  # stored as decimal credits
                    payment=payment,
                    reason=CreditTransaction.REASON_REFERRAL,
                )

                # Update share link aggregate stats
                NoteShareLink.objects.filter(pk=share_link.pk).update(
                    purchase_count=models.F('purchase_count') + 1,
                    reward_amount=models.F('reward_amount') + reward_amount,
                )

                logger.info(
                    '[share-verify] Purchase complete share=%s buyer=%s sharer=%s reward=%s',
                    share_code, request.user.id, share_link.owner_id, reward_amount,
                )
                should_send_reward_email = True
            else:
                should_send_reward_email = False

        if should_send_reward_email:
            try:
                from authentication.views import send_email_via_ses
                import threading
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                
                credits_str = str(reward_amount).rstrip('0').rstrip('.') if '.' in str(reward_amount) else str(reward_amount)
                
                html_content = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2>🎉 You earned {credits_str} credits from your shared notes!</h2>
                  <p>Hi {share_link.owner.full_name or 'there'},</p>
                  <p>Great news! 🎉</p>
                  <p>Someone just purchased your shared notes:</p>
                  <p style="font-size: 18px; font-weight: bold; color: #1f3a5f; margin: 15px 0;">
                    "{pack.title}"
                  </p>
                  <p>🪙 You've earned <strong>{credits_str} credits</strong>!</p>
                  <p>Every successful purchase through your share link earns you more credits, which you can use to generate even more AI handwritten notes.</p>
                  <p>Keep sharing your notes with friends and continue earning credits with every successful purchase.</p>
                  <br>
                  <a href="{frontend_url}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #1f3a5f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    👉 Share More Notes
                  </a>
                  <br><br>
                  <p>Thank you for helping fellow students learn smarter.</p>
                  <p>— Team Scrib</p>
                </div>
                """
                
                def _send():
                    try:
                        send_email_via_ses(
                            to_email=share_link.owner.email,
                            subject=f"🎉 You earned {credits_str} credits from your shared notes!",
                            html_content=html_content
                        )
                    except Exception as e:
                        logger.error(f"Failed to send reward email to {share_link.owner.email}: {e}")
                        
                threading.Thread(target=_send, daemon=True).start()
            except Exception as e:
                logger.error(f"Error setting up reward email thread: {e}")

        # Generate presigned URL so frontend can navigate directly to viewer
        # without a second API call (the token may expire during payment flow).
        pdf_url = _get_pack_presigned_url(pack)

        return Response({
            'success': True,
            'share_code': share_code,
            'pack_id': pack.id,       # returned so buyer can create their own share link
            'title': pack.title,
            'total_pages': total_pages,
            'pdf_url': pdf_url,
            'reward_granted': str(reward_amount),
            'reward_type': SHARE_REWARD_TYPE,
        })


class SharingStatsView(APIView):
    """GET /api/scrib/share/stats/

    Returns the authenticated user’s Creator Dashboard stats for the
    ‘Earn While Learning’ section on the dashboard.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum as DjSum, Count as DjCount
        links = NoteShareLink.objects.filter(owner=request.user, is_active=True)
        aggregates = links.aggregate(
            notes_shared=DjCount('id'),
            successful_purchases=DjSum('purchase_count'),
            rewards_earned=DjSum('reward_amount'),
        )
        return Response({
            'notes_shared': aggregates['notes_shared'] or 0,
            'successful_purchases': aggregates['successful_purchases'] or 0,
            'rewards_earned': str(aggregates['rewards_earned'] or 0),
            'reward_type': SHARE_REWARD_TYPE,
        })


class SharePackPdfView(APIView):
    """GET /api/scrib/share/<share_code>/pdf/

    Authenticated endpoint that resolves a share code to a presigned S3 URL.
    Grants access to the original pack owner OR any verified buyer
    (SharedPackPurchase with amount_paise > 0, excluding click-tracking stubs).
    PDFViewerPage calls this after a buyer purchases via a share link.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, share_code):
        share_link = NoteShareLink.objects.select_related('study_pack').filter(
            share_code=share_code, is_active=True
        ).first()
        if not share_link:
            return error_response('Share link not found', status_code=404, code='not_found')

        pack = share_link.study_pack
        if pack.status != StudyPack.STATUS_READY:
            return error_response('Notes are not ready yet', status_code=404, code='not_ready')

        # Access control: owner OR verified buyer (not a click stub)
        is_owner = (pack.user_id == request.user.id)
        is_buyer = SharedPackPurchase.objects.filter(
            share_link=share_link,
            buyer=request.user,
            amount_paise__gt=0,
        ).exists()

        if not is_owner and not is_buyer:
            return error_response(
                'You have not purchased these notes',
                status_code=403, code='purchase_required',
            )

        if not pack.s3_key:
            if pack.pdf_url:
                from django.http import HttpResponseRedirect
                return HttpResponseRedirect(pack.pdf_url)
            return error_response('PDF not available', status_code=404, code='not_found')

        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')
        access_key = getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', '')

        if not bucket or not access_key or not secret_key:
            return error_response('Storage not configured', status_code=503, code='storage_unavailable')

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            presigned_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': pack.s3_key},
                ExpiresIn=3600,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error('[share-pdf] presign failed share=%s: %s', share_code, exc)
            return error_response('Could not load PDF', status_code=503, code='storage_unavailable')

        return Response({
            'pdf_url': presigned_url,
            'title': pack.title,
            'total_pages': pack.total_pages,
        })
