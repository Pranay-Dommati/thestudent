from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion,
    ProLearningCourse, ProLearningTopic, ProLearningVideo,
    ProLearningQuizQuestion, ProLearningResource
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
