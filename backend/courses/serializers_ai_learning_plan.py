from rest_framework import serializers
from django.utils import timezone
from .models import AILearningPlan

class AILearningPlanSerializer(serializers.ModelSerializer):
    """Serializer for AI Learning Plan model"""
    days_count = serializers.ReadOnlyField()
    total_videos = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AILearningPlan
        fields = [
            'id', 'title', 'description', 'created_at', 'updated_at', 
            'is_completed', 'plan_data', 'duration_days', 'difficulty_level', 
            'category', 'days_count', 'total_videos', 'user_email'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'days_count', 'total_videos']
    
    def create(self, validated_data):
        """Create a new AI learning plan"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class AILearningPlanCreateSerializer(serializers.Serializer):
    """Serializer for creating AI learning plans from goal and generated data"""
    goal = serializers.CharField(max_length=255)
    days = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Pre-generated learning plan days"
    )
    
    def create(self, validated_data):
        """Create AI learning plan from goal and days data"""
        user = self.context['request'].user
        goal = validated_data['goal']
        days_data = validated_data.get('days', [])
        
        # Structure the plan data
        plan_data = {
            'goal': goal,
            'days': days_data,
            'generated_at': str(timezone.now()),
            'source': 'ai_generated'
        }
        
        # Create the learning plan
        learning_plan = AILearningPlan.objects.create(
            user=user,
            title=f"AI Learning Plan: {goal}",
            description=f"AI-generated personalized learning plan for {goal}",
            plan_data=plan_data,
            duration_days=len(days_data),
            difficulty_level='beginner',
            category='AI-Generated'
        )
        
        return learning_plan
