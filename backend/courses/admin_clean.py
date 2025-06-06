from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion, AILearningPlan
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

# Register AI Learning Plan model
class AILearningPlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'difficulty_level', 'duration_days', 'is_completed', 'created_at']
    list_filter = ['difficulty_level', 'is_completed', 'category', 'created_at', 'user']
    search_fields = ['title', 'user__email', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'days_count', 'total_videos']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'title', 'description')
        }),
        ('Plan Details', {
            'fields': ('difficulty_level', 'duration_days', 'category', 'is_completed')
        }),
        ('Plan Data', {
            'fields': ('plan_data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('days_count', 'total_videos'),
            'classes': ('collapse',)
        })
    )

admin.site.register(AILearningPlan, AILearningPlanAdmin)
