from rest_framework import serializers
from django.utils import timezone
from .models import AILearningPlan
import json

class AILearningPlanSerializer(serializers.ModelSerializer):
    """Serializer for AI Learning Plan model"""
    days_count = serializers.ReadOnlyField()
    total_videos = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AILearningPlan
        fields = ['id', 'title', 'description', 'plan_data', 'duration_days', 
                 'difficulty_level', 'category', 'is_completed', 'created_at', 
                 'updated_at', 'days_count', 'total_videos', 'user_email']
        read_only_fields = ['id', 'created_at', 'updated_at', 'days_count', 'total_videos']

    def to_representation(self, instance):
        """Custom representation to ensure plan_data is properly formatted"""
        data = super().to_representation(instance)
        if isinstance(data['plan_data'], str):
            try:
                data['plan_data'] = json.loads(data['plan_data'])
            except json.JSONDecodeError:
                data['plan_data'] = {}
        return data

    def create(self, validated_data):
        """Create a new AI learning plan"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class AILearningPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating AI learning plans from goal and generated data"""
    goal = serializers.CharField(max_length=255)
    days = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Pre-generated learning plan days"
    )
    
    class Meta:
        model = AILearningPlan
        fields = ['title', 'description', 'plan_data', 'duration_days', 
                 'difficulty_level', 'category']
        extra_kwargs = {
            'plan_data': {'required': True},
            'duration_days': {'required': True},
            'difficulty_level': {'required': True}
        }

    def validate_plan_data(self, value):
        """Validate the plan_data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("plan_data must be a dictionary")
        
        required_fields = ['days', 'goal', 'metadata']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"plan_data must contain {field}")
        
        if not isinstance(value['days'], list):
            raise serializers.ValidationError("plan_data.days must be a list")
        
        return value

    def create(self, validated_data):
        """Create AI learning plan from goal and days data"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)
