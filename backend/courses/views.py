from django.shortcuts import render, get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import SchoolCourse, EngineeringCourse, Lesson, UserLessonProgress
from .serializers import CourseWithChaptersSerializer, EngineeringCourseWithSectionsSerializer
import json
from django.conf import settings
import os

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
        import traceback
        print(traceback.format_exc())  # Debug print
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([AllowAny])
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
