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
    
    # Resources endpoints
    path('api/resources/', views.get_resources, name='get-resources'),
    
    # Learning Plan URLs
    path('api/learning/', include('courses.urls_learning_plan')),
]