from rest_framework import serializers
from .models import (
    SchoolCourse, EngineeringCourse, CourseChapter, 
    CourseSection, Lesson, LessonResource, QuizQuestion, UserLessonProgress,
    ProLearningCourse, ProLearningTopic, ProLearningVideo, 
    ProLearningQuizQuestion, ProLearningResource
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


# Pro Learning Serializers

class ProLearningResourceSerializer(serializers.ModelSerializer):
    """Serializer for ProLearningResource model"""
    
    class Meta:
        model = ProLearningResource
        fields = [
            'id', 'title', 'url', 'resource_type', 'description', 
            'order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProLearningQuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for ProLearningQuizQuestion model"""
    
    class Meta:
        model = ProLearningQuizQuestion
        fields = [
            'id', 'question_text', 'question_type', 'options', 'correct_answer', 
            'explanation', 'points', 'order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProLearningVideoSerializer(serializers.ModelSerializer):
    """Serializer for ProLearningVideo model"""
    
    class Meta:
        model = ProLearningVideo
        fields = [
            'id', 'title', 'video_url', 'description', 'duration', 
            'order', 'is_watched', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProLearningTopicSerializer(serializers.ModelSerializer):
    """Serializer for ProLearningTopic model"""
    videos = ProLearningVideoSerializer(many=True, read_only=True)
    quiz_questions = ProLearningQuizQuestionSerializer(many=True, read_only=True)
    resources = ProLearningResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProLearningTopic
        fields = [
            'id', 'topic_name', 'order', 'is_completed', 'progress_percentage',
            'reading_material', 'summary', 'videos', 'quiz_questions', 'resources',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProLearningCourseSerializer(serializers.ModelSerializer):
    """Serializer for ProLearningCourse model"""
    topics = ProLearningTopicSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    topics_count = serializers.SerializerMethodField()
    completed_topics_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ProLearningCourse
        fields = [
            'id', 'course_name', 'description', 'user', 'topics',
            'topics_count', 'completed_topics_count', 'completion_percentage',
            'is_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_topics_count(self, obj):
        """Get total number of topics in the course"""
        try:
            count = obj.topics.count()
            print(f"🔍 Debug - Topics count for {obj.course_name}: {count}")
            return count
        except Exception as e:
            print(f"❌ Error in get_topics_count: {str(e)}")
            return 0
    
    def get_completed_topics_count(self, obj):
        """Get number of completed topics"""
        try:
            count = obj.topics.filter(is_completed=True).count()
            print(f"🔍 Debug - Completed topics count for {obj.course_name}: {count}")
            return count
        except Exception as e:
            print(f"❌ Error in get_completed_topics_count: {str(e)}")
            return 0
    
    def get_completion_percentage(self, obj):
        """Calculate completion percentage"""
        try:
            total = obj.topics.count()
            if total == 0:
                print(f"🔍 Debug - No topics for {obj.course_name}, returning 0%")
                return 0
            completed = obj.topics.filter(is_completed=True).count()
            percentage = round((completed / total) * 100, 2)
            print(f"🔍 Debug - Completion for {obj.course_name}: {completed}/{total} = {percentage}%")
            return percentage
        except Exception as e:
            print(f"❌ Error in get_completion_percentage: {str(e)}")
            return 0


class ProLearningCourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new Pro Learning course with nested data"""
    topics_data = serializers.JSONField(write_only=True)
    
    class Meta:
        model = ProLearningCourse
        fields = ['course_id', 'title', 'description', 'topics_data']
    
    def create(self, validated_data):
        """Create course with nested topics, videos, quiz questions, and resources"""
        topics_data = validated_data.pop('topics_data', {})
        user = self.context['request'].user
        
        # Create the course
        course = ProLearningCourse.objects.create(
            user=user,
            **validated_data
        )
        
        # Process topics data from localStorage format
        for topic_name, topic_content in topics_data.items():
            if isinstance(topic_content, dict) and 'content' in topic_content:
                content = topic_content['content']
                
                # Create topic
                topic = ProLearningTopic.objects.create(
                    course=course,
                    name=topic_name,
                    reading_content=content.get('reading', ''),
                    summary_content=content.get('summary', ''),
                    order=len(course.topics.all()) + 1
                )
                
                # Create videos if available
                videos = content.get('videos', [])
                for video_data in videos:
                    if isinstance(video_data, dict):
                        ProLearningVideo.objects.create(
                            topic=topic,
                            title=video_data.get('title', ''),
                            video_id=video_data.get('videoId', ''),
                            platform=video_data.get('platform', 'youtube'),
                            duration=video_data.get('duration', ''),
                            thumbnail_url=video_data.get('thumbnail', ''),
                            description=video_data.get('description', '')
                        )
                
                # Create quiz questions if available
                quiz_data = content.get('quiz', {})
                questions = quiz_data.get('questions', [])
                for question_data in questions:
                    if isinstance(question_data, dict):
                        ProLearningQuizQuestion.objects.create(
                            topic=topic,
                            question=question_data.get('question', ''),
                            options=question_data.get('options', []),
                            correct_answer=question_data.get('correctAnswer', ''),
                            explanation=question_data.get('explanation', ''),
                            difficulty_level=question_data.get('difficulty', 'medium')
                        )
                
                # Create resources if available
                resources = content.get('resources', [])
                for resource_data in resources:
                    if isinstance(resource_data, dict):
                        ProLearningResource.objects.create(
                            topic=topic,
                            title=resource_data.get('title', ''),
                            url=resource_data.get('url', ''),
                            resource_type=resource_data.get('type', 'article'),
                            description=resource_data.get('description', '')
                        )
        
        return course


class ProLearningTopicCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating individual topics"""
    videos = ProLearningVideoSerializer(many=True, required=False)
    quiz_questions = ProLearningQuizQuestionSerializer(many=True, required=False)
    resources = ProLearningResourceSerializer(many=True, required=False)
    
    class Meta:
        model = ProLearningTopic
        fields = [
            'name', 'description', 'reading_content', 'summary_content',
            'order', 'is_completed', 'videos', 'quiz_questions', 'resources'
        ]
    
    def create(self, validated_data):
        """Create topic with nested data"""
        videos_data = validated_data.pop('videos', [])
        quiz_questions_data = validated_data.pop('quiz_questions', [])
        resources_data = validated_data.pop('resources', [])
        
        topic = ProLearningTopic.objects.create(**validated_data)
        
        # Create related objects
        for video_data in videos_data:
            ProLearningVideo.objects.create(topic=topic, **video_data)
        
        for question_data in quiz_questions_data:
            ProLearningQuizQuestion.objects.create(topic=topic, **question_data)
        
        for resource_data in resources_data:
            ProLearningResource.objects.create(topic=topic, **resource_data)
        
        return topic


class ProLearningTopicUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating topic completion status"""
    
    class Meta:
        model = ProLearningTopic
        fields = ['is_completed']