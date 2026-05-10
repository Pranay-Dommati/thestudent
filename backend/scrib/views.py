import json
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Case, F, IntegerField, Sum, When
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction
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
from .services.cache import normalize_prompt, find_cached_note
from .services.image_generation import generate_handwritten_note, ImageGenerationError
from .services.pdf_generation import generate_study_pack_pdf, PdfGenerationError
from .services.payments import create_razorpay_order, verify_razorpay_signature, RazorpayError
from backend.ai.ai_service import call_gemini_flash_api

CREDIT_PACKS = {
    'starter': {'credits': 10, 'amount_paise': 4900},
    'exam': {'credits': 20, 'amount_paise': 9900},
    'study': {'credits': 40, 'amount_paise': 19900},
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
    totals = CreditTransaction.objects.filter(user=user).aggregate(
        total=Sum(
            Case(
                When(direction=CreditTransaction.DIRECTION_CREDIT, then=F('credits')),
                When(direction=CreditTransaction.DIRECTION_DEBIT, then=-F('credits')),
                default=0,
                output_field=IntegerField(),
            )
        )
    )
    return int(totals['total'] or 0)


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
            "You are an expert academic content organizer.\n\n"
            "Your task is to group a list of study topics into handwritten note pages.\n\n"
            "OBJECTIVE:\n"
            "- Minimize the total number of pages.\n"
            "- Combine only topics that are closely related and can fit comfortably on one handwritten page.\n"
            "- Keep unrelated or broad topics separate.\n"
            "- Produce page titles that summarize the grouped topics.\n\n"
            "RULES:\n"
            "1. Every topic must appear exactly once.\n"
            "2. Do not omit any topic.\n"
            "3. Do not invent new topics.\n"
            "4. Each page must contain between 1 and 4 topics.\n"
            "5. Group topics only if they are conceptually related.\n"
            "6. If a topic is broad or important enough to require its own page, keep it alone.\n"
            "7. Create a short page title (2 to 4 words).\n"
            "8. Optimize for clarity first, then for fewer pages.\n\n"
            "RETURN FORMAT:\n"
            "Return ONLY valid JSON. Do not include markdown, explanations, or extra text.\n\n"
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
            response_data = call_gemini_flash_api(prompt)
            response_text = _extract_gemini_text(response_data)
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
            'source': 'gemini',
        })


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


class PreviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = PreviewNote.objects.filter(is_active=True)
        query = request.query_params.get('q', '').strip()
        if query:
            queryset = queryset.filter(title__icontains=query)
        serializer = PreviewNoteSerializer(queryset, many=True)
        return Response(serializer.data)


class PreviewDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        preview = PreviewNote.objects.filter(is_active=True, slug=slug).first()
        if not preview:
            return error_response('Preview not found', status_code=404, code='not_found')
        serializer = PreviewNoteSerializer(preview)
        return Response(serializer.data)


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

        with transaction.atomic():
            user = get_user_model().objects.select_for_update().get(pk=request.user.pk)
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
            else:
                try:
                    generation = generate_handwritten_note(topic)
                    image_url = generation.get('image_url')
                except ImageGenerationError as exc:
                    return error_response(str(exc), status_code=503, code='generation_unavailable')

            if not image_url:
                return error_response('Image generation failed', status_code=502, code='generation_failed')

            image_url = ensure_absolute_url(request, image_url)

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

        with transaction.atomic():
            user = get_user_model().objects.select_for_update().get(pk=request.user.pk)
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

            try:
                pdf_result = generate_study_pack_pdf(pages, title=title)
                pdf_url = pdf_result.get('pdf_url')
            except PdfGenerationError as exc:
                return error_response(str(exc), status_code=503, code='generation_unavailable')

            if not pdf_url:
                return error_response('PDF generation failed', status_code=502, code='generation_failed')

            pdf_url = ensure_absolute_url(request, pdf_url)

            pack = StudyPack.objects.create(
                user=user,
                title=title,
                topics_json=pages,
                pdf_url=pdf_url,
                total_pages=page_count,
                credits_used=credits_used,
                status=StudyPack.STATUS_READY,
            )

            if not is_admin:
                CreditTransaction.objects.create(
                    user=user,
                    direction=CreditTransaction.DIRECTION_DEBIT,
                    credits=required_credits,
                    reason=CreditTransaction.REASON_GENERATION,
                    study_pack=pack,
                )

        response_data = StudyPackSerializer(pack).data
        response_data['credit_balance'] = get_credit_balance(user)
        return Response(response_data, status=201)


class CreateOrderView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pack_id = str(request.data.get('pack_id', '')).strip()
        if pack_id not in CREDIT_PACKS:
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
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        payment = Payment.objects.create(
            user=request.user,
            razorpay_order_id=order['id'],
            amount=amount_paise,
            currency=order.get('currency', 'INR'),
            credits_added=pack['credits'],
            status=Payment.STATUS_CREATED,
        )

        response_data = PaymentSerializer(payment).data
        response_data.update({
            'key_id': order.get('key_id'),
            'order_id': order.get('id'),
            'amount': amount_paise,
            'credits': pack['credits'],
            'pack_id': pack_id,
        })
        return Response(response_data, status=201)


class VerifyPaymentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = str(request.data.get('order_id', '')).strip()
        payment_id = str(request.data.get('payment_id', '')).strip()
        signature = str(request.data.get('signature', '')).strip()

        if not order_id or not payment_id or not signature:
            return error_response('Missing payment verification data')

        payment = Payment.objects.filter(razorpay_order_id=order_id).first()
        if not payment:
            return error_response('Order not found', status_code=404, code='not_found')

        if payment.status == Payment.STATUS_PAID:
            return Response({
                'success': True,
                'message': 'Payment already verified',
                'credit_balance': get_credit_balance(request.user),
            })

        try:
            verified = verify_razorpay_signature(order_id, payment_id, signature)
        except RazorpayError as exc:
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        if not verified:
            payment.status = Payment.STATUS_FAILED
            payment.save(update_fields=['status'])
            return error_response('Payment verification failed', status_code=400, code='verification_failed')

        with transaction.atomic():
            payment.status = Payment.STATUS_PAID
            payment.razorpay_payment_id = payment_id
            payment.razorpay_signature = signature
            payment.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature'])

            CreditTransaction.objects.get_or_create(
                user=payment.user,
                direction=CreditTransaction.DIRECTION_CREDIT,
                credits=payment.credits_added,
                reason=CreditTransaction.REASON_PAYMENT,
                payment=payment,
            )

        return Response({
            'success': True,
            'message': 'Payment verified',
            'credit_balance': get_credit_balance(payment.user),
        })


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


class MyStudyPacksView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        packs = StudyPack.objects.filter(user=request.user)
        serializer = StudyPackSerializer(packs, many=True)
        return Response(serializer.data)
