from rest_framework import serializers
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction


class PreviewNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreviewNote
        fields = [
            'id',
            'title',
            'slug',
            'tags',
            'image_url',
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
            'created_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'razorpay_order_id',
            'amount',
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
