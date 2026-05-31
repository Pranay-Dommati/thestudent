import json
import logging
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Case, F, IntegerField, Sum, When
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# pyrefly: ignore [missing-import]
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction
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
    'starter': {'credits': 10, 'amount_paise': 5900},   # ₹59
    'popular': {'credits': 20, 'amount_paise': 9900},   # ₹99
    'pro':     {'credits': 40, 'amount_paise': 19900},  # ₹199
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
    
    return int(credits_in - credits_out)


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
    groups = []
    page_number = 1
    for i in range(0, len(topics), 3):
        chunk = topics[i:i + 3]
        title = chunk[0][:40] if chunk else f"Page {page_number}"
        groups.append({
            'page_number': page_number,
            'title': title or f"Page {page_number}",
            'topics': chunk,
        })
        page_number += 1
    return groups


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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrganizeTopicsRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response('Invalid request', details=serializer.errors)

        topics = [str(item).strip() for item in serializer.validated_data['topics'] if str(item).strip()]
        if not topics:
            return error_response('Provide at least one topic')

        key_preview = (settings.GEMINI_API_KEY or '')
        if not key_preview:
            print("[scrib] GEMINI_API_KEY missing in settings")
        else:
            print(f"[scrib] GEMINI_API_KEY loaded (len={len(key_preview)})")
        # Debug log can be removed later if needed

        prompt = (
            "You are an expert academic curriculum organizer. Your task is to accurately cluster a list of study topics into handwritten note pages.\n\n"
            "CRITICAL CONSTRAINT:\n"
            "ONLY cluster topics if they belong to the exact same subject and are conceptually contiguous (e.g., 'Binary Search Trees' and 'Graph Theory' can be grouped under Data Structures; 'Cell Division' and 'Genetics' under Biology).\n"
            "DO NOT group fundamentally different subjects (e.g., 'English Grammar' and 'Data Structures', or 'History' and 'Mathematics'). If topics are unrelated, they MUST be put on separate pages, even if that results in 1 topic per page.\n\n"
            "RULES:\n"
            "1. Every topic provided must appear exactly once.\n"
            "2. Do not omit any topic, and do not make up or invent new topics.\n"
            "3. Each page can contain between 1 and 4 topics MAXIMUM.\n"
            "4. Never hallucinate connections to save space. Unrelated concepts mean separate pages.\n"
            "5. Produce a short, accurate page title (1 to 5 words) that summarizes the page's exact contents.\n\n"
            "RETURN FORMAT:\n"
            "Return ONLY a clean, parseable JSON object. Do not include markdown code block syntax (like ```json), explanations, or extra text.\n\n"
            "{\n"
            "  \"groups\": [\n"
            "    {\n"
            "      \"page_number\": 1,\n"
            "      \"title\": \"Foundations\",\n"
            "      \"topics\": [\n"
            "        \"Cloud Computing\",\n"
            "        \"Virtualization\"\n"
            "      ]\n"
            "    }\n"
            "  ],\n"
            "  \"total_pages\": 1,\n"
            "  \"credit_savings\": {\n"
            "    \"original_topics\": 2,\n"
            "    \"optimized_pages\": 1,\n"
            "    \"credits_saved\": 1\n"
            "  }\n"
            "}\n\n"
            f"TOPICS:\n{json.dumps(topics, ensure_ascii=True)}\n"
        )

        try:
            response_text = call_scrib_vertex_ai(prompt)
            
            # Clean up the markdown if present
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
                
            parsed = json.loads(response_text)
        except Exception as exc:
            groups = _build_groups_fallback(topics)
            groups = _split_groups_by_domain(groups, topics)
            return Response({
                'groups': groups,
                'total_pages': len(groups),
                'credit_savings': {
                    'original_topics': len(topics),
                    'optimized_pages': len(groups),
                    'credits_saved': max(len(topics) - len(groups), 0),
                },
                'source': 'fallback',
                'message': str(exc),
            })

        groups = parsed.get('groups') if isinstance(parsed, dict) else None
        if not isinstance(groups, list) or not groups:
            groups = _build_groups_fallback(topics)
        groups = _split_groups_by_domain(groups, topics)

        total_pages = len(groups)

        credit_savings = parsed.get('credit_savings') if isinstance(parsed, dict) else None
        credit_savings = {
            'original_topics': len(topics),
            'optimized_pages': total_pages,
            'credits_saved': max(len(topics) - total_pages, 0),
        }

        for group in groups:
            print(f"[scrib] group page {group.get('page_number')}: {group.get('title')} -> {group.get('topics')}")

        return Response({
            'groups': groups,
            'total_pages': total_pages,
            'credit_savings': credit_savings,
            'source': 'vertex_ai',
        })

class ParseSyllabusView(APIView):
    permission_classes = [AllowAny]

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
        
        try:
            logger.info("[SCRIB API] /parse-syllabus/ called - sending to Vertex AI...")
            response_text = call_scrib_vertex_ai(prompt)
            
            # Clean up the markdown if present
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            parsed = json.loads(response_text)
            logger.info(f"[SCRIB API] SUCCESS - Vertex AI parsed {len(parsed)} topics. NO FALLBACK USED.")
            return Response(parsed)
        except Exception as e:
            logger.error(f"[SCRIB API] FAILED - Vertex AI error: {str(e)}")
            return error_response(f"Failed to parse syllabus: {str(e)}", status_code=500)

class ModerateTopicsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topics = request.data.get('topics')
        if not topics or not isinstance(topics, list):
            return error_response('List of topics is required', status_code=400)
            
        prompt = (
            f"You are a strict content moderator for an educational app. Evaluate the following list of study topics. "
            f"Return a JSON array of booleans corresponding to each topic. True means it is a valid, acceptable educational or general topic. "
            f"False means it is highly inappropriate, sexually explicit, pornographic, or hate speech. Return ONLY the JSON array.\n\n"
            f"Topics:\n{json.dumps(topics)}"
        )
        
        try:
            response_text = call_scrib_vertex_ai(prompt)
            
            # Clean up the markdown if present
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
                
            return Response({'moderation': json.loads(response_text)})
        except Exception as e:
            # Fallback: assume valid if AI fails, but log it
            logger.error(f"Moderation failed: {e}")
            return Response({'moderation': [True] * len(topics)})



def parse_topics_from_request(data):
    topics = data.get('topics') or []
    pages = data.get('pages') or []

    if pages:
        parsed_pages = []
        for entry in pages:
            if isinstance(entry, (list, tuple)):
                page_topics = [str(item).strip() for item in entry if str(item).strip()]
            else:
                page_topics = [str(entry).strip()] if str(entry).strip() else []
            if page_topics:
                parsed_pages.append(page_topics)
        return parsed_pages

    if isinstance(topics, (list, tuple)) and topics:
        return [[str(item).strip()] for item in topics if str(item).strip()]

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
                
        # --- Phase 3: Trigger Background Task ---
        generate_study_pack_task.delay(pack.id, pages, title, request.user.id)
        
        # Invalidate history cache
        from django.core.cache import cache
        cache.delete(f'scrib_my_study_packs_api_{request.user.id}')

        # If Celery is running synchronously (ALWAYS_EAGER), the task can take 30+ seconds,
        # which might cause the MySQL connection to time out. Close it so Django reconnects.
        from django.db import connection
        connection.close()

        response_data = StudyPackSerializer(pack).data
        response_data['credit_balance'] = get_credit_balance(user)
        # Return 202 Accepted because processing is in background
        return Response(response_data, status=202)


from django.utils import timezone
from datetime import timedelta
from django.db import transaction

def cleanup_stuck_packs(user):
    """
    Find packs that are stuck in PENDING or GENERATING for more than 5 minutes
    due to a server crash, mark them as FAILED, and refund the credits.
    """
    cutoff = timezone.now() - timedelta(minutes=5)
    stuck_packs = StudyPack.objects.filter(
        user=user,
        status__in=[StudyPack.STATUS_PENDING, StudyPack.STATUS_GENERATING],
        created_at__lt=cutoff
    )
    cache_invalidated = False
    for pack in stuck_packs:
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
            return Response({
                'id': pack.id,
                'status': pack.status,
                'pdf_url': pack.pdf_url,
                's3_key': pack.s3_key
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
                ExpiresIn=300,
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
                ExpiresIn=300,  # 5 min — plenty for the browser to start loading
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
        from django.core.cache import cache
        # Clean up any zombie packs before returning history
        cleanup_stuck_packs(request.user)
        
        packs = StudyPack.objects.filter(user=request.user)
        serializer = StudyPackSerializer(packs, many=True)
        return Response(serializer.data)

