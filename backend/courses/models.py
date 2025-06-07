from django.db import models
from django.conf import settings
import uuid
from django.core.exceptions import ValidationError
import json

class BaseCourse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    short_description = models.TextField(blank=True)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    duration = models.CharField(max_length=50, blank=True)
    last_updated = models.DateField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)
    
    class Meta:
        abstract = True

class SchoolCourse(BaseCourse):
    LEVEL_CHOICES = (
        ('10th', 'Class 10'),
        ('11th', 'Class 11'),
        ('12th', 'Class 12'),
    )
    BOARD_CHOICES = (
        ('cbse', 'CBSE'),
        ('state', 'State Board'),
        ('icse', 'ICSE'),
    )
    
    class_level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    board = models.CharField(max_length=20, choices=BOARD_CHOICES)
    state = models.CharField(max_length=50, blank=True)
    subject = models.CharField(max_length=100)
    sources = models.CharField(max_length=255, blank=True)
    key_topics = models.JSONField(default=list)
    learning_points = models.JSONField(default=list)
    
    def __str__(self):
        return f"{self.class_level} - {self.subject} ({self.board})"

class EngineeringCourse(BaseCourse):
    PROFICIENCY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='engineering_courses')
    subject = models.CharField(max_length=100, blank=True, null=True)
    sources = models.CharField(max_length=255, blank=True, null=True)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='beginner')
    certificate_given = models.BooleanField(default=False)
    project_based = models.BooleanField(default=False)
    learning_points = models.JSONField(default=list, blank=True, null=True)
    requirements = models.JSONField(default=list, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"Engineering - {self.title} ({self.proficiency})"

class CourseChapter(models.Model):
    """For School Courses"""
    school_course = models.ForeignKey(SchoolCourse, on_delete=models.CASCADE, related_name='chapters')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name

class CourseSection(models.Model):
    """For Engineering Courses"""
    engineering_course = models.ForeignKey(EngineeringCourse, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name

class Lesson(models.Model):
    TYPE_CHOICES = (
        ('video', 'Video'),
        ('article', 'Article'),
        ('quiz', 'Quiz'),
        ('resources', 'Resources'),
    )
    
    chapter = models.ForeignKey(CourseChapter, on_delete=models.CASCADE, related_name='lessons', null=True, blank=True)
    section = models.ForeignKey(CourseSection, on_delete=models.CASCADE, related_name='lessons', null=True, blank=True)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='video')
    video_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    about_lesson = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title

class LessonResource(models.Model):
    RESOURCE_TYPE_CHOICES = (
        ('downloadable', 'Downloadable'),
        ('internet', 'Internet'),
    )
    
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources')
    type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to='lesson_resources/', null=True, blank=True)
    
    def __str__(self):
        return self.title

class QuizQuestion(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.TextField()
    options = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=255)
    
    def __str__(self):
        return self.question

class QuizResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_results')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quiz_results')
    answers = models.JSONField(default=dict)  # Store user's answers
    score = models.FloatField()  # Percentage score
    total_questions = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['user', 'lesson'], name='idx_user_lesson_quiz'),
            models.Index(fields=['submitted_at'], name='idx_quiz_submitted_at'),
        ]
    
    @property
    def percentage(self):
        """Calculate percentage score"""
        if self.total_questions == 0:
            return 0
        return (self.score / self.total_questions) * 100
    
    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} - {self.score}/{self.total_questions}"

class UserLessonProgress(models.Model):
    """Tracks which lessons a user has completed"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='completed_by_users')
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'lesson']
        ordering = ['completed_at']
    
    def __str__(self):
        return f"{self.user} - {self.lesson.title} - {self.completed_at.strftime('%Y-%m-%d')}"

# AI-Generated Learning Plan Model - Single unified model
class AILearningPlan(models.Model):
    """Unified model for AI-generated learning plans with all data stored in JSON fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_learning_plans')
    title = models.CharField(max_length=255)  # The learning goal
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)
    
    # Store all learning plan data as JSON
    plan_data = models.JSONField(default=dict, help_text="Complete learning plan data including days, topics, projects, and videos")
    
    # Optional metadata
    duration_days = models.PositiveIntegerField(default=7)
    difficulty_level = models.CharField(max_length=20, default='beginner')
    category = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Learning Plan'
        verbose_name_plural = 'AI Learning Plans'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'title'],
                name='unique_user_learning_plan_title'
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'created_at'], name='idx_user_created_at'),
            models.Index(fields=['category', 'difficulty_level'], name='idx_category_difficulty'),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email if self.user else 'No User'}"
    
    def clean(self):
        """Validate the model before saving"""
        super().clean()
        
        # Validate plan_data structure
        if self.plan_data:
            required_keys = ['goal', 'days']
            for key in required_keys:
                if key not in self.plan_data:
                    raise ValidationError(f"plan_data must contain '{key}' field")
            
            # Validate days structure
            days = self.plan_data.get('days', [])
            if not isinstance(days, list):
                raise ValidationError("plan_data.days must be a list")
            
            for i, day in enumerate(days):
                if not isinstance(day, dict):
                    raise ValidationError(f"Day {i+1} must be a dictionary")
                
                required_day_keys = ['day', 'topic']
                for key in required_day_keys:
                    if key not in day:
                        raise ValidationError(f"Day {i+1} must contain '{key}' field")
                
                # Validate videos structure
                videos = day.get('videos', [])
                if not isinstance(videos, list):
                    raise ValidationError(f"Day {i+1} videos must be a list")
                
                for j, video in enumerate(videos):
                    if not isinstance(video, dict):
                        raise ValidationError(f"Day {i+1}, Video {j+1} must be a dictionary")
                    
                    if 'title' not in video:
                        raise ValidationError(f"Day {i+1}, Video {j+1} must have a title")
    
    def save(self, *args, **kwargs):
        """Override save to run validation and ensure plan_data is a dict"""
        if isinstance(self.plan_data, str):
            try:
                self.plan_data = json.loads(self.plan_data)
            except json.JSONDecodeError:
                self.plan_data = {}
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def days_count(self):
        """Get the number of days in the learning plan"""
        return len(self.plan_data.get('days', []))
    
    @property
    def total_videos(self):
        """Get the total number of videos across all days"""
        total = 0
        for day in self.plan_data.get('days', []):
            total += len(day.get('videos', []))
        return total
    
    @classmethod
    def find_similar_plans(cls, user, title, threshold=0.8):
        """Find similar learning plans for the same user"""
        from difflib import SequenceMatcher
        
        existing_plans = cls.objects.filter(user=user)
        similar_plans = []
        
        for plan in existing_plans:
            similarity = SequenceMatcher(None, title.lower(), plan.title.lower()).ratio()
            if similarity >= threshold:
                similar_plans.append((plan, similarity))
        
        return sorted(similar_plans, key=lambda x: x[1], reverse=True)
    
    @classmethod
    def create_with_duplicate_check(cls, user, title, **kwargs):
        """Create a learning plan with duplicate checking"""
        # Check for exact duplicates
        if cls.objects.filter(user=user, title=title).exists():
            raise ValueError(f"Learning plan with title '{title}' already exists for this user")
        
        # Check for similar plans
        similar_plans = cls.find_similar_plans(user, title)
        if similar_plans:
            similar_titles = [plan[0].title for plan in similar_plans[:3]]
            raise ValueError(f"Similar learning plans found: {similar_titles}")
        
        # Create the plan
        return cls.objects.create(user=user, title=title, **kwargs)
