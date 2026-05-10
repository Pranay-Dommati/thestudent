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
    ScribMeSerializer,
)
from .services.cache import normalize_prompt, find_cached_note
from .services.image_generation import generate_handwritten_note, ImageGenerationError
from .services.pdf_generation import generate_study_pack_pdf, PdfGenerationError
from .services.payments import create_razorpay_order, verify_razorpay_signature, RazorpayError

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


def get_credit_balance(user):
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
            balance = get_credit_balance(user)
            if balance < required_credits:
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

            note = GeneratedNote.objects.create(
                user=user,
                prompt=topic,
                normalized_prompt=normalized,
                image_url=image_url,
                credits_used=required_credits,
                page_count=1,
                source=source,
            )

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

        with transaction.atomic():
            user = get_user_model().objects.select_for_update().get(pk=request.user.pk)
            balance = get_credit_balance(user)
            if balance < required_credits:
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

            pack = StudyPack.objects.create(
                user=user,
                title=title,
                topics_json=pages,
                pdf_url=pdf_url,
                total_pages=required_credits,
                credits_used=required_credits,
                status=StudyPack.STATUS_READY,
            )

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
