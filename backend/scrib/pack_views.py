"""Content packs — the paid PDF + quiz bundles behind Interview Prep.

Two audiences share this module:

* the reader endpoints a student hits (list, detail, pdf, quizzes, purchase), and
* the ``admin/`` endpoints the /admin-p panel uses to manage packs, upload PDFs
  to S3 and author quizzes.

Two rules hold throughout. Prices are never taken from the request — they are
read from the database row being purchased. And a user who has not paid never
receives a URL to the full PDF: the free-preview pages are extracted into a
separate S3 object and only that object is ever presigned for them.
"""

import csv
import io
import logging
import random
import uuid

from django.conf import settings
from django.db import transaction
from django.db.models import Count, Max, Q, Sum
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

# pyrefly: ignore [missing-import]
from .models import (
    ContentPack, PackBundle, PackQuiz, PackQuizQuestion,
    PackPurchase, Payment, QuizAttempt, owned_pack_ids,
)
# pyrefly: ignore [missing-import]
from .serializers import (
    ContentPackCardSerializer, PackBundleSerializer, PackQuizCardSerializer,
    PackQuizQuestionSerializer, AdminContentPackSerializer,
    AdminPackQuizSerializer, AdminPackQuizQuestionSerializer,
)
# pyrefly: ignore [missing-import]
from .services.payments import create_razorpay_order, verify_razorpay_signature, RazorpayError
# pyrefly: ignore [missing-import]
from .views import error_response, is_admin_user

logger = logging.getLogger(__name__)

# Browsers stream large PDFs with HTTP Range requests rather than downloading
# them up front, so a URL that expires mid-session breaks pages the reader has
# not scrolled to yet. StudyPack reader URLs already use 7 days for this reason
# (see StudyPackPdfView) — packs follow the same convention.
#
# A short expiry would buy little anyway: owners can download the file outright,
# so the real protection is that non-owners are served a *different* S3 object
# containing only the free pages.
DEFAULT_PDF_URL_EXPIRY_SECONDS = 604800  # 7 days
MAX_PDF_BYTES = 100 * 1024 * 1024


def _pdf_expiry():
    """Read at call time so the value can be tuned from settings."""
    return int(getattr(settings, 'SCRIB_PACK_PDF_URL_EXPIRY_SECONDS', DEFAULT_PDF_URL_EXPIRY_SECONDS))


# ──────────────────────────────────────────────────────────────────────────────
# S3 helpers
# ──────────────────────────────────────────────────────────────────────────────

def _s3_config():
    return (
        getattr(settings, 'AWS_STORAGE_BUCKET_NAME', ''),
        getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1'),
        getattr(settings, 'SCRIB_S3_ACCESS_KEY_ID', ''),
        getattr(settings, 'SCRIB_S3_SECRET_ACCESS_KEY', ''),
    )


def _s3_client():
    """Return (client, bucket) or (None, None) when S3 is not configured."""
    import boto3

    bucket, region, access_key, secret_key = _s3_config()
    if not bucket or not access_key or not secret_key:
        logger.error('[packs] S3 is not configured — set SCRIB_S3_* and AWS_STORAGE_BUCKET_NAME')
        return None, None
    client = boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    return client, bucket


def _presign(key):
    """Presigned GET that renders inline in the browser's PDF viewer."""
    from botocore.exceptions import BotoCoreError, ClientError

    s3, bucket = _s3_client()
    if not s3:
        return None
    try:
        return s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ResponseContentType': 'application/pdf',
                'ResponseContentDisposition': 'inline',
            },
            ExpiresIn=_pdf_expiry(),
        )
    except (BotoCoreError, ClientError) as exc:
        logger.error('[packs] presign failed key=%s: %s', key, exc)
        return None


def _build_free_preview(pack):
    """Extract the first `free_page_count` pages into their own S3 object.

    Done once per uploaded PDF and cached on the row. This is what makes the
    paywall real: the browser is handed a PDF that simply does not contain the
    paid pages, rather than a full PDF the UI politely hides.

    Returns the free-preview S3 key, or '' when it could not be produced.
    """
    from PyPDF2 import PdfReader, PdfWriter

    s3, bucket = _s3_client()
    if not s3 or not pack.s3_key:
        return ''

    try:
        original = s3.get_object(Bucket=bucket, Key=pack.s3_key)['Body'].read()
        reader = PdfReader(io.BytesIO(original))
        writer = PdfWriter()
        for page in reader.pages[: max(pack.free_page_count, 1)]:
            writer.add_page(page)

        buf = io.BytesIO()
        writer.write(buf)
        buf.seek(0)

        free_key = f'interview-packs/free/{pack.slug}_{uuid.uuid4().hex[:8]}.pdf'
        s3.upload_fileobj(
            buf, bucket, free_key,
            ExtraArgs={'ContentType': 'application/pdf', 'ContentDisposition': 'inline'},
        )
    except Exception as exc:
        logger.error('[packs] free-preview extraction failed pack=%s: %s', pack.id, exc)
        return ''

    # Drop the superseded object so old previews can't outlive a re-upload.
    old_key = pack.s3_free_key
    pack.s3_free_key = free_key
    pack.save(update_fields=['s3_free_key', 'updated_at'])
    if old_key and old_key != free_key:
        try:
            s3.delete_object(Bucket=bucket, Key=old_key)
        except Exception:
            logger.warning('[packs] could not delete stale preview %s', old_key)

    return free_key


# ──────────────────────────────────────────────────────────────────────────────
# Reader endpoints
# ──────────────────────────────────────────────────────────────────────────────

class PackListView(APIView):
    """GET /api/scrib/packs/?section=interview

    Every active pack in the section plus the bundle offer. Anonymous users get
    the same catalogue with `owned: false` throughout.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        section = request.query_params.get('section', ContentPack.SECTION_INTERVIEW).strip()

        packs = (
            ContentPack.objects
            .filter(section=section, is_active=True)
            .annotate(
                annotated_quiz_count=Count('quizzes', filter=Q(quizzes__is_active=True), distinct=True),
                annotated_question_count=Count(
                    'quizzes__questions',
                    filter=Q(quizzes__is_active=True),
                    distinct=True,
                ),
            )
        )

        owned_ids = owned_pack_ids(request.user)
        owned_bundle_ids = set(
            PackPurchase.objects
            .filter(user=request.user.id, bundle__isnull=False)
            .values_list('bundle_id', flat=True)
        ) if request.user.is_authenticated else set()

        bundle = PackBundle.objects.filter(section=section, is_active=True).first()

        return Response({
            'section': section,
            'packs': ContentPackCardSerializer(
                packs, many=True, context={'owned_ids': owned_ids}
            ).data,
            'bundle': PackBundleSerializer(
                bundle, context={'owned_bundle_ids': owned_bundle_ids}
            ).data if bundle else None,
        })


class PackDetailView(APIView):
    """GET /api/scrib/packs/<slug>/

    Everything the prep workspace needs for one pack: the pack itself, its
    sibling packs for the sidebar, its quizzes with the user's best scores, and
    a presigned PDF URL scoped to what they've paid for.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, slug):
        pack = ContentPack.objects.filter(slug=slug, is_active=True).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')

        owned_ids = owned_pack_ids(request.user)
        owned = pack.id in owned_ids

        # Sidebar: every pack in the section, so switching subjects never
        # requires a trip back to the Library.
        siblings = (
            ContentPack.objects
            .filter(section=pack.section, is_active=True)
            .annotate(
                annotated_quiz_count=Count('quizzes', filter=Q(quizzes__is_active=True), distinct=True),
                annotated_question_count=Count(
                    'quizzes__questions', filter=Q(quizzes__is_active=True), distinct=True,
                ),
            )
        )

        quizzes = pack.quizzes.filter(is_active=True).annotate(annotated_question_count=Count('questions'))

        best_scores, attempt_counts = {}, {}
        if request.user.is_authenticated:
            rows = (
                QuizAttempt.objects
                .filter(user=request.user, quiz__pack=pack)
                .values('quiz_id')
                .annotate(best=Max('score'), n=Count('id'))
            )
            for row in rows:
                best_scores[row['quiz_id']] = row['best']
                attempt_counts[row['quiz_id']] = row['n']

        bundle = PackBundle.objects.filter(section=pack.section, is_active=True).first()
        owned_bundle_ids = set(
            PackPurchase.objects
            .filter(user=request.user.id, bundle__isnull=False)
            .values_list('bundle_id', flat=True)
        ) if request.user.is_authenticated else set()

        return Response({
            'pack': ContentPackCardSerializer(
                ContentPack.objects.filter(pk=pack.pk).annotate(
                    annotated_quiz_count=Count('quizzes', filter=Q(quizzes__is_active=True), distinct=True),
                    annotated_question_count=Count(
                        'quizzes__questions', filter=Q(quizzes__is_active=True), distinct=True,
                    ),
                ).first(),
                context={'owned_ids': owned_ids},
            ).data,
            'owned': owned,
            'siblings': ContentPackCardSerializer(
                siblings, many=True, context={'owned_ids': owned_ids}
            ).data,
            'quizzes': PackQuizCardSerializer(
                quizzes, many=True,
                context={'best_scores': best_scores, 'attempt_counts': attempt_counts},
            ).data,
            'bundle': PackBundleSerializer(
                bundle, context={'owned_bundle_ids': owned_bundle_ids}
            ).data if bundle else None,
        })


class PackPdfView(APIView):
    """GET /api/scrib/packs/<slug>/pdf/

    Owners get the full PDF; everyone else gets the extracted free-preview file.
    The response says which one it is so the reader can show the right paywall.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, slug):
        pack = ContentPack.objects.filter(slug=slug, is_active=True).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')
        if not pack.s3_key:
            return error_response('This pack has no PDF yet', status_code=404, code='no_pdf')

        owned = pack.id in owned_pack_ids(request.user)

        if owned:
            key = pack.s3_key
        else:
            key = pack.s3_free_key or _build_free_preview(pack)
            if not key:
                return error_response(
                    'Preview is not available right now',
                    status_code=503, code='storage_error',
                )

        url = _presign(key)
        if not url:
            return error_response(
                'Could not fetch the PDF', status_code=503, code='storage_unavailable',
            )

        return Response({
            'pdf_url': url,
            'owned': owned,
            'total_pages': pack.page_count,
            'free_pages': pack.free_page_count,
            'accessible_pages': pack.page_count if owned else min(pack.free_page_count, pack.page_count),
            'expires_in': _pdf_expiry(),
        })


class PackQuizQuestionsView(APIView):
    """GET /api/scrib/packs/quizzes/<quiz_id>/ — questions, owners only.

    Answers are withheld; grading happens on submit.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = PackQuiz.objects.filter(pk=quiz_id, is_active=True).select_related('pack').first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')

        if quiz.pack_id not in owned_pack_ids(request.user):
            return error_response(
                'Unlock this pack to take its quizzes', status_code=403, code='locked',
            )

        questions = quiz.questions.all()
        return Response({
            'quiz': {
                'id': quiz.id,
                'number': quiz.number,
                'title': quiz.display_title(),
                'topic': quiz.topic,
                'pack_slug': quiz.pack.slug,
                'pack_title': quiz.pack.title,
            },
            'questions': PackQuizQuestionSerializer(questions, many=True).data,
        })


class PackQuizSubmitView(APIView):
    """POST /api/scrib/packs/quizzes/<quiz_id>/submit/  {answers: {question_id: index}}

    Grades server-side and returns the per-question breakdown — the only place
    correct answers and explanations are ever disclosed.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = PackQuiz.objects.filter(pk=quiz_id, is_active=True).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')

        if quiz.pack_id not in owned_pack_ids(request.user):
            return error_response(
                'Unlock this pack to take its quizzes', status_code=403, code='locked',
            )

        submitted = request.data.get('answers') or {}
        if not isinstance(submitted, dict):
            return error_response('answers must be an object of {question_id: option_index}')

        questions = list(quiz.questions.all())
        if not questions:
            return error_response('This quiz has no questions yet', status_code=409, code='empty_quiz')

        score = 0
        breakdown = []
        for q in questions:
            raw = submitted.get(str(q.id), submitted.get(q.id))
            try:
                chosen = int(raw)
            except (TypeError, ValueError):
                chosen = None
            correct = chosen is not None and chosen == q.correct_index
            if correct:
                score += 1
            breakdown.append({
                'question_id': q.id,
                'chosen_index': chosen,
                'correct_index': q.correct_index,
                'correct': correct,
                'explanation': q.explanation,
            })

        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=score,
            total=len(questions),
            answers={str(k): v for k, v in submitted.items()},
        )

        best = (
            QuizAttempt.objects.filter(user=request.user, quiz=quiz)
            .aggregate(best=Max('score'))['best'] or score
        )

        return Response({
            'attempt_id': attempt.id,
            'score': score,
            'total': len(questions),
            'best_score': best,
            'results': breakdown,
        }, status=201)


# ──────────────────────────────────────────────────────────────────────────────
# Purchase
# ──────────────────────────────────────────────────────────────────────────────

class PackPurchaseOrderView(APIView):
    """POST /api/scrib/packs/purchase/  {pack: <slug>} or {bundle: <slug>}

    The price comes from the row, never from the request body.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pack_slug = str(request.data.get('pack', '') or '').strip()
        bundle_slug = str(request.data.get('bundle', '') or '').strip()

        if bool(pack_slug) == bool(bundle_slug):
            return error_response('Send exactly one of pack or bundle')

        pack = bundle = None
        if pack_slug:
            pack = ContentPack.objects.filter(slug=pack_slug, is_active=True).first()
            if not pack:
                return error_response('Pack not found', status_code=404, code='not_found')
            if pack.id in owned_pack_ids(request.user):
                return error_response('You already own this pack', status_code=409, code='already_owned')
            amount_paise, label = pack.price_paise, pack.title
        else:
            bundle = PackBundle.objects.filter(slug=bundle_slug, is_active=True).first()
            if not bundle:
                return error_response('Bundle not found', status_code=404, code='not_found')
            if PackPurchase.objects.filter(user=request.user, bundle=bundle).exists():
                return error_response('You already own this bundle', status_code=409, code='already_owned')
            amount_paise, label = bundle.price_paise, bundle.name

        if amount_paise <= 0:
            return error_response('This item is not purchasable', status_code=409, code='not_purchasable')

        receipt = f'pack_{request.user.id}_{uuid.uuid4().hex[:10]}'
        try:
            order = create_razorpay_order(amount_paise, currency='INR', receipt=receipt)
        except RazorpayError as exc:
            logger.error('[packs] Razorpay order failed user=%s: %s', request.user.id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        # credits_added stays 0 — a pack purchase grants access, not credits.
        Payment.objects.create(
            user=request.user,
            razorpay_order_id=order['id'],
            amount=amount_paise,
            currency=order.get('currency', 'INR'),
            credits_added=0,
            status=Payment.STATUS_CREATED,
        )

        logger.info(
            '[packs] order created order_id=%s user=%s item=%s amount=%d',
            order['id'], request.user.id, pack_slug or bundle_slug, amount_paise,
        )

        return Response({
            'key_id': order.get('key_id') or settings.RAZORPAY_KEY_ID,
            'order_id': order.get('id'),
            'amount': amount_paise,
            'currency': order.get('currency', 'INR'),
            'item': label,
            'pack': pack_slug or None,
            'bundle': bundle_slug or None,
        }, status=201)


class PackPurchaseVerifyView(APIView):
    """POST /api/scrib/packs/purchase/verify/

    Verifies the Razorpay signature, then grants the entitlement. Idempotent:
    replaying the same verification returns success without double-granting.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = str(request.data.get('razorpay_order_id') or request.data.get('order_id', '')).strip()
        payment_id = str(request.data.get('razorpay_payment_id') or request.data.get('payment_id', '')).strip()
        signature = str(request.data.get('razorpay_signature') or request.data.get('signature', '')).strip()
        pack_slug = str(request.data.get('pack', '') or '').strip()
        bundle_slug = str(request.data.get('bundle', '') or '').strip()

        if not order_id or not payment_id or not signature:
            return error_response('Missing payment verification data')
        if bool(pack_slug) == bool(bundle_slug):
            return error_response('Send exactly one of pack or bundle')

        payment = Payment.objects.filter(razorpay_order_id=order_id, user=request.user).first()
        if not payment:
            return error_response('Order not found', status_code=404, code='not_found')

        pack = bundle = None
        if pack_slug:
            pack = ContentPack.objects.filter(slug=pack_slug, is_active=True).first()
            if not pack:
                return error_response('Pack not found', status_code=404, code='not_found')
            expected = pack.price_paise
        else:
            bundle = PackBundle.objects.filter(slug=bundle_slug, is_active=True).first()
            if not bundle:
                return error_response('Bundle not found', status_code=404, code='not_found')
            expected = bundle.price_paise

        # The order must be the one that was created for this item, so a cheap
        # order can't be replayed to unlock an expensive pack.
        if payment.amount != expected:
            logger.warning(
                '[packs] amount mismatch order=%s paid=%s expected=%s',
                order_id, payment.amount, expected,
            )
            return error_response('Payment does not match this item', status_code=400, code='amount_mismatch')

        try:
            verified = verify_razorpay_signature(order_id, payment_id, signature)
        except RazorpayError as exc:
            logger.error('[packs] signature check errored order=%s: %s', order_id, exc)
            return error_response(str(exc), status_code=503, code='payments_unavailable')

        if not verified:
            payment.status = Payment.STATUS_FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return error_response(
                'Payment signature verification failed', status_code=400, code='verification_failed',
            )

        with transaction.atomic():
            locked = Payment.objects.select_for_update().get(pk=payment.pk)
            if locked.status != Payment.STATUS_PAID:
                locked.status = Payment.STATUS_PAID
                locked.razorpay_payment_id = payment_id
                locked.razorpay_signature = signature
                locked.save(update_fields=[
                    'status', 'razorpay_payment_id', 'razorpay_signature', 'updated_at',
                ])

            purchase, created = PackPurchase.objects.get_or_create(
                user=request.user,
                pack=pack,
                bundle=bundle,
                defaults={'payment': locked, 'amount_paise': expected},
            )

        logger.info(
            '[packs] purchase %s user=%s item=%s',
            'granted' if created else 'already present', request.user.id, pack_slug or bundle_slug,
        )

        return Response({
            'success': True,
            'purchase_id': purchase.id,
            'pack': pack.slug if pack else None,
            'bundle': bundle.slug if bundle else None,
            'unlocked_pack_ids': sorted(owned_pack_ids(request.user)),
        })


class MyPacksView(APIView):
    """GET /api/scrib/packs/mine/ — everything this user has unlocked."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = owned_pack_ids(request.user)
        packs = ContentPack.objects.filter(id__in=ids).annotate(
            annotated_quiz_count=Count('quizzes', filter=Q(quizzes__is_active=True), distinct=True),
            annotated_question_count=Count('quizzes__questions', filter=Q(quizzes__is_active=True), distinct=True),
        )
        return Response({
            'packs': ContentPackCardSerializer(
                packs, many=True, context={'owned_ids': ids}
            ).data,
        })


# ──────────────────────────────────────────────────────────────────────────────
# Admin endpoints (/admin-p → Interview Prep)
# ──────────────────────────────────────────────────────────────────────────────

class _AdminView(APIView):
    """Shared guard: authenticated staff only."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not is_admin_user(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Admin access required')


def _annotated_packs(qs):
    return qs.annotate(
        annotated_quiz_count=Count('quizzes', distinct=True),
        annotated_question_count=Count('quizzes__questions', distinct=True),
    )


class AdminPackListView(_AdminView):
    """GET  /api/scrib/admin/packs/   — every pack, active or not
    POST /api/scrib/admin/packs/   — create one
    """

    def get(self, request):
        section = request.query_params.get('section', '').strip()
        qs = ContentPack.objects.all()
        if section:
            qs = qs.filter(section=section)
        return Response({
            'results': AdminContentPackSerializer(_annotated_packs(qs), many=True).data,
            'count': qs.count(),
        })

    def post(self, request):
        serializer = AdminContentPackSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                'Check the highlighted fields', code='validation_error', details=serializer.errors,
            )
        pack = serializer.save()
        return Response(
            AdminContentPackSerializer(_annotated_packs(
                ContentPack.objects.filter(pk=pack.pk)
            ).first()).data,
            status=201,
        )


def _avg_score_pct(attempts_qs):
    """Mean of each attempt's own percentage, not sum(score)/sum(total).

    Averaging percentages first means a 3-question quiz and a 25-question quiz
    each count once, rather than the 25-question quiz dominating the figure.
    """
    values = [a.score / a.total * 100 for a in attempts_qs.only('score', 'total') if a.total]
    return round(sum(values) / len(values), 1) if values else None


class AdminPackAnalyticsView(_AdminView):
    """GET /api/scrib/admin/packs/analytics/?section=interview

    A basic product overview — revenue, buyers, purchase mix, quiz engagement,
    and average scores, plus the same numbers broken down per pack so you can
    see which subjects are selling and which are actually being used.

    Deliberately not per-question difficulty analysis. That's a distinct,
    more invasive kind of report (it points at individual questions rather
    than the product as a whole) and wasn't asked for — see the CSV importer's
    docstring for the same "don't build what wasn't asked for" reasoning
    applied to influencer payouts.
    """

    def get(self, request):
        section = request.query_params.get('section', ContentPack.SECTION_INTERVIEW).strip()

        packs_qs = ContentPack.objects.filter(section=section)

        pack_purchases = PackPurchase.objects.filter(pack__section=section)
        bundle_purchases = PackPurchase.objects.filter(bundle__section=section)
        revenue_paise = (
            (pack_purchases.aggregate(s=Sum('amount_paise'))['s'] or 0)
            + (bundle_purchases.aggregate(s=Sum('amount_paise'))['s'] or 0)
        )
        buyers = set(pack_purchases.values_list('user_id', flat=True)) | set(
            bundle_purchases.values_list('user_id', flat=True)
        )

        attempts_qs = QuizAttempt.objects.filter(quiz__pack__section=section)

        overview = {
            'packs_live': packs_qs.filter(is_active=True).count(),
            'packs_total': packs_qs.count(),
            'revenue_paise': revenue_paise,
            'buyers': len(buyers),
            'pack_purchases': pack_purchases.count(),
            'bundle_purchases': bundle_purchases.count(),
            'quiz_attempts': attempts_qs.count(),
            'avg_score_pct': _avg_score_pct(attempts_qs),
        }

        per_pack = []
        for pack in packs_qs.order_by('sort_order', 'title'):
            # Direct purchases only — a pack unlocked via the bundle isn't a
            # per-pack "sale" on its own, so it's counted in the bundle total
            # above rather than attributed to any one pack here.
            pack_attempts = attempts_qs.filter(quiz__pack=pack)
            per_pack.append({
                'id': pack.id,
                'title': pack.title,
                'category': pack.category,
                'is_active': pack.is_active,
                'purchases': pack.purchases.count(),
                'revenue_paise': pack.purchases.aggregate(s=Sum('amount_paise'))['s'] or 0,
                'quiz_attempts': pack_attempts.count(),
                'avg_score_pct': _avg_score_pct(pack_attempts),
            })

        return Response({'overview': overview, 'packs': per_pack})


class AdminPackDetailView(_AdminView):
    """GET / PATCH / DELETE /api/scrib/admin/packs/<pk>/"""

    def get(self, request, pk):
        pack = _annotated_packs(ContentPack.objects.filter(pk=pk)).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')
        quizzes = pack.quizzes.annotate(annotated_question_count=Count('questions')).order_by('number')
        return Response({
            'pack': AdminContentPackSerializer(pack).data,
            'quizzes': AdminPackQuizSerializer(quizzes, many=True).data,
        })

    def patch(self, request, pk):
        pack = ContentPack.objects.filter(pk=pk).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')

        previous_free = pack.free_page_count
        serializer = AdminContentPackSerializer(pack, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                'Check the highlighted fields', code='validation_error', details=serializer.errors,
            )
        pack = serializer.save()

        # Changing how many pages are free invalidates the extracted preview.
        if pack.free_page_count != previous_free and pack.s3_key:
            _build_free_preview(pack)

        return Response(AdminContentPackSerializer(
            _annotated_packs(ContentPack.objects.filter(pk=pack.pk)).first()
        ).data)

    def delete(self, request, pk):
        pack = ContentPack.objects.filter(pk=pk).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')
        if pack.purchases.exists():
            return error_response(
                'People have bought this pack — deactivate it instead of deleting it.',
                status_code=409, code='has_purchases',
            )
        pack.delete()
        return Response({'success': True})


class AdminPackPdfUploadView(_AdminView):
    """POST /api/scrib/admin/packs/<pk>/pdf/  (multipart: file=<pdf>)

    Uploads the PDF to S3, records the real page count, and rebuilds the free
    preview so the paywall matches the new file immediately.
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        pack = ContentPack.objects.filter(pk=pk).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')

        upload = request.FILES.get('file')
        if not upload:
            return error_response('Attach a PDF file as "file"')
        if not upload.name.lower().endswith('.pdf'):
            return error_response('Only PDF files can be uploaded', code='bad_file_type')
        if upload.size > MAX_PDF_BYTES:
            return error_response(
                f'That PDF is {upload.size // (1024 * 1024)} MB — the limit is '
                f'{MAX_PDF_BYTES // (1024 * 1024)} MB.',
                code='file_too_large',
            )

        s3, bucket = _s3_client()
        if not s3:
            return error_response(
                'S3 is not configured on the server', status_code=503, code='storage_unavailable',
            )

        raw = upload.read()

        # Count pages up front: a PDF that can't be parsed shouldn't reach S3.
        try:
            from PyPDF2 import PdfReader
            page_count = len(PdfReader(io.BytesIO(raw)).pages)
        except Exception as exc:
            logger.error('[packs] unreadable PDF for pack=%s: %s', pack.id, exc)
            return error_response('That file could not be read as a PDF', code='bad_pdf')

        old_key = pack.s3_key
        new_key = f'interview-packs/{pack.slug}_{uuid.uuid4().hex[:8]}.pdf'
        try:
            s3.upload_fileobj(
                io.BytesIO(raw), bucket, new_key,
                ExtraArgs={'ContentType': 'application/pdf', 'ContentDisposition': 'inline'},
            )
        except Exception as exc:
            logger.error('[packs] upload failed pack=%s: %s', pack.id, exc)
            return error_response('Upload to S3 failed', status_code=503, code='storage_error')

        pack.s3_key = new_key
        pack.page_count = page_count
        pack.save(update_fields=['s3_key', 'page_count', 'updated_at'])

        free_key = _build_free_preview(pack)

        if old_key and old_key != new_key:
            try:
                s3.delete_object(Bucket=bucket, Key=old_key)
            except Exception:
                logger.warning('[packs] could not delete replaced PDF %s', old_key)

        logger.info('[packs] PDF uploaded pack=%s pages=%s key=%s', pack.id, page_count, new_key)

        return Response({
            'success': True,
            'page_count': page_count,
            'free_page_count': pack.free_page_count,
            'free_preview_ready': bool(free_key),
        })


class AdminPackQuizListView(_AdminView):
    """GET  /api/scrib/admin/packs/<pk>/quizzes/  — quizzes in a pack
    POST /api/scrib/admin/packs/<pk>/quizzes/  — add one
    """

    def get(self, request, pk):
        quizzes = (
            PackQuiz.objects.filter(pack_id=pk)
            .annotate(annotated_question_count=Count('questions'))
            .order_by('number')
        )
        return Response({'results': AdminPackQuizSerializer(quizzes, many=True).data})

    def post(self, request, pk):
        pack = ContentPack.objects.filter(pk=pk).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')

        data = dict(request.data)
        data['pack'] = pack.id
        # Default to the next free slot so adding a quiz needs one field, not two.
        if not data.get('number'):
            highest = pack.quizzes.aggregate(m=Max('number'))['m'] or 0
            data['number'] = highest + 1

        serializer = AdminPackQuizSerializer(data=data)
        if not serializer.is_valid():
            return error_response(
                'Check the highlighted fields', code='validation_error', details=serializer.errors,
            )
        quiz = serializer.save()
        return Response(
            AdminPackQuizSerializer(
                PackQuiz.objects.filter(pk=quiz.pk).annotate(annotated_question_count=Count('questions')).first()
            ).data,
            status=201,
        )


MAX_CSV_BYTES = 3 * 1024 * 1024


class AdminPackQuizCsvImportView(_AdminView):
    """POST /api/scrib/admin/packs/<pk>/quizzes/import-csv/  (multipart: file=<csv>)

    One CSV populates every quiz in a pack in a single upload — the practical
    answer to authoring 5 packs × 10 quizzes × 25 questions by hand. Header row
    required, column names case-insensitive, extra columns ignored:

        quiz_number, question, option1, option2, option3, option4, answer

    Optional columns: question_number (explicit ordering — default is file
    order), quiz_topic (sets the quiz's topic from its first row), explanation.

    `answer` accepts a 1-based option number ("2"), a letter ("B"), or the
    exact text of the correct option, so content that already exists in any of
    those conventions can be pasted in without reformatting.

    A quiz_number that doesn't exist yet is created automatically. All rows are
    validated before anything is written — a CSV with one bad row imports
    nothing and reports every problem row at once, so authoring doesn't leave a
    half-imported pack to clean up.
    """

    parser_classes = [MultiPartParser, FormParser]

    REQUIRED_COLUMNS = ('quiz_number', 'question', 'option1', 'option2', 'answer')

    def post(self, request, pk):
        pack = ContentPack.objects.filter(pk=pk).first()
        if not pack:
            return error_response('Pack not found', status_code=404, code='not_found')

        upload = request.FILES.get('file')
        if not upload:
            return error_response('Attach a CSV file as "file"')
        if upload.size > MAX_CSV_BYTES:
            return error_response(
                f'That file is {upload.size // 1024} KB — the limit is {MAX_CSV_BYTES // 1024} KB.',
                code='file_too_large',
            )

        try:
            text = upload.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return error_response('That file is not valid UTF-8 text', code='bad_encoding')

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            return error_response('The CSV has no header row', code='bad_csv')

        headers = {h.strip().lower(): h for h in reader.fieldnames if h}
        missing = [name for name in self.REQUIRED_COLUMNS if name not in headers]
        if missing:
            return error_response(
                f"Missing required column(s): {', '.join(missing)}",
                code='missing_columns',
            )

        def col(row, name):
            key = headers.get(name)
            return (row.get(key) or '').strip() if key else ''

        rows = list(reader)
        if not rows:
            return error_response('The CSV has no data rows', code='bad_csv')

        # ── validate every row before writing anything ──
        by_quiz = {}
        errors = []

        for i, row in enumerate(rows):
            line_no = i + 2  # header occupies line 1
            quiz_raw = col(row, 'quiz_number')
            question_text = col(row, 'question')
            if not quiz_raw and not question_text:
                continue  # spreadsheet exports often trail with blank rows

            try:
                quiz_number = int(quiz_raw)
                if quiz_number < 1:
                    raise ValueError
            except ValueError:
                errors.append(f'Row {line_no}: quiz_number "{quiz_raw}" is not a positive whole number')
                continue

            if not question_text:
                errors.append(f'Row {line_no}: the question column is empty')
                continue

            options = [col(row, f'option{n}') for n in (1, 2, 3, 4)]
            options = [o for o in options if o]
            if len(options) < 2:
                errors.append(f'Row {line_no}: needs at least option1 and option2 filled in')
                continue

            answer_raw = col(row, 'answer')
            correct_index = None
            if answer_raw.isdigit():
                idx = int(answer_raw) - 1
                if 0 <= idx < len(options):
                    correct_index = idx
            elif len(answer_raw) == 1 and answer_raw.upper() in 'ABCD':
                idx = ord(answer_raw.upper()) - ord('A')
                if idx < len(options):
                    correct_index = idx
            else:
                for idx, option_text in enumerate(options):
                    if option_text.lower() == answer_raw.lower():
                        correct_index = idx
                        break
            if correct_index is None:
                errors.append(
                    f'Row {line_no}: answer "{answer_raw}" doesn’t match any option '
                    f'— use a number, a letter, or the exact option text'
                )
                continue

            bucket = by_quiz.setdefault(quiz_number, {'topic': '', 'questions': []})
            topic = col(row, 'quiz_topic')
            if topic and not bucket['topic']:
                bucket['topic'] = topic
            bucket['questions'].append({
                'text': question_text,
                'options': options,
                'correct_index': correct_index,
                'explanation': col(row, 'explanation'),
                'order_raw': col(row, 'question_number'),
            })

        if errors:
            return error_response(
                f'{len(errors)} row(s) could not be imported — nothing was saved',
                code='validation_error',
                details={'errors': errors[:60], 'total_errors': len(errors)},
            )
        if not by_quiz:
            return error_response('No usable rows were found in that CSV', code='bad_csv')

        # ── every row is valid — now write it ──
        quizzes_touched = 0
        questions_created = 0
        with transaction.atomic():
            for quiz_number, bucket in by_quiz.items():
                quiz, created = PackQuiz.objects.get_or_create(
                    pack=pack, number=quiz_number,
                    defaults={'topic': bucket['topic']},
                )
                if not created and bucket['topic'] and not quiz.topic:
                    quiz.topic = bucket['topic']
                    quiz.save(update_fields=['topic'])
                quizzes_touched += 1

                next_order = quiz.questions.aggregate(m=Max('order'))['m'] or 0
                for offset, q in enumerate(bucket['questions'], start=1):
                    try:
                        order = int(q['order_raw']) if q['order_raw'] else next_order + offset
                    except ValueError:
                        order = next_order + offset
                    PackQuizQuestion.objects.create(
                        quiz=quiz,
                        order=order,
                        text=q['text'],
                        options=q['options'],
                        correct_index=q['correct_index'],
                        explanation=q['explanation'],
                    )
                    questions_created += 1

        logger.info(
            '[packs] CSV import pack=%s quizzes=%s questions=%s',
            pack.id, quizzes_touched, questions_created,
        )

        return Response({
            'success': True,
            'quizzes_touched': quizzes_touched,
            'questions_created': questions_created,
        }, status=201)


class AdminQuizDetailView(_AdminView):
    """GET / PATCH / DELETE /api/scrib/admin/quizzes/<pk>/"""

    def get(self, request, pk):
        quiz = PackQuiz.objects.filter(pk=pk).annotate(annotated_question_count=Count('questions')).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')
        return Response({
            'quiz': AdminPackQuizSerializer(quiz).data,
            'questions': AdminPackQuizQuestionSerializer(quiz.questions.all(), many=True).data,
        })

    def patch(self, request, pk):
        quiz = PackQuiz.objects.filter(pk=pk).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')
        serializer = AdminPackQuizSerializer(quiz, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                'Check the highlighted fields', code='validation_error', details=serializer.errors,
            )
        serializer.save()
        return Response(AdminPackQuizSerializer(
            PackQuiz.objects.filter(pk=pk).annotate(annotated_question_count=Count('questions')).first()
        ).data)

    def delete(self, request, pk):
        quiz = PackQuiz.objects.filter(pk=pk).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')
        quiz.delete()
        return Response({'success': True})


class AdminQuizShuffleOptionsView(_AdminView):
    """POST /api/scrib/admin/quizzes/<pk>/shuffle-options/

    Randomizes each question's option order within one quiz. The correct
    option moves with its own text — only its position changes, so the
    stored answer is still correct after shuffling, just no longer sitting
    in whatever slot it started in.

    Exists because bulk-authored question banks (LLM-generated or imported
    from an external doc) tend to place the correct option in the same slot
    across most questions — commonly always option B — which makes a quiz
    guessable without reading it. This breaks that pattern without touching
    question text, option wording, or which answer is correct.
    """

    def post(self, request, pk):
        quiz = PackQuiz.objects.filter(pk=pk).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')

        questions = list(quiz.questions.all())
        touched = []
        for question in questions:
            options = list(question.options)
            if len(options) < 2:
                continue
            order = list(range(len(options)))
            random.shuffle(order)
            question.options = [options[i] for i in order]
            question.correct_index = order.index(question.correct_index)
            touched.append(question)

        if touched:
            PackQuizQuestion.objects.bulk_update(touched, ['options', 'correct_index'])

        return Response({'success': True, 'shuffled': len(touched)})


class AdminQuizQuestionsView(_AdminView):
    """GET  /api/scrib/admin/quizzes/<pk>/questions/
    POST /api/scrib/admin/quizzes/<pk>/questions/

    POST takes either a single question object or {"questions": [...]} for bulk
    import, so 25 questions can be pasted in one go instead of typed one by one.
    """

    def get(self, request, pk):
        questions = PackQuizQuestion.objects.filter(quiz_id=pk)
        return Response({'results': AdminPackQuizQuestionSerializer(questions, many=True).data})

    def post(self, request, pk):
        quiz = PackQuiz.objects.filter(pk=pk).first()
        if not quiz:
            return error_response('Quiz not found', status_code=404, code='not_found')

        payload = request.data.get('questions')
        bulk = isinstance(payload, list)
        items = payload if bulk else [request.data]
        if not items:
            return error_response('No questions supplied')

        next_order = (quiz.questions.aggregate(m=Max('order'))['m'] or 0) + 1

        prepared, errors = [], []
        for offset, item in enumerate(items):
            data = dict(item)
            data['quiz'] = quiz.id
            if not data.get('order'):
                data['order'] = next_order + offset
            serializer = AdminPackQuizQuestionSerializer(data=data)
            if serializer.is_valid():
                prepared.append(serializer)
            else:
                errors.append({'index': offset, 'errors': serializer.errors})

        # All-or-nothing: a half-imported quiz is worse than a rejected one.
        if errors:
            return error_response(
                f'{len(errors)} of {len(items)} question(s) could not be saved',
                code='validation_error', details={'items': errors},
            )

        with transaction.atomic():
            created = [s.save() for s in prepared]

        return Response({
            'created': len(created),
            'results': AdminPackQuizQuestionSerializer(created, many=True).data,
        }, status=201)


class AdminQuestionDetailView(_AdminView):
    """PATCH / DELETE /api/scrib/admin/questions/<pk>/"""

    def patch(self, request, pk):
        question = PackQuizQuestion.objects.filter(pk=pk).first()
        if not question:
            return error_response('Question not found', status_code=404, code='not_found')
        serializer = AdminPackQuizQuestionSerializer(question, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                'Check the highlighted fields', code='validation_error', details=serializer.errors,
            )
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        question = PackQuizQuestion.objects.filter(pk=pk).first()
        if not question:
            return error_response('Question not found', status_code=404, code='not_found')
        question.delete()
        return Response({'success': True})


class AdminBundleListView(_AdminView):
    """GET / POST /api/scrib/admin/bundles/ — the 'buy everything' offer."""

    def get(self, request):
        bundles = PackBundle.objects.all()
        return Response({
            'results': [
                {
                    **PackBundleSerializer(b, context={'owned_bundle_ids': set()}).data,
                    'is_active': b.is_active,
                    'pack_ids': list(b.packs.values_list('id', flat=True)),
                }
                for b in bundles
            ],
        })

    def post(self, request):
        name = str(request.data.get('name', '') or '').strip()
        if not name:
            return error_response('Give the bundle a name')

        bundle = PackBundle.objects.create(
            name=name,
            section=str(request.data.get('section') or ContentPack.SECTION_INTERVIEW).strip(),
            price_paise=int(request.data.get('price_paise') or 39900),
            is_active=bool(request.data.get('is_active', True)),
        )
        pack_ids = request.data.get('pack_ids')
        if isinstance(pack_ids, list):
            bundle.packs.set(ContentPack.objects.filter(id__in=pack_ids))
        return Response(
            PackBundleSerializer(bundle, context={'owned_bundle_ids': set()}).data, status=201,
        )


class AdminBundleDetailView(_AdminView):
    """PATCH / DELETE /api/scrib/admin/bundles/<pk>/"""

    def patch(self, request, pk):
        bundle = PackBundle.objects.filter(pk=pk).first()
        if not bundle:
            return error_response('Bundle not found', status_code=404, code='not_found')

        for field in ('name', 'section'):
            if field in request.data:
                setattr(bundle, field, str(request.data[field]).strip())
        if 'price_paise' in request.data:
            bundle.price_paise = int(request.data['price_paise'] or 0)
        if 'is_active' in request.data:
            bundle.is_active = bool(request.data['is_active'])
        bundle.save()

        pack_ids = request.data.get('pack_ids')
        if isinstance(pack_ids, list):
            bundle.packs.set(ContentPack.objects.filter(id__in=pack_ids))

        return Response(PackBundleSerializer(bundle, context={'owned_bundle_ids': set()}).data)

    def delete(self, request, pk):
        bundle = PackBundle.objects.filter(pk=pk).first()
        if not bundle:
            return error_response('Bundle not found', status_code=404, code='not_found')
        if bundle.purchases.exists():
            return error_response(
                'People have bought this bundle — deactivate it instead of deleting it.',
                status_code=409, code='has_purchases',
            )
        bundle.delete()
        return Response({'success': True})
