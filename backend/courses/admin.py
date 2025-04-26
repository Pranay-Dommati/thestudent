from django.contrib import admin
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion,
    UserLessonProgress
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

class LessonResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'lesson', 'get_course']
    list_filter = ['type']
    search_fields = ['title', 'lesson__title']
    
    def get_course(self, obj):
        if obj.lesson.chapter:
            return f"School: {obj.lesson.chapter.school_course.title}"
        elif obj.lesson.section:
            return f"Engineering: {obj.lesson.section.engineering_course.title}"
        return "Unknown course"
    
    get_course.short_description = 'Course'

admin.site.register(SchoolCourse, SchoolCourseAdmin)
admin.site.register(EngineeringCourse, EngineeringCourseAdmin)
admin.site.register(CourseChapter, ChapterAdmin)
admin.site.register(CourseSection, SectionAdmin)
admin.site.register(Lesson)
admin.site.register(LessonResource, LessonResourceAdmin)  # Use custom admin class
admin.site.register(UserLessonProgress)
