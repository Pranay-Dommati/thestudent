from django.db import models
from authentication.models import User
import uuid

class LearningPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_plans', null=True, blank=True)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class LearningPlanDay(models.Model):
    learning_plan = models.ForeignKey(LearningPlan, on_delete=models.CASCADE, related_name='days')
    day = models.PositiveIntegerField()
    topic = models.CharField(max_length=255)
    project_idea = models.TextField(blank=True)
    youtube_query = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['day']
    
    def __str__(self):
        return f"Day {self.day}: {self.topic}"

class VideoResource(models.Model):
    learning_plan_day = models.ForeignKey(LearningPlanDay, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_id = models.CharField(max_length=50)
    thumbnail_url = models.URLField()
    channel_title = models.CharField(max_length=255)
    
    def __str__(self):
        return self.title
