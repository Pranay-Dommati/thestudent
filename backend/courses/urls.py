from django.urls import path, include
from . import views
from .working_views import save_pro_learning_course
from .pro_learning_admin_views import admin_pro_learning_topics

"""Courses app URL patterns.

Order matters: more specific static routes (e.g. 'enroll/') MUST come before the
generic catch-all 'api/courses/<str:course_id>/' route. Otherwise Django will
capture e.g. 'enroll' as <course_id> and dispatch to the wrong view, producing
405 Method Not Allowed for POST requests (root cause of enrollment issue).
"""

urlpatterns = [
    # Creation & listing (specific prefixes first)
    path('api/courses/create/', views.create_course, name='create-course'),
    path('api/courses/engineering/', views.list_engineering_courses, name='list-engineering-courses'),
    path('api/courses/engineering/<str:course_id>/', views.get_engineering_course_by_id, name='get-engineering-course-by-id'),
    path('api/courses/all/', views.list_all_courses, name='list-all-courses'),
    path('api/courses/school/', views.list_school_courses, name='list-school-courses'),
    path('api/courses/school/<str:course_id>/', views.get_school_course_by_id, name='get-school-course-by-id'),

    # Admin analytics endpoints (must precede generic <course_id> route)
    path('api/courses/admin/enrollment-stats/', views.admin_enrollment_stats, name='admin-enrollment-stats'),
    path('api/courses/admin/enrollments/<str:course_type>/<str:course_id>/', views.admin_course_enrollments, name='admin-course-enrollments'),

    # Course enrollment endpoints (must precede generic <course_id> route)
    path('api/courses/enroll/', views.start_predefined_course, name='start-predefined-course'),
    path('api/courses/enrolled/', views.get_user_enrolled_courses, name='get-user-enrolled-courses'),
    path('api/courses/enrollment/<int:enrollment_id>/', views.delete_course_enrollment, name='delete-course-enrollment'),
    path('api/courses/enrollment-check/<str:course_type>/<str:course_id>/', views.check_course_enrollment, name='check-course-enrollment'),
    path('api/courses/enrollment-progress/<int:enrollment_id>/', views.update_course_progress, name='update-course-progress'),
    path('api/courses/enrollment-status/<str:course_id>/', views.enrollment_status, name='enrollment-status'),

    # Progress tracking endpoints
    path('api/courses/progress/<str:course_id>/', views.get_course_progress, name='get-course-progress'),
    # Progress by course id in path (accepts both engineering and school)
    # Previously this pointed to engineering-only and caused 404s for school courses.
    path('api/courses/<str:course_id>/progress/', views.get_course_progress, name='get-course-progress-by-path'),
    path('api/lessons/complete/<int:lesson_id>/', views.toggle_lesson_completion, name='toggle-lesson-completion'),
    path('api/lessons/toggle-completion/<int:lesson_id>/', views.toggle_lesson_completion, name='toggle-lesson-completion'),

    # Quiz endpoints
    path('api/quiz/submit/<int:lesson_id>/', views.submit_quiz, name='submit-quiz'),
    path('api/quiz/submit-school/<str:quiz_id>/', views.submit_school_quiz, name='submit-school-quiz'),

    # Resources endpoints
    path('api/resources/', views.get_resources, name='get-resources'),
    path('api/resources/download/<int:resource_id>/', views.download_resource, name='download-resource'),

    # Admin Pro Learning analytics (place BEFORE include to avoid capture by generic routes)
    path('api/courses/pro-learning/admin/topics/', admin_pro_learning_topics, name='admin-pro-learning-topics'),
    # Pro Learning endpoints
    path('api/courses/pro-learning/', include('courses.pro_learning_urls')),
    # Direct Pro Learning save endpoint (bypasses DRF)
    path('api/courses/pro-learning-direct/save/', save_pro_learning_course, name='direct-save-course'),

    # Certification endpoints
    path('api/courses/<str:course_id>/certificate/', views.issue_engineering_certificate, name='issue-engineering-certificate'),
    path('api/courses/certificates/', views.get_user_certificates, name='get-user-certificates'),

    # Learning activity tracking endpoints (MUST come before generic <course_id> route)
    path('api/courses/track-activity/', views.track_learning_activity, name='track-learning-activity'),
    path('api/courses/learning-stats/', views.get_learning_stats, name='get-learning-stats'),

    # Admin analytics: enrollment statistics per course
    path('api/courses/admin/enrollment-stats/', views.admin_enrollment_stats, name='admin-enrollment-stats'),

    # Generic course CRUD (placed AFTER specific routes to avoid conflicts)
    path('api/courses/<str:course_id>/', views.get_course_by_id, name='get-course-by-id'),
    path('api/courses/<str:course_id>/update/', views.update_course, name='update-course'),
    path('api/courses/<str:course_id>/delete/', views.delete_course, name='delete-course'),
]