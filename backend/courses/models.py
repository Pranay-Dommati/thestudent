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
        ('6th', 'Class 6'),
        ('7th', 'Class 7'),
        ('8th', 'Class 8'),
        ('9th', 'Class 9'),
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

class AITopicContent(models.Model):
    """Model for storing AI-generated content for individual topics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_topic_contents')
    course_title = models.CharField(max_length=255)
    topic_name = models.CharField(max_length=255)
    reading = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    videos = models.JSONField(default=list, blank=True, help_text="List of video objects")
    resources = models.JSONField(default=list, blank=True, help_text="List of resource objects")
    quiz = models.JSONField(default=list, blank=True, help_text="List of quiz questions")
    projects = models.JSONField(default=list, blank=True, help_text="List of project objects")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course_title", "topic_name")
        ordering = ["-created_at"]
        verbose_name = "AI Topic Content"
        verbose_name_plural = "AI Topic Contents"
        indexes = [
            models.Index(fields=['user', 'course_title'], name='idx_user_course_title'),
            models.Index(fields=['created_at'], name='idx_ai_content_created_at'),
        ]

    def clean(self):
        """Validate the model before saving"""
        super().clean()
        
        # Ensure JSON fields are lists
        if not isinstance(self.videos, list):
            self.videos = []
        if not isinstance(self.resources, list):
            self.resources = []
        if not isinstance(self.quiz, list):
            self.quiz = []
        if not isinstance(self.projects, list):
            self.projects = []

    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.clean()
        super().save(*args, **kwargs)

    @property
    def has_content(self):
        """Check if the topic has any content"""
        return bool(
            self.reading or 
            self.summary or 
            self.videos or 
            self.resources or 
            self.quiz or 
            self.projects
        )

    @property
    def content_summary(self):
        """Get a summary of available content"""
        return {
            'has_reading': bool(self.reading),
            'has_summary': bool(self.summary),
            'video_count': len(self.videos) if isinstance(self.videos, list) else 0,
            'resource_count': len(self.resources) if isinstance(self.resources, list) else 0,
            'quiz_count': len(self.quiz) if isinstance(self.quiz, list) else 0,
            'project_count': len(self.projects) if isinstance(self.projects, list) else 0,
        }

    def __str__(self):
        return f"{self.course_title} - {self.topic_name} - {self.user.email if self.user else 'No User'}"
