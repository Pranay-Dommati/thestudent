from django.db import models
from django.conf import settings
from django.utils import timezone
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


# ==================== PRO LEARNING MODELS ====================

class ProLearningCourse(models.Model):
    """
    Model to store AI-generated Pro Learning courses
    Each course belongs to a specific user and can have multiple topics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='pro_courses'
    )
    course_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pro Learning Course'
        verbose_name_plural = 'Pro Learning Courses'
    
    def __str__(self):
        return f"{self.course_name} - {self.user.username}"
    
    def get_total_topics(self):
        """Get total number of topics in this course"""
        return self.topics.count()
    
    def get_completed_topics(self):
        """Get number of completed topics in this course"""
        return self.topics.filter(is_completed=True).count()
    
    def update_completion_percentage(self):
        """Update course completion percentage based on completed topics"""
        total_topics = self.get_total_topics()
        if total_topics > 0:
            completed_topics = self.get_completed_topics()
            self.completion_percentage = (completed_topics / total_topics) * 100
            self.is_completed = self.completion_percentage == 100
            self.save(update_fields=['completion_percentage', 'is_completed'])


class ProLearningTopic(models.Model):
    """
    Model to store individual topics within a Pro Learning course
    Each topic contains 5 tabs of content: reading_material, summary, videos, quiz, resources
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        ProLearningCourse, 
        on_delete=models.CASCADE, 
        related_name='topics'
    )
    topic_name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)  # For ordering topics within a course
    
    # Content for the 5 tabs
    reading_material = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    
    # Completion tracking
    is_completed = models.BooleanField(default=False)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['course', 'order']
        unique_together = ['course', 'order']  # Ensure unique ordering within course
        verbose_name = 'Pro Learning Topic'
        verbose_name_plural = 'Pro Learning Topics'
    
    def __str__(self):
        return f"{self.course.course_name} - {self.topic_name}"
    
    def mark_completed(self):
        """Mark this topic as completed and update course progress"""
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.progress_percentage = 100.00
            self.save(update_fields=['is_completed', 'completed_at', 'progress_percentage'])
            
            # Update parent course completion
            self.course.update_completion_percentage()


class ProLearningVideo(models.Model):
    """
    Model to store video content for each topic
    Each topic can have multiple videos
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        ProLearningTopic, 
        on_delete=models.CASCADE, 
        related_name='videos'
    )
    title = models.CharField(max_length=255)
    video_url = models.URLField()  # YouTube or other video URLs
    description = models.TextField(blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)  # e.g., "10:30"
    order = models.PositiveIntegerField(default=0)
    is_watched = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['topic', 'order']
        verbose_name = 'Pro Learning Video'
        verbose_name_plural = 'Pro Learning Videos'
    
    def __str__(self):
        return f"{self.topic.topic_name} - {self.title}"


class ProLearningQuizQuestion(models.Model):
    """
    Model to store quiz questions for each topic
    Each topic can have multiple quiz questions
    """
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        ProLearningTopic, 
        on_delete=models.CASCADE, 
        related_name='quiz_questions'
    )
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='mcq')
    options = models.JSONField(default=list)  # Store multiple choice options as JSON list
    correct_answer = models.CharField(max_length=255)
    explanation = models.TextField(blank=True, null=True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['topic', 'order']
        verbose_name = 'Pro Learning Quiz Question'
        verbose_name_plural = 'Pro Learning Quiz Questions'
    
    def __str__(self):
        return f"{self.topic.topic_name} - Q{self.order}: {self.question_text[:50]}..."


class ProLearningResource(models.Model):
    """
    Model to store additional resources for each topic
    Each topic can have multiple resources (links, documents, etc.)
    """
    RESOURCE_TYPES = (
        ('link', 'External Link'),
        ('document', 'Document'),
        ('article', 'Article'),
        ('tool', 'Online Tool'),
        ('reference', 'Reference Material'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(
        ProLearningTopic, 
        on_delete=models.CASCADE, 
        related_name='resources'
    )
    title = models.CharField(max_length=255)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES, default='link')
    url = models.URLField()
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['topic', 'order']
        verbose_name = 'Pro Learning Resource'
        verbose_name_plural = 'Pro Learning Resources'
    
    def __str__(self):
        return f"{self.topic.topic_name} - {self.title}"
