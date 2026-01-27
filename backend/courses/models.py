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
    
    SOURCE_TYPE_CHOICES = (
        ('youtube', 'YouTube Curated'),
        ('original', 'EasyLearnova Original'),
    )
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES, default='youtube')
    
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


class Certification(models.Model):
    """Certificate issued to a user for completing an EngineeringCourse."""
    id = models.BigAutoField(primary_key=True)
    # Store as hyphenated UUID string to avoid DB length mismatches across engines
    def generate_uuid_str():
        return str(uuid.uuid4())

    certificate_id = models.CharField(max_length=36, default=generate_uuid_str, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey('EngineeringCourse', on_delete=models.CASCADE, related_name='certificates')
    issued_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='certificates/', null=True, blank=True)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate {self.certificate_id} - {self.user} - {self.course.title}"

class CourseChapter(models.Model):
    """For School Courses"""
    school_course = models.ForeignKey(SchoolCourse, on_delete=models.CASCADE, related_name='chapters')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name

class CourseSection(models.Model):
    """For Engineering Courses"""
    engineering_course = models.ForeignKey(EngineeringCourse, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    video_url = models.URLField(blank=True, max_length=500)
    description = models.TextField(blank=True)
    about_lesson = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    # Soft delete flag (aligns with existing MySQL column)
    is_deleted = models.BooleanField(default=False)
    # Timestamp for last update (aligns with existing MySQL NOT NULL column)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    url = models.URLField(blank=True, max_length=500)
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
    video_url = models.URLField(max_length=500)  # YouTube or other video URLs
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
    url = models.URLField(max_length=500)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['topic', 'order']
        verbose_name = 'Pro Learning Resource'
        verbose_name_plural = 'Pro Learning Resources'
    
    def __str__(self):
        return f"{self.topic.topic_name} - {self.title}"


# ==================== USER COURSE TRACKING MODELS ====================

class ProLearningShareLink(models.Model):
    """
    Public share link for a ProLearningCourse.
    Enables read-only, unauthenticated access to a course via a UUID token.
    The UUID primary key itself serves as the share token.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        ProLearningCourse,
        on_delete=models.CASCADE,
        related_name='share_links',
        db_constraint=False  # Avoid MySQL FK mismatch issues seen in legacy UUID columns
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_share_links')
    created_at = models.DateTimeField(auto_now_add=True)
    # Optional expiry; if set and in the past, treat as inactive
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pro Learning Share Link'
        verbose_name_plural = 'Pro Learning Share Links'
        indexes = [
            models.Index(fields=['course'], name='idx_share_course'),
            models.Index(fields=['created_by'], name='idx_share_creator'),
            models.Index(fields=['is_active'], name='idx_share_active'),
        ]

    def __str__(self):
        status = 'active' if self.is_active else 'inactive'
        return f"ShareLink({self.id}) for {self.course.course_name} [{status}]"

    @property
    def is_expired(self):
        return self.expires_at is not None and timezone.now() > self.expires_at

    def is_usable(self):
        return self.is_active and not self.is_expired

class UserStartedPredefinedCourse(models.Model):
    """
    Model to track when users start learning predefined courses (School/Engineering)
    Provides one-to-many relationship from User to course tracking
    """
    COURSE_TYPE_CHOICES = (
        ('school', 'School Course'),
        ('engineering', 'Engineering Course'),
    )
    
    BOARD_CHOICES = (
        ('cbse', 'CBSE'),
        ('icse', 'ICSE'),
        ('state', 'State Board'),
        ('ib', 'International Baccalaureate'),
    )
    
    CLASS_CHOICES = (
        ('6th', '6th Grade'),
        ('7th', '7th Grade'), 
        ('8th', '8th Grade'),
        ('9th', '9th Grade'),
        ('10th', '10th Grade'),
        ('11th', '11th Grade'),
        ('12th', '12th Grade'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='started_predefined_courses'
    )
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES)
    
    # For School Courses
    school_course = models.ForeignKey(
        SchoolCourse, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='enrolled_users'
    )
    class_level = models.CharField(max_length=10, choices=CLASS_CHOICES, null=True, blank=True)
    board = models.CharField(max_length=20, choices=BOARD_CHOICES, null=True, blank=True)
    subject = models.CharField(max_length=100, null=True, blank=True)
    
    # For Engineering Courses
    engineering_course = models.ForeignKey(
        EngineeringCourse, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='enrolled_users'
    )
    
    # Progress tracking
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_completed = models.BooleanField(default=False)
    last_accessed_lesson = models.ForeignKey(
        Lesson, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='last_accessed_by_users'
    )
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        unique_together = [
            ['user', 'school_course'],
            ['user', 'engineering_course']
        ]
        verbose_name = 'User Started Predefined Course'
        verbose_name_plural = 'User Started Predefined Courses'
        indexes = [
            models.Index(fields=['user', 'course_type'], name='idx_user_course_type'),
            models.Index(fields=['started_at'], name='idx_course_started_at'),
            models.Index(fields=['progress_percentage'], name='idx_course_progress'),
        ]
    
    def __str__(self):
        if self.course_type == 'school':
            return f"{self.user.username} - {self.school_course.title} ({self.class_level} {self.board})"
        else:
            return f"{self.user.username} - {self.engineering_course.title}"
    
    def get_course(self):
        """Get the actual course object based on course type"""
        if self.course_type == 'school':
            return self.school_course
        elif self.course_type == 'engineering':
            return self.engineering_course
        return None
    
    def get_course_title(self):
        """Get the course title regardless of course type"""
        course = self.get_course()
        return course.title if course else "Unknown Course"
    
    def update_progress(self):
        """Calculate and update progress based on completed lessons"""
        course = self.get_course()
        if not course:
            return
        
        if self.course_type == 'school':
            total_lessons = Lesson.objects.filter(chapter__school_course=course).count()
            completed_lessons = UserLessonProgress.objects.filter(
                user=self.user,
                lesson__chapter__school_course=course
            ).count()
        else:  # engineering
            total_lessons = Lesson.objects.filter(section__engineering_course=course).count()
            completed_lessons = UserLessonProgress.objects.filter(
                user=self.user,
                lesson__section__engineering_course=course
            ).count()
        
        if total_lessons > 0:
            self.progress_percentage = (completed_lessons / total_lessons) * 100
            self.is_completed = self.progress_percentage == 100
            
            if self.is_completed and not self.completed_at:
                self.completed_at = timezone.now()
            
            self.save(update_fields=['progress_percentage', 'is_completed', 'completed_at'])
    
    def get_next_lesson(self):
        """Get the next lesson to be completed in this course"""
        course = self.get_course()
        if not course:
            return None
        
        if self.course_type == 'school':
            completed_lesson_ids = UserLessonProgress.objects.filter(
                user=self.user,
                lesson__chapter__school_course=course
            ).values_list('lesson_id', flat=True)
            
            next_lesson = Lesson.objects.filter(
                chapter__school_course=course
            ).exclude(id__in=completed_lesson_ids).order_by('order').first()
        else:  # engineering
            completed_lesson_ids = UserLessonProgress.objects.filter(
                user=self.user,
                lesson__section__engineering_course=course
            ).values_list('lesson_id', flat=True)
            
            next_lesson = Lesson.objects.filter(
                section__engineering_course=course
            ).exclude(id__in=completed_lesson_ids).order_by('order').first()
        
        return next_lesson
    
    @classmethod
    def start_course(cls, user, course_type, **course_data):
        """
        Helper method to start a course for a user
        
        Args:
            user: User instance
            course_type: 'school' or 'engineering'
            **course_data: Course-specific data (course_id, class_level, board, subject, etc.)
        """
        enrollment_data = {
            'user': user,
            'course_type': course_type,
        }
        
        if course_type == 'school':
            enrollment_data.update({
                'school_course_id': course_data.get('course_id'),
                'class_level': course_data.get('class_level'),
                'board': course_data.get('board'),
                'subject': course_data.get('subject'),
            })
        elif course_type == 'engineering':
            enrollment_data.update({
                'engineering_course_id': course_data.get('course_id'),
            })
        
        # Create or get existing enrollment
        enrollment, created = cls.objects.get_or_create(**enrollment_data)
        
        return enrollment, created


class LearningActivity(models.Model):
    """
    Tracks daily learning activity for each user.
    Used to calculate learning streaks and weekly time spent.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_activities')
    date = models.DateField(default=timezone.now)  # One record per day
    time_spent_minutes = models.PositiveIntegerField(default=0)  # Accumulated minutes for the day
    sessions_count = models.PositiveIntegerField(default=0)  # Number of learning sessions
    last_activity = models.DateTimeField(auto_now=True)  # Last time activity was recorded
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'date')  # One record per user per day
        verbose_name = "Learning Activity"
        verbose_name_plural = "Learning Activities"
        ordering = ['-date']
    
    def __str__(self):
        hours = self.time_spent_minutes / 60
        return f"{self.user.username} - {self.date} - {hours:.1f}h ({self.time_spent_minutes}m)"
    
    @property
    def time_spent_hours(self):
        """Convert minutes to hours for display"""
        return round(self.time_spent_minutes / 60, 1)
    
    @classmethod
    def add_learning_time(cls, user, minutes):
        """
        Add learning time for the current day.
        Creates new record if none exists for today.
        """
        today = timezone.now().date()
        activity, created = cls.objects.get_or_create(
            user=user,
            date=today,
            defaults={'time_spent_minutes': 0, 'sessions_count': 0}
        )
        
        activity.time_spent_minutes += minutes
        activity.sessions_count += 1
        activity.save()
        
        return activity
    
    @classmethod
    def get_weekly_hours(cls, user):
        """Get total hours spent learning this week"""
        from datetime import timedelta
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        week_activities = cls.objects.filter(
            user=user,
            date__gte=start_of_week,
            date__lte=today
        )
        
        total_minutes = sum(activity.time_spent_minutes for activity in week_activities)
        return round(total_minutes / 60, 1)
    
    @classmethod
    def get_current_streak(cls, user):
        """Calculate current learning streak (consecutive days)"""
        from datetime import timedelta
        
        streak = 0
        current_date = timezone.now().date()
        
        # Check if user has activity today or yesterday (allow for different time zones)
        has_recent_activity = cls.objects.filter(
            user=user,
            date__in=[current_date, current_date - timedelta(days=1)]
        ).exists()
        
        if not has_recent_activity:
            return 0
        
        # Count consecutive days backwards
        check_date = current_date
        while True:
            if cls.objects.filter(user=user, date=check_date).exists():
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
                
        return streak
