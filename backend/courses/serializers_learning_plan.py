from rest_framework import serializers
from .models_learning_plan import LearningPlan, LearningPlanDay, VideoResource

class VideoResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoResource
        fields = ['id', 'title', 'description', 'video_id', 'thumbnail_url', 'channel_title']

class LearningPlanDaySerializer(serializers.ModelSerializer):
    videos = VideoResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = LearningPlanDay
        fields = ['id', 'day', 'topic', 'project_idea', 'youtube_query', 'videos']

class LearningPlanSerializer(serializers.ModelSerializer):
    days = LearningPlanDaySerializer(many=True, read_only=True)
    
    class Meta:
        model = LearningPlan
        fields = ['id', 'title', 'created_at', 'days']
        read_only_fields = ['created_at']
