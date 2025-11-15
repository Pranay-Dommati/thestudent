from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion,
    ProLearningCourse, ProLearningTopic, ProLearningVideo,
    ProLearningQuizQuestion, ProLearningResource,
    UserStartedPredefinedCourse, LearningActivity
)

class LessonResourceInline(admin.TabularInline):
    model = LessonResource
    extra = 1

class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1

class ChapterAdmin(admin.ModelAdmin):
    inlines = [LessonInline]

class SectionAdmin(admin.ModelAdmin):
    inlines = [LessonInline]

class SchoolCourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_level', 'board', 'subject', 'is_published', 'last_updated']
    list_filter = ['class_level', 'board', 'is_published']
    search_fields = ['title', 'subject']

class EngineeringCourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'subject', 'proficiency', 'is_published', 'last_updated']
    list_filter = ['proficiency', 'certificate_given', 'project_based', 'is_published', 'user']
    search_fields = ['title', 'subject', 'user__email']

# Register core course models
admin.site.register(SchoolCourse, SchoolCourseAdmin)
admin.site.register(EngineeringCourse, EngineeringCourseAdmin)
admin.site.register(CourseChapter, ChapterAdmin)
admin.site.register(CourseSection, SectionAdmin)
admin.site.register(Lesson)
admin.site.register(LessonResource)
admin.site.register(QuizQuestion)

# ==================== PRO LEARNING ADMIN ====================

class ProLearningVideoInline(admin.TabularInline):
    model = ProLearningVideo
    extra = 1
    fields = ['title', 'video_url', 'duration', 'order', 'is_watched']

class ProLearningQuizQuestionInline(admin.TabularInline):
    model = ProLearningQuizQuestion
    extra = 1
    fields = ['question_text', 'question_type', 'correct_answer', 'points', 'order']

class ProLearningResourceInline(admin.TabularInline):
    model = ProLearningResource
    extra = 1
    fields = ['title', 'resource_type', 'url', 'order']

class ProLearningTopicInline(admin.TabularInline):
    model = ProLearningTopic
    extra = 1
    fields = ['topic_name', 'order', 'is_completed', 'progress_percentage']
    readonly_fields = ['progress_percentage']

@admin.register(ProLearningCourse)
class ProLearningCourseAdmin(admin.ModelAdmin):
    list_display = ['course_name', 'user', 'get_total_topics', 'completion_percentage', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'created_at', 'user']
    search_fields = ['course_name', 'user__username', 'user__email']
    readonly_fields = ['completion_percentage', 'created_at', 'updated_at']
    inlines = [ProLearningTopicInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ProLearningTopic)
class ProLearningTopicAdmin(admin.ModelAdmin):
    list_display = ['topic_name', 'course', 'order', 'is_completed', 'progress_percentage', 'created_at']
    list_filter = ['is_completed', 'course__course_name', 'created_at']
    search_fields = ['topic_name', 'course__course_name', 'course__user__username']
    readonly_fields = ['progress_percentage', 'created_at', 'updated_at', 'completed_at']
    inlines = [ProLearningVideoInline, ProLearningQuizQuestionInline, ProLearningResourceInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'topic_name', 'order')
        }),
        ('Content', {
            'fields': ('reading_material', 'summary'),
            'classes': ('collapse',)
        }),
        ('Progress Tracking', {
            'fields': ('is_completed', 'progress_percentage', 'completed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ProLearningVideo)
class ProLearningVideoAdmin(admin.ModelAdmin):
    list_display = ['title', 'topic', 'video_url', 'duration', 'order', 'is_watched']
    list_filter = ['is_watched', 'topic__course__course_name']
    search_fields = ['title', 'topic__topic_name', 'topic__course__course_name']

@admin.register(ProLearningQuizQuestion)
class ProLearningQuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['get_question_preview', 'topic', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'topic__course__course_name']
    search_fields = ['question_text', 'topic__topic_name', 'topic__course__course_name']
    
    def get_question_preview(self, obj):
        return f"{obj.question_text[:50]}..." if len(obj.question_text) > 50 else obj.question_text
    get_question_preview.short_description = 'Question'

@admin.register(ProLearningResource)
class ProLearningResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'topic', 'resource_type', 'url', 'order']
    list_filter = ['resource_type', 'topic__course__course_name']
    search_fields = ['title', 'topic__topic_name', 'topic__course__course_name']

# ==================== ENROLLMENT TRACKING ADMIN ====================

@admin.register(UserStartedPredefinedCourse)
class UserStartedPredefinedCourseAdmin(admin.ModelAdmin):
    list_display = [
        'get_user_info', 
        'get_course_info', 
        'course_type', 
        'progress_percentage', 
        'started_at', 
        'last_activity',
        'is_completed'
    ]
    list_filter = [
        'course_type', 
        'progress_percentage', 
        'is_completed', 
        'started_at',
        'school_course__class_level',
        'school_course__board',
        'school_course__subject',
        'engineering_course__proficiency',
        'engineering_course__category'
    ]
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'school_course__title',
        'school_course__subject',
        'engineering_course__title',
        'engineering_course__subject'
    ]
    readonly_fields = ['started_at', 'last_activity']
    date_hierarchy = 'started_at'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Course Information', {
            'fields': ('course_type', 'school_course', 'engineering_course'),
            'description': 'Select either a school course OR an engineering course, not both.'
        }),
        ('Enrollment Details', {
            'fields': ('class_level', 'board', 'subject')
        }),
        ('Progress Tracking', {
            'fields': ('progress_percentage', 'is_completed', 'completed_at', 'last_accessed_lesson')
        }),
        ('Timestamps', {
            'fields': ('started_at', 'last_activity'),
            'classes': ('collapse',)
        })
    )
    
    def get_user_info(self, obj):
        """Display user information"""
        return f"{obj.user.get_full_name() or obj.user.username} ({obj.user.email})"
    get_user_info.short_description = 'User'
    get_user_info.admin_order_field = 'user__username'
    
    def get_course_info(self, obj):
        """Display course information"""
        if obj.school_course:
            return f"{obj.school_course.title} ({obj.school_course.class_level} {obj.school_course.board})"
        elif obj.engineering_course:
            return f"{obj.engineering_course.title} ({obj.engineering_course.proficiency})"
        return "No course assigned"
    get_course_info.short_description = 'Course'
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related(
            'user', 'school_course', 'engineering_course', 'last_accessed_lesson'
        )
    
    # Custom actions
    actions = ['mark_completed', 'reset_progress', 'update_last_activity']
    
    def mark_completed(self, request, queryset):
        """Mark selected enrollments as completed"""
        from django.utils import timezone
        updated = queryset.update(
            is_completed=True, 
            progress_percentage=100,
            completed_at=timezone.now()
        )
        self.message_user(request, f'{updated} enrollments marked as completed.')
    mark_completed.short_description = 'Mark selected enrollments as completed'
    
    def reset_progress(self, request, queryset):
        """Reset progress for selected enrollments"""
        updated = queryset.update(
            progress_percentage=0,
            is_completed=False,
            completed_at=None
        )
        self.message_user(request, f'{updated} enrollments had their progress reset.')
    reset_progress.short_description = 'Reset progress for selected enrollments'
    
    def update_last_activity(self, request, queryset):
        """Update last activity time to now"""
        from django.utils import timezone
        updated = queryset.update(last_activity=timezone.now())
        self.message_user(request, f'{updated} enrollments had their last activity time updated.')
    update_last_activity.short_description = 'Update last activity time to now'


# ==================== LEARNING ACTIVITY ADMIN ====================

@admin.register(LearningActivity)
class LearningActivityAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'date', 'time_spent_hours', 'time_spent_minutes', 
        'sessions_count', 'last_activity'
    ]
    list_filter = ['date', 'last_activity']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'last_activity']
    date_hierarchy = 'date'
    ordering = ['-date', '-last_activity']
    
    def time_spent_hours(self, obj):
        return f"{obj.time_spent_hours}h"
    time_spent_hours.short_description = 'Hours'
    
    fieldsets = (
        ('User & Date', {
            'fields': ('user', 'date')
        }),
        ('Activity Details', {
            'fields': ('time_spent_minutes', 'sessions_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_activity'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
