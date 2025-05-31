from django.db import models
import uuid

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

# Import learning plan models
from .models_learning_plan import LearningPlan, LearningPlanDay, VideoResource
