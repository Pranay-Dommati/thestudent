from rest_framework import serializers
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion, UserLessonProgress, AITopicContent
)

class LessonResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource
        fields = ['id', 'type', 'title', 'url', 'file', 'description']

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'options', 'correct_answer']
        
    def to_representation(self, instance):
        # Get the default representation
        data = super().to_representation(instance)
        
        # Ensure options is always a list
        if not isinstance(data['options'], list):
            # Try to convert JSON string to list if needed
            try:
                import json
                if isinstance(data['options'], str):
                    data['options'] = json.loads(data['options'])
                else:
                    data['options'] = []
            except:
                data['options'] = []
                
        return data

class LessonSerializer(serializers.ModelSerializer):
    resources = serializers.SerializerMethodField()
    quiz_questions = QuizQuestionSerializer(many=True, required=False)
    completed = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'type', 'video_url', 'description', 
            'about_lesson', 'order', 'resources', 'quiz_questions', 'completed'
        ]
    
    def get_resources(self, obj):
        """Group resources by type for frontend compatibility"""
        lesson_resources = obj.resources.all()
        
        resources_data = {
            'downloadable': [],
            'internet': []
        }
        
        for resource in lesson_resources:
            resource_data = {
                'id': resource.id,
                'name': resource.title,
                'description': resource.description,
                'link': resource.url if resource.url else (resource.file.url if resource.file else ''),
                'download_url': f'/api/resources/download/{resource.id}/' if resource.file else None
            }
            
            if resource.type == 'downloadable':
                resources_data['downloadable'].append(resource_data)
            elif resource.type == 'internet':
                resources_data['internet'].append(resource_data)
        
        return resources_data
    
    def get_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserLessonProgress.objects.filter(user=request.user, lesson=obj).exists()
        return False

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
            'id', 'title', 'short_description', 'description',
            'thumbnail', 'duration', 'sources', 'proficiency', 
            'certificate_given', 'project_based', 'learning_points', 
            'requirements', 'category', 'last_updated', 'is_published', 
            'sections'
        ]

class AITopicContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AITopicContent
        fields = [
            'id', 'user', 'course_title', 'topic_name',
            'reading', 'summary', 'videos', 'resources',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)