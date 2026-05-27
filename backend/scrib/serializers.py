from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction


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
        child=serializers.ListField(child=serializers.CharField(max_length=255)),
        required=False,
    )


class OrganizeTopicsRequestSerializer(serializers.Serializer):
    topics = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=1,
    )


class ScribMeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    credit_balance = serializers.IntegerField()
