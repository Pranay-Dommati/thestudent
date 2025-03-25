from rest_framework import serializers
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion
)

class LessonResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource
        fields = ['id', 'type', 'title', 'url', 'file']

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'options', 'correct_answer']

class LessonSerializer(serializers.ModelSerializer):
    resources = LessonResourceSerializer(many=True, required=False)
    quiz_questions = QuizQuestionSerializer(many=True, required=False)
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'type', 'video_url', 'description', 
            'about_lesson', 'order', 'resources', 'quiz_questions'
        ]

class CourseChapterSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, required=False)
    
    class Meta:
        model = CourseChapter
        fields = ['id', 'name', 'order', 'lessons']

class CourseWithChaptersSerializer(serializers.ModelSerializer):
    chapters = CourseChapterSerializer(many=True, required=False)
    
    class Meta:
        model = SchoolCourse
        fields = [
            'id', 'title', 'class_level', 'board', 'state', 'subject',
            'short_description', 'description', 'thumbnail', 'duration',
            'sources', 'last_updated', 'key_topics', 'learning_points',
            'is_published', 'chapters'
        ]

class CourseSectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, required=False)
    
    class Meta:
        model = CourseSection
        fields = ['id', 'name', 'order', 'lessons']

class EngineeringCourseWithSectionsSerializer(serializers.ModelSerializer):
    sections = CourseSectionSerializer(many=True, required=False)
    
    class Meta:
        model = EngineeringCourse
        fields = [
            'id', 'title', 'subject', 'short_description', 'description',
            'thumbnail', 'duration', 'sources', 'proficiency', 'certificate_given',
            'project_based', 'last_updated', 'learning_points', 'requirements',
            'is_published', 'sections', 'category'  # Added category field
        ]