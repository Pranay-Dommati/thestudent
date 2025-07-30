from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion, AITopicContent
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

# Register AI Topic Content model
class AITopicContentAdmin(admin.ModelAdmin):
    list_display = ['course_title', 'topic_name', 'user', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at', 'user']
    search_fields = ['course_title', 'topic_name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'course_title', 'topic_name')
        }),
        ('Content', {
            'fields': ('reading', 'summary', 'videos', 'resources')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

admin.site.register(AITopicContent, AITopicContentAdmin)
