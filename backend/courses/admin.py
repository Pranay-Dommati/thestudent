from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion
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
    inlines = [LessonResourceInline, QuizQuestionInline]

class ChapterAdmin(admin.ModelAdmin):
    inlines = [LessonInline]

class SectionAdmin(admin.ModelAdmin):
    inlines = [LessonInline]

class SchoolCourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_level', 'board', 'subject', 'is_published', 'last_updated']
    list_filter = ['class_level', 'board', 'is_published']
    search_fields = ['title', 'subject']

class EngineeringCourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'proficiency', 'is_published', 'last_updated']
    list_filter = ['proficiency', 'certificate_given', 'project_based', 'is_published']
    search_fields = ['title', 'subject']

admin.site.register(SchoolCourse, SchoolCourseAdmin)
admin.site.register(EngineeringCourse, EngineeringCourseAdmin)
admin.site.register(CourseChapter, ChapterAdmin)
admin.site.register(CourseSection, SectionAdmin)
admin.site.register(Lesson)
