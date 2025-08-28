from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import SchoolCourse, EngineeringCourse, Lesson, UserLessonProgress, LessonResource, LearningActivity, UserStartedPredefinedCourse, Certification
from .serializers import CourseWithChaptersSerializer, EngineeringCourseWithSectionsSerializer, CertificationSerializer
from django.utils import timezone
from django.conf import settings
import uuid
import os
import json
import traceback
import requests
import time
from django.conf import settings
import os
import mimetypes

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
                'is_published': True,
            }
            
            # Handle key_topics and learning_points
            # Accept both key_topics/learning_points (snake_case) and keyTopics/learningPoints (camelCase) 
            # for backwards compatibility with existing code
            if 'key_topics' in data:
                try:
                    course_data['key_topics'] = json.loads(data.get('key_topics', '[]'))
                except json.JSONDecodeError:
                    course_data['key_topics'] = []
            elif 'keyTopics' in data:
                try:
                    course_data['key_topics'] = json.loads(data.get('keyTopics', '[]'))
                except json.JSONDecodeError:
                    course_data['key_topics'] = []
            else:
                course_data['key_topics'] = []
                
            if 'learning_points' in data:
                try:
                    course_data['learning_points'] = json.loads(data.get('learning_points', '[]'))
                except json.JSONDecodeError:
                    course_data['learning_points'] = []
            elif 'learningPoints' in data:
                try:
                    course_data['learning_points'] = json.loads(data.get('learningPoints', '[]'))
                except json.JSONDecodeError:
                    course_data['learning_points'] = []
            else:
                course_data['learning_points'] = []
            
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
                
                # Extract resource files info if available
                resource_files_info = {}
                if 'resourceFilesInfo' in data:
                    try:
                        resource_file_ids = json.loads(data.get('resourceFilesInfo', '[]'))
                        # Create a mapping of file IDs to actual file objects
                        for file_id in resource_file_ids:
                            if file_id in request.FILES:
                                resource_files_info[file_id] = request.FILES[file_id]
                    except json.JSONDecodeError:
                        print("Error parsing resourceFilesInfo")
                
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
                                        # Create resource with basic info
                                        resource = lesson.resources.create(
                                            type=res_type,
                                            title=res_data.get('name', res_data.get('title', '')),
                                            description=res_data.get('description', ''),
                                            url=res_data.get('link', res_data.get('url', ''))
                                        )
                                        
                                        # Process file upload if this is a downloadable resource with fileId
                                        if res_type == 'downloadable' and 'fileId' in res_data:
                                            file_id = res_data.get('fileId')
                                            if file_id in resource_files_info:
                                                # Assign the uploaded file to the resource
                                                resource.file = resource_files_info[file_id]
                                                resource.save()
                          # Add quiz questions if any
                        if 'quizQuestions' in lesson_data and lesson_data['quizQuestions']:
                            for question_data in lesson_data['quizQuestions']:
                                correct_answer_index = question_data.get('correctAnswer', 0)
                                options = question_data.get('options', [])
                                
                                # Convert correctAnswer index to actual option text
                                if isinstance(correct_answer_index, int) and 0 <= correct_answer_index < len(options):
                                    correct_answer_text = options[correct_answer_index]
                                else:
                                    # Fallback: if it's already text or invalid index, use as-is
                                    correct_answer_text = str(correct_answer_index)
                                
                                lesson.quiz_questions.create(
                                    question=question_data.get('question', ''),
                                    options=options,
                                    correct_answer=correct_answer_text
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
                'category': data.get('category', ''),  # Make sure to set the category
                'is_published': True,  # Set it as published by default
            }
            
            if 'thumbnail' in request.FILES:
                course_data['thumbnail'] = request.FILES['thumbnail']
                
            # Create the engineering course
            serializer = EngineeringCourseWithSectionsSerializer(data=course_data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Process sections
                sections_data = json.loads(data.get('sections', '[]'))
                
                # Extract resource files info if available
                resource_files_info = {}
                if 'resourceFilesInfo' in data:
                    try:
                        resource_file_ids = json.loads(data.get('resourceFilesInfo', '[]'))
                        # Create a mapping of file IDs to actual file objects
                        for file_id in resource_file_ids:
                            if file_id in request.FILES:
                                resource_files_info[file_id] = request.FILES[file_id]
                    except json.JSONDecodeError:
                        print("Error parsing resourceFilesInfo")
                
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
                                        # Create resource with basic info
                                        resource = lesson.resources.create(
                                            type=res_type,
                                            title=res_data.get('name', res_data.get('title', '')),
                                            description=res_data.get('description', ''),
                                            url=res_data.get('link', res_data.get('url', ''))
                                        )
                                        
                                        # Process file upload if this is a downloadable resource with fileId
                                        if res_type == 'downloadable' and 'fileId' in res_data:
                                            file_id = res_data.get('fileId')
                                            if file_id in resource_files_info:
                                                # Assign the uploaded file to the resource
                                                resource.file = resource_files_info[file_id]
                                                resource.save()
                          # Add quiz questions if any
                        if 'quizQuestions' in lesson_data and lesson_data['quizQuestions']:
                            for question_data in lesson_data['quizQuestions']:
                                correct_answer_index = question_data.get('correctAnswer', 0)
                                options = question_data.get('options', [])
                                
                                # Convert correctAnswer index to actual option text
                                if isinstance(correct_answer_index, int) and 0 <= correct_answer_index < len(options):
                                    correct_answer_text = options[correct_answer_index]
                                else:
                                    # Fallback: if it's already text or invalid index, use as-is
                                    correct_answer_text = str(correct_answer_index)
                                
                                lesson.quiz_questions.create(
                                    question=question_data.get('question', ''),
                                    options=options,
                                    correct_answer=correct_answer_text
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
        print(traceback.format_exc())  # Debug print
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def list_engineering_courses(request):
    try:
        category = request.query_params.get('category', 'all')
        print(f"Requested category: {category}")
        
        queryset = EngineeringCourse.objects.all()
        print(f"Total courses before filtering: {queryset.count()}")
        
        if category != 'all' and category != '':
            queryset = queryset.filter(category=category)
            print(f"Courses after category filter: {queryset.count()}")

        # Process course data
        courses_data = []
        for course in queryset:
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                'short_description': course.short_description,
                'description': course.description,
                'duration': course.duration,
                'sources': course.sources,
                'proficiency': course.proficiency,
                'certificate_given': course.certificate_given,
                'project_based': course.project_based,
                'category': course.category,
                'last_updated': course.last_updated,
            }
            courses_data.append(course_data)

        print(f"Successfully processed {len(courses_data)} courses")
        return Response(courses_data)
        
    except Exception as e:
        print(f"Error in list_engineering_courses: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Internal server error", "details": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def get_engineering_course_by_id(request, course_id):
    try:
        course = EngineeringCourse.objects.get(id=course_id)
        serializer = EngineeringCourseWithSectionsSerializer(course)
        return Response(serializer.data)
    except EngineeringCourse.DoesNotExist:
        return Response(
            {"error": "Course not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def get_school_course_by_id(request, course_id):
    try:
        course = SchoolCourse.objects.get(id=course_id)
        serializer = CourseWithChaptersSerializer(course)
        return Response(serializer.data)
    except SchoolCourse.DoesNotExist:
        return Response(
            {"error": "Course not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def list_all_courses(request):
    try:
        category = request.query_params.get('category', 'all')
        print(f"Requested category: {category}")
        
        # Process engineering courses
        eng_queryset = EngineeringCourse.objects.all()
        if category != 'all' and category != '' and category != 'school':
            eng_queryset = eng_queryset.filter(category=category)
        
        # Process school courses
        school_queryset = SchoolCourse.objects.all()
        if category == 'school':
            eng_queryset = EngineeringCourse.objects.none()  # Empty if only school courses requested
        
        # Combine both types of courses
        courses_data = []
        
        # Engineering courses
        for course in eng_queryset:
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                'short_description': course.short_description,
                'course_type': 'engineering',
                'category': course.category or 'Engineering',
                'class': 'Engineering',
                'last_updated': course.last_updated,
                'is_published': course.is_published
            }
            courses_data.append(course_data)
        
        # School courses
        for course in school_queryset:
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                'short_description': course.short_description,
                'course_type': 'school',
                'category': course.subject,
                'class': f"{course.class_level} - {course.board}",
                'last_updated': course.last_updated,
                'is_published': course.is_published
            }
            courses_data.append(course_data)

        print(f"Successfully processed {len(courses_data)} courses")
        return Response(courses_data)
        
    except Exception as e:
        print(f"Error in list_all_courses: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Internal server error", "details": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def list_school_courses(request):
    try:
        class_level = request.query_params.get('class', '')
        board = request.query_params.get('board', '')
        state = request.query_params.get('state', '')
        subject = request.query_params.get('subject', '')

        print(f"Filtering courses: class={class_level}, board={board}, state={state}, subject={subject}")

        queryset = SchoolCourse.objects.all()
        
        # Apply filters
        if class_level:
            queryset = queryset.filter(class_level=class_level)

        if board:
            queryset = queryset.filter(board__iexact=board)

        if subject:
            # Log the subject being searched for debugging
            print(f"Searching for subject: '{subject}'")
            
            # Use iexact for case-insensitive but exact subject matching
            queryset = queryset.filter(subject__iexact=subject)
            
            # If no results with iexact, try icontains as fallback
            if queryset.count() == 0:
                print(f"No exact matches found for subject '{subject}', trying partial match")
                queryset = SchoolCourse.objects.filter(
                    class_level=class_level,
                    board__iexact=board,
                    subject__icontains=subject
                )
            
        if board == 'state' and state:
            # Use icontains for more flexible state matching
            queryset = queryset.filter(state__icontains=state)

        print(f"Found {queryset.count()} courses matching the criteria:")
        for course in queryset:
            print(f"Course: {course.title}, Board: {course.board}, Class: {course.class_level}, State: {course.state}")

        # Serialize and return the courses
        courses_data = [
            {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                'subject': course.subject,
                'short_description': course.short_description,
                'class_level': course.class_level,
                'board': course.board,
                'state': course.state,
                'duration': course.duration,
                'sources': course.sources,
                'key_topics': course.key_topics,
                'learning_points': course.learning_points,
                'last_updated': course.last_updated,
            }
            for course in queryset
        ]

        return Response(courses_data)
    except Exception as e:
        print(f"Error in list_school_courses: {str(e)}")
        return Response(
            {"error": "Internal server error", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_lesson_completion(request, lesson_id):
    """
    Mark a lesson as complete or incomplete for the current user
    """
    try:
        lesson = get_object_or_404(Lesson, id=lesson_id)
        user = request.user
        
        # Check if lesson progress record exists
        progress, created = UserLessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson
        )
        
        # If it existed and we're toggling, delete it to mark as incomplete
        if not created:
            progress.delete()
            status_message = 'incomplete'
        else:
            status_message = 'complete'
        
        # Calculate progress percentage for the course
        total_lessons = 0
        completed_lessons = 0
        
        if lesson.chapter:
            # School course
            course = lesson.chapter.school_course
            for chapter in course.chapters.all():
                chapter_lessons = chapter.lessons.all()
                total_lessons += chapter_lessons.count()
                completed_lessons += UserLessonProgress.objects.filter(
                    user=user,
                    lesson__in=chapter_lessons
                ).count()
        elif lesson.section:
            # Engineering course
            course = lesson.section.engineering_course
            for section in course.sections.all():
                section_lessons = section.lessons.all()
                total_lessons += section_lessons.count()
                completed_lessons += UserLessonProgress.objects.filter(
                    user=user, 
                    lesson__in=section_lessons
                ).count()
        
        progress_percentage = 0
        if total_lessons > 0:
            progress_percentage = int((completed_lessons / total_lessons) * 100)
            
        return Response({
            'status': status_message,
            'lesson_id': lesson_id,
            'progress': {
                'completed': completed_lessons,
                'total': total_lessons,
                'percentage': progress_percentage
            }
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_progress(request, course_id):
    """
    Get the progress of a specific course for the current user
    """
    try:
        user = request.user
        total_lessons = 0
        completed_lessons = 0
        
        # Determine if it's a school course or engineering course
        try:
            # Try to find a school course first
            course = SchoolCourse.objects.get(id=course_id)
            is_school_course = True
        except SchoolCourse.DoesNotExist:
            # If not found, try engineering course
            try:
                course = EngineeringCourse.objects.get(id=course_id)
                is_school_course = False
            except EngineeringCourse.DoesNotExist:
                return Response(
                    {"error": "Course not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get lesson completion status
        if is_school_course:
            # For school course
            lessons_by_chapter = []
            for chapter in course.chapters.all():
                chapter_lessons = chapter.lessons.all()
                total_lessons += chapter_lessons.count()
                
                # Get completed lessons in this chapter
                completed_lesson_ids = UserLessonProgress.objects.filter(
                    user=user, 
                    lesson__chapter=chapter
                ).values_list('lesson_id', flat=True)
                
                chapter_completed = len(completed_lesson_ids)
                completed_lessons += chapter_completed
                
                # Build chapter data with lessons
                chapter_data = {
                    'id': chapter.id,
                    'name': chapter.name,
                    'total_lessons': chapter_lessons.count(),
                    'completed_lessons': chapter_completed,
                    'lessons': [
                        {
                            'id': lesson.id,
                            'title': lesson.title,
                            'completed': lesson.id in completed_lesson_ids
                        }
                        for lesson in chapter_lessons
                    ]
                }
                lessons_by_chapter.append(chapter_data)
                
            response_data = {
                'course': {
                    'id': str(course.id),
                    'title': course.title,
                    'type': 'school'
                },
                'progress': {
                    'completed': completed_lessons,
                    'total': total_lessons,
                    'percentage': int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
                },
                'chapters': lessons_by_chapter
            }
        else:
            # For engineering course
            lessons_by_section = []
            for section in course.sections.all():
                section_lessons = section.lessons.all()
                total_lessons += section_lessons.count()
                
                # Get completed lessons in this section
                completed_lesson_ids = UserLessonProgress.objects.filter(
                    user=user, 
                    lesson__section=section
                ).values_list('lesson_id', flat=True)
                
                section_completed = len(completed_lesson_ids)
                completed_lessons += section_completed
                
                # Build section data with lessons
                section_data = {
                    'id': section.id,
                    'name': section.name,
                    'total_lessons': section_lessons.count(),
                    'completed_lessons': section_completed,
                    'lessons': [
                        {
                            'id': lesson.id,
                            'title': lesson.title,
                            'completed': lesson.id in completed_lesson_ids
                        }
                        for lesson in section_lessons
                    ]
                }
                lessons_by_section.append(section_data)
            
            response_data = {
                'course': {
                    'id': str(course.id),
                    'title': course.title,
                    'type': 'engineering'
                },
                'progress': {
                    'completed': completed_lessons,
                    'total': total_lessons,
                    'percentage': int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
                },
                'sections': lessons_by_section        }
        
        return Response(response_data)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_engineering_course_progress(request, course_id):
    """Return authenticated user's progress for a specific engineering course."""
    try:
        user = request.user
        # Validate course exists
        try:
            course = EngineeringCourse.objects.get(id=course_id)
        except EngineeringCourse.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        # Compute progress
        total_lessons = Lesson.objects.filter(section__engineering_course=course).count()
        completed_lessons = UserLessonProgress.objects.filter(
            user=user,
            lesson__section__engineering_course=course
        ).count()
        percentage = int((completed_lessons / total_lessons) * 100) if total_lessons else 0

        # If tracking enrollment, update it
        enrollment = UserStartedPredefinedCourse.objects.filter(user=user, engineering_course=course).first()
        if enrollment:
            enrollment.progress_percentage = percentage
            enrollment.is_completed = percentage == 100
            if enrollment.is_completed and not enrollment.completed_at:
                enrollment.completed_at = timezone.now()
            enrollment.save(update_fields=['progress_percentage', 'is_completed', 'completed_at'])

        # If a certificate already exists, include it
        cert = Certification.objects.filter(user=user, course=course).first()
        cert_data = CertificationSerializer(cert, context={'request': request}).data if cert else None

        return Response({
            'course_id': str(course.id),
            'progress': {
                'completed': completed_lessons,
                'total': total_lessons,
                'percentage': percentage,
                'is_completed': percentage == 100
            },
            'certificate': cert_data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def _render_certificate_file(user, course, certificate_obj):
    """Create a certificate file for download. Minimal placeholder: store the provided sample PDF under a new name.
    TODO: In production, render dynamic text on PDF using ReportLab or borb/Pillow.
    """
    # Location of sample template provided by user
    template_path = os.path.join(settings.BASE_DIR, 'courses', 'certificates', 'sample_certificate', 'Blue Simple Minimalist Participation Certificate.pdf')
    media_dir = settings.MEDIA_ROOT
    os.makedirs(os.path.join(media_dir, 'certificates'), exist_ok=True)
    filename = f"certificate_{certificate_obj.certificate_id}.pdf"
    dest_path = os.path.join(media_dir, 'certificates', filename)
    try:
        # Copy the template for now
        with open(template_path, 'rb') as src, open(dest_path, 'wb') as dst:
            dst.write(src.read())
        return f"certificates/{filename}"
    except Exception:
        return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_engineering_certificate(request, course_id):
    """Issue a certificate for the user if progress is 100%."""
    try:
        user = request.user
        try:
            course = EngineeringCourse.objects.get(id=course_id)
        except EngineeringCourse.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        # Compute progress
        total_lessons = Lesson.objects.filter(section__engineering_course=course).count()
        if total_lessons == 0:
            return Response({"error": "Course has no lessons"}, status=status.HTTP_400_BAD_REQUEST)

        completed_lessons = UserLessonProgress.objects.filter(
            user=user,
            lesson__section__engineering_course=course
        ).count()
        percentage = int((completed_lessons / total_lessons) * 100)

        if percentage < 100:
            return Response({"error": "Course not completed"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create certificate (enforce single per user/course)
        cert, created = Certification.objects.get_or_create(user=user, course=course)

        # If no file yet, generate/store one
        if not cert.file:
            rel_path = _render_certificate_file(user, course, cert)
            if rel_path:
                cert.file.name = rel_path
                cert.save(update_fields=['file'])

        data = CertificationSerializer(cert, context={'request': request}).data
        data.update({
            'course_name': course.title,
            'user_name': getattr(user, 'full_name', None) or getattr(user, 'username', None) or user.email,
        })
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, lesson_id):
    """
    Submit quiz answers and calculate score
    """
    try:
        lesson = get_object_or_404(Lesson, id=lesson_id)
        user = request.user
        data = request.data
        
        # Get user's answers from request data
        user_answers = data.get('answers', {})
        
        # Get all quiz questions for this lesson
        quiz_questions = lesson.quiz_questions.all()
        
        if not quiz_questions.exists():
            return Response(
                {"error": "No quiz questions found for this lesson"},
                status=status.HTTP_404_NOT_FOUND
            )
          # Calculate score
        total_questions = quiz_questions.count()
        correct_answers = 0
        
        # Debug information
        print(f"Processing quiz submission for lesson: {lesson_id}")
        print(f"User answers received: {user_answers}")
        
        for question in quiz_questions:
            question_id = str(question.id)
            user_answer = user_answers.get(question_id)
            
            # Parse options if needed
            options = question.options
            if isinstance(options, str):
                try:
                    import json
                    options = json.loads(options)
                except:
                    options = []
            
            if not isinstance(options, list):
                options = []
                
            print(f"Question {question_id}: {question.question}")
            print(f"Options: {options}")
            print(f"Correct answer: {question.correct_answer}")
            print(f"User answer index: {user_answer}")
            
            if user_answer is not None:
                try:
                    user_answer_index = int(user_answer)
                    # Make sure the answer index is valid
                    if user_answer_index >= 0 and user_answer_index < len(options):
                        # Check if the option at this index matches the correct answer
                        if options[user_answer_index] == question.correct_answer:
                            correct_answers += 1
                            print(f"Correct answer for question {question_id}")
                        else:
                            print(f"Wrong answer for question {question_id}")
                    else:
                        print(f"Invalid answer index for question {question_id}: {user_answer_index}")
                except (ValueError, TypeError):
                    print(f"Invalid answer format for question {question_id}: {user_answer}")
                    continue
        
        # Calculate percentage score
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= 80  # 80% passing score
        
        # Save quiz result to database
        from .models import QuizResult
        quiz_result = QuizResult.objects.create(
            user=user,
            lesson=lesson,
            answers=user_answers,
            score=score,
            passed=passed
        )
          # If quiz passed, mark lesson as complete
        if passed:
            UserLessonProgress.objects.get_or_create(
                user=user,
                lesson=lesson
            )
        
        return Response({
            "id": quiz_result.id,
            "score": score,
            "passed": passed,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "submitted_at": quiz_result.submitted_at
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_school_quiz(request, quiz_id):
    """
    Submit quiz answers for school courses that don't have lesson objects
    """
    try:
        user = request.user
        data = request.data
        
        # Get user's answers from request data
        user_answers = data.get('answers', {})
        
        # Since school courses don't have lesson objects with quiz questions,
        # we'll calculate the score based on the answers provided
        # The frontend should send the correct answers along with user answers
        
        quiz_questions = data.get('questions', [])
        
        if not quiz_questions:
            return Response(
                {"error": "No quiz questions provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Calculate score
        total_questions = len(quiz_questions)
        correct_answers = 0
        
        # Debug information
        print(f"Processing school quiz submission for quiz_id: {quiz_id}")
        print(f"User answers received: {user_answers}")
        print(f"Quiz questions: {len(quiz_questions)}")
        
        for question in quiz_questions:
            question_id = str(question.get('id'))
            user_answer_index = user_answers.get(question_id)
            correct_answer_index = question.get('correctAnswer')
            
            print(f"Question {question_id}: User answer index: {user_answer_index}, Correct index: {correct_answer_index}")
            
            if user_answer_index is not None and user_answer_index == correct_answer_index:
                correct_answers += 1
        
        # Calculate percentage score
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= 80  # 80% passing score
        
        # For school courses, we can create a simple result without database storage
        # or create a simplified quiz result entry
        result_data = {
            "quiz_id": quiz_id,
            "score": score,
            "passed": passed,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "user_id": user.id,
            "answers": user_answers
        }
        
        print(f"Quiz result: {result_data}")
        
        return Response({
            "id": f"school_quiz_{quiz_id}_{user.id}",
            "score": score,
            "passed": passed,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "submitted_at": None  # We don't store this for school quizzes
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def get_resources(request):
    """
    Get high-quality learning resources using Google Programmable Search API
    Excludes YouTube videos and focuses on educational content
    """
    import requests
    import json
    from datetime import datetime
    
    try:
        data = request.data
        topic = data.get('topic', '').strip()
        exclude_youtube = data.get('excludeYoutube', True)
        
        if not topic:
            return Response({
                'error': 'Topic is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Your Google Programmable Search API credentials
        API_KEY = 'AIzaSyCoZJC3kzWosQEJpbb0Q2QmoQpMUuBpVlI'
        SEARCH_ENGINE_ID = '2593cd20d7e52429f'
        
        print(f"🔍 Getting resources for topic: {topic}")
        print(f"🎛️ Exclude YouTube: {exclude_youtube}")
        
        resources = []
        
        # Define trusted educational sites for specific searches
        trusted_sites = [
            'freecodecamp.org',
            'geeksforgeeks.org', 
            'developer.mozilla.org',
            'w3schools.com',
            'stackoverflow.com',
            'github.com',
            'coursera.org',
            'edx.org',
            'khanacademy.org',
            'codecademy.com',
            'udemy.com',
            'tutorialspoint.com',
            'programiz.com',
            'javatpoint.com',
            'leetcode.com',
            'hackerrank.com',
            'codewars.com',
            'realpython.com',
            'python.org',
            'java.com',
            'cplusplus.com'
        ]
        
        # Create highly targeted search queries for the specific topic
        # Make sure queries are precise and topic-focused
        search_queries = [
            f'{topic} programming tutorial',
            f'{topic} data structure tutorial',
            f'{topic} algorithm tutorial', 
            f'learn {topic} programming',
            f'{topic} implementation examples',
            f'{topic} coding practice problems',
            f'{topic} programming guide',
            f'how to use {topic} in programming'
        ]
        
        # Enhanced search queries with site restrictions for quality
        enhanced_queries = []
        for base_query in search_queries[:4]:  # Use top 4 most relevant queries
            enhanced_queries.extend([
                f'{base_query} site:geeksforgeeks.org OR site:freecodecamp.org',
                f'{base_query} site:tutorialspoint.com OR site:w3schools.com',
                f'{base_query} site:programiz.com OR site:javatpoint.com'
            ])
        
        # Use the enhanced queries
        search_queries = enhanced_queries[:6]  # Limit to 6 queries to avoid too many API calls
        
        for query in search_queries:
            try:
                print(f"🔍 Searching with query: {query}")
                
                url = 'https://www.googleapis.com/customsearch/v1'
                params = {
                    'key': API_KEY,
                    'cx': SEARCH_ENGINE_ID,
                    'q': query,
                    'num': 3,  # Get 3 results per query type
                    'safe': 'active'
                }
                
                response = requests.get(url, params=params, timeout=10)
                print(f"📊 Google API Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    search_data = response.json()
                    
                    if 'items' in search_data:
                        print(f"✅ Found {len(search_data['items'])} items for query: {query}")
                        for item in search_data['items']:
                            link = item.get('link', '')
                            domain = item.get('displayLink', '')
                            
                            # Filter out YouTube and video content
                            if exclude_youtube and any(video_domain in link.lower() for video_domain in [
                                'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
                                'video', 'watch', 'embed'
                            ]):
                                print(f"⏭️ Skipping video resource: {item.get('title', '')[:50]}...")
                                continue
                            
                            # Check topic relevance - ensure the resource is actually about the topic
                            if not is_topic_relevant(item.get('title', ''), item.get('snippet', ''), topic):
                                print(f"⏭️ Skipping irrelevant resource: {item.get('title', '')[:50]}...")
                                continue
                            
                            # Categorize resource based on domain and content
                            resource_type = categorize_resource_type(item.get('title', ''), domain)
                            
                            resource = {
                                'title': item.get('title', ''),
                                'url': link,
                                'description': item.get('snippet', ''),
                                'provider': domain,
                                'type': resource_type,
                                'difficulty': determine_difficulty(item.get('title', ''), item.get('snippet', '')),
                                'free': is_free_resource(domain),
                                'rating': 'High' if domain in trusted_sites else 'Medium'
                            }
                            
                            # Enhanced duplicate checking - check URL, normalized URL, and similar titles
                            if is_duplicate_resource(resource, resources):
                                print(f"⏭️ Skipping duplicate resource: {resource['title'][:50]}...")
                                continue
                            
                            resources.append(resource)
                            print(f"📌 Added resource: {resource['title'][:50]}...")
                    else:
                        print(f"⚠️ No 'items' in search response for query: {query}")
                        if 'error' in search_data:
                            print(f"❌ Google API Error: {search_data['error']}")
                else:
                    error_text = response.text[:200]
                    print(f"❌ Google API Error {response.status_code}: {error_text}")
                
                # Small delay between requests to avoid rate limiting
                import time
                time.sleep(0.1)
                
            except Exception as search_error:
                print(f"❌ Search error for query '{query}': {search_error}")
                continue
        
        # Final deduplication pass to ensure no duplicates slipped through
        print(f"🔍 Before deduplication: {len(resources)} resources")
        deduplicated_resources = []
        for resource in resources:
            if not is_duplicate_resource(resource, deduplicated_resources):
                deduplicated_resources.append(resource)
        print(f"✅ After deduplication: {len(deduplicated_resources)} unique resources")
        
        # Sort by quality and limit to top 7 resources
        quality_resources = sorted(deduplicated_resources, key=lambda x: get_quality_score(x), reverse=True)[:7]
        
        print(f"✅ Found {len(quality_resources)} quality resources for topic: {topic}")
        
        return Response({
            'resources': quality_resources,
            'metadata': {
                'topic': topic,
                'total_found': len(quality_resources),
                'search_method': 'google_programmable_search',
                'exclude_youtube': exclude_youtube,
                'generated_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        print(f"❌ Error in get_resources: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e),
            'resources': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def normalize_url(url):
    """Normalize URL for better duplicate detection"""
    if not url:
        return ""
    
    # Remove common URL parameters and fragments
    url = url.split('?')[0].split('#')[0]
    # Remove trailing slashes
    url = url.rstrip('/')
    # Convert to lowercase
    url = url.lower()
    # Remove www prefix
    url = url.replace('://www.', '://')
    
    return url


def normalize_title(title):
    """Normalize title for similarity comparison"""
    if not title:
        return ""
    
    # Convert to lowercase and remove extra spaces
    title = ' '.join(title.lower().split())
    # Remove common prefixes and suffixes
    prefixes_to_remove = ['learn', 'tutorial', 'guide', 'how to', 'introduction to', 'intro to']
    suffixes_to_remove = ['tutorial', 'guide', 'explained', 'basics', 'fundamentals']
    
    for prefix in prefixes_to_remove:
        if title.startswith(prefix + ' '):
            title = title[len(prefix):].strip()
    
    for suffix in suffixes_to_remove:
        if title.endswith(' ' + suffix):
            title = title[:-len(suffix)].strip()
    
    return title


def is_duplicate_resource(new_resource, existing_resources):
    """Enhanced duplicate checking for resources"""
    new_url = normalize_url(new_resource.get('url', ''))
    new_title = normalize_title(new_resource.get('title', ''))
    
    for existing in existing_resources:
        existing_url = normalize_url(existing.get('url', ''))
        existing_title = normalize_title(existing.get('title', ''))
        
        # Check for exact URL match
        if new_url == existing_url:
            return True
        
        # Check for very similar titles (same content, different formatting)
        if new_title and existing_title and len(new_title) > 10:
            # Calculate similarity - if titles are very similar, consider duplicate
            common_words = set(new_title.split()) & set(existing_title.split())
            total_words = set(new_title.split()) | set(existing_title.split())
            
            if len(total_words) > 0:
                similarity = len(common_words) / len(total_words)
                if similarity > 0.8:  # 80% similarity threshold
                    return True
        
        # Check for same domain with very similar paths
        if new_url and existing_url:
            try:
                from urllib.parse import urlparse
                new_parsed = urlparse(new_url)
                existing_parsed = urlparse(existing_url)
                
                # Same domain and very similar paths
                if (new_parsed.netloc == existing_parsed.netloc and 
                    new_parsed.path and existing_parsed.path):
                    
                    path_similarity = len(set(new_parsed.path.split('/')) & set(existing_parsed.path.split('/'))) / max(len(set(new_parsed.path.split('/'))), len(set(existing_parsed.path.split('/'))))
                    if path_similarity > 0.7:  # 70% path similarity
                        return True
            except:
                pass  # If URL parsing fails, continue with other checks
    
    return False


def is_topic_relevant(title, description, topic):
    """Check if the resource content is actually relevant to the topic"""
    content = (title + ' ' + description).lower()
    topic_lower = topic.lower()
    
    # Direct topic match
    if topic_lower in content:
        return True
    
    # Handle common programming topics and their variations
    topic_variations = {
        'arrays': ['array', 'arrays', 'list', 'lists', 'data structure'],
        'strings': ['string', 'strings', 'text', 'character'],
        'loops': ['loop', 'loops', 'for loop', 'while loop', 'iteration'],
        'functions': ['function', 'functions', 'method', 'methods'],
        'variables': ['variable', 'variables', 'var', 'declaration'],
        'classes': ['class', 'classes', 'object', 'oop'],
        'recursion': ['recursion', 'recursive', 'recursively'],
        'sorting': ['sort', 'sorting', 'bubble sort', 'merge sort', 'quick sort'],
        'searching': ['search', 'searching', 'binary search', 'linear search'],
        'linked lists': ['linked list', 'linkedlist', 'node', 'pointer'],
        'trees': ['tree', 'trees', 'binary tree', 'bst'],
        'graphs': ['graph', 'graphs', 'vertex', 'edge', 'node'],
        'stacks': ['stack', 'stacks', 'lifo', 'push', 'pop'],
        'queues': ['queue', 'queues', 'fifo', 'enqueue', 'dequeue'],
        'hash tables': ['hash', 'hashtable', 'hashmap', 'dictionary', 'map'],
        'dynamic programming': ['dynamic programming', 'dp', 'memoization'],
    }
    
    # Check for topic variations
    variations = topic_variations.get(topic_lower, [topic_lower])
    for variation in variations:
        if variation in content:
            return True
    
    # If it's a programming concept, check for programming-related keywords
    programming_keywords = [
        'programming', 'code', 'coding', 'algorithm', 'data structure', 
        'computer science', 'software', 'development'
    ]
    
    has_programming_context = any(keyword in content for keyword in programming_keywords)
    has_topic_mention = any(variation in content for variation in variations)
    
    return has_programming_context and has_topic_mention


def categorize_resource_type(title, domain):
    """Categorize resource based on title and domain"""
    title_lower = title.lower()
    domain_lower = domain.lower()
    
    if 'youtube.com' in domain_lower:
        return 'Video'
    elif any(word in domain_lower for word in ['coursera', 'edx', 'udemy', 'khanacademy', 'codecademy']):
        return 'Course'
    elif any(word in domain_lower for word in ['github.com']):
        return 'Tool'
    elif any(word in domain_lower for word in ['stackoverflow.com']):
        return 'Reference'
    elif any(word in domain_lower for word in ['developer.mozilla.org', 'w3schools', 'docs.', 'tutorialspoint']):
        return 'Documentation'
    elif any(word in title_lower for word in ['tutorial', 'guide', 'learn', 'how to']):
        return 'Tutorial'
    elif any(word in title_lower for word in ['practice', 'exercise', 'challenge']):
        return 'Practice'
    elif any(word in domain_lower for word in ['medium.com', 'dev.to']):
        return 'Article'
    else:
        return 'Resource'


def determine_difficulty(title, description):
    """Determine difficulty level based on content"""
    content = (title + ' ' + description).lower()
    
    if any(word in content for word in ['beginner', 'basic', 'intro', 'getting started', 'fundamentals']):
        return 'Beginner'
    elif any(word in content for word in ['advanced', 'expert', 'deep dive', 'mastery', 'complex']):
        return 'Advanced'
    elif any(word in content for word in ['intermediate', 'beyond basics']):
        return 'Intermediate'
    else:
        return 'All Levels'


def is_free_resource(domain):
    """Determine if resource is likely free based on domain"""
    free_domains = [
        'freecodecamp.org', 'w3schools.com', 'developer.mozilla.org',
        'geeksforgeeks.org', 'stackoverflow.com', 'github.com',
        'khanacademy.org', 'tutorialspoint.com', 'medium.com', 'dev.to'
    ]
    return any(free_domain in domain.lower() for free_domain in free_domains)


def get_quality_score(resource):
    """Calculate quality score for resource ranking"""
    score = 0
    domain = resource.get('provider', '').lower()
    
    # High-quality educational domains get higher scores
    quality_domains = {
        'freecodecamp.org': 10,
        'geeksforgeeks.org': 10,
        'developer.mozilla.org': 9,
        'programiz.com': 9,
        'w3schools.com': 8,
        'tutorialspoint.com': 8,
        'javatpoint.com': 8,
        'stackoverflow.com': 7,
        'codecademy.com': 9,
        'coursera.org': 8,
        'edx.org': 8,
        'khanacademy.org': 7,
        'leetcode.com': 8,
        'hackerrank.com': 8,
        'realpython.com': 9
    }
    
    for domain_key, domain_score in quality_domains.items():
        if domain_key in domain:
            score += domain_score
            break
    
    # Boost score for comprehensive content
    title = resource.get('title', '').lower()
    if any(word in title for word in ['complete', 'comprehensive', 'full', 'ultimate']):
        score += 2
    
    return score

@api_view(['GET'])
@permission_classes([AllowAny])
def download_resource(request, resource_id):
    """
    Download a lesson resource file with proper headers
    """
    try:
        resource = get_object_or_404(LessonResource, id=resource_id)
        
        if not resource.file:
            return Response(
                {'error': 'No file associated with this resource'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the file path
        file_path = resource.file.path
        
        if not os.path.exists(file_path):
            return Response(
                {'error': 'File not found on server'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Guess the content type
        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'
        
        # Read the file
        with open(file_path, 'rb') as file:
            response = HttpResponse(file.read(), content_type=content_type)
            
        # Set the Content-Disposition header to force download
        filename = os.path.basename(file_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'Failed to download file: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== COURSE ENROLLMENT ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_predefined_course(request):
    """
    Endpoint to enroll a user in a predefined course (School or Engineering)
    Expected data:
    {
        "course_type": "school" or "engineering",
        "course_id": course_id,
        "class_level": "6th" (for school courses),
        "board": "cbse" (for school courses),
        "subject": "english" (for school courses)
    }
    """
    try:
        from .models import UserStartedPredefinedCourse, SchoolCourse, EngineeringCourse
        
        user = request.user
        data = request.data
        
        course_type = data.get('course_type')
        course_id = data.get('course_id')
        
        if not course_type or not course_id:
            return Response(
                {'error': 'course_type and course_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if course_type not in ['school', 'engineering']:
            return Response(
                {'error': 'course_type must be either "school" or "engineering"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate course exists
        if course_type == 'school':
            try:
                course = SchoolCourse.objects.get(id=course_id)
            except SchoolCourse.DoesNotExist:
                return Response(
                    {'error': 'School course not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:  # engineering
            try:
                course = EngineeringCourse.objects.get(id=course_id)
            except EngineeringCourse.DoesNotExist:
                return Response(
                    {'error': 'Engineering course not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Prepare enrollment data
        course_data = {
            'course_id': course_id,
            'class_level': data.get('class_level'),
            'board': data.get('board'),
            'subject': data.get('subject'),
        }
        
        # Create or get enrollment
        enrollment, created = UserStartedPredefinedCourse.start_course(
            user=user,
            course_type=course_type,
            **course_data
        )
        
        # Prepare response data
        response_data = {
            'success': True,
            'enrollment_id': enrollment.id,
            'course_title': enrollment.get_course_title(),
            'progress_percentage': float(enrollment.progress_percentage),
            'started_at': enrollment.started_at,
            'created': created
        }
        
        if created:
            response_data['message'] = 'Successfully enrolled in course'
        else:
            response_data['message'] = 'Already enrolled in this course'
        
        return Response(response_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in start_predefined_course: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': f'Failed to start course: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enrollment_status(request, course_id):
    """Compatibility endpoint used by frontend to check if user already enrolled.

    The existing canonical endpoint is `check_course_enrollment` which requires
    both course_type and course_id. Some frontend code (e.g. SchoolCourseDetails)
    calls `/api/courses/enrollment-status/<course_id>/` without specifying the
    course type. This helper tries to infer the type by probing SchoolCourse
    first, then EngineeringCourse. Returns a simplified boolean response.
    """
    from .models import UserStartedPredefinedCourse, SchoolCourse, EngineeringCourse
    user = request.user
    course_type = None
    try:
        if SchoolCourse.objects.filter(id=course_id).exists():
            course_type = 'school'
            is_enrolled = UserStartedPredefinedCourse.objects.filter(user=user, school_course_id=course_id).exists()
        elif EngineeringCourse.objects.filter(id=course_id).exists():
            course_type = 'engineering'
            is_enrolled = UserStartedPredefinedCourse.objects.filter(user=user, engineering_course_id=course_id).exists()
        else:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'is_enrolled': is_enrolled, 'course_type': course_type})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_enrolled_courses(request):
    """
    Get all courses the user has enrolled in
    """
    try:
        from .models import UserStartedPredefinedCourse
        
        user = request.user
        
        enrollments = UserStartedPredefinedCourse.objects.filter(user=user).select_related(
            'school_course', 'engineering_course'
        ).order_by('-started_at')
        
        courses = []
        for enrollment in enrollments:
            # Build enrollment data with full course details
            enrollment_data = {
                'id': enrollment.id,
                'course_type': enrollment.course_type,
                'class_level': enrollment.class_level,
                'board': enrollment.board,
                'subject': enrollment.subject,
                'progress_percentage': float(enrollment.progress_percentage),
                'is_completed': enrollment.is_completed,
                'started_at': enrollment.started_at.isoformat() if enrollment.started_at else None,
                'last_activity': enrollment.last_activity.isoformat() if enrollment.last_activity else None,
                'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
                'school_course': None,
                'engineering_course': None
            }
            
            # Add full course details
            if enrollment.school_course:
                # Safely handle all string fields
                def safe_field(obj, field_name, default=""):
                    try:
                        value = getattr(obj, field_name, default)
                        if value is None:
                            return default
                        if isinstance(value, bytes):
                            return value.decode('utf-8', errors='ignore')
                        return str(value)
                    except (UnicodeDecodeError, AttributeError):
                        return default
                
                enrollment_data['school_course'] = {
                    'id': enrollment.school_course.id,
                    'title': safe_field(enrollment.school_course, 'title'),
                    'subject': safe_field(enrollment.school_course, 'subject'),
                    'class_level': safe_field(enrollment.school_course, 'class_level'),
                    'board': safe_field(enrollment.school_course, 'board'),
                    'state': safe_field(enrollment.school_course, 'state'),
                    'thumbnail': request.build_absolute_uri(enrollment.school_course.thumbnail.url) if enrollment.school_course.thumbnail else "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                    'duration': safe_field(enrollment.school_course, 'duration'),
                    'sources': safe_field(enrollment.school_course, 'sources'),
                    'description': safe_field(enrollment.school_course, 'description'),
                }
            elif enrollment.engineering_course:
                # Safely handle all string fields
                def safe_field(obj, field_name, default=""):
                    try:
                        value = getattr(obj, field_name, default)
                        if value is None:
                            return default
                        if isinstance(value, bytes):
                            return value.decode('utf-8', errors='ignore')
                        return str(value)
                    except (UnicodeDecodeError, AttributeError):
                        return default
                
                enrollment_data['engineering_course'] = {
                    'id': enrollment.engineering_course.id,
                    'title': safe_field(enrollment.engineering_course, 'title'),
                    'subject': safe_field(enrollment.engineering_course, 'subject'),
                    'proficiency': safe_field(enrollment.engineering_course, 'proficiency'),
                    'category': safe_field(enrollment.engineering_course, 'category'),
                    'thumbnail': request.build_absolute_uri(enrollment.engineering_course.thumbnail.url) if enrollment.engineering_course.thumbnail else "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                    'duration': safe_field(enrollment.engineering_course, 'duration'),
                    'sources': safe_field(enrollment.engineering_course, 'sources'),
                    'description': safe_field(enrollment.engineering_course, 'description'),
                }
            
            courses.append(enrollment_data)
        
        return Response({
            'success': True,
            'courses': courses,
            'total_count': len(courses)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_user_enrolled_courses: {str(e)}")
        traceback.print_exc()
        return Response({
            'success': False,
            'error': f'Failed to get enrolled courses: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_course_enrollment(request, enrollment_id):
    """
    Delete a course enrollment for the authenticated user
    """
    try:
        from .models import UserStartedPredefinedCourse
        
        user = request.user
        
        # Get the enrollment record
        try:
            enrollment = UserStartedPredefinedCourse.objects.get(
                id=enrollment_id,
                user=user
            )
        except UserStartedPredefinedCourse.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Enrollment not found or you do not have permission to delete it'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Store course info for response
        course_info = {
            'course_type': enrollment.course_type,
            'course_id': enrollment.school_course_id if enrollment.course_type == 'school' else enrollment.engineering_course_id
        }
        
        # Delete the enrollment
        enrollment.delete()
        
        return Response({
            'success': True,
            'message': 'Course enrollment removed successfully',
            'course_info': course_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in delete_course_enrollment: {str(e)}")
        traceback.print_exc()
        return Response({
            'success': False,
            'error': f'Failed to remove course enrollment: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_course_enrollment(request, course_type, course_id):
    """
    Check if user is enrolled in a specific course
    """
    try:
        from .models import UserStartedPredefinedCourse
        
        user = request.user
        
        filter_params = {'user': user, 'course_type': course_type}
        
        if course_type == 'school':
            filter_params['school_course_id'] = course_id
        elif course_type == 'engineering':
            filter_params['engineering_course_id'] = course_id
        else:
            return Response(
                {'error': 'Invalid course_type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = UserStartedPredefinedCourse.objects.get(**filter_params)
            return Response({
                'enrolled': True,
                'enrollment_id': enrollment.id,
                'progress_percentage': float(enrollment.progress_percentage),
                'started_at': enrollment.started_at,
                'last_activity': enrollment.last_activity,
                'is_completed': enrollment.is_completed
            }, status=status.HTTP_200_OK)
        except UserStartedPredefinedCourse.DoesNotExist:
            return Response({
                'enrolled': False
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in check_course_enrollment: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': f'Failed to check enrollment: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_course_progress(request, enrollment_id):
    """
    Update course progress when user completes a lesson
    """
    try:
        from .models import UserStartedPredefinedCourse
        
        user = request.user
        
        try:
            enrollment = UserStartedPredefinedCourse.objects.get(id=enrollment_id, user=user)
        except UserStartedPredefinedCourse.DoesNotExist:
            return Response(
                {'error': 'Enrollment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update progress
        enrollment.update_progress()
        
        # Get next lesson
        next_lesson = enrollment.get_next_lesson()
        
        response_data = {
            'success': True,
            'progress_percentage': float(enrollment.progress_percentage),
            'is_completed': enrollment.is_completed,
            'next_lesson': {
                'id': next_lesson.id,
                'title': next_lesson.title,
                'type': next_lesson.type
            } if next_lesson else None
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in update_course_progress: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': f'Failed to update progress: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== LEARNING ACTIVITY TRACKING API ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_learning_activity(request):
    """
    Track learning activity for the current user.
    Call this endpoint to log time spent learning.
    
    Expected payload:
    {
        "minutes": 5  // Number of minutes to add
    }
    """
    try:
        user = request.user
        minutes = int(request.data.get('minutes', 0))
        
        if minutes <= 0:
            return Response({
                'error': 'Minutes must be a positive number'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add learning time for today
        activity = LearningActivity.add_learning_time(user, minutes)
        
        return Response({
            'success': True,
            'message': f'Added {minutes} minutes of learning time',
            'data': {
                'total_today_minutes': activity.time_spent_minutes,
                'total_today_hours': activity.time_spent_hours,
                'sessions_today': activity.sessions_count,
                'date': activity.date
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response({
            'error': 'Invalid minutes value'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error in track_learning_activity: {str(e)}")
        return Response({
            'error': f'Failed to track activity: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_learning_stats(request):
    """
    Get learning statistics for the current user.
    Returns weekly hours, current streak, and today's activity.
    """
    try:
        user = request.user
        
        # Get weekly hours
        weekly_hours = LearningActivity.get_weekly_hours(user)
        
        # Get current streak
        current_streak = LearningActivity.get_current_streak(user)
        
        # Get today's activity
        from django.utils import timezone
        today = timezone.now().date()
        try:
            today_activity = LearningActivity.objects.get(user=user, date=today)
            today_minutes = today_activity.time_spent_minutes
            today_hours = today_activity.time_spent_hours
            today_sessions = today_activity.sessions_count
        except LearningActivity.DoesNotExist:
            today_minutes = 0
            today_hours = 0
            today_sessions = 0
        
        # Get this week's daily breakdown
        from datetime import timedelta
        start_of_week = today - timedelta(days=today.weekday())
        week_activities = LearningActivity.objects.filter(
            user=user,
            date__gte=start_of_week,
            date__lte=today
        ).order_by('date')
        
        daily_breakdown = []
        for i in range(7):  # Monday to Sunday
            check_date = start_of_week + timedelta(days=i)
            day_activity = week_activities.filter(date=check_date).first()
            daily_breakdown.append({
                'date': check_date,
                'day_name': check_date.strftime('%A')[:3],  # Mon, Tue, etc.
                'minutes': day_activity.time_spent_minutes if day_activity else 0,
                'hours': day_activity.time_spent_hours if day_activity else 0,
                'sessions': day_activity.sessions_count if day_activity else 0,
                'has_activity': bool(day_activity)
            })
        
        return Response({
            'success': True,
            'data': {
                'weekly_hours': weekly_hours,
                'current_streak': current_streak,
                'today': {
                    'minutes': today_minutes,
                    'hours': today_hours,
                    'sessions': today_sessions
                },
                'weekly_breakdown': daily_breakdown
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_learning_stats: {str(e)}")
        return Response({
            'error': f'Failed to get learning stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_course(request, course_id):
    """
    Delete a course (both school and engineering courses)
    """
    try:
        # Try to find the course in SchoolCourse first
        school_course = None
        engineering_course = None
        
        try:
            school_course = get_object_or_404(SchoolCourse, id=course_id)
            course_type = 'school'
        except Http404:
            try:
                engineering_course = get_object_or_404(EngineeringCourse, id=course_id)
                course_type = 'engineering'
            except Http404:
                return Response({
                    'error': 'Course not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Delete the course
        if school_course:
            course_title = school_course.title
            school_course.delete()
        else:
            course_title = engineering_course.title
            engineering_course.delete()
        
        return Response({
            'success': True,
            'message': f'Course "{course_title}" deleted successfully',
            'course_type': course_type
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in delete_course: {str(e)}")
        return Response({
            'error': f'Failed to delete course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([AllowAny])
def update_course(request, course_id):
    """
    Update a course (both school and engineering courses)
    """
    try:
        data = request.data
        print("Received update data:", data)  # Debug print
        
        # Try to find the course in SchoolCourse first
        school_course = None
        engineering_course = None
        
        try:
            school_course = get_object_or_404(SchoolCourse, id=course_id)
            course_type = 'school'
        except Http404:
            try:
                engineering_course = get_object_or_404(EngineeringCourse, id=course_id)
                course_type = 'engineering'
            except Http404:
                return Response({
                    'error': 'Course not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Update School Course
        if school_course:
            # Update basic fields
            if 'title' in data:
                school_course.title = data.get('title')
            if 'class_level' in data:
                school_course.class_level = data.get('class_level')
            if 'board' in data:
                school_course.board = data.get('board')
            if 'state' in data:
                school_course.state = data.get('state', '')
            if 'subject' in data:
                school_course.subject = data.get('subject')
            if 'sources' in data:
                school_course.sources = data.get('sources', '')
            if 'duration' in data:
                school_course.duration = data.get('duration', '')
            if 'description' in data:
                school_course.description = data.get('description')
            if 'short_description' in data or 'shortDescription' in data:
                school_course.short_description = data.get('short_description', data.get('shortDescription', ''))
            if 'is_published' in data:
                # Handle string to boolean conversion for FormData
                is_published_value = data.get('is_published', False)
                if isinstance(is_published_value, str):
                    school_course.is_published = is_published_value.lower() in ('true', '1', 'yes', 'on')
                else:
                    school_course.is_published = bool(is_published_value)
                
            # Handle key_topics and learning_points
            if 'key_topics' in data:
                try:
                    key_topics_data = data.get('key_topics', '[]')
                    if not key_topics_data.strip():
                        key_topics_data = '[]'
                    school_course.key_topics = json.loads(key_topics_data)
                except (json.JSONDecodeError, AttributeError):
                    school_course.key_topics = []
            elif 'keyTopics' in data:
                try:
                    key_topics_data = data.get('keyTopics', '[]')
                    if not key_topics_data.strip():
                        key_topics_data = '[]'
                    school_course.key_topics = json.loads(key_topics_data)
                except (json.JSONDecodeError, AttributeError):
                    school_course.key_topics = []
                    
            if 'learning_points' in data:
                try:
                    learning_points_data = data.get('learning_points', '[]')
                    if not learning_points_data.strip():
                        learning_points_data = '[]'
                    school_course.learning_points = json.loads(learning_points_data)
                except (json.JSONDecodeError, AttributeError):
                    school_course.learning_points = []
            elif 'learningPoints' in data:
                try:
                    learning_points_data = data.get('learningPoints', '[]')
                    if not learning_points_data.strip():
                        learning_points_data = '[]'
                    school_course.learning_points = json.loads(learning_points_data)
                except (json.JSONDecodeError, AttributeError):
                    school_course.learning_points = []
            
            # Handle thumbnail update
            if 'thumbnail' in request.FILES:
                school_course.thumbnail = request.FILES['thumbnail']
            
            school_course.save()
            course = school_course
            
        # Update Engineering Course
        else:
            # Update basic fields
            if 'title' in data:
                engineering_course.title = data.get('title')
            if 'category' in data:
                engineering_course.category = data.get('category')
            if 'proficiency_level' in data:
                # Map proficiency_level to proficiency field in model
                engineering_course.proficiency = data.get('proficiency_level')
            if 'sources' in data:
                engineering_course.sources = data.get('sources', '')
            if 'duration' in data:
                engineering_course.duration = data.get('duration', '')
            if 'description' in data:
                engineering_course.description = data.get('description')
            if 'short_description' in data or 'shortDescription' in data:
                engineering_course.short_description = data.get('short_description', data.get('shortDescription', ''))
            if 'is_published' in data:
                # Handle string to boolean conversion for FormData
                is_published_value = data.get('is_published', False)
                if isinstance(is_published_value, str):
                    engineering_course.is_published = is_published_value.lower() in ('true', '1', 'yes', 'on')
                else:
                    engineering_course.is_published = bool(is_published_value)
            if 'certificate' in data:
                # Map certificate to certificate_given boolean field
                certificate_value = data.get('certificate', '')
                engineering_course.certificate_given = bool(certificate_value and certificate_value != 'No Certificate')
                
            # Handle learning_objectives (map to learning_points in model)
            if 'learning_objectives' in data:
                try:
                    objectives_data = data.get('learning_objectives', '[]')
                    if not objectives_data.strip():
                        objectives_data = '[]'
                    engineering_course.learning_points = json.loads(objectives_data)
                except (json.JSONDecodeError, AttributeError):
                    engineering_course.learning_points = []
            elif 'learningObjectives' in data:
                try:
                    objectives_data = data.get('learningObjectives', '[]')
                    if not objectives_data.strip():
                        objectives_data = '[]'
                    engineering_course.learning_points = json.loads(objectives_data)
                except (json.JSONDecodeError, AttributeError):
                    engineering_course.learning_points = []
            
            # Handle prerequisites (map to requirements in model)
            if 'prerequisites' in data:
                try:
                    prereq_data = data.get('prerequisites', '[]')
                    if not prereq_data.strip():
                        prereq_data = '[]'
                    engineering_course.requirements = json.loads(prereq_data)
                except (json.JSONDecodeError, AttributeError):
                    engineering_course.requirements = []
                    
            # Handle course_content (note: this field may not exist in model, so we'll skip errors)
            # Note: course_content is not in the current model, so we'll just ignore it for now
            
            # Handle thumbnail update
            if 'thumbnail' in request.FILES:
                engineering_course.thumbnail = request.FILES['thumbnail']
            
            engineering_course.save()
            course = engineering_course
        
        # Return updated course data
        course_data = {
            'id': str(course.id),
            'title': course.title,
            'description': course.description,
            'short_description': course.short_description,
            'thumbnail': course.thumbnail.url if course.thumbnail else None,
            'duration': course.duration,
            'is_published': course.is_published,
            'course_type': course_type,
            'last_updated': course.last_updated,
            'created_at': course.created_at,
        }
        
        # Add type-specific fields
        if course_type == 'school':
            course_data.update({
                'class_level': course.class_level,
                'board': course.board,
                'state': course.state,
                'subject': course.subject,
                'sources': course.sources,
                'key_topics': course.key_topics,
                'learning_points': course.learning_points,
                'class': course.class_level,
                'category': course.subject,
            })
        else:
            course_data.update({
                'category': course.category,
                'proficiency_level': getattr(course, 'proficiency', 'beginner'),
                'learning_objectives': course.learning_points or [],
                'prerequisites': course.requirements or [],
                'sources': course.sources or '',
                'certificate': 'Certificate of Completion' if getattr(course, 'certificate_given', False) else '',
                'price': str(getattr(course, 'price', 0)),
                'course_content': getattr(course, 'course_content', []),
            })
        
        return Response({
            'success': True,
            'message': f'Course "{course.title}" updated successfully',
            'course': course_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in update_course: {str(e)}")
        traceback.print_exc()
        return Response({
            'error': f'Failed to update course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def get_course_by_id(request, course_id):
    """
    Get a specific course by ID (both school and engineering courses)
    """
    try:
        # Try to find the course in SchoolCourse first
        school_course = None
        engineering_course = None
        
        try:
            school_course = get_object_or_404(SchoolCourse, id=course_id)
            course_type = 'school'
        except Http404:
            try:
                engineering_course = get_object_or_404(EngineeringCourse, id=course_id)
                course_type = 'engineering'
            except Http404:
                return Response({
                    'error': 'Course not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Get course data
        if school_course:
            course = school_course
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'description': course.description,
                'short_description': course.short_description,
                'thumbnail': course.thumbnail.url if course.thumbnail else None,
                'duration': course.duration,
                'is_published': course.is_published,
                'course_type': course_type,
                'last_updated': course.last_updated,
                'created_at': course.created_at,
                'class_level': course.class_level,
                'board': course.board,
                'state': course.state,
                'subject': course.subject,
                'sources': course.sources,
                'key_topics': course.key_topics,
                'learning_points': course.learning_points,
                'class': course.class_level,
                'category': course.subject,
                # Include chapters and lessons
                'chapters': []
            }
            
            # Get chapters and lessons for school courses
            chapters = course.chapters.all().order_by('order')
            for chapter in chapters:
                chapter_data = {
                    'id': chapter.id,
                    'name': chapter.name,
                    'order': chapter.order,
                    'lessons': []
                }
                
                lessons = chapter.lessons.all().order_by('order')
                for lesson in lessons:
                    lesson_data = {
                        'id': lesson.id,
                        'title': lesson.title,
                        'type': lesson.type,
                        'video_url': lesson.video_url,
                        'description': lesson.description,
                        'about_lesson': lesson.about_lesson,
                        'order': lesson.order,
                        'resources': [],
                        'quiz_questions': []
                    }
                    
                    # Get lesson resources
                    resources = lesson.resources.all()
                    for resource in resources:
                        resource_data = {
                            'id': resource.id,
                            'type': resource.type,
                            'title': resource.title,
                            'description': resource.description,
                            'url': resource.url,
                            'file': resource.file.url if resource.file else None
                        }
                        lesson_data['resources'].append(resource_data)
                    
                    # Get quiz questions
                    quiz_questions = lesson.quiz_questions.all()
                    for question in quiz_questions:
                        question_data = {
                            'id': question.id,
                            'question': question.question,
                            'options': question.options,
                            'correct_answer': question.correct_answer
                        }
                        lesson_data['quiz_questions'].append(question_data)
                    
                    chapter_data['lessons'].append(lesson_data)
                
                course_data['chapters'].append(chapter_data)
        else:
            course = engineering_course
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'description': course.description,
                'short_description': course.short_description,
                'thumbnail': course.thumbnail.url if course.thumbnail else None,
                'duration': course.duration,
                'is_published': course.is_published,
                'course_type': course_type,
                'last_updated': course.last_updated,
                'created_at': course.created_at,
                'category': course.category,
                # Map model fields to expected edit form fields
                'proficiency_level': getattr(course, 'proficiency', 'beginner'),
                'learning_objectives': course.learning_points or [],
                'prerequisites': course.requirements or [],
                'course_content': getattr(course, 'course_content', []),
                'sources': course.sources or '',
                'certificate': 'Certificate of Completion' if getattr(course, 'certificate_given', False) else '',
                'price': str(getattr(course, 'price', 0)),
                # Include sections and lessons
                'sections': []
            }
            
            # Get sections and lessons for engineering courses
            sections = course.sections.all().order_by('order')
            for section in sections:
                section_data = {
                    'id': section.id,
                    'name': section.name,
                    'order': section.order,
                    'lessons': []
                }
                
                lessons = section.lessons.all().order_by('order')
                for lesson in lessons:
                    lesson_data = {
                        'id': lesson.id,
                        'title': lesson.title,
                        'type': lesson.type,
                        'video_url': lesson.video_url,
                        'description': lesson.description,
                        'about_lesson': lesson.about_lesson,
                        'order': lesson.order,
                        'resources': [],
                        'quiz_questions': []
                    }
                    
                    # Get lesson resources
                    resources = lesson.resources.all()
                    for resource in resources:
                        resource_data = {
                            'id': resource.id,
                            'type': resource.type,
                            'title': resource.title,
                            'description': resource.description,
                            'url': resource.url,
                            'file': resource.file.url if resource.file else None
                        }
                        lesson_data['resources'].append(resource_data)
                    
                    # Get quiz questions
                    quiz_questions = lesson.quiz_questions.all()
                    for question in quiz_questions:
                        question_data = {
                            'id': question.id,
                            'question': question.question,
                            'options': question.options,
                            'correct_answer': question.correct_answer
                        }
                        lesson_data['quiz_questions'].append(question_data)
                    
                    section_data['lessons'].append(lesson_data)
                
                course_data['sections'].append(section_data)
        
        return Response(course_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_course_by_id: {str(e)}")
        return Response({
            'error': f'Failed to get course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
