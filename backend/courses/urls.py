from django.urls import path, include
from . import views
from .urls_learning_plan import urlpatterns as learning_plan_urls

urlpatterns = [
    path('api/courses/create/', views.create_course, name='create-course'),
    path('api/courses/engineering/', views.list_engineering_courses, name='list-engineering-courses'),
    path('api/courses/engineering/<str:course_id>/', views.get_engineering_course_by_id, name='get-engineering-course-by-id'),
    path('api/courses/all/', views.list_all_courses, name='list-all-courses'),
    path('api/courses/school/', views.list_school_courses, name='list-school-courses'),    path('api/courses/school/<str:course_id>/', views.get_school_course_by_id, name='get-school-course-by-id'),
    # Progress tracking endpoints
    path('api/courses/progress/<str:course_id>/', views.get_course_progress, name='get-course-progress'),
    path('api/lessons/complete/<int:lesson_id>/', views.toggle_lesson_completion, name='toggle-lesson-completion'),
    path('api/lessons/toggle-completion/<int:lesson_id>/', views.toggle_lesson_completion, name='toggle-lesson-completion'),
    
    # Quiz endpoints
    path('api/quiz/submit/<int:lesson_id>/', views.submit_quiz, name='submit-quiz'),
    path('api/quiz/submit-school/<str:quiz_id>/', views.submit_school_quiz, name='submit-school-quiz'),
    
    # Resources endpoints
    path('api/resources/', views.get_resources, name='get-resources'),
    path('api/resources/download/<int:resource_id>/', views.download_resource, name='download-resource'),
    
    # Learning Plan URLs
    path('api/learning/', include('courses.urls_learning_plan')),
]