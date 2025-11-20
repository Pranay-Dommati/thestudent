from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404, FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import SchoolCourse, EngineeringCourse, Lesson, UserLessonProgress, LessonResource, LearningActivity, UserStartedPredefinedCourse, Certification
from .serializers import (
    CourseWithChaptersSerializer, EngineeringCourseWithSectionsSerializer, CertificationSerializer,
    CourseStructureSerializer, EngineeringCourseStructureSerializer, LessonSerializer
)
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
import io
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.text import get_valid_filename
from urllib.parse import quote as urlquote
from django.db.models import Count
from django.db.models import Q
from django.core.files.storage import default_storage
from django.urls import reverse

# Module-level helper: build robust thumbnail URL with file-existence check and placeholder fallback
def _build_thumbnail_url(obj_with_thumbnail, request):
    placeholder = os.environ.get(
        'DEFAULT_THUMBNAIL_PLACEHOLDER',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb'
    )
    try:
        thumb = getattr(obj_with_thumbnail, 'thumbnail', None)
        if thumb and getattr(thumb, 'name', None):
            storage = getattr(thumb, 'storage', None) or default_storage
            if storage.exists(thumb.name):
                url = thumb.url
                if isinstance(url, str) and url.lower().startswith('http'):
                    return url
                return request.build_absolute_uri(url)
    except Exception as e:
        if settings.DEBUG:
            print(f"[WARN] build thumbnail url failed: {e}")
    return placeholder

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def create_course(request):
    """
    Creates a new course based on the education level
    """
    data = request.data
    if settings.DEBUG:
        print("Received data:", data)
    
    try:
        # Global payload guard (approximate): reject clearly oversized multipart bodies
        content_length = request.META.get('CONTENT_LENGTH')
        try:
            if content_length and int(content_length) > getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024) * 3:
                return Response({'error': 'Payload too large'}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        except Exception:
            pass
        # Helper to parse list-like fields coming from JSON or multipart forms
        def _parse_list_field(val, default=None):
            if default is None:
                default = []
            if val is None:
                return list(default)
            # If already a list/tuple, return as list
            if isinstance(val, (list, tuple)):
                return list(val)
            # If it's a string, try to json.loads it
            if isinstance(val, str):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, (list, tuple)):
                        return list(parsed)
                    return list(default)
                except Exception:
                    return list(default)
            # Fallback
            return list(default)
        
        # Helper: build robust thumbnail URL with file-existence check and placeholder fallback
        def _build_thumbnail_url(obj_with_thumbnail, request):
            placeholder = os.environ.get(
                'DEFAULT_THUMBNAIL_PLACEHOLDER',
                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb'
            )
            try:
                thumb = getattr(obj_with_thumbnail, 'thumbnail', None)
                if thumb and getattr(thumb, 'name', None):
                    storage = getattr(thumb, 'storage', None) or default_storage
                    if storage.exists(thumb.name):
                        url = thumb.url
                        if isinstance(url, str) and url.lower().startswith('http'):
                            return url
                        return request.build_absolute_uri(url)
            except Exception as e:
                if settings.DEBUG:
                    print(f"[WARN] build thumbnail url failed: {e}")
            return placeholder
        # Helper: validate and attach thumbnail
        def _attach_thumbnail(files_dict, key='thumbnail'):
            if key not in files_dict:
                return None
            f = files_dict[key]
            # Enforce max size (5MB default)
            max_bytes = int(os.environ.get('MAX_THUMBNAIL_SIZE', 5 * 1024 * 1024))
            if getattr(f, 'size', 0) > max_bytes:
                raise ValueError('Thumbnail too large')
            # Validate content type
            ctype = getattr(f, 'content_type', '')
            if not ctype or not any(ctype.lower().startswith(p) for p in ['image/jpeg', 'image/png', 'image/jpg']):
                raise ValueError('Invalid thumbnail type')
            # Sanitize file name
            f.name = get_valid_filename(f.name)[:100]
            return f

        # Reasonable caps to avoid abuse
        MAX_SECTIONS = int(os.environ.get('MAX_SECTIONS', '50'))
        MAX_LESSONS_PER_SECTION = int(os.environ.get('MAX_LESSONS_PER_SECTION', '200'))
        MAX_RESOURCES_PER_LESSON = int(os.environ.get('MAX_RESOURCES_PER_LESSON', '50'))
        MAX_QUIZ_PER_LESSON = int(os.environ.get('MAX_QUIZ_PER_LESSON', '100'))

        # Helper to fetch first present value among multiple possible keys (snake/camel compatibility)
        def _first(keys, default=''):
            for k in keys:
                if k in data and data.get(k) not in (None, ''):
                    return data.get(k)
            return default

        # For School courses (10th, 11th, 12th)
        if 'class_level' in data or 'classLevel' in data or 'educationLevel' in data:
            # Extract the form data
            course_data = {
                'title': _first(['title', 'courseTitle']),
                # Accept common variants from frontend
                'class_level': _first(['class_level', 'classLevel', 'educationLevel']),
                'board': _first(['board', 'Board', 'educationBoard']),
                'state': _first(['state', 'State']),
                'subject': _first(['subject', 'Subject', 'courseSubject']),
                'sources': _first(['sources']),
                'duration': _first(['duration']),
                'is_published': True,
            }
            
            # Handle key_topics and learning_points
            # Accept both key_topics/learning_points (snake_case) and keyTopics/learningPoints (camelCase) 
            # for backwards compatibility with existing code
            if 'key_topics' in data or 'keyTopics' in data:
                course_data['key_topics'] = _parse_list_field(data.get('key_topics', data.get('keyTopics')))
            else:
                course_data['key_topics'] = []

            if 'learning_points' in data or 'learningPoints' in data:
                course_data['learning_points'] = _parse_list_field(data.get('learning_points', data.get('learningPoints')))
            else:
                course_data['learning_points'] = []
            
            # If 'shortDescription' is in data, use it, otherwise use title
            course_data['short_description'] = data.get('shortDescription', course_data.get('title', ''))
            # If 'description' is in data, use it, otherwise generate one
            course_data['description'] = data.get(
                'description',
                f"{course_data.get('title')} - {course_data.get('class_level')} - {course_data.get('subject')}"
            )
            
            # Validate required fields
            missing_fields = []
            for field in ['title', 'class_level', 'board', 'subject']:
                if not course_data.get(field):
                    missing_fields.append(field)
            
            if missing_fields:
                detail = {'error': f'Missing required fields: {", ".join(missing_fields)}'}
                if settings.DEBUG:
                    detail['received_keys'] = list(data.keys())
                return Response(detail, status=status.HTTP_400_BAD_REQUEST)
            
            if 'thumbnail' in request.FILES:
                try:
                    course_data['thumbnail'] = _attach_thumbnail(request.FILES, 'thumbnail')
                except ValueError as ve:
                    return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the school course
            serializer = CourseWithChaptersSerializer(data=course_data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Process chapters
                chapters_data = _parse_list_field(data.get('chapters', []))
                
                # Extract resource files info if available
                resource_files_info = {}
                if 'resourceFilesInfo' in data:
                    resource_file_ids = _parse_list_field(data.get('resourceFilesInfo', []))
                    # Create a mapping of file IDs to actual file objects
                    for file_id in resource_file_ids:
                        if file_id in request.FILES:
                            resource_files_info[file_id] = request.FILES[file_id]
                
                if len(chapters_data) > MAX_SECTIONS:
                    return Response({'error': 'Too many chapters'}, status=status.HTTP_400_BAD_REQUEST)
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
                    lessons_list = chapter_data.get('lessons', [])
                    if len(lessons_list) > MAX_LESSONS_PER_SECTION:
                        return Response({'error': 'Too many lessons in a chapter'}, status=status.HTTP_400_BAD_REQUEST)
                    for lesson_idx, lesson_data in enumerate(lessons_list):
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
                                    res_list = resources[res_type]
                                    if len(res_list) > MAX_RESOURCES_PER_LESSON:
                                        return Response({'error': 'Too many resources in a lesson'}, status=status.HTTP_400_BAD_REQUEST)
                                    for res_data in res_list:
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
                            if len(lesson_data['quizQuestions']) > MAX_QUIZ_PER_LESSON:
                                return Response({'error': 'Too many quiz questions in a lesson'}, status=status.HTTP_400_BAD_REQUEST)
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
                if settings.DEBUG:
                    print("Serializer errors:", serializer.errors)
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
                'learning_points': _parse_list_field(data.get('learningPoints', [])),
                'requirements': _parse_list_field(data.get('requirements', [])),
                'category': data.get('category', ''),  # Make sure to set the category
                'is_published': True,  # Set it as published by default
            }
            
            if 'thumbnail' in request.FILES:
                try:
                    course_data['thumbnail'] = _attach_thumbnail(request.FILES, 'thumbnail')
                except ValueError as ve:
                    return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
                
            # Create the engineering course
            serializer = EngineeringCourseWithSectionsSerializer(data=course_data)
            if serializer.is_valid():
                course = serializer.save()
                
                # Process sections
                sections_data = _parse_list_field(data.get('sections', []))
                
                # Extract resource files info if available
                resource_files_info = {}
                if 'resourceFilesInfo' in data:
                    resource_file_ids = _parse_list_field(data.get('resourceFilesInfo', []))
                    # Create a mapping of file IDs to actual file objects
                    for file_id in resource_file_ids:
                        if file_id in request.FILES:
                            resource_files_info[file_id] = request.FILES[file_id]
                
                if len(sections_data) > MAX_SECTIONS:
                    return Response({'error': 'Too many sections'}, status=status.HTTP_400_BAD_REQUEST)
                for idx, section_data in enumerate(sections_data):
                    section = course.sections.create(
                        name=section_data.get('name', f'Section {idx+1}'),
                        order=idx
                    )
                    
                    # Process lessons for each section
                    lessons_list = section_data.get('lessons', [])
                    if len(lessons_list) > MAX_LESSONS_PER_SECTION:
                        return Response({'error': 'Too many lessons in a section'}, status=status.HTTP_400_BAD_REQUEST)
                    for lesson_idx, lesson_data in enumerate(lessons_list):
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
                                    res_list = resources[res_type]
                                    if len(res_list) > MAX_RESOURCES_PER_LESSON:
                                        return Response({'error': 'Too many resources in a lesson'}, status=status.HTTP_400_BAD_REQUEST)
                                    for res_data in res_list:
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
                            if len(lesson_data['quizQuestions']) > MAX_QUIZ_PER_LESSON:
                                return Response({'error': 'Too many quiz questions in a lesson'}, status=status.HTTP_400_BAD_REQUEST)
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
                if settings.DEBUG:
                    print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response(
                {'error': 'Invalid course data - missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        if settings.DEBUG:
            print(traceback.format_exc())
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
        if settings.DEBUG:
            print(f"Requested category: {category}")
        
        # Public listing should only include published courses
        queryset = EngineeringCourse.objects.filter(is_published=True)
        if settings.DEBUG:
            print(f"Total courses before filtering: {queryset.count()}")
        
        if category != 'all' and category != '':
            queryset = queryset.filter(category=category)
            if settings.DEBUG:
                print(f"Courses after category filter: {queryset.count()}")

        # Process course data
        courses_data = []
        for course in queryset:
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': _build_thumbnail_url(course, request),
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

        if settings.DEBUG:
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
@authentication_classes([JWTAuthentication])
def get_engineering_course_by_id(request, course_id):
    try:
        course = EngineeringCourse.objects.get(id=course_id)
        
        # Check if we only want the structure (lightweight)
        structure_only = request.query_params.get('structure_only', 'false').lower() == 'true'
        
        if structure_only:
            serializer = EngineeringCourseStructureSerializer(course, context={'request': request})
            return Response(serializer.data)
            
        # Include request in serializer context so lesson completion flags compute correctly
        serializer = EngineeringCourseWithSectionsSerializer(course, context={'request': request})
        data = serializer.data

        # Preview gating for unauthenticated users
        # Expose only first K sections, and within each of those,
        # unlock only first L lessons (scrub the rest).
        try:
            preview_limit = int(os.environ.get('PREVIEW_SECTIONS_LIMIT', '2'))  # K
        except Exception:
            preview_limit = 2
        try:
            preview_lessons = int(os.environ.get('PREVIEW_LESSONS_PER_SECTION', '3'))  # L
        except Exception:
            preview_lessons = 3

        is_auth = request.user.is_authenticated if hasattr(request, 'user') else False

        if not is_auth:
            sections = data.get('sections') or []
            gated_sections = []
            for s_idx, section in enumerate(sections):
                sec = dict(section)
                lessons = sec.get('lessons') or []
                new_lessons = []
                if s_idx < preview_limit:
                    # First K sections: unlock only first L lessons
                    sec['is_preview'] = True
                    sec['is_locked'] = False
                    for l_idx, l in enumerate(lessons):
                        ld = dict(l)
                        if l_idx < preview_lessons:
                            ld['is_preview'] = True
                            ld['is_locked'] = False
                        else:
                            # Scrub content for non-preview lessons in preview sections
                            ld['is_preview'] = False
                            ld['is_locked'] = True
                            ld['video_url'] = None
                            ld['resources'] = {'downloadable': [], 'internet': []}
                            ld['quiz_questions'] = []
                else:
                    # Sections beyond preview limit are fully locked
                    sec['is_preview'] = False
                    sec['is_locked'] = True
                    scrubbed = []
                    for l in lessons:
                        ld = dict(l)
                        ld['is_preview'] = False
                        ld['is_locked'] = True
                        ld['video_url'] = None
                        ld['resources'] = {'downloadable': [], 'internet': []}
                        ld['quiz_questions'] = []
                        scrubbed.append(ld)
                    sec['lessons'] = scrubbed
                gated_sections.append(sec)

            data['sections'] = gated_sections
            data['preview'] = {
                'sections_unlocked': min(preview_limit, len(gated_sections)),
                'lessons_per_section_unlocked': preview_lessons,
                'message': 'Login to unlock all content, quizzes and resources'
            }
        else:
            # Provide explicit flags for UI convenience
            for sec in data.get('sections') or []:
                sec['is_preview'] = False
                sec['is_locked'] = False

        return Response(data)
    except EngineeringCourse.DoesNotExist:
        return Response(
            {"error": "Course not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([JWTAuthentication])
def get_school_course_by_id(request, course_id):
    try:
        course = SchoolCourse.objects.get(id=course_id)
        
        # Check if we only want the structure (lightweight)
        structure_only = request.query_params.get('structure_only', 'false').lower() == 'true'
        
        if structure_only:
            serializer = CourseStructureSerializer(course, context={'request': request})
            return Response(serializer.data)
            
        serializer = CourseWithChaptersSerializer(course, context={'request': request})
        data = serializer.data

        # Apply similar preview gating for school courses by chapters
        try:
            preview_limit = int(os.environ.get('PREVIEW_SECTIONS_LIMIT', '2'))
        except Exception:
            preview_limit = 2
        try:
            preview_lessons = int(os.environ.get('PREVIEW_LESSONS_PER_SECTION', '3'))
        except Exception:
            preview_lessons = 3

        is_auth = request.user.is_authenticated if hasattr(request, 'user') else False

        if not is_auth:
            chapters = data.get('chapters') or []
            gated_chapters = []
            for c_idx, chapter in enumerate(chapters):
                ch = dict(chapter)
                lessons = ch.get('lessons') or []
                new_lessons = []
                if c_idx < preview_limit:
                    ch['is_preview'] = True
                    ch['is_locked'] = False
                    for l_idx, l in enumerate(lessons):
                        ld = dict(l)
                        if l_idx < preview_lessons:
                            ld['is_preview'] = True
                            ld['is_locked'] = False
                        else:
                            ld['is_preview'] = False
                            ld['is_locked'] = True
                            ld['video_url'] = None
                            ld['resources'] = {'downloadable': [], 'internet': []}
                            ld['quiz_questions'] = []
                        new_lessons.append(ld)
                    ch['lessons'] = new_lessons
                else:
                    ch['is_preview'] = False
                    ch['is_locked'] = True
                    scrubbed = []
                    for l in lessons:
                        ld = dict(l)
                        ld['is_preview'] = False
                        ld['is_locked'] = True
                        ld['video_url'] = None
                        ld['resources'] = {'downloadable': [], 'internet': []}
                        ld['quiz_questions'] = []
                        scrubbed.append(ld)
                    ch['lessons'] = scrubbed
                gated_chapters.append(ch)

            data['chapters'] = gated_chapters
            data['preview'] = {
                'sections_unlocked': min(preview_limit, len(gated_chapters)),
                'lessons_per_section_unlocked': preview_lessons,
                'message': 'Login to unlock all chapters and resources'
            }
        else:
            for ch in data.get('chapters') or []:
                ch['is_preview'] = False
                ch['is_locked'] = False

        return Response(data)
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
        
        # Process engineering courses (only published for public listing)
        eng_queryset = EngineeringCourse.objects.filter(is_published=True)
        if category != 'all' and category != '' and category != 'school':
            eng_queryset = eng_queryset.filter(category=category)
        
        # Process school courses (only published for public listing)
        school_queryset = SchoolCourse.objects.filter(is_published=True)
        if category == 'school':
            eng_queryset = EngineeringCourse.objects.none()  # Empty if only school courses requested
        
        # Combine both types of courses
        courses_data = []
        
        # Engineering courses
        for course in eng_queryset:
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': _build_thumbnail_url(course, request),
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
                'thumbnail': _build_thumbnail_url(course, request),
                'short_description': course.short_description,
                'course_type': 'school',
                'category': course.subject,
                'class': f"{course.class_level} - {course.board}",
                'last_updated': course.last_updated,
                'is_published': course.is_published
            }
            courses_data.append(course_data)

        if settings.DEBUG:
            print(f"Successfully processed {len(courses_data)} courses")
        return Response(courses_data)
        
    except Exception as e:
        if settings.DEBUG:
            print(f"Error in list_all_courses: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Internal server error", "details": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

###############################################
# Admin analytics: Enrollment stats and details
###############################################

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def admin_enrollment_stats(request):
    """Return enrollment counts grouped by course for admin analytics.

    Response shape:
    {
      "total_courses": 33,
      "total_enrollments": 45,
      "items": [
         {"course_id": "uuid", "title": "...", "type": "Engineering|School", "enrollments": 7, "published": true}
      ]
    }
    """
    try:
        from .models import UserStartedPredefinedCourse as USP

        # Pre-compute counts for each course type
        eng_counts_qs = (
            USP.objects.filter(course_type='engineering', engineering_course__isnull=False)
            .values('engineering_course_id')
            .annotate(c=Count('id'))
        )
        eng_count_map = {str(row['engineering_course_id']): int(row['c'] or 0) for row in eng_counts_qs}

        sch_counts_qs = (
            USP.objects.filter(course_type='school', school_course__isnull=False)
            .values('school_course_id')
            .annotate(c=Count('id'))
        )
        sch_count_map = {str(row['school_course_id']): int(row['c'] or 0) for row in sch_counts_qs}

        items = []
        total_enrollments = 0

        # List all engineering courses
        for c in EngineeringCourse.objects.all().only('id', 'title', 'is_published'):
            cid = str(c.id)
            cnt = eng_count_map.get(cid, 0)
            total_enrollments += cnt
            items.append({
                'course_id': cid,
                'title': c.title,
                'type': 'Engineering',
                'enrollments': cnt,
                'published': bool(getattr(c, 'is_published', False)),
            })

        # List all school courses
        for c in SchoolCourse.objects.all().only('id', 'title', 'is_published'):
            cid = str(c.id)
            cnt = sch_count_map.get(cid, 0)
            total_enrollments += cnt
            items.append({
                'course_id': cid,
                'title': c.title,
                'type': 'School',
                'enrollments': cnt,
                'published': bool(getattr(c, 'is_published', False)),
            })

        # Sort by enrollments desc, then title
        items.sort(key=lambda x: (-int(x.get('enrollments', 0)), (x.get('title') or '').lower()))

        return Response({
            'total_courses': len(items),
            'total_enrollments': total_enrollments,
            'items': items,
        })
    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def admin_course_enrollments(request, course_type, course_id):
    """Return the list of users enrolled in a given course for admin.

    Response:
    {
      "course": {"id": "uuid", "title": "...", "type": "Engineering|School"},
      "count": 3,
      "enrollments": [
         {"user_id": 1, "name": "Alice", "email": "a@x", "enrolled_at": "ISO", "last_activity": "ISO"}
      ]
    }
    """
    try:
        from .models import UserStartedPredefinedCourse as USP
        course_type = (course_type or '').lower()

        # Validate course and build base filter
        if course_type == 'engineering':
            course = get_object_or_404(EngineeringCourse, id=course_id)
            qs = USP.objects.filter(course_type='engineering', engineering_course_id=course_id)
            ctitle = getattr(course, 'title', str(course_id))
            ctype = 'Engineering'
        elif course_type == 'school':
            course = get_object_or_404(SchoolCourse, id=course_id)
            qs = USP.objects.filter(course_type='school', school_course_id=course_id)
            ctitle = getattr(course, 'title', str(course_id))
            ctype = 'School'
        else:
            return Response({'error': 'Invalid course_type'}, status=status.HTTP_400_BAD_REQUEST)

        qs = qs.select_related('user').order_by('-started_at')

        def safe_name(u):
            try:
                return (getattr(u, 'full_name', None) or getattr(u, 'first_name', None) or getattr(u, 'username', None) or '').strip() or u.email
            except Exception:
                return getattr(u, 'email', '')

        enrollments = []
        for e in qs:
            u = getattr(e, 'user', None)
            enrollments.append({
                'user_id': getattr(u, 'id', None),
                'name': safe_name(u) if u else None,
                'email': getattr(u, 'email', None) if u else None,
                'enrolled_at': e.started_at.isoformat() if getattr(e, 'started_at', None) else None,
                'last_activity': e.last_activity.isoformat() if getattr(e, 'last_activity', None) else None,
                'is_completed': bool(getattr(e, 'is_completed', False)),
                'progress_percentage': float(getattr(e, 'progress_percentage', 0) or 0),
            })

        return Response({
            'course': {'id': str(course_id), 'title': ctitle, 'type': ctype},
            'count': len(enrollments),
            'enrollments': enrollments,
        })
    except Http404:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def list_school_courses(request):
    try:
        class_level = request.query_params.get('class', '')
        board = request.query_params.get('board', '')
        state = request.query_params.get('state', '')
        subject = request.query_params.get('subject', '')

        if settings.DEBUG:
            print(f"Filtering courses: class={class_level}, board={board}, state={state}, subject={subject}")

        queryset = SchoolCourse.objects.all()
        
        # Apply filters
        if class_level:
            queryset = queryset.filter(class_level=class_level)

        if board:
            queryset = queryset.filter(board__iexact=board)

        if subject:
            # Log the subject being searched for debugging
            if settings.DEBUG:
                print(f"Searching for subject: '{subject}'")
            
            # Use iexact for case-insensitive but exact subject matching
            queryset = queryset.filter(subject__iexact=subject)
            
            # If no results with iexact, try icontains as fallback
            if queryset.count() == 0:
                if settings.DEBUG:
                    print(f"No exact matches found for subject '{subject}', trying partial match")
                queryset = SchoolCourse.objects.filter(
                    class_level=class_level,
                    board__iexact=board,
                    subject__icontains=subject
                )
            
        if board == 'state' and state:
            # Use icontains for more flexible state matching
            queryset = queryset.filter(state__icontains=state)

        if settings.DEBUG:
            print(f"Found {queryset.count()} courses matching the criteria:")
            for course in queryset:
                print(f"Course: {course.title}, Board: {course.board}, Class: {course.class_level}, State: {course.state}")

        # Serialize and return the courses
        courses_data = [
            {
                'id': str(course.id),
                'title': course.title,
                'thumbnail': _build_thumbnail_url(course, request),
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
        if settings.DEBUG:
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

        # Persist progress to the user's enrollment so Learning Hub reflects updates
        try:
            from .models import UserStartedPredefinedCourse

            enrollment_qs = UserStartedPredefinedCourse.objects.filter(user=user)
            if lesson.chapter and course:
                # School course enrollment
                enrollment_qs = enrollment_qs.filter(course_type='school', school_course=course)
            elif lesson.section and course:
                # Engineering course enrollment
                enrollment_qs = enrollment_qs.filter(course_type='engineering', engineering_course=course)

            enrollment = enrollment_qs.first()
            if enrollment:
                # Update persisted progress and completion flags
                enrollment.progress_percentage = progress_percentage
                enrollment.is_completed = progress_percentage == 100
                # Track last accessed lesson for resume UX
                enrollment.last_accessed_lesson = lesson
                if enrollment.is_completed and not enrollment.completed_at:
                    enrollment.completed_at = timezone.now()
                enrollment.save(update_fields=['progress_percentage', 'is_completed', 'last_accessed_lesson', 'completed_at', 'last_activity'])
        except Exception:
            # Never break the toggle flow if persistence fails; surface progress in response anyway
            pass
            
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
    """Overlay clean certificate content onto the blue EasyLearnova template."""
    template_path = os.path.join(
        settings.BASE_DIR,
        'courses', 'certificates', 'sample_certificate.pdf',
    )
    media_dir = settings.MEDIA_ROOT
    os.makedirs(os.path.join(media_dir, 'certificates'), exist_ok=True)
    # Use a time-stamped filename to avoid any stale caching issues
    filename = f"certificate_{certificate_obj.certificate_id}_{int(time.time())}.pdf"
    dest_path = os.path.join(media_dir, 'certificates', filename)

    try:
        # Read base template
        with open(template_path, 'rb') as f:
            base_reader = PdfReader(f)
            base_page = base_reader.pages[0]
            page_width = float(base_page.mediabox.width)
            page_height = float(base_page.mediabox.height)

        # Build overlay PDF in memory
        overlay_stream = io.BytesIO()
        c = canvas.Canvas(overlay_stream, pagesize=(page_width, page_height))

        # Get user data
        name = getattr(user, 'full_name', None) or getattr(user, 'username', None) or user.email
        name_text = str(name).title()
        course_title = str(getattr(course, 'title', 'Course')).title()
        issued_at = getattr(certificate_obj, 'issued_at', timezone.now())
        issued_str = issued_at.strftime('%m/%d/%Y, %I:%M:%S %p')
        cert_id = str(certificate_obj.certificate_id)

        # Register script font if available
        script_font_name = 'Helvetica-Bold'
        script_ttf_path = os.path.join(settings.BASE_DIR, 'courses', 'fonts', 'SamiraScript.ttf')
        try:
            if os.path.exists(script_ttf_path) and 'SamiraScript' not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont('SamiraScript', script_ttf_path))
                script_font_name = 'SamiraScript'
        except Exception:
            pass

        # Layout coordinates (adjusted for your blue template)
        center_x = page_width / 2.0

        # "Certificate of Completion" title
        c.setFont('Helvetica-Bold', 36)
        c.setFillColor(HexColor('#1E293B'))  # Dark gray
        c.drawCentredString(center_x, page_height * 0.68, "Certificate of Completion")
        
        # "This certifies that" subtitle
        c.setFont('Helvetica', 14)
        c.setFillColor(HexColor('#64748B'))  # Medium gray
        c.drawCentredString(center_x, page_height * 0.63, "This certifies that")
        
        # User name (large, colored, script font if available)
        c.setFont(script_font_name, 36)
        c.setFillColor(HexColor('#6366F1'))  # Indigo
        c.drawCentredString(center_x, page_height * 0.55, name_text)
        
        # "has successfully completed the course" text
        c.setFont('Helvetica', 14)
        c.setFillColor(HexColor('#64748B'))  # Medium gray
        c.drawCentredString(center_x, page_height * 0.49, "has successfully completed the course")
        
        # Course title
        c.setFont('Helvetica-Bold', 20)
        c.setFillColor(HexColor('#1E293B'))  # Dark gray
        c.drawCentredString(center_x, page_height * 0.43, course_title)
        
        # Bottom boxes for issued date and certificate ID
        box_y = page_height * 0.25
        box_height = page_height * 0.08
        box_width = page_width * 0.35
        margin_x = page_width * 0.08
        
        # Left box - Issued date
        c.setFillColor(HexColor('#F8FAFC'))  # Very light gray
        c.setStrokeColor(HexColor('#E2E8F0'))  # Light gray border
        c.rect(margin_x, box_y, box_width, box_height, fill=1, stroke=1)
        
        c.setFont('Helvetica', 10)
        c.setFillColor(HexColor('#64748B'))
        c.drawString(margin_x + 15, box_y + box_height - 15, "Issued")
        c.setFont('Helvetica-Bold', 11)
        c.setFillColor(HexColor('#1E293B'))
        c.drawString(margin_x + 15, box_y + 15, issued_str)
        
        # Right box - Certificate ID
        right_box_x = page_width - margin_x - box_width
        c.setFillColor(HexColor('#F8FAFC'))
        c.setStrokeColor(HexColor('#E2E8F0'))
        c.rect(right_box_x, box_y, box_width, box_height, fill=1, stroke=1)
        
        c.setFont('Helvetica', 10)
        c.setFillColor(HexColor('#64748B'))
        c.drawString(right_box_x + 15, box_y + box_height - 15, "Certificate ID")
        c.setFont('Helvetica-Bold', 7)
        c.setFillColor(HexColor('#1E293B'))
        
        # Keep certificate ID on single line with smaller font if needed
        c.drawString(right_box_x + 15, box_y + 15, cert_id)

        c.showPage()
        c.save()
        overlay_stream.seek(0)

        overlay_reader = PdfReader(overlay_stream)
        overlay_page = overlay_reader.pages[0]

        # Merge overlay on base template
        merged_writer = PdfWriter()
        with open(template_path, 'rb') as f2:
            base_reader_again = PdfReader(f2)
            base_page2 = base_reader_again.pages[0]
            base_page2.merge_page(overlay_page)
            merged_writer.add_page(base_page2)

            # Add remaining pages if any, unchanged
            for i in range(1, len(base_reader_again.pages)):
                merged_writer.add_page(base_reader_again.pages[i])

            with open(dest_path, 'wb') as out_f:
                merged_writer.write(out_f)

        return f"certificates/{filename}"
        
    except Exception as e:
        # Fallback: try plain copy to avoid breaking the flow
        try:
            with open(template_path, 'rb') as src, open(dest_path, 'wb') as dst:
                dst.write(src.read())
            return f"certificates/{filename}"
        except Exception:
            return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def issue_engineering_certificate(request, course_id):
    """Singleton certificate resource for an engineering course.

    GET: Return existing certificate if issued (404 if not yet issued).
    POST: Issue (or re-issue) certificate if user has 100% progress.
    """
    try:
        user = request.user
        try:
            course = EngineeringCourse.objects.get(id=course_id)
        except EngineeringCourse.DoesNotExist:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            cert = Certification.objects.filter(user=user, course=course).first()
            if not cert:
                return Response({"detail": "Certificate not issued"}, status=status.HTTP_404_NOT_FOUND)
            data = CertificationSerializer(cert, context={'request': request}).data
            data.update({
                'course_name': course.title,
                'user_name': getattr(user, 'full_name', None) or getattr(user, 'username', None) or user.email,
            })
            return Response(data, status=status.HTTP_200_OK)

        # POST flow: compute progress
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

        # Always (re)generate PDF so template updates reflect
        rel_path = _render_certificate_file(user, course, cert)
        if rel_path:
            old_path = None
            if cert.file and cert.file.name and cert.file.name != rel_path:
                old_path = os.path.join(settings.MEDIA_ROOT, cert.file.name)
            cert.file.name = rel_path
            cert.save(update_fields=['file'])
            if old_path and os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

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
        
        # If no DB-backed questions, allow client-provided questions for grading fallback
        client_questions = data.get('questions')
        if not quiz_questions.exists() and client_questions:
            try:
                # Normalize client questions into a list of dicts
                import json
                if isinstance(client_questions, str):
                    client_questions = json.loads(client_questions)
                if not isinstance(client_questions, list):
                    client_questions = []
            except Exception:
                client_questions = []
        
        if not quiz_questions.exists() and not client_questions:
            return Response(
                {"error": "No quiz questions found for this lesson"},
                status=status.HTTP_404_NOT_FOUND
            )
        # Calculate score
        # Support both DB and client-provided question sets
        total_questions = quiz_questions.count() if quiz_questions.exists() else len(client_questions)
        correct_answers = 0
        
        # Debug information
        print(f"Processing quiz submission for lesson: {lesson_id}")
        print(f"User answers received: {user_answers}")
        
        if quiz_questions.exists():
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
        else:
            # Client-provided questions with correctAnswer index
            for idx, q in enumerate(client_questions or []):
                qid = str(q.get('id', idx))
                user_answer = user_answers.get(qid)
                options = q.get('options') or []
                try:
                    user_idx = int(user_answer)
                except (ValueError, TypeError):
                    continue
                correct_idx = q.get('correctAnswer')
                if isinstance(correct_idx, str):
                    try:
                        correct_idx = int(correct_idx)
                    except Exception:
                        correct_idx = None
                if isinstance(correct_idx, int) and 0 <= user_idx < len(options) and user_idx == correct_idx:
                    correct_answers += 1
        
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
            passed=passed,
            total_questions=total_questions
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
@authentication_classes([])
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

        # Google Programmable Search API credentials (from settings or env)
        from django.conf import settings as dj_settings
        API_KEY = getattr(dj_settings, 'GOOGLE_SEARCH_API_KEY', None) or getattr(dj_settings, 'GEMINI_API_KEY', '')
        SEARCH_ENGINE_ID = getattr(dj_settings, 'GOOGLE_SEARCH_ENGINE_ID', '')
        
        print(f"🔍 Getting resources for topic: {topic}")
        print(f"🎛️ Exclude YouTube: {exclude_youtube}")
        
        resources = []
        
        # Define trusted educational sites for specific searches
        trusted_sites = [
            # General education / science
            'khanacademy.org', 'britannica.com', 'nationalgeographic.com', 'bbc.co.uk', 'bbc.com',
            'ck12.org', 'openstax.org', 'quizlet.com', 'sciencedaily.com', 'nature.com', 'nih.gov',
            'nasa.gov', 'noaa.gov', 'mit.edu', 'harvard.edu', 'stanford.edu',
            # Programming / CS
            'freecodecamp.org', 'geeksforgeeks.org', 'developer.mozilla.org', 'w3schools.com',
            'stackoverflow.com', 'github.com', 'tutorialspoint.com', 'programiz.com', 'javatpoint.com',
            # Courses/platforms
            'coursera.org', 'edx.org', 'codecademy.com', 'udemy.com',
        ]
        
        # Classify topic to choose appropriate queries (simple heuristic)
        topic_l = topic.lower()
        programming_keywords = [
            'programming', 'algorithm', 'data structure', 'python', 'java', 'javascript', 'arrays',
            'linked list', 'tree', 'graph', 'sorting', 'searching', 'recursion', 'oop', 'sql', 'database'
        ]
        is_programming = any(k in topic_l for k in programming_keywords)

        # Create targeted search queries
        if is_programming:
            base_queries = [
                f'{topic} tutorial',
                f'learn {topic}',
                f'{topic} examples',
                f'{topic} practice problems'
            ]
            enhanced_queries = []
            for bq in base_queries:
                enhanced_queries.extend([
                    f'{bq} site:geeksforgeeks.org OR site:freecodecamp.org',
                    f'{bq} site:tutorialspoint.com OR site:w3schools.com',
                    f'{bq} site:programiz.com OR site:javatpoint.com'
                ])
            search_queries = enhanced_queries[:6]
        else:
            base_queries = [
                f'{topic} study guide',
                f'what is {topic}',
                f'{topic} notes pdf',
                f'{topic} explanation',
                f'{topic} examples',
                f'learn {topic}'
            ]
            enhanced_queries = []
            for bq in base_queries[:4]:
                enhanced_queries.extend([
                    f'{bq} site:khanacademy.org OR site:britannica.com',
                    f'{bq} site:bbc.co.uk OR site:nationalgeographic.com',
                    f'{bq} site:ck12.org OR site:openstax.org'
                ])
            search_queries = enhanced_queries[:6]
        
        for query in search_queries:
            try:
                print(f"🔍 Searching with query: {query}")
                
                url = 'https://www.googleapis.com/customsearch/v1'
                params = {
                    'key': API_KEY,
                    'cx': SEARCH_ENGINE_ID,
                    'q': query,
                    'num': 4,  # Slightly more per query for better coverage
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
    science_keywords = [
        'biology','chemistry','physics','science','ecosystem','plant','animal','cell','photosynthesis','respiration','human body','organism','energy','light','chlorophyll','glucose','oxygen'
    ]
    
    has_programming_context = any(keyword in content for keyword in programming_keywords)
    has_science_context = any(keyword in content for keyword in science_keywords)
    has_topic_mention = any(variation in content for variation in variations)

    # Accept if topic is explicitly mentioned regardless of context
    if has_topic_mention:
        return True
    # Otherwise require a domain context
    return has_programming_context or has_science_context


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
        'khanacademy.org', 'tutorialspoint.com', 'medium.com', 'dev.to',
        'britannica.com', 'ck12.org', 'openstax.org', 'bbc.co.uk', 'bbc.com'
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
@permission_classes([IsAuthenticated])
def download_resource(request, resource_id):
    """
    Download a lesson resource file with proper headers and authorization.
    Access control: user must be enrolled in the corresponding course or be staff.
    """
    try:
        resource = get_object_or_404(LessonResource, id=resource_id)

        # Ensure there's an associated file
        if not resource.file:
            return Response({'error': 'No file associated with this resource'}, status=status.HTTP_404_NOT_FOUND)

        # Authorization: allow staff/superuser, otherwise require enrollment in the course
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            # Determine course context (school or engineering)
            lesson = resource.lesson
            course = None
            course_type = None
            if lesson and getattr(lesson, 'section_id', None):
                course = getattr(lesson.section, 'engineering_course', None)
                course_type = 'engineering'
            elif lesson and getattr(lesson, 'chapter_id', None):
                course = getattr(lesson.chapter, 'school_course', None)
                course_type = 'school'

            # If course context exists, verify enrollment
            if course and course_type:
                is_enrolled = UserStartedPredefinedCourse.objects.filter(
                    user=user,
                    course_type=course_type,
                    engineering_course=course if course_type == 'engineering' else None,
                    school_course=course if course_type == 'school' else None,
                ).exists()
                if not is_enrolled:
                    return Response({'error': 'Not authorized to download this resource'}, status=status.HTTP_403_FORBIDDEN)

        # Build absolute file path from storage
        file_path = resource.file.path
        if not os.path.exists(file_path):
            return Response({'error': 'File not found on server'}, status=status.HTTP_404_NOT_FOUND)

        # Guess content type
        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'

        # Stream the file to avoid loading into memory
        file_handle = open(file_path, 'rb')
        response = FileResponse(file_handle, content_type=content_type)

        # Safe filename handling for Content-Disposition (support utf-8 via filename*)
        raw_name = os.path.basename(file_path)
        safe_name = get_valid_filename(raw_name)[:150] or 'download'
        quoted_name = urlquote(safe_name)
        response['Content-Disposition'] = f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{quoted_name}"
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, max-age=86400'

        # Length header is optional with FileResponse; add if obtainable
        try:
            response['Content-Length'] = os.path.getsize(file_path)
        except OSError:
            pass

        return response

    except Exception as e:
        return Response({'error': f'Failed to download file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                    'thumbnail': _build_thumbnail_url(enrollment.school_course, request),
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
                    'thumbnail': _build_thumbnail_url(enrollment.engineering_course, request),
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
@permission_classes([AllowAny])
@authentication_classes([])
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
            return Response({'error': 'Invalid course_type'}, status=status.HTTP_400_BAD_REQUEST)

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


# ==================== ADMIN ENROLLMENT ANALYTICS ====================

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def admin_enrollment_stats(request):
    """Return enrollment counts per published course (school and engineering).

    Response shape:
    {
      "totals": { "total_courses": n, "total_enrollments": m },
      "courses": [
        { "id": str, "title": str, "course_type": "school|engineering", "enrollments": int, "is_published": bool, "last_updated": ISO }, ...
      ]
    }
    """
    try:
        # Engineering courses with enroll counts
        eng_qs = (
            EngineeringCourse.objects.all()
            .annotate(enrollments=Count('enrolled_users'))
        )
        # School courses with enroll counts
        school_qs = (
            SchoolCourse.objects.all()
            .annotate(enrollments=Count('enrolled_users'))
        )

        courses = []
        total_enrollments = 0

        for c in eng_qs:
            cnt = int(getattr(c, 'enrollments', 0) or 0)
            total_enrollments += cnt
            courses.append({
                'id': str(c.id),
                'title': c.title,
                'course_type': 'engineering',
                'enrollments': cnt,
                'is_published': bool(c.is_published),
                'last_updated': c.last_updated.isoformat() if getattr(c, 'last_updated', None) else None,
            })

        for c in school_qs:
            cnt = int(getattr(c, 'enrollments', 0) or 0)
            total_enrollments += cnt
            courses.append({
                'id': str(c.id),
                'title': c.title,
                'course_type': 'school',
                'enrollments': cnt,
                'is_published': bool(c.is_published),
                'last_updated': c.last_updated.isoformat() if getattr(c, 'last_updated', None) else None,
            })

        # Sort by enrollments desc, then title
        courses.sort(key=lambda x: (-x['enrollments'], (x['title'] or '').lower()))

        return Response({
            'totals': {
                'total_courses': len(courses),
                'total_enrollments': total_enrollments,
            },
            'courses': courses,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to compute enrollment stats: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        # Verify user is authenticated
        if not user or not user.is_authenticated:
            return Response({
                'error': 'User not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get weekly hours
        weekly_hours = LearningActivity.get_weekly_hours(user)
        
        # Get current streak
        current_streak = LearningActivity.get_current_streak(user)
        
        # Get today's activity
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
                'date': check_date.isoformat(),  # Convert to ISO format for JSON serialization
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
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error in get_learning_stats: {str(e)}")
        print(f"Traceback: {error_traceback}")
        return Response({
            'success': False,
            'error': f'Failed to get learning stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
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
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminUser])
def update_course(request, course_id):
    """
    Update a course (both school and engineering courses)
    """
    try:
        data = request.data
        if settings.DEBUG:
            print("Received update data:", data)
        
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

            # Nested update: chapters and lessons (optional)
            if 'chapters' in data:
                try:
                    chapters_payload = data.get('chapters', '[]')
                    if isinstance(chapters_payload, str):
                        chapters_data = json.loads(chapters_payload or '[]')
                    else:
                        chapters_data = chapters_payload or []
                except Exception:
                    chapters_data = []

                kept_chapter_ids = []
                for chapter_index, ch in enumerate(chapters_data):
                    ch_id = ch.get('id')
                    ch_name = ch.get('name', '').strip()
                    if not ch_name:
                        continue
                    # Find existing chapter by id under this course
                    chapter_obj = None
                    if ch_id:
                        chapter_obj = school_course.chapters.filter(id=ch_id).first()
                    if not chapter_obj:
                        chapter_obj = school_course.chapters.create(name=ch_name, order=chapter_index)
                    else:
                        chapter_obj.name = ch_name
                        chapter_obj.order = chapter_index
                        chapter_obj.save()
                    kept_chapter_ids.append(chapter_obj.id)

                    # Update lessons in this chapter
                    lessons = ch.get('lessons', []) or []
                    kept_lesson_ids = []
                    for lesson_index, les in enumerate(lessons):
                        les_id = les.get('id')
                        title = (les.get('title') or '').strip()
                        if not title:
                            continue
                        lesson_obj = None
                        if les_id:
                            lesson_obj = chapter_obj.lessons.filter(id=les_id).first()
                        if not lesson_obj:
                            lesson_obj = chapter_obj.lessons.create(
                                title=title,
                                type=les.get('type', 'video') or 'video',
                                order=lesson_index
                            )
                        # Update fields
                        lesson_obj.title = title
                        lesson_obj.type = les.get('type', lesson_obj.type) or lesson_obj.type
                        # Frontend sends camelCase videoUrl/aboutLesson
                        lesson_obj.video_url = les.get('videoUrl', les.get('video_url', lesson_obj.video_url)) or ''
                        lesson_obj.description = les.get('description', lesson_obj.description) or ''
                        lesson_obj.about_lesson = les.get('aboutLesson', les.get('about_lesson', lesson_obj.about_lesson)) or ''
                        lesson_obj.order = lesson_index
                        lesson_obj.save()
                        kept_lesson_ids.append(lesson_obj.id)

                        # --- Handle lesson resources (downloadable and internet) ---
                        has_resources = les.get('hasResources', False)
                        resources_data = les.get('resources', {})
                        
                        if settings.DEBUG:
                            print(f"[DEBUG] School Lesson '{lesson_obj.title}' - hasResources: {has_resources}")
                            print(f"[DEBUG] School Lesson '{lesson_obj.title}' - resources_data: {resources_data}")
                        
                        if has_resources and resources_data:
                            # Clear existing resources for this lesson
                            lesson_obj.resources.all().delete()
                            
                            # Add downloadable resources
                            downloadable_resources = resources_data.get('downloadable', [])
                            if isinstance(downloadable_resources, str):
                                try:
                                    downloadable_resources = json.loads(downloadable_resources)
                                except:
                                    downloadable_resources = []
                            
                            if settings.DEBUG:
                                print(f"[DEBUG] Downloadable resources: {downloadable_resources}")
                            
                            for res in downloadable_resources:
                                if isinstance(res, dict):
                                    # Handle both 'title'/'url' and 'name'/'link' field names
                                    resource_title = res.get('title') or res.get('name', '')
                                    resource_url = res.get('url') or res.get('link', '')
                                    
                                    LessonResource.objects.create(
                                        lesson=lesson_obj,
                                        type='downloadable',
                                        title=resource_title,
                                        description=res.get('description', ''),
                                        url=resource_url,
                                    )
                                    if settings.DEBUG:
                                        print(f"[DEBUG] Created downloadable resource: {resource_title}")
                            
                            # Add internet resources
                            internet_resources = resources_data.get('internet', [])
                            if isinstance(internet_resources, str):
                                try:
                                    internet_resources = json.loads(internet_resources)
                                except:
                                    internet_resources = []
                            
                            if settings.DEBUG:
                                print(f"[DEBUG] Internet resources: {internet_resources}")
                            
                            for res in internet_resources:
                                if isinstance(res, dict):
                                    # Handle both 'title'/'url' and 'name'/'link' field names
                                    resource_title = res.get('title') or res.get('name', '')
                                    resource_url = res.get('url') or res.get('link', '')
                                    
                                    LessonResource.objects.create(
                                        lesson=lesson_obj,
                                        type='internet',
                                        title=resource_title,
                                        description=res.get('description', ''),
                                        url=resource_url,
                                    )
                                    if settings.DEBUG:
                                        print(f"[DEBUG] Created internet resource: {resource_title}")
                        elif not has_resources:
                            # If hasResources is explicitly false, clear all resources
                            lesson_obj.resources.all().delete()

                        # --- Nested: quiz questions update for SchoolCourse lessons ---
                        has_quiz_key = ('quizQuestions' in les) or ('quiz_questions' in les)
                        quiz_list = (les.get('quizQuestions') or les.get('quiz_questions') or [])
                        if isinstance(quiz_list, str):
                            try:
                                import json as _json
                                quiz_list = _json.loads(quiz_list) or []
                            except Exception:
                                quiz_list = []
                        kept_question_ids = []
                        for q in (quiz_list or []):
                            q_id = q.get('id')
                            question_text = (q.get('question') or '').strip()
                            options = q.get('options') or []
                            if isinstance(options, str):
                                try:
                                    import json as _json
                                    options = _json.loads(options) or []
                                except Exception:
                                    options = []
                            # Determine correct answer text
                            ca = q.get('correctAnswer', q.get('correct_answer', ''))
                            correct_answer_text = ''
                            # Support index (int or numeric string)
                            try:
                                idx = int(ca)
                                if 0 <= idx < len(options):
                                    correct_answer_text = options[idx]
                            except Exception:
                                pass
                            if not correct_answer_text and isinstance(ca, str) and ca in options:
                                correct_answer_text = ca
                            if not question_text or not options:
                                # Skip invalid question payloads
                                continue
                            if q_id:
                                qq = lesson_obj.quiz_questions.filter(id=q_id).first()
                                if qq:
                                    qq.question = question_text
                                    qq.options = options
                                    if correct_answer_text:
                                        qq.correct_answer = correct_answer_text
                                    qq.save()
                                    kept_question_ids.append(qq.id)
                                    continue
                            # Create new
                            qq = lesson_obj.quiz_questions.create(
                                question=question_text,
                                options=options,
                                correct_answer=correct_answer_text or (options[0] if options else '')
                            )
                            kept_question_ids.append(qq.id)

                        # Delete removed quiz questions for this lesson
                        if has_quiz_key:
                            if kept_question_ids:
                                lesson_obj.quiz_questions.exclude(id__in=kept_question_ids).delete()
                            else:
                                lesson_obj.quiz_questions.all().delete()

                    # Delete lessons not in payload for this chapter
                    if kept_lesson_ids:
                        chapter_obj.lessons.exclude(id__in=kept_lesson_ids).delete()
                    else:
                        # If no lessons kept, remove all lessons in this chapter
                        chapter_obj.lessons.all().delete()

                # Delete chapters not in payload
                if kept_chapter_ids:
                    school_course.chapters.exclude(id__in=kept_chapter_ids).delete()
                else:
                    # If none kept (empty payload), remove all chapters
                    school_course.chapters.all().delete()
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
                
            # Handle learning outcomes/objectives (map to learning_points in model)
            if 'learning_objectives' in data or 'learningObjectives' in data or 'learning_outcomes' in data or 'learningOutcomes' in data:
                try:
                    objectives_data = (
                        data.get('learning_objectives')
                        or data.get('learningObjectives')
                        or data.get('learning_outcomes')
                        or data.get('learningOutcomes')
                        or '[]'
                    )
                    if isinstance(objectives_data, str):
                        if not objectives_data.strip():
                            objectives_data = '[]'
                        engineering_course.learning_points = json.loads(objectives_data)
                    else:
                        # Already a list
                        engineering_course.learning_points = list(objectives_data)
                except (json.JSONDecodeError, AttributeError, TypeError):
                    engineering_course.learning_points = []
            
            # Handle prerequisites/requirements (map to requirements in model)
            if 'prerequisites' in data or 'requirements' in data:
                try:
                    # Accept both 'prerequisites' and 'requirements' field names
                    prereq_data = data.get('requirements') or data.get('prerequisites') or '[]'
                    if settings.DEBUG:
                        print(f"[DEBUG] Requirements update - Raw data: {prereq_data}")
                        print(f"[DEBUG] Requirements update - Type: {type(prereq_data)}")
                    
                    if isinstance(prereq_data, str):
                        if not prereq_data.strip():
                            prereq_data = '[]'
                        engineering_course.requirements = json.loads(prereq_data)
                    else:
                        # Already a list
                        engineering_course.requirements = list(prereq_data)
                    
                    if settings.DEBUG:
                        print(f"[DEBUG] Requirements update - Parsed: {engineering_course.requirements}")
                except (json.JSONDecodeError, AttributeError, TypeError) as e:
                    if settings.DEBUG:
                        print(f"[DEBUG] Requirements update - Error: {e}")
                    engineering_course.requirements = []
                    
            # Handle course_content (note: this field may not exist in model, so we'll skip errors)
            # Note: course_content is not in the current model, so we'll just ignore it for now
            
            # Handle thumbnail update
            if 'thumbnail' in request.FILES:
                engineering_course.thumbnail = request.FILES['thumbnail']
            
            engineering_course.save()

            # Nested update: sections and lessons (optional)
            if 'sections' in data:
                try:
                    sections_payload = data.get('sections', '[]')
                    if isinstance(sections_payload, str):
                        sections_data = json.loads(sections_payload or '[]')
                    else:
                        sections_data = sections_payload or []
                except Exception:
                    sections_data = []

                kept_section_ids = []
                for section_index, sec in enumerate(sections_data):
                    sec_id = sec.get('id')
                    sec_name = sec.get('name', '').strip()
                    if not sec_name:
                        continue
                    # Find existing section by id under this course
                    section_obj = None
                    if sec_id:
                        section_obj = engineering_course.sections.filter(id=sec_id).first()
                    if not section_obj:
                        section_obj = engineering_course.sections.create(name=sec_name, order=section_index)
                    else:
                        section_obj.name = sec_name
                        section_obj.order = section_index
                        section_obj.save()
                    kept_section_ids.append(section_obj.id)

                    # Update lessons in this section
                    lessons = sec.get('lessons', []) or []
                    kept_lesson_ids = []
                    for lesson_index, les in enumerate(lessons):
                        les_id = les.get('id')
                        title = (les.get('title') or '').strip()
                        if not title:
                            continue
                        lesson_obj = None
                        if les_id:
                            lesson_obj = section_obj.lessons.filter(id=les_id).first()
                        if not lesson_obj:
                            lesson_obj = section_obj.lessons.create(
                                title=title,
                                type=les.get('type', 'video') or 'video',
                                order=lesson_index
                            )
                        # Update fields
                        lesson_obj.title = title
                        lesson_obj.type = les.get('type', lesson_obj.type) or lesson_obj.type
                        lesson_obj.video_url = les.get('videoUrl', les.get('video_url', lesson_obj.video_url)) or ''
                        lesson_obj.description = les.get('description', lesson_obj.description) or ''
                        lesson_obj.about_lesson = les.get('aboutLesson', les.get('about_lesson', lesson_obj.about_lesson)) or ''
                        lesson_obj.order = lesson_index
                        lesson_obj.save()
                        kept_lesson_ids.append(lesson_obj.id)

                        # --- Handle lesson resources (downloadable and internet) ---
                        has_resources = les.get('hasResources', False)
                        resources_data = les.get('resources', {})
                        
                        if settings.DEBUG:
                            print(f"[DEBUG] Lesson '{lesson_obj.title}' - hasResources: {has_resources}")
                            print(f"[DEBUG] Lesson '{lesson_obj.title}' - resources_data: {resources_data}")
                        
                        if has_resources and resources_data:
                            # Clear existing resources for this lesson
                            lesson_obj.resources.all().delete()
                            
                            # Add downloadable resources
                            downloadable_resources = resources_data.get('downloadable', [])
                            if isinstance(downloadable_resources, str):
                                try:
                                    downloadable_resources = json.loads(downloadable_resources)
                                except:
                                    downloadable_resources = []
                            
                            if settings.DEBUG:
                                print(f"[DEBUG] Downloadable resources: {downloadable_resources}")
                            
                            for res in downloadable_resources:
                                if isinstance(res, dict):
                                    # Handle both 'title'/'url' and 'name'/'link' field names
                                    resource_title = res.get('title') or res.get('name', '')
                                    resource_url = res.get('url') or res.get('link', '')
                                    
                                    LessonResource.objects.create(
                                        lesson=lesson_obj,
                                        type='downloadable',
                                        title=resource_title,
                                        description=res.get('description', ''),
                                        url=resource_url,
                                    )
                                    if settings.DEBUG:
                                        print(f"[DEBUG] Created downloadable resource: {resource_title}")
                            
                            # Add internet resources
                            internet_resources = resources_data.get('internet', [])
                            if isinstance(internet_resources, str):
                                try:
                                    internet_resources = json.loads(internet_resources)
                                except:
                                    internet_resources = []
                            
                            if settings.DEBUG:
                                print(f"[DEBUG] Internet resources: {internet_resources}")
                            
                            for res in internet_resources:
                                if isinstance(res, dict):
                                    # Handle both 'title'/'url' and 'name'/'link' field names
                                    resource_title = res.get('title') or res.get('name', '')
                                    resource_url = res.get('url') or res.get('link', '')
                                    
                                    LessonResource.objects.create(
                                        lesson=lesson_obj,
                                        type='internet',
                                        title=resource_title,
                                        description=res.get('description', ''),
                                        url=resource_url,
                                    )
                                    if settings.DEBUG:
                                        print(f"[DEBUG] Created internet resource: {resource_title}")
                        elif not has_resources:
                            # If hasResources is explicitly false, clear all resources
                            lesson_obj.resources.all().delete()

                        # --- Nested: quiz questions update for EngineeringCourse lessons ---
                        has_quiz_key = ('quizQuestions' in les) or ('quiz_questions' in les)
                        quiz_list = (les.get('quizQuestions') or les.get('quiz_questions') or [])
                        if isinstance(quiz_list, str):
                            try:
                                import json as _json
                                quiz_list = _json.loads(quiz_list) or []
                            except Exception:
                                quiz_list = []
                        kept_question_ids = []
                        for q in (quiz_list or []):
                            q_id = q.get('id')
                            question_text = (q.get('question') or '').strip()
                            options = q.get('options') or []
                            if isinstance(options, str):
                                try:
                                    import json as _json
                                    options = _json.loads(options) or []
                                except Exception:
                                    options = []
                            # Determine correct answer text
                            ca = q.get('correctAnswer', q.get('correct_answer', ''))
                            correct_answer_text = ''
                            # Support index (int or numeric string)
                            try:
                                idx = int(ca)
                                if 0 <= idx < len(options):
                                    correct_answer_text = options[idx]
                            except Exception:
                                pass
                            if not correct_answer_text and isinstance(ca, str) and ca in options:
                                correct_answer_text = ca
                            if not question_text or not options:
                                # Skip invalid question payloads
                                continue
                            if q_id:
                                qq = lesson_obj.quiz_questions.filter(id=q_id).first()
                                if qq:
                                    qq.question = question_text
                                    qq.options = options
                                    if correct_answer_text:
                                        qq.correct_answer = correct_answer_text
                                    qq.save()
                                    kept_question_ids.append(qq.id)
                                    continue
                            # Create new
                            qq = lesson_obj.quiz_questions.create(
                                question=question_text,
                                options=options,
                                correct_answer=correct_answer_text or (options[0] if options else '')
                            )
                            kept_question_ids.append(qq.id)

                        # Delete removed quiz questions for this lesson
                        if has_quiz_key:
                            if kept_question_ids:
                                lesson_obj.quiz_questions.exclude(id__in=kept_question_ids).delete()
                            else:
                                lesson_obj.quiz_questions.all().delete()

                    # Delete lessons not in payload for this section
                    if kept_lesson_ids:
                        section_obj.lessons.exclude(id__in=kept_lesson_ids).delete()
                    else:
                        section_obj.lessons.all().delete()

                # Delete sections not in payload
                if kept_section_ids:
                    engineering_course.sections.exclude(id__in=kept_section_ids).delete()
                else:
                    engineering_course.sections.all().delete()
            course = engineering_course
        
        # Return updated course data
        course_data = {
            'id': str(course.id),
            'title': course.title,
            'description': course.description,
            'short_description': course.short_description,
            'thumbnail': _build_thumbnail_url(course, request),
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
                # Provide both legacy and new field names for compatibility
                'learning_objectives': course.learning_points or [],
                'learning_outcomes': course.learning_points or [],
                'prerequisites': course.requirements or [],
                'requirements': course.requirements or [],
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
@authentication_classes([JWTAuthentication])
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
                'thumbnail': _build_thumbnail_url(course, request),
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
                        'videoUrl': lesson.video_url,
                        'description': lesson.description,
                        'about_lesson': lesson.about_lesson,
                        'aboutLesson': lesson.about_lesson,
                        'order': lesson.order,
                        'resources': {'downloadable': [], 'internet': []},  # Changed to grouped structure
                        'quiz_questions': [],
                        'quizQuestions': []
                    }
                    
                    # Get lesson resources and group by type
                    resources = lesson.resources.all()
                    for resource in resources:
                        # Start with common fields
                        resource_data = {
                            'id': resource.id,
                            'type': resource.type,
                            'title': resource.title,
                            'name': resource.title,  # Also include 'name' for frontend compatibility
                            'description': resource.description,
                        }
                        # Security: never expose direct file URLs. For downloadable resources,
                        # provide only the protected download endpoint. External resources keep link/url.
                        if resource.type == 'downloadable':
                            resource_data.update({
                                'url': '',
                                'link': '',
                                'file': None,
                                'download_url': request.build_absolute_uri(
                                    reverse('download-resource', args=[resource.id])
                                )
                            })
                            lesson_data['resources']['downloadable'].append(resource_data)
                        elif resource.type == 'internet':
                            resource_data.update({
                                'url': resource.url,
                                'link': resource.url,
                                'file': None,
                                'download_url': None
                            })
                            lesson_data['resources']['internet'].append(resource_data)
                    
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
                        # Map correct_answer (text) -> index in options if present
                        try:
                            ca_idx = question.options.index(question.correct_answer)
                        except Exception:
                            ca_idx = 0 if (isinstance(question.options, list) and question.options) else -1
                        lesson_data['quizQuestions'].append({
                            'id': question.id,
                            'question': question.question,
                            'options': question.options,
                            'correctAnswer': ca_idx
                        })
                    
                    chapter_data['lessons'].append(lesson_data)
                
                course_data['chapters'].append(chapter_data)
        else:
            course = engineering_course
            course_data = {
                'id': str(course.id),
                'title': course.title,
                'description': course.description,
                'short_description': course.short_description,
                'thumbnail': _build_thumbnail_url(course, request),
                'duration': course.duration,
                'is_published': course.is_published,
                'course_type': course_type,
                'last_updated': course.last_updated,
                'created_at': course.created_at,
                'category': course.category,
                # Map model fields to expected edit form fields
                'proficiency_level': getattr(course, 'proficiency', 'beginner'),
                # Keep legacy keys used by some frontend components
                'learning_objectives': course.learning_points or [],
                'prerequisites': course.requirements or [],
                # Also provide the keys expected by the admin edit form
                'learning_outcomes': course.learning_points or [],
                'requirements': course.requirements or [],
                'sources': course.sources or '',
                'certificate': 'Certificate of Completion' if getattr(course, 'certificate_given', False) else '',
                'price': str(getattr(course, 'price', 0)),
                'course_content': getattr(course, 'course_content', []),
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
                        'videoUrl': lesson.video_url,
                        'description': lesson.description,
                        'about_lesson': lesson.about_lesson,
                        'aboutLesson': lesson.about_lesson,
                        'order': lesson.order,
                        'resources': {'downloadable': [], 'internet': []},  # Changed to grouped structure
                        'quiz_questions': [],
                        'quizQuestions': []
                    }
                    
                    # Get lesson resources and group by type
                    resources = lesson.resources.all()
                    for resource in resources:
                        # Start with common fields
                        resource_data = {
                            'id': resource.id,
                            'type': resource.type,
                            'title': resource.title,
                            'name': resource.title,  # Also include 'name' for frontend compatibility
                            'description': resource.description,
                        }
                        # Security: never expose direct file URLs. For downloadable resources,
                        # provide only the protected download endpoint. External resources keep link/url.
                        if resource.type == 'downloadable':
                            resource_data.update({
                                'url': '',
                                'link': '',
                                'file': None,
                                'download_url': request.build_absolute_uri(
                                    reverse('download-resource', args=[resource.id])
                                )
                            })
                            lesson_data['resources']['downloadable'].append(resource_data)
                        elif resource.type == 'internet':
                            resource_data.update({
                                'url': resource.url,
                                'link': resource.url,
                                'file': None,
                                'download_url': None
                            })
                            lesson_data['resources']['internet'].append(resource_data)
                    
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
                        try:
                            ca_idx = question.options.index(question.correct_answer)
                        except Exception:
                            ca_idx = 0 if (isinstance(question.options, list) and question.options) else -1
                        lesson_data['quizQuestions'].append({
                            'id': question.id,
                            'question': question.question,
                            'options': question.options,
                            'correctAnswer': ca_idx
                        })
                    
                    section_data['lessons'].append(lesson_data)
                
                course_data['sections'].append(section_data)

        # Apply preview gating for unauthenticated users to prevent data leakage
        is_auth = request.user.is_authenticated if hasattr(request, 'user') else False
        if not is_auth:
            # Read preview limits from environment with safe defaults
            try:
                preview_limit = int(os.environ.get('PREVIEW_SECTIONS_LIMIT', '2'))  # K
            except Exception:
                preview_limit = 2
            try:
                preview_lessons = int(os.environ.get('PREVIEW_LESSONS_PER_SECTION', '3'))  # L
            except Exception:
                preview_lessons = 3

            if course_type == 'school':
                chapters = course_data.get('chapters') or []
                gated_chapters = []
                for c_idx, ch in enumerate(chapters):
                    ch_copy = dict(ch)
                    lessons = ch_copy.get('lessons') or []
                    new_lessons = []
                    if c_idx < preview_limit:
                        ch_copy['is_preview'] = True
                        ch_copy['is_locked'] = False
                        for l_idx, l in enumerate(lessons):
                            ld = dict(l)
                            if l_idx < preview_lessons:
                                ld['is_preview'] = True
                                ld['is_locked'] = False
                            else:
                                ld['is_preview'] = False
                                ld['is_locked'] = True
                                ld['video_url'] = None
                                ld['videoUrl'] = None
                                ld['resources'] = {'downloadable': [], 'internet': []}
                                ld['quiz_questions'] = []
                                ld['quizQuestions'] = []
                            new_lessons.append(ld)
                        ch_copy['lessons'] = new_lessons
                    else:
                        ch_copy['is_preview'] = False
                        ch_copy['is_locked'] = True
                        scrubbed = []
                        for l in lessons:
                            ld = dict(l)
                            ld['is_preview'] = False
                            ld['is_locked'] = True
                            ld['video_url'] = None
                            ld['videoUrl'] = None
                            ld['resources'] = {'downloadable': [], 'internet': []}
                            ld['quiz_questions'] = []
                            ld['quizQuestions'] = []
                            scrubbed.append(ld)
                        ch_copy['lessons'] = scrubbed
                    gated_chapters.append(ch_copy)
                course_data['chapters'] = gated_chapters
                course_data['preview'] = {
                    'sections_unlocked': min(preview_limit, len(gated_chapters)),
                    'lessons_per_section_unlocked': preview_lessons,
                    'message': 'Login to unlock all chapters and resources'
                }
            else:
                # engineering
                sections = course_data.get('sections') or []
                gated_sections = []
                for s_idx, sec in enumerate(sections):
                    sec_copy = dict(sec)
                    lessons = sec_copy.get('lessons') or []
                    new_lessons = []
                    if s_idx < preview_limit:
                        sec_copy['is_preview'] = True
                        sec_copy['is_locked'] = False
                        for l_idx, l in enumerate(lessons):
                            ld = dict(l)
                            if l_idx < preview_lessons:
                                ld['is_preview'] = True
                                ld['is_locked'] = False
                            else:
                                ld['is_preview'] = False
                                ld['is_locked'] = True
                                ld['video_url'] = None
                                ld['videoUrl'] = None
                                ld['resources'] = {'downloadable': [], 'internet': []}
                                ld['quiz_questions'] = []
                                ld['quizQuestions'] = []
                            new_lessons.append(ld)
                        sec_copy['lessons'] = new_lessons
                    else:
                        sec_copy['is_preview'] = False
                        sec_copy['is_locked'] = True
                        scrubbed = []
                        for l in lessons:
                            ld = dict(l)
                            ld['is_preview'] = False
                            ld['is_locked'] = True
                            ld['video_url'] = None
                            ld['videoUrl'] = None
                            ld['resources'] = {'downloadable': [], 'internet': []}
                            ld['quiz_questions'] = []
                            ld['quizQuestions'] = []
                            scrubbed.append(ld)
                        sec_copy['lessons'] = scrubbed
                    gated_sections.append(sec_copy)
                course_data['sections'] = gated_sections
                course_data['preview'] = {
                    'sections_unlocked': min(preview_limit, len(gated_sections)),
                    'lessons_per_section_unlocked': preview_lessons,
                    'message': 'Login to unlock all content, quizzes and resources'
                }

        return Response(course_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_course_by_id: {str(e)}")
        return Response({
            'error': f'Failed to get course: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_certificates(request):
    """
    Get all certificates earned by the authenticated user
    """
    try:
        user = request.user
        
        # Get all certificates for the user
        certificates = Certification.objects.filter(user=user).select_related('course')
        
        certificates_data = []
        for cert in certificates:
            cert_data = {
                'id': cert.id,
                'certificate_id': str(cert.certificate_id),
                'course': {
                    'id': str(cert.course.id),
                    'title': cert.course.title,
                    'thumbnail': _build_thumbnail_url(cert.course, request),
                    'category': getattr(cert.course, 'category', None) or getattr(cert.course, 'subject', 'Course'),
                    'proficiency': getattr(cert.course, 'proficiency', 'Beginner')
                },
                'issued_at': cert.issued_at.isoformat(),
                'download_url': request.build_absolute_uri(cert.file.url) if cert.file else None,
                'preview_url': f"/certificate-preview/{cert.course.id}"
            }
            certificates_data.append(cert_data)
        
        return Response({
            'success': True,
            'certificates': certificates_data,
            'total_count': len(certificates_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_user_certificates: {str(e)}")
        return Response({
            'success': False,
            'error': f'Failed to get user certificates: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([JWTAuthentication])
def get_lesson_details(request, lesson_id):
    """
    Fetch full details for a specific lesson.
    Used for lazy loading lesson content.
    """
    try:
        lesson = Lesson.objects.get(id=lesson_id)
        
        # Check for preview restrictions if user is not authenticated
        is_auth = request.user.is_authenticated if hasattr(request, 'user') else False
        
        if not is_auth:
            # Determine if this lesson is locked
            is_locked = True
            
            try:
                preview_limit = int(os.environ.get('PREVIEW_SECTIONS_LIMIT', '2'))
                preview_lessons = int(os.environ.get('PREVIEW_LESSONS_PER_SECTION', '3'))
                
                # Check if lesson belongs to a chapter (School) or section (Engineering)
                if lesson.chapter:
                    chapter_order = lesson.chapter.order
                    lesson_order = lesson.order
                    if chapter_order < preview_limit and lesson_order < preview_lessons:
                        is_locked = False
                elif lesson.section:
                    section_order = lesson.section.order
                    lesson_order = lesson.order
                    if section_order < preview_limit and lesson_order < preview_lessons:
                        is_locked = False
            except Exception:
                # Default to locked if logic fails
                pass
                
            if is_locked:
                return Response(
                    {"error": "Login to unlock this lesson"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = LessonSerializer(lesson, context={'request': request})
        return Response(serializer.data)
        
    except Lesson.DoesNotExist:
        return Response(
            {"error": "Lesson not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
