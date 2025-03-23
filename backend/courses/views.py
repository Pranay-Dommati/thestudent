from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from .models import SchoolCourse, EngineeringCourse
from .serializers import CourseWithChaptersSerializer, EngineeringCourseWithSectionsSerializer
import json

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([AllowAny])
def create_course(request):
    """
    Creates a new course based on the education level
    """
    data = request.data
    print("Received data:", data)  # Debug print
    
    try:
        # For School courses (10th, 11th, 12th)
        if 'class_level' in data:
            # Extract the form data
            course_data = {
                'title': data.get('title', ''),
                'class_level': data.get('class_level', ''),
                'board': data.get('board', ''),
                'state': data.get('state', ''),
                'subject': data.get('subject', ''),
                'sources': data.get('sources', ''),
                'duration': data.get('duration', ''),
                'key_topics': json.loads(data.get('keyTopics', '[]')),
                'learning_points': json.loads(data.get('learningPoints', '[]')),
                'is_published': True,
            }
            
            # If 'shortDescription' is in data, use it, otherwise use title
            course_data['short_description'] = data.get('shortDescription', data.get('title', ''))
            # If 'description' is in data, use it, otherwise generate one
            course_data['description'] = data.get('description', f"{data.get('title')} - {data.get('class_level')} - {data.get('subject')}")
            
            # Validate required fields
            missing_fields = []
            for field in ['title', 'class_level', 'board', 'subject']:
                if not course_data[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                return Response(
                    {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if 'thumbnail' in request.FILES:
                course_data['thumbnail'] = request.FILES['thumbnail']
            
            # Create the school course
            serializer = CourseWithChaptersSerializer(data=course_data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Process chapters
                chapters_data = json.loads(data.get('chapters', '[]'))
                for idx, chapter_data in enumerate(chapters_data):
                    if not chapter_data.get('name'):
                        return Response(
                            {'error': f'Chapter {idx+1} name is required'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
                    chapter = course.chapters.create(
                        name=chapter_data.get('name'),
                        order=idx
                    )
                    
                    # Process lessons for each chapter
                    for lesson_idx, lesson_data in enumerate(chapter_data.get('lessons', [])):
                        if not lesson_data.get('title'):
                            return Response(
                                {'error': f'Lesson title in chapter {idx+1}, lesson {lesson_idx+1} is required'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                            
                        lesson = chapter.lessons.create(
                            title=lesson_data.get('title', ''),
                            type=lesson_data.get('type', 'video'),
                            video_url=lesson_data.get('videoUrl', ''),
                            description=lesson_data.get('description', ''),
                            about_lesson=lesson_data.get('aboutLesson', ''),
                            order=lesson_idx
                        )
                        
                        # Add resources if any
                        if 'resources' in lesson_data and lesson_data['resources']:
                            resources = lesson_data['resources']
                            for res_type in ['downloadable', 'internet']:
                                if res_type in resources:
                                    for res_data in resources[res_type]:
                                        lesson.resources.create(
                                            type=res_type,
                                            title=res_data.get('title', ''),
                                            url=res_data.get('url', '')
                                        )
                        
                        # Add quiz questions if any
                        if 'quizQuestions' in lesson_data and lesson_data['quizQuestions']:
                            for question_data in lesson_data['quizQuestions']:
                                lesson.quiz_questions.create(
                                    question=question_data.get('question', ''),
                                    options=question_data.get('options', []),
                                    correct_answer=question_data.get('correctAnswer', '')
                                )
                
                return Response(
                    {'message': 'School course created successfully', 'id': course.id}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                print("Serializer errors:", serializer.errors)  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # For Engineering courses
        elif 'proficiency' in data:  # This indicates it's an engineering course
            course_data = {
                'title': data.get('title', ''),
                'subject': data.get('title', ''),  # If no separate subject field, use title
                'short_description': data.get('shortDescription', ''),
                'description': data.get('description', ''),
                'duration': data.get('duration', ''),
                'sources': data.get('sources', ''),
                'proficiency': data.get('proficiency', 'beginner'),
                'certificate_given': data.get('certificateGiven') in ['true', True, 'True'],
                'project_based': data.get('projectBased') in ['true', True, 'True'],
                'last_updated': data.get('lastUpdated', None),
                'learning_points': json.loads(data.get('learningPoints', '[]')),
                'requirements': json.loads(data.get('requirements', '[]')),
            }
            
            if 'thumbnail' in request.FILES:
                course_data['thumbnail'] = request.FILES['thumbnail']
                
            # Create the engineering course
            serializer = EngineeringCourseWithSectionsSerializer(data=course_data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Process sections
                sections_data = json.loads(data.get('sections', '[]'))
                for idx, section_data in enumerate(sections_data):
                    section = course.sections.create(
                        name=section_data.get('name', f'Section {idx+1}'),
                        order=idx
                    )
                    
                    # Process lessons for each section
                    for lesson_idx, lesson_data in enumerate(section_data.get('lessons', [])):
                        lesson = section.lessons.create(
                            title=lesson_data.get('title', ''),
                            type=lesson_data.get('type', 'video'),
                            video_url=lesson_data.get('videoUrl', ''),
                            description=lesson_data.get('description', ''),
                            about_lesson=lesson_data.get('aboutLesson', ''),
                            order=lesson_idx
                        )
                        
                        # Add resources if any
                        if 'resources' in lesson_data and lesson_data['resources']:
                            resources = lesson_data['resources']
                            for res_type in ['downloadable', 'internet']:
                                if res_type in resources:
                                    for res_data in resources[res_type]:
                                        lesson.resources.create(
                                            type=res_type,
                                            title=res_data.get('title', ''),
                                            url=res_data.get('url', '')
                                        )
                        
                        # Add quiz questions if any
                        if 'quizQuestions' in lesson_data and lesson_data['quizQuestions']:
                            for question_data in lesson_data['quizQuestions']:
                                lesson.quiz_questions.create(
                                    question=question_data.get('question', ''),
                                    options=question_data.get('options', []),
                                    correct_answer=question_data.get('correctAnswer', '')
                                )
                
                return Response(
                    {'message': 'Engineering course created successfully', 'id': course.id}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                print("Serializer errors:", serializer.errors)  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response(
                {'error': 'Invalid course data - missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # Debug print
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
