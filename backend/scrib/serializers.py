from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction, PromoCode, PromoCodeRedemption


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
