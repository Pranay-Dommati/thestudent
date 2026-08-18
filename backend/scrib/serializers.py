from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import (
    PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction,
    PromoCode, PromoCodeRedemption,
    ContentPack, PackBundle, PackQuiz, PackQuizQuestion,
)


class PreviewNoteSerializer(serializers.ModelSerializer):
    # Always expose pdf_url — falls back to image_url for legacy rows
    pdf_url = serializers.SerializerMethodField()

    def get_pdf_url(self, obj):
        return obj.resolved_pdf_url

    class Meta:
        model = PreviewNote
        fields = [
            'id',
            'title',
            'slug',
            'tags',
            'pdf_url',     # primary: PDF URL
            'image_url',   # kept for backward-compat thumbnail usage
            'page_count',
        ]


class GeneratedNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedNote
        fields = [
            'id',
            'prompt',
            'normalized_prompt',
            'image_url',
            'page_count',
            'credits_used',
            'source',
            'created_at',
        ]


class StudyPackSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyPack
        fields = [
            'id',
            'title',
            'topics_json',
            'pdf_url',
            'total_pages',
            'credits_used',
            'status',
            'share_token',
            'created_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    amount_rupees = serializers.SerializerMethodField()

    def get_amount_rupees(self, obj):
        """Return amount in INR (divide paise by 100)."""
        return round(obj.amount / 100, 2)

    class Meta:
        model = Payment
        fields = [
            'id',
            'razorpay_order_id',
            'razorpay_payment_id',
            'amount',
            'amount_rupees',
            'currency',
            'credits_added',
            'status',
            'created_at',
        ]


class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = [
            'id',
            'direction',
            'credits',
            'reason',
            'created_at',
        ]


class GenerateNoteRequestSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)


class GenerateStudyPackRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    topics = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False,
    )
    pages = serializers.ListField(
        required=False,
    )


class OrganizeTopicsRequestSerializer(serializers.Serializer):
    topics = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=1,
    )
    force_topics_per_page = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=4)


class ScribMeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    credit_balance = serializers.FloatField()


class RedeemCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32, trim_whitespace=True)

    def validate_code(self, value):
        return value.upper().strip()


class PromoCodeRedemptionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = PromoCodeRedemption
        fields = ['id', 'user_email', 'user_name', 'credits_added', 'redeemed_at']


class PromoCodeSerializer(serializers.ModelSerializer):
    remaining_redemptions = serializers.IntegerField(read_only=True)
    status = serializers.CharField(read_only=True)
    redemptions = PromoCodeRedemptionSerializer(many=True, read_only=True)

    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'credits_to_add', 'campaign_name',
            'max_redemptions', 'times_redeemed', 'remaining_redemptions',
            'is_active', 'expires_at', 'created_at', 'status',
            'redemptions',
        ]


class PromoCodeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the campaign dashboard (no redemptions inline)."""
    remaining_redemptions = serializers.IntegerField(read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'credits_to_add', 'campaign_name',
            'max_redemptions', 'times_redeemed', 'remaining_redemptions',
            'is_active', 'expires_at', 'created_at', 'status',
        ]


# ── Content packs (Interview Prep) ────────────────────────────────────────────

def _counted(obj, annotated_attr, property_attr):
    """Prefer the queryset annotation; fall back to the model property.

    Views annotate these counts to avoid a query per row, but a serializer may
    also be handed a plain instance — this keeps both paths working.
    """
    value = getattr(obj, annotated_attr, None)
    return getattr(obj, property_attr) if value is None else value


class ContentPackCardSerializer(serializers.ModelSerializer):
    """Grid/rail card. Never exposes S3 keys."""

    quiz_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    owned = serializers.SerializerMethodField()

    def get_quiz_count(self, obj):
        return _counted(obj, 'annotated_quiz_count', 'quiz_count')

    def get_question_count(self, obj):
        return _counted(obj, 'annotated_question_count', 'question_count')

    class Meta:
        model = ContentPack
        fields = [
            'id', 'slug', 'section', 'category', 'title', 'description',
            'theme', 'page_count', 'free_page_count',
            'price_paise', 'price', 'quiz_count', 'question_count', 'owned',
        ]

    def get_price(self, obj):
        return obj.price_paise / 100

    def get_owned(self, obj):
        return obj.id in self.context.get('owned_ids', set())


class PackQuizCardSerializer(serializers.ModelSerializer):
    """Quiz card — question count and the user's best score, never the answers."""

    title = serializers.CharField(source='display_title', read_only=True)
    question_count = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    attempts = serializers.SerializerMethodField()

    def get_question_count(self, obj):
        return _counted(obj, 'annotated_question_count', 'question_count')

    class Meta:
        model = PackQuiz
        fields = ['id', 'number', 'title', 'topic', 'question_count', 'best_score', 'attempts']

    def get_best_score(self, obj):
        return self.context.get('best_scores', {}).get(obj.id)

    def get_attempts(self, obj):
        return self.context.get('attempt_counts', {}).get(obj.id, 0)


class PackQuizQuestionSerializer(serializers.ModelSerializer):
    """Question as sent to the browser — correct_index and explanation withheld
    until the attempt is submitted and graded server-side."""

    class Meta:
        model = PackQuizQuestion
        fields = ['id', 'order', 'text', 'options']


class PackBundleSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    pack_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    owned = serializers.SerializerMethodField()

    class Meta:
        model = PackBundle
        fields = [
            'id', 'slug', 'name', 'section', 'covers_count',
            'price_paise', 'price', 'original_price', 'pack_count',
            'question_count', 'owned',
        ]

    def _offer_packs(self, obj):
        """What this offer unlocks for the user being served.

        A top-up tier has no pack list of its own, so the view passes the packs
        the user is actually missing; without that context (the admin list, for
        instance) fall back to the bundle's own set.
        """
        packs = self.context.get('offer_packs')
        if packs is None:
            return list(obj.packs.filter(is_active=True))
        return list(packs)

    def get_price(self, obj):
        return obj.price_paise / 100

    def get_original_price(self, obj):
        return sum(p.price_paise for p in self._offer_packs(obj)) / 100

    def get_pack_count(self, obj):
        return len(self._offer_packs(obj))

    def get_question_count(self, obj):
        packs = self._offer_packs(obj)
        if not packs:
            return 0
        return PackQuizQuestion.objects.filter(
            quiz__pack__in=packs, quiz__is_active=True,
        ).count()

    def get_owned(self, obj):
        return obj.id in self.context.get('owned_bundle_ids', set())


# ── Admin-side serializers (expose the fields the admin panel edits) ──────────

class AdminContentPackSerializer(serializers.ModelSerializer):
    quiz_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    has_pdf = serializers.SerializerMethodField()
    purchase_count = serializers.SerializerMethodField()

    def get_quiz_count(self, obj):
        return _counted(obj, 'annotated_quiz_count', 'quiz_count')

    def get_question_count(self, obj):
        return _counted(obj, 'annotated_question_count', 'question_count')

    class Meta:
        model = ContentPack
        fields = [
            'id', 'slug', 'section', 'category', 'title', 'description',
            'theme', 'price_paise', 'page_count', 'free_page_count',
            'sort_order', 'is_active', 'has_pdf', 'quiz_count', 'question_count',
            'purchase_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['slug', 'page_count', 'created_at', 'updated_at']

    def get_has_pdf(self, obj):
        return bool(obj.s3_key)

    def get_purchase_count(self, obj):
        return obj.purchases.count()


class AdminPackQuizSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    def get_question_count(self, obj):
        return _counted(obj, 'annotated_question_count', 'question_count')

    class Meta:
        model = PackQuiz
        fields = ['id', 'pack', 'number', 'title', 'topic', 'is_active', 'question_count', 'created_at']
        read_only_fields = ['created_at']


class AdminPackQuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackQuizQuestion
        fields = ['id', 'quiz', 'order', 'text', 'options', 'correct_index', 'explanation']

    def validate(self, attrs):
        options = attrs.get('options', getattr(self.instance, 'options', None)) or []
        if not isinstance(options, list) or len(options) < 2:
            raise serializers.ValidationError({'options': 'Give at least two answer options.'})
        if any(not str(o).strip() for o in options):
            raise serializers.ValidationError({'options': 'Answer options cannot be blank.'})
        correct = attrs.get('correct_index', getattr(self.instance, 'correct_index', 0))
        if correct is None or correct < 0 or correct >= len(options):
            raise serializers.ValidationError(
                {'correct_index': f'Pick the correct answer (0–{len(options) - 1}).'}
            )
        return attrs
