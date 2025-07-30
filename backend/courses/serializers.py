from rest_framework import serializers
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion, UserLessonProgress, AITopicContent
)
import json

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
    user_email = serializers.CharField(source='user.email', read_only=True)
    has_content = serializers.BooleanField(read_only=True)
    content_summary = serializers.DictField(read_only=True)
    
    class Meta:
        model = AITopicContent
        fields = [
            'id', 'user', 'user_email', 'course_title', 'topic_name',
            'reading', 'summary', 'videos', 'resources', 'quiz', 'projects',
            'created_at', 'updated_at', 'has_content', 'content_summary'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'created_at', 'updated_at', 'has_content', 'content_summary']

    def to_internal_value(self, data):
        # Accept both camelCase and snake_case from frontend
        data = dict(data)
        if 'courseTitle' in data:
            data['course_title'] = data.pop('courseTitle')
        if 'topicName' in data:
            data['topic_name'] = data.pop('topicName')
        # Accept both direct and stringified lists for JSON fields
        for field in ['videos', 'resources', 'quiz', 'projects']:
            value = data.get(field)
            if value is not None and not isinstance(value, list):
                try:
                    data[field] = json.loads(value) if isinstance(value, str) else []
                except Exception:
                    data[field] = []
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Always output lists for JSON fields
        for field in ['videos', 'resources', 'quiz', 'projects']:
            if isinstance(data.get(field), str):
                try:
                    data[field] = json.loads(data[field])
                except Exception:
                    data[field] = []
            elif not isinstance(data.get(field), list):
                data[field] = []
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)

# Compatibility serializer for AI Learning Plan format
class AIContentPlanSerializer(serializers.Serializer):
    """Serializer to format AI content in the expected learning plan structure"""
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField()
    type = serializers.CharField(default='ai_topic_content')
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    topics = serializers.ListField(child=serializers.DictField(), read_only=True)
    plan_data = serializers.DictField(read_only=True)
    
    def to_representation(self, instance):
        """Convert AITopicContent instances to learning plan format"""
        if isinstance(instance, dict):
            return instance
            
        # If it's an AITopicContent instance, convert it
        return {
            'id': instance.id,
            'title': instance.course_title,
            'type': 'ai_topic_content',
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            'plan_data': {
                'goal': instance.course_title,
                'days': [{
                    'day': 1,
                    'topic': instance.topic_name,
                    'reading': instance.reading,
                    'summary': instance.summary,
                    'videos': instance.videos if isinstance(instance.videos, list) else [],
                    'resources': instance.resources if isinstance(instance.resources, list) else [],
                }]
            }
        }